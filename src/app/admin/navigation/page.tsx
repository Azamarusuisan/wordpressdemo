"use client";

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical, Navigation, Link as LinkIcon, Type, MousePointer2, RefreshCw } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    href: string;
}

export default function NavigationPage() {
    const [config, setConfig] = useState({
        logoText: 'LP Builder',
        sticky: true,
        ctaText: 'お問い合わせ',
        ctaLink: '#contact',
        navItems: [] as NavItem[]
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('/api/config/navigation')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setConfig({
                        ...data,
                        navItems: data.navItems || []
                    });
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/config/navigation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert('ナビゲーション設定を保存しました。');
            }
        } catch (e) {
            alert('保存に失敗しました。');
        } finally {
            setIsSaving(false);
        }
    };

    const addNavItem = () => {
        const newItem: NavItem = {
            id: Date.now().toString(),
            label: '新メニュー',
            href: '#'
        };
        setConfig({ ...config, navItems: [...config.navItems, newItem] });
    };

    const removeNavItem = (id: string) => {
        setConfig({ ...config, navItems: config.navItems.filter(item => item.id !== id) });
    };

    const updateNavItem = (id: string, updates: Partial<NavItem>) => {
        setConfig({
            ...config,
            navItems: config.navItems.map(item => item.id === id ? { ...item, ...updates } : item)
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-10 max-w-4xl mx-auto pb-40">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">ナビ管理</h1>
                    <p className="text-gray-500 mt-1">サイト全体のヘッダーナビゲーションをカスタマイズします。</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                    {isSaving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    設定を保存
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 基本設定 */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                                <Type className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">基本設定</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ロゴテキスト</label>
                                <input
                                    type="text"
                                    value={config.logoText}
                                    onChange={(e) => setConfig({ ...config, logoText: e.target.value })}
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs font-bold text-gray-600">ヘッダーを固定する</span>
                                <button
                                    onClick={() => setConfig({ ...config, sticky: !config.sticky })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.sticky ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.sticky ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                                <MousePointer2 className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">CTAボタン</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ボタンテキスト</label>
                                <input
                                    type="text"
                                    value={config.ctaText}
                                    onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">リンク先 (URL)</label>
                                <input
                                    type="text"
                                    value={config.ctaLink}
                                    onChange={(e) => setConfig({ ...config, ctaLink: e.target.value })}
                                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* メニュー項目管理 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                                <Navigation className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">メニュー項目</h2>
                        </div>
                        <button
                            onClick={addNavItem}
                            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-all"
                        >
                            <Plus className="h-4 w-4" /> 項目を追加
                        </button>
                    </div>

                    <div className="space-y-3">
                        {config.navItems.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-bold">メニュー項目がありません</p>
                            </div>
                        )}
                        {config.navItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm group transition-all hover:shadow-md hover:border-gray-200">
                                <div className="text-gray-300">
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Navigation className="h-3.5 w-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => updateNavItem(item.id, { label: e.target.value })}
                                            className="w-full rounded-xl border border-transparent bg-gray-50 pl-10 pr-4 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-500/20"
                                            placeholder="表示名"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <LinkIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={item.href}
                                            onChange={(e) => updateNavItem(item.id, { href: e.target.value })}
                                            className="w-full rounded-xl border border-transparent bg-gray-50 pl-10 pr-4 py-2 text-sm font-bold outline-none focus:bg-white focus:border-indigo-500/20"
                                            placeholder="URL"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeNavItem(item.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* プレビュー表示 */}
                    <div className="mt-10 p-8 rounded-3xl bg-gray-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Navigation className="h-20 w-20" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            ライブプレビュー
                        </h3>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10">
                            <div className="font-black text-lg">{config.logoText}</div>
                            <div className="flex gap-4">
                                {config.navItems.map(item => (
                                    <span key={item.id} className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                            <div className="bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {config.ctaText}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
