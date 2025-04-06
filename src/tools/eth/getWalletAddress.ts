import {createViemWalletClient} from '../../viem/createViemWalletClient.js';
import {ToolConfig} from '../allTools.js';

export const getWalletAddressTool: ToolConfig<{}> = {
    definition: {
        type: 'function',
        function: {
            name: 'get_wallet_address',
            description: 'Get the AI bot\'s connected wallet address of the AI bot',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            },
        },
    },
    handler: async () => {
        const walletClient = createViemWalletClient();
        return walletClient.account.address;
    }
};