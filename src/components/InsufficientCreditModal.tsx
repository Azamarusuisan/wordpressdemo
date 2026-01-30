'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  Coins,
  CreditCard,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { CREDIT_PACKAGES, usdToTokens, formatTokens } from '@/lib/plans';

interface InsufficientCreditContextValue {
  showModal: (data: { currentBalance: number; requiredAmount: number }) => void;
  hideModal: () => void;
}

const InsufficientCreditContext = createContext<InsufficientCreditContextValue | null>(null);

export function useInsufficientCredit() {
  const context = useContext(InsufficientCreditContext);
  if (!context) {
    throw new Error('useInsufficientCredit must be used within InsufficientCreditProvider');
  }
  return context;
}

interface ProviderProps {
  children: React.ReactNode;
}

export function InsufficientCreditProvider({ children }: ProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [creditData, setCreditData] = useState<{
    currentBalance: number;
    requiredAmount: number;
  } | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);

  const showModal = useCallback((data: { currentBalance: number; requiredAmount: number }) => {
    setCreditData(data);
    setIsOpen(true);
  }, []);

  const hideModal = useCallback(() => {
    setIsOpen(false);
    setCreditData(null);
  }, []);

  const handlePurchase = async (packageId: number) => {
    try {
      setPurchaseLoading(packageId);
      toast.loading('決済ページを準備中...', { id: 'credit-purchase' });

      const res = await fetch('/api/billing/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (!res.ok) throw new Error('Failed');

      const { url } = await res.json();
      toast.dismiss('credit-purchase');
      window.location.href = url;
    } catch {
      toast.error('購入処理に失敗しました', { id: 'credit-purchase' });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const deficit = creditData ? creditData.requiredAmount - creditData.currentBalance : 0;

  // 不足分を補うのに最適なパッケージを推薦
  const recommendedPackage = CREDIT_PACKAGES.find((pkg) => pkg.creditUsd >= deficit) || CREDIT_PACKAGES[CREDIT_PACKAGES.length - 1];

  return (
    <InsufficientCreditContext.Provider value={{ showModal, hideModal }}>
      {children}

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* ヘッダー - 警告カラー */}
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">

                      <div className="absolute inset-0 bg-black/10" />
                      <motion.img
                        src="/bell-bag.png"
                        alt="Credit Bag"
                        className="absolute -right-6 -bottom-8 w-32 h-32 object-contain opacity-40 rotate-[10deg]"
                        initial={{ rotate: 10, scale: 0.9 }}
                        animate={{ rotate: 15, scale: 1 }}
                        transition={{ duration: 0.8, ease: "backOut" }}
                      />
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                      <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>

                      <div className="relative z-10 flex items-start gap-4">
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                        >
                          <AlertTriangle className="w-8 h-8" />
                        </motion.div>
                        <div>
                          <Dialog.Title className="text-xl font-bold">
                            トークン残高不足
                          </Dialog.Title>
                          <Dialog.Description className="text-sm text-white/80 mt-1">
                            この操作を実行するにはトークンが不足しています
                          </Dialog.Description>
                        </div>
                      </div>
                    </div>

                    {/* トークン情報 */}
                    <div className="p-6 border-b">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">現在の残高</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatTokens(usdToTokens(creditData?.currentBalance || 0))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                          <p className="text-xs text-red-600 mb-1">必要トークン</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatTokens(usdToTokens(creditData?.requiredAmount || 0))}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded-xl">
                          <p className="text-xs text-amber-600 mb-1">不足分</p>
                          <p className="text-lg font-bold text-amber-600">
                            {formatTokens(usdToTokens(deficit))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 推奨パッケージ */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        おすすめのトークンパッケージ
                      </div>

                      {recommendedPackage && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handlePurchase(recommendedPackage.id)}
                          disabled={purchaseLoading !== null}
                          className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/20 rounded-lg">
                                <Zap className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold">{recommendedPackage.name}</p>
                                <p className="text-sm text-white/80">
                                  {formatTokens(usdToTokens(recommendedPackage.creditUsd))} トークン
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {purchaseLoading === recommendedPackage.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <span className="text-xl font-bold">
                                    ¥{recommendedPackage.priceJpy.toLocaleString()}
                                  </span>
                                  <ChevronRight className="w-5 h-5" />
                                </>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )}

                      {/* その他のパッケージ */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">その他のパッケージ</p>
                        <div className="grid grid-cols-2 gap-2">
                          {CREDIT_PACKAGES.filter((pkg) => pkg.id !== recommendedPackage?.id)
                            .slice(0, 4)
                            .map((pkg) => (
                              <motion.button
                                key={pkg.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handlePurchase(pkg.id)}
                                disabled={purchaseLoading !== null}
                                className="p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                                    <p className="text-xs text-gray-500">{formatTokens(usdToTokens(pkg.creditUsd))} トークン</p>
                                  </div>
                                  {purchaseLoading === pkg.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                  ) : (
                                    <span className="text-sm font-bold text-blue-600">
                                      ¥{pkg.priceJpy.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </motion.button>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* フッター */}
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span>安全な決済</span>
                      </div>
                      <button
                        onClick={hideModal}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        後で購入する
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </InsufficientCreditContext.Provider>
  );
}

// グローバルに使用できるヘルパー関数
let globalShowModal: ((data: { currentBalance: number; requiredAmount: number }) => void) | null = null;

export function setGlobalShowModal(fn: typeof globalShowModal) {
  globalShowModal = fn;
}

export function showInsufficientCreditModal(data: { currentBalance: number; requiredAmount: number }) {
  if (globalShowModal) {
    globalShowModal(data);
  } else {
    // フォールバック: トーストで通知
    toast.error(
      `トークン残高が不足しています。残高: ${formatTokens(usdToTokens(data.currentBalance))}, 必要: ${formatTokens(usdToTokens(data.requiredAmount))}`,
      { duration: 5000 }
    );
  }
}

// API呼び出し用のラッパー
export async function fetchWithCreditCheck<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);

  if (res.status === 402) {
    const errorData = await res.json();

    if (errorData.error === 'INSUFFICIENT_CREDIT') {
      showInsufficientCreditModal({
        currentBalance: errorData.credits?.currentBalance || 0,
        requiredAmount: errorData.credits?.estimatedCost || 0,
      });
    } else if (errorData.error === 'SUBSCRIPTION_REQUIRED') {
      toast.error('サブスクリプションが必要です。設定画面からプランを選択してください。', {
        duration: 5000,
      });
    } else if (errorData.error === 'API_KEY_REQUIRED') {
      toast.error(
        'FreeプランではAPIキーの設定が必要です。設定画面でGoogle AI APIキーを入力してください。',
        {
          duration: 6000,
          icon: '🔑',
        }
      );
    }

    throw new Error(errorData.message || 'Payment required');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Request failed');
  }

  return res.json();
}
