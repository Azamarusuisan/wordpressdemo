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

    // Design Analysis State
    const [designImage, setDesignImage] = useState<string | null>(null);
    const [designDefinition, setDesignDefinition] = useState<any | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleDesignImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                setDesignImage(base64);

                // Analyze
                try {
                    const res = await fetch('/api/ai/analyze-design', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageUrl: base64 })
                    });

                    if (!res.ok) throw new Error('デザイン解析に失敗しました');

                    const data = await res.json();
                    setDesignDefinition(data);
                } catch (err) {
                    console.error(err);
                    setError('デザイン解析に失敗しました。別の画像を試してください。');
                    setDesignImage(null);
                } finally {
                    setIsAnalyzing(false);
                }
            };
        } catch (err) {
            console.error(err);
            setIsAnalyzing(false);
        }
    };

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
                body: JSON.stringify({
                    businessInfo: data,
                    designDefinition: designDefinition // Pass optional design definition
                }),
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

                            {/* Design Reference Upload Section */}
                            <div className="mb-8 p-6 bg-surface-50 border border-border rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-foreground flex items-center">
                                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                                        デザインリファレンス (任意)
                                    </h4>
                                    {designDefinition && (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                                            解析完了: {designDefinition.vibe}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                    参考にしたいWebサイトやデザインの画像をアップロードすると、AIがその「雰囲気」や「配色」を解析してページに適用します。
                                </p>

                                {!designImage && !designDefinition ? (
                                    <div className="relative border-2 border-dashed border-border hover:border-primary transition-colors rounded-lg p-8 text-center cursor-pointer group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleDesignImageUpload}
                                            disabled={isAnalyzing}
                                        />
                                        <div className="flex flex-col items-center">
                                            <div className="p-3 bg-surface-100 group-hover:bg-primary/10 rounded-full mb-3 transition-colors">
                                                {isAnalyzing ? (
                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-foreground">
                                                {isAnalyzing ? 'デザインを解析中...' : '画像をアップロードまたはドラッグ＆ドロップ'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start space-x-4 bg-background p-4 rounded-lg border border-border">
                                        {designImage && (
                                            <img
                                                src={designImage}
                                                alt="Reference"
                                                className="w-20 h-20 object-cover rounded-md border border-border"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-sm font-bold text-foreground mb-1">デザイン定義</h5>
                                            {designDefinition ? (
                                                <div className="text-xs text-muted-foreground space-y-1">
                                                    <p><span className="font-semibold">Vibe:</span> {designDefinition.vibe}</p>
                                                    <p><span className="font-semibold">Colors:</span> {designDefinition.colorPalette?.primary}, {designDefinition.colorPalette?.background}</p>
                                                    <p className="line-clamp-2"><span className="font-semibold">Desc:</span> {designDefinition.description}</p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">解析中...</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setDesignImage(null);
                                                setDesignDefinition(null);
                                            }}
                                            className="text-muted-foreground hover:text-red-500 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
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
