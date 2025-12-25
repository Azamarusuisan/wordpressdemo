import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessInfoForm, BusinessInfo } from './BusinessInfoForm';
import { Sparkles, X, AlertCircle } from 'lucide-react';

interface GeminiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (sections: any[]) => void;
}

type Step = 'input' | 'generating' | 'preview';

export const GeminiGeneratorModal: React.FC<GeminiGeneratorModalProps> = ({
    isOpen,
    onClose,
    onGenerated,
}) => {
    const [step, setStep] = useState<Step>('input');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async (data: BusinessInfo) => {
        setLoading(true);
        setError(null);
        setStep('generating');

        try {
            const response = await fetch('/api/lp-builder/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ businessInfo: data }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '生成に失敗しました');
            }

            if (result.success && result.data) {
                onGenerated(result.data.sections);
                onClose();
                setStep('input');
            } else {
                throw new Error('無効なデータ形式を受信しました');
            }
        } catch (err: any) {
            console.error('Generation error:', err);
            setError(err.message || '予期せぬエラーが発生しました');
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-background border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface-50">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">AI LPジェネレーター</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Powered by ZettAI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-muted-foreground hover:bg-surface-100 hover:text-foreground rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-background">
                    {step === 'input' && (
                        <div className="animate-fadeIn max-w-2xl mx-auto">
                            <div className="mb-8 text-center">
                                <h3 className="text-2xl font-bold text-foreground mb-3">ビジネスについて教えてください</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    あなたのビジネスの詳細を共有してください。AIが最適な構成とコピーを提案します。<br />
                                    <span className="text-xs opacity-70 block mt-2">※ 詳細に入力するほど、より高品質なページが生成されます。</span>
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-8 p-4 bg-red-50 border border-red-100 rounded-md text-red-600 flex items-center text-sm"
                                >
                                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                                    <span className="font-bold">{error}</span>
                                </motion.div>
                            )}

                            <BusinessInfoForm
                                onSubmit={handleGenerate}
                                onCancel={onClose}
                                isLoading={loading}
                            />
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-surface-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-4">AIがページを生成しています...</h3>
                            <p className="text-muted-foreground font-medium max-w-md mx-auto leading-relaxed mb-8">
                                市場を分析し、コンテンツを構成し、コピーを執筆しています。<br />
                                あなただけのプレミアムな体験を創造中。
                            </p>

                            <div className="w-full max-w-xs bg-surface-100 rounded-full h-1 overflow-hidden">
                                <div className="bg-primary h-1 rounded-full animate-progress" />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );

    if (typeof document === 'undefined') return null;

    return createPortal(modalContent, document.body);
};
