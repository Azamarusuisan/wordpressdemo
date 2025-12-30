"use client";

import React, { useState } from 'react';
import { X, Loader2, Send, CheckCircle } from 'lucide-react';
import type { ClickableArea, FormFieldConfig } from '@/types';

interface FormInputModalProps {
    area: ClickableArea;
    pageSlug: string;
    onClose: () => void;
}

export function FormInputModal({ area, pageSlug, onClose }: FormInputModalProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const fields = area.formFields || [];

    const validateField = (field: FormFieldConfig, value: string): string | null => {
        if (field.required && !value.trim()) {
            return `${field.fieldLabel}は必須です`;
        }
        if (field.fieldType === 'email' && value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return '有効なメールアドレスを入力してください';
            }
        }
        if (field.fieldType === 'tel' && value.trim()) {
            const telRegex = /^[\d\-+() ]+$/;
            if (!telRegex.test(value)) {
                return '有効な電話番号を入力してください';
            }
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // バリデーション
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
            const error = validateField(field, formData[field.fieldName] || '');
            if (error) {
                newErrors[field.fieldName] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('/api/form-submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageSlug,
                    areaId: area.id,
                    formTitle: area.formTitle,
                    formFields: fields.map(f => ({
                        fieldName: f.fieldName,
                        fieldLabel: f.fieldLabel,
                        value: formData[f.fieldName] || '',
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error('送信に失敗しました');
            }

            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            setErrors({ _form: '送信に失敗しました。もう一度お試しください。' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // エラーをクリア
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in duration-200">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">送信完了</h3>
                    <p className="text-gray-600 text-sm">お問い合わせありがとうございます。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">
                        {area.formTitle || 'お問い合わせ'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {errors._form && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors._form}</p>
                        </div>
                    )}

                    {fields.map(field => (
                        <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {field.fieldLabel}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.fieldType === 'textarea' ? (
                                <textarea
                                    value={formData[field.fieldName] || ''}
                                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                                    placeholder={field.placeholder || `${field.fieldLabel}を入力`}
                                    rows={4}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors[field.fieldName]
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                    } outline-none focus:ring-2 transition-all resize-none`}
                                />
                            ) : (
                                <input
                                    type={field.fieldType}
                                    value={formData[field.fieldName] || ''}
                                    onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                                    placeholder={field.placeholder || `${field.fieldLabel}を入力`}
                                    className={`w-full px-4 py-3 rounded-lg border ${
                                        errors[field.fieldName]
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                    } outline-none focus:ring-2 transition-all`}
                                />
                            )}
                            {errors[field.fieldName] && (
                                <p className="mt-1 text-xs text-red-500">{errors[field.fieldName]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                送信中...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                送信する
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
