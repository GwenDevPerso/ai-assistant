import "dotenv/config";
import OpenAi from "openai";
import {Assistant} from 'openai/resources/beta/assistants';
import {Thread} from 'openai/resources/beta/threads/threads';
import readline from 'readline';
import {startServer} from "./api/server.js";
import {createAssistant} from "./openai/createAssistant.js";
import {createRun} from "./openai/createRun.js";
import {createThread} from './openai/createThread.js';
import {performRun} from "./openai/performRun.js";

const client = new OpenAi();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function chat(thread: Thread, assistant: Assistant): Promise<void> {
    while(true) {
        const userInput = await question('\nYou: ');

        if (userInput.toLowerCase() === 'exit') {
            rl.close();
            break;
        }

        try {
            await client.beta.threads.messages.create(thread.id, {
                role: 'user',
                content: userInput
            });

            const run = await createRun(client, thread, assistant.id);
            console.log(`Creating run with assistant ${assistant.id} for thread ${thread.id}`)
            
            // Fournir un contexte minimal pour la cohérence
            const runContext = {
                threadId: thread.id
            };
            
            const result = await performRun(run, client, thread, runContext);

            if (result && result.text) {
                console.log('\nLucy: ', result.text.value);
            }

        } catch (error) {
            console.error(
                `Error during chat: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
            rl.close()
            break;
        }
    }
}


async function main() {
    try {
        const assistant = await createAssistant(client);
        const thread = await createThread(client);

        // Start the API server
        const server = startServer();
        console.log('API server started for frontend communication');
        
        console.log(`Chat started! Type "exit" to end the conversation.`)
    
        await chat(thread, assistant);
        
        // Close the server when chat ends
        server.close();
    } catch (error) {
        console.error(
            `Error in main: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        rl.close();
        process.exit(1);
    }
}
main();