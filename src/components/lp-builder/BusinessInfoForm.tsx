import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

const industryOptions = [
    'SaaS / IT',
    '飲食・フード',
    '美容・サロン',
    '不動産',
    '教育・スクール',
    'コンサルティング',
    'EC・物販',
    '医療・ヘルスケア',
    'その他',
];

const toneOptions = [
    { value: 'professional', label: 'プロフェッショナル', desc: '信頼感、誠実、論理的' },
    { value: 'friendly', label: 'フレンドリー', desc: '親しみやすさ、共感、柔らかい' },
    { value: 'luxury', label: 'ラグジュアリー', desc: '高級感、洗練、特別感' },
    { value: 'energetic', label: 'エネルギッシュ', desc: '活気、情熱、行動的' },
];

export const businessInfoSchema = z.object({
    businessName: z.string().min(1, 'ビジネス名は必須です'),
    industry: z.string().min(1, '業種を選択してください'),
    service: z.string().min(10, 'サービス概要は10文字以上で入力してください'),
    target: z.string().min(1, 'ターゲット顧客は必須です'),
    strengths: z.string().min(1, '主な強みは必須です'),
    differentiators: z.string().optional(),
    priceRange: z.string().optional(),
    tone: z.enum(['professional', 'friendly', 'luxury', 'energetic']),
});

export type BusinessInfo = z.infer<typeof businessInfoSchema>;

interface BusinessInfoFormProps {
    onSubmit: (data: BusinessInfo) => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const BusinessInfoForm: React.FC<BusinessInfoFormProps> = ({
    onSubmit,
    onCancel,
    isLoading,
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BusinessInfo>({
        resolver: zodResolver(businessInfoSchema),
        defaultValues: {
            tone: 'professional',
        },
    });

    const selectedTone = watch('tone');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 左カラム */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            ビジネス名 <span className="text-rose-400">*</span>
                        </label>
                        <input
                            {...register('businessName')}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="例: TechFlow, 〇〇カフェ"
                        />
                        {errors.businessName && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.businessName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            業種 <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                            <select
                                {...register('industry')}
                                className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer font-medium text-slate-700 hover:bg-white/80"
                            >
                                <option value="" className="text-slate-400">業種を選択してください</option>
                                {industryOptions.map((option) => (
                                    <option key={option} value={option} className="text-slate-900 bg-white">
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        {errors.industry && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.industry.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            サービス概要 <span className="text-rose-400">*</span>
                        </label>
                        <textarea
                            {...register('service')}
                            rows={5}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-300 font-medium leading-relaxed"
                            placeholder="どのようなサービスを提供していますか？主な特徴や提供価値などを具体的に入力してください。"
                        />
                        {errors.service && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.service.message}</p>
                        )}
                    </div>
                </div>

                {/* 右カラム */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            ターゲット顧客 <span className="text-rose-400">*</span>
                        </label>
                        <input
                            {...register('target')}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="例: 30代の働く女性, 業務効率化したい中小企業"
                        />
                        {errors.target && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.target.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            主な強み <span className="text-rose-400">*</span>
                        </label>
                        <input
                            {...register('strengths')}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="例: 業界最安値, 24時間サポート, 特許技術"
                        />
                        {errors.strengths && (
                            <p className="text-rose-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.strengths.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            差別化ポイント・こだわり (任意)
                        </label>
                        <input
                            {...register('differentiators')}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="他社との違いや独自のこだわり"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                            価格帯 (任意)
                        </label>
                        <input
                            {...register('priceRange')}
                            className="w-full px-5 py-4 bg-white/50 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                            placeholder="例: 月額980円〜, 1回5,000円"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">
                    トーン & マナー <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {toneOptions.map((tone) => (
                        <motion.div
                            key={tone.value}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setValue('tone', tone.value as any)}
                            className={`
                                cursor-pointer p-5 rounded-[28px] border-2 transition-all relative overflow-hidden flex flex-col justify-between h-[120px]
                                ${selectedTone === tone.value
                                    ? 'border-indigo-500 bg-white shadow-[0_12px_32px_-8px_rgba(99,102,241,0.2)]'
                                    : 'border-slate-100 bg-white/40 hover:border-indigo-200 hover:bg-white/60'
                                }
                            `}
                        >
                            <div className="relative z-10">
                                <span className={`text-sm font-black block mb-1 ${selectedTone === tone.value ? 'text-indigo-600' : 'text-slate-900'}`}>{tone.label}</span>
                                <span className="text-[10px] text-slate-400 font-bold leading-tight">{tone.desc}</span>
                            </div>

                            {selectedTone === tone.value && (
                                <motion.div
                                    layoutId="tone-check"
                                    className="absolute bottom-4 right-4 text-indigo-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </motion.div>
                            )}

                            {selectedTone === tone.value && (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="pt-10 border-t border-slate-100/50 flex justify-end items-center gap-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="text-sm font-black text-slate-400 hover:text-slate-900 transition-colors px-4 py-2 disabled:opacity-50"
                >
                    キャンセル
                </button>
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative flex items-center justify-center gap-3">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="tracking-widest uppercase text-xs">生成中...</span>
                            </>
                        ) : (
                            <>
                                <span className="transform group-hover:rotate-12 transition-transform duration-300">✨</span>
                                <span className="tracking-tight text-lg">AIでLPを生成する</span>
                            </>
                        )}
                    </span>
                </motion.button>
            </div>
        </form>
    );
};
