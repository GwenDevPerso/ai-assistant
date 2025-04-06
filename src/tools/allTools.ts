import {deployErc20Tool} from "./eth/deployErc20Tool.js";
import {getBalanceTool} from "./eth/getBalance.js";
import {getWalletAddressTool} from "./eth/getWalletAddress.js";
import {sendTransactionTool} from "./eth/sendTransaction.js";
import {deploySplTokenTool} from "./solana/deploySplTokenTool.js";
import {getSolanaBalanceTool} from "./solana/getSolanaBalance.js";
import {getSolanaWalletAddressTool} from "./solana/getSolanaWalletAddress.js";
import {sendSolanaTransactionTool} from "./solana/sendSolanaTransaction.js";

export interface ToolConfig<T = any> {
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
    handler: (args: T) => Promise<any>;
};


export const tools: Record<string, ToolConfig> = {
    get_balance: getBalanceTool,
    get_wallet_address: getWalletAddressTool,
    send_transaction: sendTransactionTool,
    deploy_erc20_token: deployErc20Tool, 
    deploy_spl_token: deploySplTokenTool,
    get_solana_balance: getSolanaBalanceTool,
    get_solana_wallet_address: getSolanaWalletAddressTool,
    send_solana_transaction: sendSolanaTransactionTool,
} 