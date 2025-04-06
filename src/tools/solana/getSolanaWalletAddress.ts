import {createSolanaWalletClient} from '../../solana/createSolanaWalletClient.js';
import {ToolConfig} from '../allTools.js';

export const getSolanaWalletAddressTool: ToolConfig<{}> = {
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
    handler: async () => {
        const wallet = createSolanaWalletClient();
        return wallet.publicKey.toString();
    }
}; 