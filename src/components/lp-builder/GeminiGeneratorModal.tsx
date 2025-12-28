import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessInfoForm, BusinessInfo } from './BusinessInfoForm';
import { Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';

interface GeminiGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (sections: any[], meta?: { duration: number, estimatedCost: number }) => void;
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

                    if (!res.ok) throw new Error('Failed to analyze design');

                    const data = await res.json();
                    setDesignDefinition(data);
                } catch (err) {
                    console.error(err);
                    setError('Failed to analyze design. Please try another image.');
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
                throw new Error(result.error || 'Generation failed');
            }

            if (result.success && result.data) {
                onGenerated(result.data.sections, result.data.meta);
                onClose();
                setStep('input');
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (err: any) {
            console.error('Generation error:', err);
            setError(err.message || 'An unexpected error occurred');
            setStep('input');
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col ring-1 ring-black/5"
            >
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/30">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-none">AI Page Generator</h2>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Powered by Gemini 1.5 Flash</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white/40">
                    {step === 'input' && (
                        <div className="animate-fadeIn max-w-2xl mx-auto">
                            <div className="mb-8 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Tell us about your business</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">
                                    Share the details, and our AI will architect the perfect landing page structure and copy.<br />
                                    <span className="text-xs opacity-70 block mt-2 font-medium">more details = better results</span>
                                </p>
                            </div>

                            {/* Design Reference Upload Section */}
                            <div className="mb-8 p-1 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100/50 shadow-sm">
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-bold text-gray-900 flex items-center text-sm">
                                            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                                            Design Reference (Optional)
                                        </h4>
                                        {designDefinition && (
                                            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-wide border border-green-200">
                                                Analyzed: {designDefinition.vibe}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                        Upload a reference image (screenshot or design), and the AI will analyze its "vibe" and color palette to match your page.
                                    </p>

                                    {!designImage && !designDefinition ? (
                                        <div className="relative border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-all rounded-xl p-8 text-center cursor-pointer group bg-gray-50/50 hover:bg-white">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleDesignImageUpload}
                                                disabled={isAnalyzing}
                                            />
                                            <div className="flex flex-col items-center">
                                                <div className="p-3 bg-white shadow-sm ring-1 ring-gray-100 group-hover:ring-indigo-100 group-hover:scale-110 rounded-full mb-3 transition-all duration-300">
                                                    {isAnalyzing ? (
                                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                                                    {isAnalyzing ? 'Analyzing Design...' : 'Upload Reference Image'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">PNG, JPG, WEBP (Max 5MB)</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start space-x-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            {designImage && (
                                                <img
                                                    src={designImage}
                                                    alt="Reference"
                                                    className="w-16 h-16 object-cover rounded-md border border-gray-100 shadow-sm"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider">Design Definition</h5>
                                                {designDefinition ? (
                                                    <div className="text-xs text-gray-500 space-y-1 font-mono">
                                                        <p><span className="text-gray-400">Vibe:</span> {designDefinition.vibe}</p>
                                                        <p><span className="text-gray-400">Palette:</span> {designDefinition.colorPalette?.primary}, {designDefinition.colorPalette?.background}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">Analyzing...</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDesignImage(null);
                                                    setDesignDefinition(null);
                                                }}
                                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 flex items-center text-sm shadow-sm"
                                >
                                    <AlertCircle className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
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
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
                            <div className="relative w-32 h-32 mb-10">
                                <div className="absolute inset-0 border-4 border-indigo-100/50 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center animate-pulse">
                                        <Sparkles className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Generating your page...</h3>
                            <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed mb-10 text-sm">
                                Analyzing market trends, structuring content, and crafting high-converting copy.<br />
                                <span className="text-indigo-500/80">Creating a premium experience just for you.</span>
                            </p>

                            <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-indigo-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                                />
                            </div>
                            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                                AI Processing
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );

    if (typeof document === 'undefined') return null;

    return createPortal(modalContent, document.body);
};
