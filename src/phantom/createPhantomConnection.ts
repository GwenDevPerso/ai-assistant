import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';

// This interface reflects what we expect to store in a session
// when connected to a Phantom wallet
export interface PhantomWalletConnection {
  publicKey: PublicKey;
  connection: Connection;
  isConnected: boolean;
}

let phantomConnection: PhantomWalletConnection | null = null;

/**
 * Store a Phantom wallet connection for use in the backend
 * This is used when the frontend has connected to Phantom and 
 * passed the necessary details to the backend
 */
export function setPhantomConnection(publicKeyString: string): PhantomWalletConnection {
  // Create a Solana connection (this would typically be configured based on your needs)
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Store the connection details
  phantomConnection = {
    publicKey: new PublicKey(publicKeyString),
    connection,
    isConnected: true
  };
  
  return phantomConnection;
}

/**
 * Get the current Phantom wallet connection
 */
export function getPhantomConnection(): PhantomWalletConnection | null {
  return phantomConnection;
}

/**
 * Clear the current Phantom wallet connection
 */
export function clearPhantomConnection(): void {
  phantomConnection = null;
} 