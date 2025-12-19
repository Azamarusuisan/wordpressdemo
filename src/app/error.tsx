"use client";

import { useEffect } from "react";
import { RefreshCw, AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Runtime Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500 shadow-inner">
                <AlertCircle className="h-10 w-10" />
            </div>

            <h1 className="mb-4 text-2xl font-black text-gray-900 md:text-3xl">エラーが発生しました</h1>

            <p className="mb-10 max-w-sm text-sm font-medium leading-relaxed text-gray-500">
                申し訳ありません、システムの実行中に問題が発生しました。
                一時的な問題の可能性がありますので、再読み込みをお試しください。
            </p>

            {process.env.NODE_ENV === "development" && (
                <div className="mb-10 w-full max-w-xl overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 p-6 text-left shadow-inner">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-red-400">Error Detail (Dev Mode Only)</span>
                    <code className="block break-all text-xs font-bold font-mono text-red-600">
                        {error.message || "Unknown error occurred"}
                    </code>
                </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
                <button
                    onClick={() => reset()}
                    className="group flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95"
                >
                    <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                    もう一度試す
                </button>
                <Link
                    href="/"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-4 text-sm font-black text-gray-500 transition-all hover:bg-gray-50 active:scale-95"
                >
                    <Home className="h-4 w-4" />
                    トップページへ
                </Link>
            </div>
        </div>
    );
}
