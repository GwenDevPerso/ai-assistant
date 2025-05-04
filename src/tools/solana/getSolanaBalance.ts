import {ToolConfig} from '../allTools.js';

export const getSolanaBalanceTool: ToolConfig<{}, {walletAddress?: string}> = {
    definition: {
        type: 'function',
        function: {
            name: 'get_solana_balance',
            description: 'Get the SOL balance of a Solana wallet',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    handler: async (args, context) => {
        if (!context?.walletAddress) {
            return null;
        }

        return {
            account: context.walletAddress,
            balance: 100,
            function: 'get_solana_balance',
        };
    },
};
