import {createViemPublicClient} from "../../viem/createViemPublicClient.js";
import {createViemWalletClient} from "../../viem/createViemWalletClient.js";
import {ToolConfig} from "../allTools.js";


const ERC20_ABI = [] as const;
const ERC20_BYTECODE = "0x";

interface DeployErc20Args {
    name: string;
    symbol: string;
    initialSupply?: string;
}

export const deployErc20Tool: ToolConfig<DeployErc20Args> = {
    definition: {
        type: 'function',
        function: {
            name: 'deploy_erc20_token',
            description: 'Deploy a new  ERC20 token contract',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Token name' },
                    symbol: { type: 'string', description: 'Token symbol' },
                    initialSupply: { 
                        type: 'string', 
                        description: 'Initial supply (default: 1 billion)', 
                        nullable: true 
                    }
                },
                required: ['name', 'symbol']
            },
        },
    },
    handler: async ({ name, symbol, initialSupply }: DeployErc20Args) => {
        try {
            const walletClient = createViemWalletClient();
            const publicClient = createViemPublicClient();
            
            // Default initial supply to 1 billion tokens
            const supply = initialSupply ? BigInt(initialSupply) : BigInt(1_000_000_000);
    
            // Prepare contract deployment transaction
            const txHash = await walletClient.deployContract({
                abi: ERC20_ABI,
                bytecode: ERC20_BYTECODE,
                args: [name, symbol, supply],
                account: walletClient.account
            });
    
            console.log(`Transaction sent: ${txHash}`);
    
            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            if (!receipt.contractAddress) {
                throw new Error('Contract address not found in transaction receipt');
            }
    
            console.log(`Contract deployed at: ${receipt.contractAddress}`);
            return receipt.contractAddress;
            
        } catch (error) {
            throw new Error(
                `Failed to deploy erc20: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }
};
