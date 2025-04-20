import {Keypair, PublicKey} from '@solana/web3.js';
import bs58 from 'bs58';
import {getPhantomConnection} from '../phantom/createPhantomConnection.js';

// Définir un type de retour qui garantit toujours la présence de publicKey
export interface SolanaWalletClient {
    publicKey: PublicKey;
    isPhantomWallet: boolean;
    secretKey?: Uint8Array; // Optionnel car Phantom ne fournit pas la clé privée
}

export function createSolanaWalletClient(): SolanaWalletClient {
    // Check if we have a Phantom wallet connection
    const phantomConnection = getPhantomConnection();
    
    if (phantomConnection && phantomConnection.isConnected) {
        // If we have a Phantom connection, return the public key
        // Since the actual signing would happen in the frontend with Phantom
        return {
            publicKey: phantomConnection.publicKey,
            isPhantomWallet: true
        };
    }
    
    // If no Phantom connection, fall back to the private key from environment variable
    const privateKeyBase58 = process.env.SOLANA_PRIVATE_KEY;
    
    if (!privateKeyBase58) {
        throw new Error('No wallet connection available. Please connect Phantom wallet or set SOLANA_PRIVATE_KEY environment variable');
    }
    
    // Convert the base58 private key to Uint8Array and create a keypair
    const privateKey = bs58.decode(privateKeyBase58);
    const keypair = Keypair.fromSecretKey(privateKey);
    
    return {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
        isPhantomWallet: false
    };
} 