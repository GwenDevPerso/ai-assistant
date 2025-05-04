// import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
// import { getPhantomConnection } from '../../phantom/createPhantomConnection.js';
// import { createTransactionForPhantomSigning } from '../../phantom/phantomWalletTools.js';
// import { ToolConfig } from '../allTools.js';

// interface CreatePhantomTransactionArgs {
//   recipient: string;
//   amount: number;
//   memo?: string;
// }

// /**
//  * Tool for creating a transaction that can be sent to the frontend
//  * for signing with Phantom wallet.
//  */
// export const createPhantomTransaction: ToolConfig<CreatePhantomTransactionArgs> = {
//   definition: {
//     type: 'function',
//     function: {
//       name: 'create_phantom_transaction',
//       description: 'Create a Solana transaction to be signed by Phantom wallet',
//       parameters: {
//         type: 'object',
//         properties: {
//           recipient: {
//             type: 'string',
//             description: 'The recipient wallet address'
//           },
//           amount: {
//             type: 'number',
//             description: 'The amount in SOL to send'
//           },
//           memo: {
//             type: 'string',
//             description: 'Optional memo to include with the transaction'
//           }
//         },
//         required: ['recipient', 'amount']
//       }
//     }
//   },
//   handler: async (args: CreatePhantomTransactionArgs) => {
//     try {
//       const { recipient, amount, memo } = args;
      
//       // Check if Phantom wallet is connected
//       const connection = getPhantomConnection();
//       if (!connection || !connection.isConnected) {
//         return {
//           success: false,
//           error: 'Phantom wallet is not connected',
//           message: 'Please connect to Phantom wallet first'
//         };
//       }
      
//       // Create a recipient public key
//       let recipientPubkey: PublicKey;
//       try {
//         recipientPubkey = new PublicKey(recipient);
//       } catch (error) {
//         return {
//           success: false,
//           error: 'Invalid recipient address',
//           message: 'The recipient address is not a valid Solana address'
//         };
//       }
      
//       // Create a transfer instruction
//       const instruction = SystemProgram.transfer({
//         fromPubkey: connection.publicKey,
//         toPubkey: recipientPubkey,
//         lamports: amount * LAMPORTS_PER_SOL
//       });
      
//       // Create the transaction
//       const transaction = await createTransactionForPhantomSigning([instruction]);
      
//       if (!transaction) {
//         return {
//           success: false,
//           error: 'Failed to create transaction',
//           message: 'Could not create the transaction'
//         };
//       }
      
//       // Serialize the transaction to send to the frontend
//       const serializedTransaction = Buffer.from(
//         transaction.serialize({requireAllSignatures: false})
//       ).toString('base64');
      
//       return {
//         success: true,
//         serializedTransaction,
//         message: `Transaction created to send ${amount} SOL to ${recipient}`,
//         // This data would be sent to the frontend app which would then
//         // use Phantom to sign and broadcast the transaction
//         frontendData: {
//           transaction: serializedTransaction,
//           sender: connection.publicKey.toString(),
//           receiver: recipient,
//           amount
//         }
//       };
//     } catch (error) {
//       console.error('Error creating Phantom transaction:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//         message: 'Failed to create transaction'
//       };
//     }
//   }
// }; 