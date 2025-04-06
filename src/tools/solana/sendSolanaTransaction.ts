import {LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {createSolanaPublicClient} from '../../solana/createSolanaPublicClient.js';
import {createSolanaWalletClient} from '../../solana/createSolanaWalletClient.js';
import {ToolConfig} from '../allTools.js';

interface SendSolanaTransactionArgs {
    to: string;
    value?: string;
}

export const sendSolanaTransactionTool: ToolConfig<SendSolanaTransactionArgs> = {
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
                        description: 'The recipient Solana address (base58 encoded public key)'
                    },
                    value: {
                        type: 'string',
                        description: 'The amount of SOL to send (in SOL, not lamports)',
                        optional: true
                    }
                },
                required: ['to'],
            },
        },
    },
    handler: async ({ to, value }: SendSolanaTransactionArgs) => {
        try {
            const connection = createSolanaPublicClient();
            const wallet = createSolanaWalletClient();
            
            // Convert the destination address to a PublicKey
            const toPublicKey = new PublicKey(to);
            
            // Default value is 0.001 SOL if not specified
            const amountInSol = value ? parseFloat(value) : 0.001;
            // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = amountInSol * LAMPORTS_PER_SOL;

            // Create a transaction to transfer SOL
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: toPublicKey,
                    lamports: Math.floor(lamports),
                })
            );

            // Get the latest blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = wallet.publicKey;

            // Sign the transaction with the wallet
            const signature = await connection.sendTransaction(
                transaction, 
                [wallet]
            );

            // Return the transaction signature (equivalent to hash in Ethereum)
            return signature;
        } catch (error) {
            throw new Error(
                `Failed to send Solana transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
} 