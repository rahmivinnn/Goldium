import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { SelfContainedWallet } from './wallet-service';

// Create wallet instance
const selfContainedWallet = new SelfContainedWallet();
import { TREASURY_WALLET, GOLDIUM_TOKEN_ADDRESS, SOL_TO_GOLD_RATE, GOLD_TO_SOL_RATE } from './constants';

export interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface SwapMetadata {
  timestamp: number;
  txHash: string;
  fromToken: 'SOL' | 'GOLD';
  toToken: 'SOL' | 'GOLD';
  fromAmount: number;
  toAmount: number;
  rate: number;
}

class SwapService {
  private connection: Connection;
  private swapHistory: SwapMetadata[] = [];

  constructor() {
    this.connection = selfContainedWallet.getConnection();
  }

  // Set external wallet for actual transactions
  setExternalWallet(wallet: any) {
    this.externalWallet = wallet;
  }
  
  private externalWallet: any = null;

  // Swap SOL to GOLD
  async swapSolToGold(solAmount: number): Promise<SwapResult> {
    try {
      console.log(`Swapping ${solAmount} SOL to GOLD through treasury`);
      
      // Use external wallet balance if available, otherwise self-contained
      let currentBalance = 0;
      let useExternalWallet = false;
      
      if (this.externalWallet && this.externalWallet.connected) {
        currentBalance = this.externalWallet.balance;
        useExternalWallet = true;
        console.log(`Using external wallet balance: ${currentBalance} SOL`);
      } else {
        currentBalance = await selfContainedWallet.getBalance();
        console.log(`Using self-contained wallet balance: ${currentBalance} SOL`);
      }
      
      const feeBuffer = 0.001; // Reserve for transaction fees
      const requiredAmount = solAmount + feeBuffer;
      
      console.log(`Balance check: current=${currentBalance}, required=${requiredAmount}, amount=${solAmount}, fees=${feeBuffer}`);
      
      if (currentBalance < requiredAmount) {
        const errorMsg = `Insufficient SOL balance. Need ${requiredAmount.toFixed(6)} SOL but only have ${currentBalance.toFixed(6)} SOL`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      const treasuryPubkey = new PublicKey(TREASURY_WALLET);
      const goldAmount = solAmount * SOL_TO_GOLD_RATE;

      // Create REAL transaction using external wallet or self-contained wallet
      let signature: string;
      
      if (useExternalWallet && this.externalWallet.walletInstance) {
        // Use external wallet for REAL transaction
        console.log('Creating REAL transaction with external wallet');
        
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(this.externalWallet.address),
            toPubkey: treasuryPubkey,
            lamports: solAmount * LAMPORTS_PER_SOL,
          })
        );
        
        // Get recent blockhash
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(this.externalWallet.address);
        
        // Sign and send through external wallet
        const signedTransaction = await this.externalWallet.walletInstance.signTransaction(transaction);
        signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        
        console.log(`REAL transaction sent: ${signature}`);
        
        // Wait for confirmation
        await this.connection.confirmTransaction(signature);
        
      } else {
        // Fallback to self-contained wallet
        console.log('Creating REAL transaction with self-contained wallet');
        
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: selfContainedWallet.getPublicKey(),
            toPubkey: treasuryPubkey,
            lamports: solAmount * LAMPORTS_PER_SOL,
          })
        );
        
        signature = await selfContainedWallet.signAndSendTransaction(transaction);
      }
      
      // Record swap metadata
      const swapData: SwapMetadata = {
        timestamp: Date.now(),
        txHash: signature,
        fromToken: 'SOL',
        toToken: 'GOLD',
        fromAmount: solAmount,
        toAmount: goldAmount,
        rate: SOL_TO_GOLD_RATE
      };
      
      this.swapHistory.push(swapData);
      
      console.log(`REAL swap successful: ${signature}`);
      return { success: true, signature };
      
    } catch (error: any) {
      console.error('REAL SOL to GOLD swap failed:', error);
      
      // Handle specific wallet errors for REAL transactions
      if (error.message?.includes('User rejected')) {
        return { success: false, error: 'Transaction was cancelled by user' };
      } else if (error.message?.includes('insufficient funds') || error.message?.includes('Attempt to debit an account')) {
        return { success: false, error: 'Insufficient SOL balance for this transaction' };
      } else {
        return { success: false, error: error.message || 'Transaction failed' };
      }
    }
  }

  // Swap GOLD to SOL (simplified - in reality would need GOLD token account)
  async swapGoldToSol(goldAmount: number): Promise<SwapResult> {
    try {
      console.log(`Swapping ${goldAmount} GOLD to SOL through treasury`);
      
      const solAmount = goldAmount * GOLD_TO_SOL_RATE;
      
      // This would involve transferring GOLD tokens to treasury
      // and receiving SOL back - simplified for now
      
      const mockSignature = `mock_gold_to_sol_${Date.now()}`;
      
      // Record swap metadata
      const swapData: SwapMetadata = {
        timestamp: Date.now(),
        txHash: mockSignature,
        fromToken: 'GOLD',
        toToken: 'SOL',
        fromAmount: goldAmount,
        toAmount: solAmount,
        rate: GOLD_TO_SOL_RATE
      };
      
      this.swapHistory.push(swapData);
      
      console.log(`GOLD to SOL swap simulated: ${mockSignature}`);
      return { success: true, signature: mockSignature };
      
    } catch (error: any) {
      console.error('GOLD to SOL swap failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get swap history
  getSwapHistory(): SwapMetadata[] {
    return this.swapHistory;
  }

  // Clear swap history
  clearHistory(): void {
    this.swapHistory = [];
  }
}

export const swapService = new SwapService();