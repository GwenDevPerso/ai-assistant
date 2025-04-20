import cors from 'cors';
import express from 'express';
import OpenAi from 'openai';
import {Assistant} from 'openai/resources/beta/assistants';
import {Thread} from 'openai/resources/beta/threads/threads';
import {createAssistant} from '../openai/createAssistant.js';
import {createRun} from '../openai/createRun.js';
import {createThread} from '../openai/createThread.js';
import {performRun} from '../openai/performRun.js';
import {setPhantomConnection} from '../phantom/createPhantomConnection.js';
import {sendSolanaTransactionTool} from '../tools/solana/sendSolanaTransaction.js';

// Types definitions
interface ThreadStore {
  [key: string]: {
    thread: Thread;
    assistant: Assistant;
    walletAddress?: string;
    phantomWalletConnected?: boolean;
    lastTransactionData?: any; // Pour stocker les données de transaction les plus récentes
  }
}

interface MessageRequest {
  message: string;
  walletAddress?: string;
}

interface PhantomConnectRequest {
  publicKey: string;
  conversationId: string;
}

interface ConversationIdRequest {
  conversationId: string;
}

// Initialize Express app and OpenAI client
const client = new OpenAi();
const app = express();
const PORT = process.env.PORT || 3000;

// Create a single router for all endpoints
const router = express.Router();

// Store assistants and threads in memory (for development purposes)
// In production, you would use a database
const threadStore: ThreadStore = {};

// Middleware
app.use(cors());
app.use(express.json());

// Error handler utility
const handleError = (res: express.Response, error: unknown, message: string): void => {
  console.error(`${message}:`, error);
  res.status(500).json({ 
    error: message,
    details: error instanceof Error ? error.message : 'Unknown error'
  });
};

// Intercepteur pour les outils utilisés par l'IA
// Cet objet original stockera les données renvoyées par sendSolanaTransactionTool
const originalToolHandlers = {
  sendSolanaTransaction: sendSolanaTransactionTool.handler
};

// Remplacer le handler original avec notre version qui intercepte les données
sendSolanaTransactionTool.handler = async (args, context) => {
  // Appeler le handler original
  const result = await originalToolHandlers.sendSolanaTransaction(args, context);
  
  // Stocker le résultat pour le rendre disponible au frontend
  // Nous utiliserons le threadId du context pour identifier la conversation
  if (context && 'threadId' in context && context.threadId) {
    const threadId = context.threadId as string;
    if (threadStore[threadId]) {
      console.log(`Intercepté: sendSolanaTransactionTool appelé pour la conversation ${threadId}`);
      threadStore[threadId].lastTransactionData = result;
    }
  }
  
  return result;
};

// Define all routes handlers
class RouteHandlers {
  /**
   * API Routes
   */
  // Health check endpoint
  static healthCheck(_req: express.Request, res: express.Response): void {
    res.status(200).json({ status: 'ok' });
  }

  // Create a new conversation
  static async createConversation(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const assistant = await createAssistant(client);
      const thread = await createThread(client);
      
      const conversationId = thread.id;
      threadStore[conversationId] = { thread, assistant };
      
      res.status(201).json({
        conversationId,
        message: 'Conversation started successfully'
      });
    } catch (error) {
      handleError(res, error, 'Failed to create conversation');
    }
  }

  // Send a message to a conversation
  static async sendMessage(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { message, walletAddress } = req.body;
      
      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }
      
      const conversation = threadStore[conversationId];
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      // Store wallet address in conversation if provided
      if (walletAddress && !conversation.walletAddress) {
        conversation.walletAddress = walletAddress;
        console.log(`Wallet address stored for conversation ${conversationId}: ${walletAddress}`);
      }
      
      const { thread, assistant } = conversation;
      
      await client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message
      });
      
      const run = await createRun(client, thread, assistant.id);
      
      // Ajouter l'ID de conversation au contexte pour l'intercepteur
      // Cela permettra à l'intercepteur de stocker les données de transaction
      const runContext = {
        walletAddress: conversation.walletAddress,
        threadId: conversationId
      };
      
      const result = await performRun(run, client, thread, runContext);
      
      // Préparer la réponse avec les données potentielles de transaction
      const responseData: any = {};
      
      if (result && result.text) {
        responseData.response = result.text.value;
      } else {
        responseData.response = 'No response received';
      }
      
      // Vérifier si une transaction a été déclenchée pendant cette exécution
      if (conversation.lastTransactionData) {
        responseData.transactionData = conversation.lastTransactionData;
        responseData.hasTransaction = true;
        
        // Réinitialiser les données de transaction pour ne pas les renvoyer à nouveau
        // sauf si explicitement demandé
        conversation.lastTransactionData = undefined;
        
        console.log(`Transaction data detected and returned to frontend for conversation ${conversationId}`);
        
        res.status(200).json(responseData);
      } else {
        // Pas de transaction détectée
        responseData.hasTransaction = false;
        res.status(200).json(responseData);
      }
    } catch (error) {
      handleError(res, error, 'Failed to process message');
    }
  }

  static async connectPhantomWallet(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { publicKey, conversationId } = req.body;
      
      // Vérifier si la conversation existe
      if (conversationId && !threadStore[conversationId]) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      // Connecter le wallet Phantom
      const connection = setPhantomConnection(publicKey);
      
      // Mettre à jour l'état de la conversation si un conversationId est fourni
      if (conversationId) {
        threadStore[conversationId].walletAddress = publicKey;
        threadStore[conversationId].phantomWalletConnected = true;
      }
      
      res.status(200).json({
        message: 'Phantom wallet connected successfully',
        connection: connection.publicKey.toString()
      });
    } catch (error) {
      handleError(res, error, 'Failed to connect Phantom wallet');
    }
  }

  // Récupérer les données de transaction pour une conversation
  static async getTransactionData(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({ error: 'Conversation ID is required' });
        return;
      }
      
      const conversation = threadStore[conversationId];
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      
      if (!conversation.lastTransactionData) {
        res.status(404).json({ 
          error: 'No transaction data available for this conversation',
          hasTransaction: false
        });
        return;
      }
      
      res.status(200).json({
        transactionData: conversation.lastTransactionData,
        hasTransaction: true
      });
    } catch (error) {
      handleError(res, error, 'Failed to get transaction data');
    }
  }
}

// Register all routes with the single router
// API Routes
router.get('/health', RouteHandlers.healthCheck);
router.post('/conversations', RouteHandlers.createConversation);
router.post('/conversations/:conversationId/messages', RouteHandlers.sendMessage);
router.post('/phantom/connect', RouteHandlers.connectPhantomWallet);
router.get('/solana/transaction-data/:conversationId', RouteHandlers.getTransactionData);

// Register the single router with the app
app.use('/api', router);

// Start the server
export function startServer() {
  return app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app; 