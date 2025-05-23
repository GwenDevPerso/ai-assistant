import OpenAI from 'openai';
import { Run } from 'openai/resources/beta/threads/runs/runs';
import { Thread } from 'openai/resources/beta/threads/threads';
import { ToolContext, tools } from '../tools/allTools.js';

export async function handleRunToolCalls(run: Run, client: OpenAI, thread: Thread) {
    const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls;

    if (!toolCalls) return run;

    // Extract context from run metadata if available
    const context: ToolContext = {};
    
    // Extract wallet address from run metadata if available
    if (run.metadata && typeof run.metadata === 'object') {
        if ('walletAddress' in run.metadata && run.metadata.walletAddress) {
            context.walletAddress = run.metadata.walletAddress as string;
            console.log(`Using wallet address from context: ${context.walletAddress}`);
        }
    }

    const toolOutputs = await Promise.all(
        toolCalls.map(async (tool) => {
            const toolConfig = tools[tool.function.name];
            if (!toolConfig) {
                console.error(`Tool ${tool.function.name} not found`);
                return null;
            }

            console.log(`Running tool ${tool.function.name}`)

            try {
                const args = JSON.parse(tool.function.arguments);
                const output = await toolConfig.handler(args, context);

                console.log(`Tool ${tool.function.name} returned ${output}`)

                return {
                    tool_call_id: tool.id,
                    output: String(output)
                }
            } catch (error) {
                const errorMessage =  error instanceof Error ? error.message : String(error);
                return {
                    tool_call_id: tool.id,
                    output: `Error: ${errorMessage}`
                }
            };
        })
    );

    const validOuputs = toolOutputs.filter(Boolean) as OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[];

    if (validOuputs.length === 0) return run;

    return client.beta.threads.runs.submitToolOutputsAndPoll(
        thread.id,
        run.id,
        {tool_outputs: validOuputs}
    )
}