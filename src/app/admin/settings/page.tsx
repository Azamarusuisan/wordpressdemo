"use client";

import React from 'react';
import { Save, Globe, Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="p-10 max-w-4xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">サイト全体の基本設定とアカウント管理を行います。</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                            <Globe className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">一般設定</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">サイト名</label>
                            <input
                                type="text"
                                defaultValue="マイ・ランディングページ"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">デフォルト言語</label>
                            <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none bg-white">
                                <option>日本語</option>
                                <option>English</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Database & Integration */}
                <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                            <Database className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">データベース連携</h2>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-bold text-gray-700">Supabase Connected</span>
                        </div>
                        <span className="text-xs font-medium text-gray-400">Status: Active</span>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]">
                        <Save className="h-5 w-5" />
                        設定を保存
                    </button>
                </div>
            </div>
        </div>
    );
}
