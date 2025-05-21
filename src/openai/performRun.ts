import OpenAi from 'openai';
import {RequiredActionFunctionToolCall, Run} from 'openai/resources/beta/threads/runs/runs';
import {Thread} from 'openai/resources/beta/threads/threads';
import {buyTokenTool} from '../tools/solana/buyTokenTool.js';
import {getSolanaBalanceTool} from '../tools/solana/getSolanaBalance.js';
import {getSolanaWalletAddressTool} from '../tools/solana/getSolanaWalletAddress.js';
import {listMyTokensTool} from '../tools/solana/listMyTokensTool.js';
import {listTopTokenTool} from '../tools/solana/listTopToken.js';
import {sendSolanaTransactionTool} from '../tools/solana/sendSolanaTransaction.js';
// Étendre notre type ThreadMessage pour qu'il soit compatible avec la façon dont nous l'utilisons
export type ThreadMessage = {
    id: string;
    object: string;
    created_at: number;
    thread_id: string;
    role: string;
    content: Array<{
        type: string;
        text?: {
            value: string;
            annotations: any[];
        };
    }>;
    file_ids: string[];
    assistant_id: string;
    run_id: string;
    metadata: Record<string, any>;

    // Ces propriétés sont ajoutées pour la compatibilité avec l'utilisation dans d'autres fichiers
    type?: string; // Pour faciliter l'accès à result?.type === 'text'
    text?: {
        value: string;
        annotations: any[];
    };
    tool?: string; // Nom de l'outil appelé
};

// Le type RunContext permet de passer des informations supplémentaires à la fonction
export interface RunContext {
    walletAddress?: string;
    threadId?: string;
    [key: string]: any;
}

/**
 * Performs a run and waits for it to complete
 */
export async function performRun(
    run: Run,
    client: OpenAi,
    thread: Thread,
    context?: RunContext,
): Promise<ThreadMessage | null> {
    let currentRun = run;

    // Continue to check the status of the run until it's complete
    while (currentRun.status === 'queued' || currentRun.status === 'in_progress') {
        // Wait for a second before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        currentRun = await client.beta.threads.runs.retrieve(thread.id, currentRun.id);
    }

    // Handle actions required by the assistant
    if (currentRun.status === 'requires_action') {
        const result = await handleRequiredAction(currentRun, client, thread, context);
        if (result) {
            // Ajouter le nom de l'outil au résultat si nécessaire
            if (currentRun.required_action?.submit_tool_outputs?.tool_calls?.[0]?.function?.name) {
                result.tool = currentRun.required_action.submit_tool_outputs.tool_calls[0].function.name;
            }
        }
        return result;
    } else if (currentRun.status === 'completed') {
        // If the run is completed, return the last message
        const messages = await client.beta.threads.messages.list(thread.id, {
            order: 'desc',
            limit: 1,
        });

        if (messages.data.length > 0) {
            // Convertir en notre type ThreadMessage étendu
            const message = messages.data[0] as unknown as ThreadMessage;

            // Ajouter les propriétés pour la compatibilité
            if (message.content && message.content.length > 0) {
                const firstContent = message.content[0];
                message.type = firstContent.type;
                if (firstContent.type === 'text' && firstContent.text) {
                    message.text = firstContent.text;
                }
            }

            return message;
        }
    } else if (currentRun.status === 'failed') {
        console.error('Run failed:', currentRun.last_error);
    } else {
        console.log('Run ended with status:', currentRun.status);
    }

    return null;
}

/**
 * Handles required actions from the assistant
 */
async function handleRequiredAction(
    run: Run,
    client: OpenAi,
    thread: Thread,
    context?: RunContext,
): Promise<ThreadMessage | null> {
    if (!run.required_action || !run.required_action.submit_tool_outputs) {
        console.error('Run requires action but no submit_tool_outputs found');
        return null;
    }

    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    const toolOutputs = [];

    for (const toolCall of toolCalls) {
        const functionCall = toolCall as RequiredActionFunctionToolCall;
        const output = await handleToolCall(functionCall, context);

        toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify(output),
        });
    }

    // Submit tool outputs back to the run
    const updatedRun = await client.beta.threads.runs.submitToolOutputs(thread.id, run.id, {tool_outputs: toolOutputs});

    // Continue with the updated run
    return await performRun(updatedRun, client, thread, context);
}

/**
 * Handles a specific tool call
 */
async function handleToolCall(toolCall: RequiredActionFunctionToolCall, context?: RunContext): Promise<any> {
    const {name, arguments: args} = toolCall.function;
    console.log(`Handling tool call: ${name} with args:`, args, context);

    try {
        const parsedArgs = JSON.parse(args);

        // Handle different tools
        if (name === 'send_solana_transaction') {
            return await sendSolanaTransactionTool.handler(parsedArgs, context);
        } else if (name === 'get_solana_wallet_address') {
            return await getSolanaWalletAddressTool.handler(parsedArgs, context);
        } else if (name === 'get_solana_balance') {
            return await getSolanaBalanceTool.handler(parsedArgs, context);
        } else if (name === 'list_top_trending_tokens') {
            return await listTopTokenTool.handler(parsedArgs, context);
        } else if (name === 'buy_token') {
            return await buyTokenTool.handler(parsedArgs, context);
        } else if (name === 'list_my_tokens') {
            return await listMyTokensTool.handler(parsedArgs, context);
        }

        // Default response for unknown tools
        return {error: `Tool '${name}' not implemented`};
    } catch (error) {
        console.error(`Error handling tool call ${name}:`, error);
        return {error: `Error handling tool call: ${error instanceof Error ? error.message : 'Unknown error'}`};
    }
}
