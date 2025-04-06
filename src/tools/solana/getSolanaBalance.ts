import {PublicKey} from '@solana/web3.js';
import {createSolanaPublicClient} from '../../solana/createSolanaPublicClient.js';
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
        const connection = createSolanaPublicClient();
        const publicKey = new PublicKey(wallet);
        const balance = await connection.getBalance(publicKey);
        // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
        return (balance / 1_000_000_000).toString();
    }
} 