"use client";

import Link from "next/link";
import { MoveLeft, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
            <div className="relative mb-8">
                <h1 className="text-[12rem] font-black leading-none tracking-tighter text-gray-100/50">404</h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-gray-900 md:text-4xl">ページが見つかりません</span>
                </div>
            </div>

            <p className="mb-10 max-w-md text-sm font-medium leading-relaxed text-gray-500">
                お探しのページは、移動または削除された可能性があります。
                URLが正しいか再度ご確認ください。
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                    href="/"
                    className="group flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white shadow-xl shadow-gray-200 transition-all hover:bg-black hover:scale-105 active:scale-95"
                >
                    <Home className="h-4 w-4" />
                    トップページへ
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="group flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-8 py-4 text-sm font-black text-gray-500 transition-all hover:bg-gray-50 active:scale-95"
                >
                    <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    前のページに戻る
                </button>
            </div>

            <div className="mt-20">
                <div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200" />
            </div>
        </div>
    );
}
