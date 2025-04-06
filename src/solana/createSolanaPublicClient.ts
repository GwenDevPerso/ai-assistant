import {Connection, clusterApiUrl} from '@solana/web3.js';

export function createSolanaPublicClient() {
    // Using devnet for testing
    return new Connection(clusterApiUrl('devnet'), 'confirmed');
} 