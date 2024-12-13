import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import bs58 from "bs58";

const createSolanaWallet = () => {
  // Generate a new keypair
  const keypair = Keypair.generate();

  // Get secret key and public key
  const secretKey = bs58.encode(keypair.secretKey);
  const publicKey = keypair.publicKey.toString();

  // Generate recovery phrase
  const mnemonic = bip39.generateMnemonic();

  return {
    secretKey,
    publicKey,
    mnemonic,
  };
};

const getSolanaBalance = async (publicAddress: string) => {
  try {
    // Connect to devnet
    const connection = new Connection("https://api.devnet.solana.com");

    // Get balance in lamports
    const balanceInLamports = await connection.getBalance(
      new PublicKey(publicAddress)
    );

    // Convert to SOL
    const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;

    return balanceInSOL;
  } catch (error: any) {
    console.error("Error getting Solana devnet balance:", error.message);
    return 0;
  }
};

const sendSolanaTransaction = async (
  senderSecretKey: string,
  recipientAddress: string,
  amount: number
): Promise<{
  success: boolean;
  signature: string | null;
  message: string;
  explorerUrl?: string;
}> => {
  try {
    // Connect to devnet
    const connection = new Connection("https://api.devnet.solana.com");

    // Convert secret key to Keypair
    const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderSecretKey));
    const recipientPubKey = new PublicKey(recipientAddress);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPubKey,
        lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
      })
    );

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderKeypair,
    ]);

    const explorerUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;

    return {
      success: true,
      signature,
      message: `Transferred ${amount} SOL 🪙 to ${recipientAddress}\n\nYou can view the transaction on ${explorerUrl}`,
    };
  } catch (error: any) {
    console.error("Error sending Solana transaction:", error.message);
    return {
      success: false,
      signature: null,
      message: error.message,
    };
  }
};

export { createSolanaWallet, getSolanaBalance, sendSolanaTransaction };
