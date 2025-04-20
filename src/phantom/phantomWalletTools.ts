import {LAMPORTS_PER_SOL, Transaction, TransactionInstruction} from '@solana/web3.js';
import {getPhantomConnection} from './createPhantomConnection.js';

/**
 * Gets the connected Phantom wallet's address as a string
 */
export function getPhantomWalletAddress(): string | null {
  const connection = getPhantomConnection();
  if (!connection || !connection.isConnected) {
    return null;
  }
  return connection.publicKey.toString();
}

/**
 * Gets the balance of the connected Phantom wallet in SOL
 */
export async function getPhantomWalletBalance(): Promise<number | null> {
  const connection = getPhantomConnection();
  if (!connection || !connection.isConnected) {
    return null;
  }
  
  try {
    const balance = await connection.connection.getBalance(connection.publicKey);

    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting Phantom wallet balance:', error);
    return null;
  }
}

/**
 * Creates a transaction object that can be sent to the frontend
 * for signing with Phantom wallet
 */
export async function createTransactionForPhantomSigning(
  instructions: TransactionInstruction[],
  recentBlockhash?: string
): Promise<Transaction | null> {
  const connection = getPhantomConnection();
  if (!connection || !connection.isConnected) {
    return null;
  }
  
  try {
    const transaction = new Transaction();
    
    // Add all provided instructions
    for (const instruction of instructions) {
      transaction.add(instruction);
    }
    
    // Set the fee payer to the connected wallet
    transaction.feePayer = connection.publicKey;
    
    // Get a recent blockhash if not provided
    if (!recentBlockhash) {
      const { blockhash } = await connection.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
    } else {
      transaction.recentBlockhash = recentBlockhash;
    }
    
    return transaction;
  } catch (error) {
    console.error('Error creating transaction for Phantom signing:', error);
    return null;
  }
}

/**
 * Validates a signature from a Phantom wallet transaction
 * This is useful for confirming transactions were processed
 */
export async function validatePhantomTransaction(signature: string): Promise<boolean> {
  const connection = getPhantomConnection();
  if (!connection || !connection.isConnected) {
    return false;
  }
  
  try {
    const status = await connection.connection.getSignatureStatus(signature);
    return status !== null && status.value !== null && !status.value.err;
  } catch (error) {
    console.error('Error validating Phantom transaction:', error);
    return false;
  }
} 