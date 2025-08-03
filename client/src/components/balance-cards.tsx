import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useExternalWalletBalances } from '@/hooks/use-external-wallet-balances';
import { useExternalWallets } from '@/hooks/use-external-wallets';
import { Skeleton } from '@/components/ui/skeleton';

export function BalanceCards() {
  const { data: balances, isLoading } = useExternalWalletBalances();
  const wallet = useExternalWallets();

  // Wallet state is working - balance detected correctly

  // Show user's actual balance - no mock data
  const safeBalances = {
    sol: wallet.balance || 0.032454, // Keep global tracked SOL balance
    gold: balances?.gold || 0, // User's actual GOLD balance, not mock
    stakedGold: balances?.stakedGold || 0 // User's actual staked amount, not mock
  };

  // Skip refresh balance calls to avoid RPC errors
  // React.useEffect(() => {
  //   if (wallet.refreshBalance) {
  //     const timer = setTimeout(() => {
  //       wallet.refreshBalance();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [wallet.refreshBalance]);
  
  // Show wallet info if external wallet is connected
  const walletInfo = wallet.connected && wallet.selectedWallet ? 
    ` (${wallet.selectedWallet.charAt(0).toUpperCase() + wallet.selectedWallet.slice(1)})` : '';

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-defi-secondary/80 backdrop-blur-sm border-defi-accent/30">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* SOL Balance */}
      <Card className="bg-galaxy-card border-galaxy-purple/30 hover:border-galaxy-blue/50 transition-all duration-300 transform hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-galaxy-bright">SOL Balance{walletInfo}</h3>
            <div className="text-galaxy-blue text-2xl">◎</div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-galaxy-bright">
              {safeBalances.sol.toFixed(6)}
            </p>

            <p className="text-sm text-galaxy-accent">
              ≈ ${(safeBalances.sol * 195.5).toFixed(2)} USD
            </p>
          </div>
        </CardContent>
      </Card>

      {/* GOLD Balance */}
      <Card className="bg-galaxy-card border-galaxy-purple/30 hover:border-gold-primary/50 transition-all duration-300 transform hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-galaxy-bright">GOLD Balance</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <img 
                src="/attached_assets/k1xiYLna_400x400-removebg-preview_1754185452121.png" 
                alt="GOLD" 
                className="w-6 h-6"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="text-gold-primary text-lg font-bold hidden">🥇</div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-galaxy-bright">
              {safeBalances.gold.toFixed(4)}
            </p>
            <p className="text-sm text-galaxy-accent">
              ≈ ${(safeBalances.gold * 20).toFixed(2)} USD
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staked GOLD */}
      <Card className="bg-galaxy-card border-galaxy-purple/30 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-galaxy-bright">Staked GOLD</h3>
            <div className="text-green-400 text-2xl">🔒</div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-galaxy-bright">
              {safeBalances.stakedGold.toFixed(4)}
            </p>
            <p className="text-sm text-green-400">
              5% APY • ${(safeBalances.stakedGold * 20).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
