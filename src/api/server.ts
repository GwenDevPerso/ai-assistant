import cors from 'cors';
import express, {Router} from 'express';
import OpenAi from 'openai';
import {Assistant} from 'openai/resources/beta/assistants';
import {Thread} from 'openai/resources/beta/threads/threads';
import {createAssistant} from '../openai/createAssistant.js';
import {createRun} from '../openai/createRun.js';
import {createThread} from '../openai/createThread.js';
import {performRun} from '../openai/performRun.js';

const client = new OpenAi();
const app = express();
const PORT = process.env.PORT || 3000;
const router = Router();

// Middleware
app.use(cors());
app.use(express.json());

// Store assistants and threads in memory (for development purposes)
// In production, you would use a database
interface ThreadStore {
  [key: string]: {
    thread: Thread;
    assistant: Assistant;
  }
}

const threadStore: ThreadStore = {};

// Routes
router.post('/conversations', async (req, res) => {
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
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      error: 'Failed to create conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/conversations/:conversationId/messages', async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const conversation = threadStore[conversationId];
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const { thread, assistant } = conversation;
    
    await client.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });
    
    const run = await createRun(client, thread, assistant.id);
    const result = await performRun(run, client, thread);
    
    if (result?.type === 'text') {
      res.status(200).json({
        response: result.text.value
      });
    } else {
      res.status(200).json({
        response: 'No response received'
      });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// router.get('/conversations/:conversationId/messages', async (req, res) => {
//   try {
//     const { conversationId } = req.params;
    
//     const conversation = threadStore[conversationId];
//     if (!conversation) {
//       return res.status(404).json({ error: 'Conversation not found' });
//     }
    
//     const { thread } = conversation;
    
//     const messages = await client.beta.threads.messages.list(thread.id);
    
//     res.status(200).json({
//       messages: messages.data
//     });
//   } catch (error) {
//     console.error('Error retrieving messages:', error);
//     res.status(500).json({ 
//       error: 'Failed to retrieve messages',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// });

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Use router with /api prefix
app.use('/api', router);

// Intégration des routes Solana

// Start the server
export function startServer() {
  return app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app; 