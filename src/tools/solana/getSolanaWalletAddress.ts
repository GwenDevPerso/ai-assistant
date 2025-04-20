import {createSolanaWalletClient} from '../../solana/createSolanaWalletClient.js';
import {ToolConfig} from '../allTools.js';

export const getSolanaWalletAddressTool: ToolConfig<{}, { walletAddress?: string }> = {
    definition: {
        type: 'function',
        function: {
            name: 'get_solana_wallet_address',
            description: 'Get the AI bot\'s connected Solana wallet address',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
        },
    },
    handler: async (args, context) => {
        // Return user wallet address if available in context
        if (context?.walletAddress) {
            return context.walletAddress;
        }
        
        // Fallback to server wallet
        const wallet = createSolanaWalletClient();
        // La publicKey est garantie grâce au type de retour de createSolanaWalletClient
        return wallet.publicKey.toString();
    }
}; 