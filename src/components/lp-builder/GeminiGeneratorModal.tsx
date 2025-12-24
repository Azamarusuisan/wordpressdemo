import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessInfoForm, BusinessInfo } from './BusinessInfoForm';

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
                // 成功したら親コンポーネントに通知
                onGenerated(result.data.sections);
                onClose(); // とりあえず閉じる
                setStep('input'); // リセット
            } else {
                throw new Error('データの形式が不正です');
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[48px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100/50 flex justify-between items-center bg-white/30">
                    <div className="flex items-center space-x-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 blur-lg opacity-20" />
                            <div className="relative p-4 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-lg transform -rotate-3">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI LP Generator</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by ZettAI AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group relative h-12 w-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-white/20">
                    {step === 'input' && (
                        <div className="animate-fadeIn">
                            <div className="mb-10">
                                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">ビジネス情報を入力してください</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    あなたのビジネスについて教えてください。AIが最適な構成と文章を提案します。<br />
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">※ 入力内容が詳しいほど、より精度の高いLPが生成されます</span>
                                </p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-8 p-5 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl text-red-700 flex items-center shadow-lg shadow-red-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
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
                            <div className="relative w-32 h-32 mb-10">
                                <div className="absolute inset-0 border-[6px] border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">
                                    🔮
                                </div>
                                <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">AIがLPを魔法のように生成中です...</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                                市場分析、構成案の作成、キャッチコピーの執筆を行っています。<br />
                                <span className="text-indigo-600 font-bold">最高のLPを準備しています。</span>少々お待ちください。
                            </p>

                            <div className="mt-12 w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-2 rounded-full animate-progress" />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );

    // Next.jsのApp Routerでもdocument.bodyがあればcreatePortalは使える
    // ただしSSR時はnullになるので注意
    if (typeof document === 'undefined') return null;

    return createPortal(modalContent, document.body);
};
