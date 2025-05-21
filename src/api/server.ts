import cors from 'cors';
import express from 'express';
import OpenAi from 'openai';
import {Assistant} from 'openai/resources/beta/assistants';
import {Thread} from 'openai/resources/beta/threads/threads';
import {createAssistant} from '../openai/createAssistant.js';
import {createRun} from '../openai/createRun.js';
import {createThread} from '../openai/createThread.js';
import {performRun} from '../openai/performRun.js';
import {sendSolanaTransactionTool} from '../tools/solana/sendSolanaTransaction.js';

// Types definitions
type ThreadStore = {
    [key: string]: {
        thread: Thread;
        assistant: Assistant;
        walletAddress?: string;
        walletConnected?: boolean;
        lastTransactionData?: any; // Pour stocker les données de transaction les plus récentes
    };
};

type SwapTransaction = {
    transaction: string;
    token: string;
    amount: number;
};

type APIResponse = {
    response: string;
    status: string;
    tool: string;
    swapTransaction?: SwapTransaction;
    transactionData?: any;
    hasTransaction?: boolean;
    hasSwapTransaction?: boolean;
};

// Initialize Express app and OpenAI client
const client = new OpenAi();
const app = express();
const PORT = process.env.PORT || 3001;

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
        details: error instanceof Error ? error.message : 'Unknown error',
    });
};

// Intercepteur pour les outils utilisés par l'IA
// Cet objet original stockera les données renvoyées par sendSolanaTransactionTool
const originalToolHandlers = {
    sendSolanaTransaction: sendSolanaTransactionTool.handler,
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
        res.status(200).json({status: 'ok'});
    }

    // Create a new conversation
    static async createConversation(_req: express.Request, res: express.Response): Promise<void> {
        try {
            const assistant = await createAssistant(client);
            const thread = await createThread(client);

            const conversationId = thread.id;
            threadStore[conversationId] = {thread, assistant};

            res.status(201).json({
                conversationId,
                message: 'Conversation started successfully',
            });
        } catch (error) {
            handleError(res, error, 'Failed to create conversation');
        }
    }

    // Send a message to a conversation
    static async sendMessage(req: express.Request, res: express.Response): Promise<void> {
        try {
            const {conversationId} = req.params;
            const {message, walletAddress} = req.body;

            if (!threadStore[conversationId].walletConnected) {
                await RouteHandlers.connectWallet(walletAddress, conversationId);
            } else {
                console.log('Wallet already connected');
            }

            if (!message) {
                res.status(400).json({error: 'Message is required'});
                return;
            }

            const conversation = threadStore[conversationId];
            if (!conversation) {
                res.status(404).json({error: 'Conversation not found'});
                return;
            }

            // Store wallet address in conversation if provided
            if (walletAddress && !conversation.walletAddress) {
                conversation.walletAddress = walletAddress;
                console.log(`Wallet address stored for conversation ${conversationId}: ${walletAddress}`);
            }

            const {thread, assistant} = conversation;

            await client.beta.threads.messages.create(thread.id, {
                role: 'user',
                content: message,
            });

            const run = await createRun(client, thread, assistant.id);

            // Ajouter l'ID de conversation au contexte pour l'intercepteur
            // Cela permettra à l'intercepteur de stocker les données de transaction
            const runContext = {
                walletAddress: conversation.walletAddress,
                threadId: conversationId,
            };

            const result = await performRun(run, client, thread, runContext);

            console.log('Result:', result);

            // Préparer la réponse avec les données potentielles de transaction
            const responseData: APIResponse = {
                response: '',
                status: '',
                tool: '',
            };

            if (result && result.text) {
                responseData.response = result.text.value;
            } else {
                responseData.response = 'No response received';
            }

            if (result && result.tool) {
                responseData.tool = result.tool;

                // Vérifier si l'outil utilisé est buy_token et ajouter les données de swap transaction
                if (result.tool === 'buy_token') {
                    // Pour debug, afficher l'objet result complet
                    console.log('Buy token result:', JSON.stringify(result, null, 2));

                    // Récupérer la valeur du premier message (qui contient généralement la réponse formatée)
                    const lastRunSteps = await client.beta.threads.runs.steps.list(thread.id, result.run_id, {
                        order: 'desc',
                    });

                    for (const step of lastRunSteps.data) {
                        if (
                            step.step_details.type === 'tool_calls' &&
                            step.step_details.tool_calls[0].type === 'function' &&
                            step.step_details.tool_calls[0].function.name === 'buy_token'
                        ) {
                            try {
                                if (step.step_details.tool_calls[0].function.output) {
                                    const outputData = JSON.parse(step.step_details.tool_calls[0].function.output);
                                    if (outputData && outputData.data) {
                                        responseData.swapTransaction = outputData.data;
                                        responseData.hasSwapTransaction = true;
                                        console.log(`Swap transaction data extracted: ${outputData.data}`);
                                        break;
                                    }
                                }
                            } catch (err) {
                                console.error('Error parsing buy_token output:', err);
                            }
                        }
                    }
                }
            }

            console.log('Response data', conversation);

            // Vérifier si une transaction a été déclenchée pendant cette exécution
            if (conversation.lastTransactionData) {
                responseData.transactionData = conversation.lastTransactionData;
                responseData.hasTransaction = true;

                // Réinitialiser les données de transaction pour ne pas les renvoyer à nouveau
                // sauf si explicitement demandé
                conversation.lastTransactionData = undefined;

                console.log(`Transaction data detected and returned to frontend for conversation ${conversationId}`);
            } else {
                // Pas de transaction détectée
                responseData.hasTransaction = false;
            }

            res.status(200).json(responseData);
        } catch (error) {
            handleError(res, error, 'Failed to process message');
        }
    }

    static async connectWallet(
        publicKey: string,
        conversationId: string,
    ): Promise<{message: string; connection: string}> {
        try {
            // Vérifier si la conversation existe
            if (conversationId && !threadStore[conversationId]) {
                throw new Error('Conversation not found');
            }

            // Connecter le wallet Phantom
            // const connection = setPhantomConnection(publicKey);

            // Mettre à jour l'état de la conversation si un conversationId est fourni
            if (conversationId) {
                threadStore[conversationId].walletAddress = publicKey;
                threadStore[conversationId].walletConnected = true;
            }

            return {
                message: 'Wallet connected successfully',
                connection: publicKey.toString(),
            };
        } catch (error) {
            return {
                message: 'Failed to connect wallet',
                connection: '',
            };
        }
    }

    // Récupérer les données de transaction pour une conversation
    static async getTransactionData(req: express.Request, res: express.Response): Promise<void> {
        try {
            const {conversationId} = req.params;

            if (!conversationId) {
                res.status(400).json({error: 'Conversation ID is required'});
                return;
            }

            const conversation = threadStore[conversationId];
            if (!conversation) {
                res.status(404).json({error: 'Conversation not found'});
                return;
            }

            if (!conversation.lastTransactionData) {
                res.status(404).json({
                    error: 'No transaction data available for this conversation',
                    hasTransaction: false,
                });
                return;
            }

            res.status(200).json({
                transactionData: conversation.lastTransactionData,
                hasTransaction: true,
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
