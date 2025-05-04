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
        console.log("Getting Solana wallet address with context:", context);
        
        // Return user wallet address if available in context
        if (context?.walletAddress) {
            console.log("Returning wallet address from context:", context.walletAddress);
            return context.walletAddress;
        }

        console.log("No wallet address found in context");
        return null;
    }
}; 