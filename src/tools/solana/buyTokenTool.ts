import {ToolConfig, ToolContext} from '../allTools.js';

export const buyTokenTool: ToolConfig<{token: string; amount: number}, ToolContext> = {
    definition: {
        type: 'function',
        function: {
            name: 'buy_token',
            description: 'Buy a token',
            parameters: {
                type: 'object',
                properties: {
                    token: {
                        type: 'string',
                        description: 'The token to buy',
                    },
                    amount: {
                        type: 'number',
                        description: 'The amount of tokens to buy',
                    },
                },
                required: ['token', 'amount'],
            },
        },
    },
    handler: async ({token, amount}: {token: string; amount: number}, context) => {
        if (!context) {
            throw new Error('Wallet address is required');
        }
        const inputMint = "So11111111111111111111111111111111111111112"; // SOL
        
        console.log("Buy token", token, amount, context.walletAddress);

        const lamport = amount * 10 ** 9;

        try {
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${token}&amount=${lamport}`,
            );
            const quote = await response.json();
            console.log('Handle buy token', quote);

            if (!quote || !quote.routePlan || quote.routePlan.length === 0) {
                throw new Error("Aucune route de swap trouvée");
            }
            const bestRoute = quote.routePlan[0];

            console.log("Best route", bestRoute);

            const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    route: bestRoute,
                    userPublicKey: context.walletAddress,
                    wrapUnwrapSOL: true,
                    feeAccount: null, // facultatif
                }),
            });
            const {swapTransaction} = await swapResponse.json();

            if (!swapTransaction) {
                return {
                    data: null,
                    function: 'buy_token',
                    error: 'No swap transaction found',
                };
            }

            return {
                data: swapTransaction,
                function: 'buy_token',
            };
        } catch (error) {
            console.error('Error buying token', error);
            return {
                data: null,
                function: 'buy_token',
                error: 'Error buying token',
            };
        }
    },
};
