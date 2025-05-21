import {ToolConfig} from '../allTools.js';

export const listTopTokenTool: ToolConfig<{}, {}> = {
    definition: {
        type: 'function',
        function: {
            name: 'list_top_trending_tokens',
            description: 'List of all the top trending tokens of the solana blockchain',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    handler: async (args, context) => {
        const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-chain': 'solana',
              'X-API-KEY': process.env.BIRDEYE_API_KEY || ''
            }
          };

        const response = await fetch('https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=20', options);
        const data = await response.json();

        return {
            data: data,
            function: 'list_top_trending_tokens',
        };
    },
};
