import {getPhantomWalletBalance} from '../../phantom/phantomWalletTools.js';
import {ToolConfig} from '../allTools.js';

interface GetSolanaBalanceArgs {
    wallet: string;
}

export const getSolanaBalanceTool: ToolConfig<GetSolanaBalanceArgs> = {
    definition: {
        type: 'function',
        function: {
            name: 'get_solana_balance',
            description: 'Get the SOL balance of a Solana wallet',
            parameters: {
                type: 'object',
                properties: {
                    wallet: {
                        type: 'string',
                        description: 'The Solana wallet address to get the balance of (base58 encoded public key)'
                    }
                },
                required: ['wallet'],
            },
        },
    },
    handler: async ({ wallet }: GetSolanaBalanceArgs) => {
        return await getPhantomWalletBalance();
    }
} 