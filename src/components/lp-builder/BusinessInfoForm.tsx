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
    { value: 'professional', label: 'Professional', desc: 'Trust, Logic, Standard' },
    { value: 'friendly', label: 'Friendly', desc: 'Empathy, Soft, Casual' },
    { value: 'luxury', label: 'Luxury', desc: 'Premium, Refined, High-End' },
    { value: 'energetic', label: 'Energetic', desc: 'Passion, Active, Bold' },
];

export const businessInfoSchema = z.object({
    businessName: z.string().min(1, 'Business Name is required'),
    industry: z.string().min(1, 'Please select an industry'),
    service: z.string().min(10, 'Details must be at least 10 characters'),
    target: z.string().min(1, 'Target Audience is required'),
    strengths: z.string().min(1, 'Strengths are required'),
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
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('businessName')}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900 shadow-sm"
                            placeholder="e.g. TechFlow, Studio Acme"
                        />
                        {errors.businessName && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.businessName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Industry <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                {...register('industry')}
                                className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-sm text-gray-900 shadow-sm"
                            >
                                <option value="" className="text-gray-400">Select Industry</option>
                                {industryOptions.map((option) => (
                                    <option key={option} value={option} className="text-gray-900 bg-white">
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Service Details <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('service')}
                            rows={5}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-400 text-sm leading-relaxed text-gray-900 shadow-sm"
                            placeholder="Describe your service, key features, and value proposition."
                        />
                        {errors.service && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.service.message}</p>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Target Audience <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('target')}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900 shadow-sm"
                            placeholder="e.g. Women in 30s, SMB Owners"
                        />
                        {errors.target && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.target.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Strengths & Benefits <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('strengths')}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900 shadow-sm"
                            placeholder="e.g. Low cost, 24/7 support, Patent Tech"
                        />
                        {errors.strengths && (
                            <p className="text-red-500 text-[10px] font-bold mt-1.5 px-1 uppercase tracking-wider">{errors.strengths.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Differentiators
                        </label>
                        <input
                            {...register('differentiators')}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900 shadow-sm"
                            placeholder="What makes you unique vs competitors?"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                            Price Range
                        </label>
                        <input
                            {...register('priceRange')}
                            className="w-full px-4 py-3 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900 shadow-sm"
                            placeholder="e.g. From $100/mo"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                    Tone & Manner <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {toneOptions.map((tone) => (
                        <div
                            key={tone.value}
                            onClick={() => setValue('tone', tone.value as any)}
                            className={`
                                cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between h-[100px] hover:shadow-md
                                ${selectedTone === tone.value
                                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-1 ring-indigo-500/20'
                                    : 'border-gray-200 bg-white/60 hover:border-indigo-300'
                                }
                            `}
                        >
                            <div className="relative z-10">
                                <span className={`text-sm font-bold block mb-1 ${selectedTone === tone.value ? 'text-indigo-700' : 'text-gray-700'}`}>{tone.label}</span>
                                <span className="text-[10px] text-gray-500 font-medium leading-tight">{tone.desc}</span>
                            </div>

                            {selectedTone === tone.value && (
                                <div className="absolute bottom-3 right-3 text-indigo-500">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-gray-100 flex justify-end items-center gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors px-6 py-3 rounded-xl hover:bg-gray-100 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all active:scale-95"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            <span>Generate Page</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
