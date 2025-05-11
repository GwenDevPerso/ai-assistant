import {ToolConfig, ToolContext} from '../allTools.js';

export const listMyTokensTool: ToolConfig<{}, ToolContext> = {
    definition: {
        type: 'function',
        function: {
            name: 'list_my_tokens',
            description: 'List all tokens owned in my wallet',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    handler: async (args, context) => {
        if (!context?.walletAddress) {
            throw new Error('Wallet address is required');
        }

        try {
            // The actual token fetching will be done on the frontend using useGetTokenAccounts
            // This tool just signals that we want to list tokens
            return {
                function: 'list_my_tokens',
                walletAddress: context.walletAddress,
            };
        } catch (error) {
            console.error('Error listing tokens:', error);
            return {
                function: 'list_my_tokens',
                error: 'Error listing tokens',
            };
        }
    },
};