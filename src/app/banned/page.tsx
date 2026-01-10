'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleLogout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    アカウント停止
                </h1>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    お客様のアカウントは利用規約違反により<br />
                    停止されました。
                </p>

                {/* User Email */}
                {userEmail && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-500 mb-1">アカウント</p>
                        <p className="text-gray-900 font-medium">{userEmail}</p>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                        <div>
                            <p className="text-sm text-red-800 font-medium mb-1">
                                停止理由について
                            </p>
                            <p className="text-sm text-red-700">
                                詳細については運営チームまでお問い合わせください。
                                異議申し立てがある場合も、下記連絡先までご連絡ください。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'ログアウト中...' : 'ログアウト'}
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400 mt-6">
                    お問い合わせ: team@zettai.co.jp
                </p>
            </div>
        </div>
    );
}
