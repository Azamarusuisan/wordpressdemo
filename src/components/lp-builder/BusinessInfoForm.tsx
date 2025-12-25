import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';

const industryOptions = [
    'SaaS / IT',
    '飲食',
    '美容 / サロン',
    '不動産',
    '教育',
    'コンサルティング',
    'Eコマース',
    'ヘルスケア',
    'その他',
];

const toneOptions = [
    { value: 'professional', label: 'プロフェッショナル', desc: '信頼感、誠実、論理的' },
    { value: 'friendly', label: 'フレンドリー', desc: '親しみやすさ、共感、柔らかさ' },
    { value: 'luxury', label: 'ラグジュアリー', desc: '高級感、洗練、特別感' },
    { value: 'energetic', label: 'エネルギッシュ', desc: '活気、情熱、アクティブ' },
];

export const businessInfoSchema = z.object({
    businessName: z.string().min(1, 'ビジネス名は必須です'),
    industry: z.string().min(1, '業界を選択してください'),
    service: z.string().min(10, 'サービス概要は10文字以上で入力してください'),
    target: z.string().min(1, 'ターゲット層は必須です'),
    strengths: z.string().min(1, '強みは必須です'),
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
                {/* Left Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            ビジネス名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('businessName')}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-sm"
                            placeholder="例: TechFlow, 株式会社Acme"
                        />
                        {errors.businessName && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.businessName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            業界 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                {...register('industry')}
                                className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer text-sm"
                            >
                                <option value="" className="text-muted-foreground">業界を選択</option>
                                {industryOptions.map((option) => (
                                    <option key={option} value={option} className="text-foreground bg-background">
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        {errors.industry && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.industry.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            サービス概要 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('service')}
                            rows={5}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground text-sm leading-relaxed"
                            placeholder="どのようなサービスを提供していますか？主な特徴や提供価値を説明してください。"
                        />
                        {errors.service && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.service.message}</p>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            ターゲット層 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('target')}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-sm"
                            placeholder="30代女性, 効率化を目指す中小企業"
                        />
                        {errors.target && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.target.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            強み・メリット <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('strengths')}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-sm"
                            placeholder="低コスト, 24時間サポート, 特許技術"
                        />
                        {errors.strengths && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.strengths.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            差別化ポイント
                        </label>
                        <input
                            {...register('differentiators')}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-sm"
                            placeholder="競合他社と比較した独自の売り"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                            価格帯
                        </label>
                        <input
                            {...register('priceRange')}
                            className="w-full px-4 py-3 bg-background border border-input rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground text-sm"
                            placeholder="例: 月額1万円〜, 初期費用50万円"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                    トーン & マナー <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {toneOptions.map((tone) => (
                        <div
                            key={tone.value}
                            onClick={() => setValue('tone', tone.value as any)}
                            className={`
                                cursor-pointer p-4 rounded-md border transition-all relative overflow-hidden flex flex-col justify-between h-[100px] hover:bg-surface-50
                                ${selectedTone === tone.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border bg-background'
                                }
                            `}
                        >
                            <div className="relative z-10">
                                <span className={`text-sm font-bold block mb-1 ${selectedTone === tone.value ? 'text-primary' : 'text-foreground'}`}>{tone.label}</span>
                                <span className="text-[10px] text-muted-foreground font-medium leading-tight">{tone.desc}</span>
                            </div>

                            {selectedTone === tone.value && (
                                <div className="absolute bottom-3 right-3 text-primary">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-border flex justify-end items-center gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 disabled:opacity-50"
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>生成中...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            <span>ページを生成する</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
