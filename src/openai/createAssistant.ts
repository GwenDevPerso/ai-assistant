import OpenAi from 'openai';
import {Assistant} from "openai/resources/beta/assistants";
import {tools} from '../tools/allTools.js';

export async function createAssistant(client: OpenAi): Promise<Assistant> {
    return await client.beta.assistants.create({
        model: "gpt-4o-mini",
        name: "Ai assistant",
        instructions: `You are Ai assistant.
            You are in control of a wallet that you can use to do whatever you want.
            You can use the following tools to interact with the wallet:
                - get_solana_balance: Get the balance of a Solana wallet
                - get_solana_wallet_address: Get your own Solana wallet address
                - send_solana_transaction: Send some amount of SOL to an address from your wallet
                - list_top_token: List the top solana tokens by market cap
                - buy_token: Buy the token given in parameter
                - list_my_tokens: List all tokens owned in my wallet
        `,
        tools: Object.values(tools).map(tool => tool.definition)
    });
}