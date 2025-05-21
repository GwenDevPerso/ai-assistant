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
        const inputMint = 'So11111111111111111111111111111111111111112'; // SOL

        console.log('Buy token', token, amount, context.walletAddress);

        const lamport = amount * 10 ** 9;

        try {
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'x-chain': 'solana',
                    'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
                },
            };
            const jsonBirdEye = await (await fetch(
                'https://public-api.birdeye.so/defi/v3/token/list?sort_by=liquidity&sort_type=desc&min_liquidity=50000&offset=0&limit=100',
                options,
            )).json();
            console.log('jsonBirdEye', JSON.stringify(jsonBirdEye.data.items, null, 2));

            const tokenFound = jsonBirdEye.data.items.find((t: any) => t.symbol === token);

            if (!tokenFound) {
                return {
                    data: null,
                    function: 'buy_token',
                    error: 'Token not found',
                };
            }

            console.log('Token', tokenFound);
            const outputMint = tokenFound?.address;

            console.log('outputMint', outputMint);

            const quoteResponse = await (
                await fetch(
                    `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${lamport}&slippageBps=50&restrictIntermediateTokens=true`
                )
              ).json();

            console.log('quoteResponse', quoteResponse);
            
            const swapResponse = await (
                await fetch('https://lite-api.jup.ag/swap/v1/swap', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: context.walletAddress,
                    
                    // ADDITIONAL PARAMETERS TO OPTIMIZE FOR TRANSACTION LANDING
                    // See next guide to optimize for transaction landing
                    dynamicComputeUnitLimit: true,
                    dynamicSlippage: true,
                    prioritizationFeeLamports: {
                          priorityLevelWithMaxLamports: {
                            maxLamports: 1000000,
                            priorityLevel: "veryHigh"
                          }
                        }
                    })
                })
                ).json();
                
            console.log('swapResponse', swapResponse);
            

            if (!swapResponse.swapTransaction) {
                return {
                    data: null,
                    function: 'buy_token',
                    error: 'No swap transaction found',
                };
            }

            return {
                data: {
                    transaction: swapResponse.swapTransaction,
                    hasSwapTransaction: true,
                    token: token,
                },
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
