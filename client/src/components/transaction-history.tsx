import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSelfContainedWallet } from './self-contained-wallet-provider';
import { TransactionInfo } from '@/lib/transaction-tracker';

export function TransactionHistory() {
  const { transactionTracker } = useSelfContainedWallet();
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch both treasury and user transactions
      const [treasuryTxs, userTxs] = await Promise.all([
        transactionTracker.fetchTreasuryTransactions(),
        transactionTracker.fetchUserTransactions()
      ]);
      
      // Combine and sort by timestamp
      const allTxs = [...treasuryTxs, ...userTxs]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20); // Show latest 20 transactions
      
      setTransactions(allTxs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get transaction type icon
  const getTransactionIcon = (type: TransactionInfo['type']) => {
    switch (type) {
      case 'swap': return '🔄';
      case 'stake': return '🔒';
      case 'unstake': return '🔓';
      case 'claim': return '💰';
      default: return '📤';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TransactionInfo['status']) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-galaxy-card border-galaxy-purple/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-galaxy-bright">
          Transaction History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
          className="bg-galaxy-button border-galaxy-purple/30 hover:border-galaxy-blue/50 text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-galaxy-accent" />
            <span className="ml-2 text-galaxy-accent">Loading transactions...</span>
          </div>
        ) : transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <div
              key={tx.signature}
              className="flex items-center justify-between p-3 bg-galaxy-card/50 rounded-lg border border-galaxy-purple/20 hover:border-galaxy-blue/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-galaxy-bright capitalize">
                      {tx.type}
                    </span>
                    {getStatusIcon(tx.status)}
                  </div>
                  <p className="text-xs text-galaxy-accent">
                    {tx.amount} {tx.token}
                  </p>
                  <p className="text-xs text-galaxy-accent">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(tx.solscanUrl, '_blank')}
                  title="Track on Solscan"
                  className="bg-transparent border-galaxy-purple/30 hover:border-galaxy-blue/50 text-galaxy-accent hover:text-galaxy-bright"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-galaxy-accent">No transactions found</p>
            <p className="text-xs text-galaxy-accent mt-1">
              Transactions will appear here after you perform swaps or staking
            </p>
          </div>
        )}
        
        {transactions.length > 0 && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(
                `https://solscan.io/account/APkBg8kzMBpVKxvgrw67vkd5KuGWqSu2GVb19eK4pump`,
                '_blank'
              )}
              className="bg-galaxy-button border-galaxy-purple/30 hover:border-galaxy-blue/50 text-white"
            >
              Track Treasury on Solscan <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}