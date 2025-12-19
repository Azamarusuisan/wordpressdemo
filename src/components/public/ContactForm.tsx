"use client";

import React from 'react';

export function ContactForm() {
    const handleSubmit = () => {
        alert('送信完了しました。');
    };

    return (
        <section id="contact" className="px-6 py-12 bg-gray-50">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">お問い合わせ</h2>
                <p className="text-gray-600 mt-2">以下のフォームよりお気軽にご連絡ください。</p>
            </div>
            <form className="space-y-4 max-w-sm mx-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700">会社名</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">お名前</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                    <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">メッセージ</label>
                    <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"></textarea>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full rounded-md bg-blue-600 py-3 font-bold text-white shadow hover:bg-blue-700"
                >
                    メッセージを送信
                </button>
            </form>
        </section>
    );
}
