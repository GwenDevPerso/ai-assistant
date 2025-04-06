import {Keypair} from '@solana/web3.js';
import bs58 from 'bs58';

export function createSolanaWalletClient() {
    // Load the private key from environment variable
    const privateKeyBase58 = process.env.SOLANA_PRIVATE_KEY;
    
    if (!privateKeyBase58) {
        throw new Error('SOLANA_PRIVATE_KEY environment variable not set');
    }
    
    // Convert the base58 private key to Uint8Array and create a keypair
    const privateKey = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(privateKey);
} 