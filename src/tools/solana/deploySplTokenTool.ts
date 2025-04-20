import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo
} from '@solana/spl-token';
import {Keypair} from '@solana/web3.js';
import {createSolanaPublicClient} from '../../solana/createSolanaPublicClient.js';
import {createSolanaWalletClient, SolanaWalletClient} from '../../solana/createSolanaWalletClient.js';
import {ToolConfig} from "../allTools.js";

interface DeploySplTokenArgs {
    name: string;
    symbol: string;
    decimals?: number;
    initialSupply?: string;
}

export const deploySplTokenTool: ToolConfig<DeploySplTokenArgs> = {
    definition: {
        type: 'function',
        function: {
            name: 'deploy_spl_token',
            description: 'Deploy a new Solana SPL token',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Token name' },
                    symbol: { type: 'string', description: 'Token symbol' },
                    decimals: { 
                        type: 'number', 
                        description: 'Token decimals (default: 9)', 
                        nullable: true 
                    },
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
    handler: async ({ name, symbol, decimals, initialSupply }: DeploySplTokenArgs) => {
        try {
            // Connect to devnet
            const connection = createSolanaPublicClient();
            const walletClient: SolanaWalletClient = createSolanaWalletClient();
            
            // Vérifier si nous utilisons un wallet Phantom
            if (walletClient.isPhantomWallet) {
                throw new Error("This operation requires a server wallet with a private key. Cannot use Phantom wallet for token deployment.");
            }

            // Créer un payer compatible avec l'API SPL Token
            if (!walletClient.secretKey) {
                throw new Error("Missing private key for token deployment");
            }

            const payer = Keypair.fromSecretKey(walletClient.secretKey);
            
            // Default values
            const tokenDecimals = decimals ?? 9;
            const supply = initialSupply ? parseFloat(initialSupply) : 1_000_000_000;
            
            console.log(`Creating SPL token "${name}" (${symbol}) with ${tokenDecimals} decimals...`);
            
            // Create a new token mint
            const mint = await createMint(
                connection,       // connection
                payer,            // payer
                payer.publicKey,  // mintAuthority
                payer.publicKey,  // freezeAuthority (you can use `null` to disable it)
                tokenDecimals     // decimals
            );
            
            console.log(`Token mint created: ${mint.toBase58()}`);
            
            // Get the token account of the wallet address, and if it does not exist, create it
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                mint,
                payer.publicKey
            );
            
            console.log(`Token account: ${tokenAccount.address.toBase58()}`);
            
            // Mint the initial supply to the token account we just created
            const mintAmount = supply * 10 ** tokenDecimals;
            await mintTo(
                connection,
                payer,
                mint,
                tokenAccount.address,
                payer,
                mintAmount
            );
            
            console.log(`Minted ${supply} tokens to ${tokenAccount.address.toBase58()}`);
            
            // Return the mint address (token address)
            return {
                tokenAddress: mint.toBase58(),
                tokenAccount: tokenAccount.address.toBase58(),
                name,
                symbol,
                decimals: tokenDecimals,
                initialSupply: supply
            };
            
        } catch (error) {
            throw new Error(
                `Failed to deploy SPL token: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}; 