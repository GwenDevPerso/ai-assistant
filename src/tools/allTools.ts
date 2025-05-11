import {buyTokenTool} from "./solana/buyTokenTool.js";
import {getSolanaBalanceTool} from "./solana/getSolanaBalance.js";
import {getSolanaWalletAddressTool} from "./solana/getSolanaWalletAddress.js";
import {listMyTokensTool} from "./solana/listMyTokensTool.js";
import {listTopTokenTool} from "./solana/listTopToken.js";
import {sendSolanaTransactionTool} from "./solana/sendSolanaTransaction.js";
// Define the base context interface
export interface ToolContext {
    walletAddress?: string;
    phantomWalletConnected?: boolean;
    [key: string]: any;
}

export interface ToolConfig<T = any, C extends ToolContext = ToolContext> {
    definition: {
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: {
                type: 'object';
                properties: Record<string, unknown>;
                required: string[];
            };
        };
    };
    handler: (args: T, context?: C) => Promise<any>;
};


export const tools: Record<string, ToolConfig> = {
    // get_balance: getBalanceTool,
    // get_wallet_address: getWalletAddressTool,
    // send_transaction: sendTransactionTool,
    // deploy_erc20_token: deployErc20Tool, 
    get_solana_balance: getSolanaBalanceTool,
    get_solana_wallet_address: getSolanaWalletAddressTool,
    send_solana_transaction: sendSolanaTransactionTool,
    list_top_token: listTopTokenTool,
    buy_token: buyTokenTool,
    list_my_tokens: listMyTokensTool,
} 