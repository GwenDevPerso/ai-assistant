import {LAMPORTS_PER_SOL, PublicKey} from '@solana/web3.js';
import {ToolConfig} from '../allTools.js';

interface SendSolanaTransactionArgs {
    to: string;
    value?: string;
}

interface TransactionContext {
    walletAddress?: string;
}

// Response interface for the transaction data
interface SolanaTransactionResponse {
    toAddress: PublicKey;
    amount: number;
    message: string;
}

export const sendSolanaTransactionTool: ToolConfig<SendSolanaTransactionArgs, TransactionContext> = {
    definition: {
        type: 'function',
        function: {
            name: 'send_solana_transaction',
            description: 'Send SOL to an address',
            parameters: {
                type: 'object',
                properties: {
                    to: {
                        type: 'string',
                        description: 'The recipient Solana address (base58 encoded public key)',
                    },
                    value: {
                        type: 'string',
                        description: 'The amount of SOL to send (in SOL, not lamports)',
                        optional: true,
                    },
                },
                required: ['to'],
            },
        },
    },
    handler: async ({to, value}: SendSolanaTransactionArgs) => {
        try {
            // Convert the destination address to a PublicKey
            const toPublicKey = new PublicKey(to);

            // Default value is 0.001 SOL if not specified
            const amountInSol = value ? parseFloat(value) : 0.001;
            // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = amountInSol * LAMPORTS_PER_SOL;

            // Return transaction data for frontend
            const response: SolanaTransactionResponse = {
                toAddress: toPublicKey,
                amount: lamports,
                message: `A transaction of ${amountInSol} SOL to ${toPublicKey.toString()} has been prepared`,
            };

            return response;
        } catch (error) {
            throw new Error(
                `Failed to prepare Solana transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    },
};
