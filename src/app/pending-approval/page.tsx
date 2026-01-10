'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
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

    const handleRefresh = () => {
        setIsLoading(true);
        router.refresh();
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                        className="w-10 h-10 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    承認待ち
                </h1>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    アカウントの登録が完了しました。<br />
                    運営チームによる承認をお待ちください。
                </p>

                {/* User Email */}
                {userEmail && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-500 mb-1">登録メールアドレス</p>
                        <p className="text-gray-900 font-medium">{userEmail}</p>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
                    <div className="flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <div>
                            <p className="text-sm text-blue-800 font-medium mb-1">
                                承認について
                            </p>
                            <p className="text-sm text-blue-700">
                                承認が完了すると、登録メールアドレスに通知が届きます。
                                通常1〜2営業日以内に対応いたします。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '確認中...' : '承認状態を確認する'}
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ログアウト
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
