import {ToolConfig} from '../allTools.js';

export const listTopTokenTool: ToolConfig<{}, {}> = {
    definition: {
        type: 'function',
        function: {
            name: 'list_top_token',
            description: 'List of all the top trending tokens',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
    handler: async (args, context) => {
        const response = await fetch('https://public-api.birdeye.so/public/token/top', {
            headers: {
                'X-API-KEY': 'TON_API_KEY',
            },
        });
        const data = await response.json();

        return {
            data: data,
            function: 'list_top_token',
        };
    },
};
