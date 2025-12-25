"use client";

import React, { useState, useEffect } from 'react';
import { Save, Globe, Github, Loader2, CheckCircle, Sparkles, LogOut, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [plan, setPlan] = useState<'normal' | 'premium'>('normal');
    const [googleApiKey, setGoogleApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [config, setConfig] = useState<any>({
        siteName: 'My Landing Page',
        github: { token: '', owner: '', repo: '', branch: 'main', path: 'public/lp' }
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    useEffect(() => {
        // Get User
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        // Get User Settings
        const fetchUserSettings = async () => {
            try {
                const res = await fetch('/api/user/settings');
                const data = await res.json();
                setHasApiKey(data.hasApiKey || false);
                setPlan(data.plan || 'normal');
            } catch (e) {
                console.error('Failed to fetch user settings', e);
            }
        };
        fetchUserSettings();

        // Get Global Config
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                const data = await res.json();
                if (data.siteName) setConfig(data);
            } catch (e) {
                console.error('Failed to fetch config', e);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save User specific API Key
            if (googleApiKey) {
                await fetch('/api/user/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ googleApiKey })
                });
                setHasApiKey(true);
                setGoogleApiKey(''); // Clear after save
            }

            // Save Global Config
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setSaveStatus('success');
                toast.success('設定を保存しました');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (e) {
            toast.error('設定の保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    return (
        <div className="p-8 max-w-4xl mx-auto pb-32">
            <div className="mb-10 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">設定</h1>
                    <p className="text-sm text-muted-foreground mt-1">個人の設定と連携を管理します。</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-md bg-surface-100 px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-surface-200 hover:text-foreground transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    ログアウト
                </button>
            </div>

            {/* User Info & Plan */}
            {user && (
                <div className="mb-8 rounded-lg bg-surface-50 p-6 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                Logged in as: <span className="text-primary">{user.email}</span>
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${plan === 'premium'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-surface-200 text-muted-foreground'
                            }`}>
                            {plan === 'premium' && <Crown className="h-3 w-3" />}
                            <span>{plan === 'premium' ? 'Premium' : 'Normal'}</span>
                        </div>
                    </div>
                    {plan === 'normal' && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            高度な機能にアクセスするにはプレミアムプランにアップグレードしてください。
                        </p>
                    )}
                </div>
            )}

            <div className="space-y-8">
                {/* Google AI API Key */}
                <div className="rounded-lg border border-border bg-background p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-md text-purple-600 border border-purple-100">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Google AI APIキー</h2>
                            <p className="text-xs text-muted-foreground">AI生成機能に必要です (個人キー)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {hasApiKey && (
                            <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                                <CheckCircle className="h-4 w-4" />
                                APIキーは有効です
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">
                                {hasApiKey ? 'APIキーを更新' : 'APIキー'}
                            </label>
                            <input
                                type="password"
                                value={googleApiKey}
                                placeholder="AIzaSy..."
                                onChange={e => setGoogleApiKey(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                            />
                        </div>
                        <div className="rounded-md bg-surface-50 p-4 border border-border">
                            <p className="text-xs text-muted-foreground font-medium">
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold text-foreground hover:text-primary">Google AI Studio</a>でキーを取得してください。
                                <br />レート制限を緩和するには請求設定を有効にしてください。
                            </p>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="rounded-lg border border-border bg-background p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-md text-blue-600 border border-blue-100">
                            <Globe className="h-5 w-5" />
                        </div>
                        <h2 className="text-base font-bold text-foreground">一般設定</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">サイト名</label>
                            <input
                                type="text"
                                value={config.siteName}
                                onChange={e => setConfig({ ...config, siteName: e.target.value })}
                                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* GitHub Integration */}
                <div className="rounded-lg border border-border bg-background p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-surface-100 rounded-md text-foreground border border-border">
                            <Github className="h-5 w-5" />
                        </div>
                        <h2 className="text-base font-bold text-foreground">GitHub連携</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">パーソナルアクセストークン</label>
                            <input
                                type="password"
                                value={config.github?.token || ''}
                                placeholder="ghp_..."
                                onChange={e => setConfig({ ...config, github: { ...config.github, token: e.target.value } })}
                                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">オーナー / 組織</label>
                            <input
                                type="text"
                                value={config.github?.owner || ''}
                                onChange={e => setConfig({ ...config, github: { ...config.github, owner: e.target.value } })}
                                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">リポジトリ</label>
                            <input
                                type="text"
                                value={config.github?.repo || ''}
                                onChange={e => setConfig({ ...config, github: { ...config.github, repo: e.target.value } })}
                                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-6 flex justify-center items-center z-50">
                <div className="max-w-4xl w-full flex justify-between items-center">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {isSaving ? '保存中...' : saveStatus === 'success' ? '保存しました' : '未保存の変更'}
                    </p>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-3 rounded-md bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveStatus === 'success' ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        変更を保存
                    </button>
                </div>
            </div>
        </div>
    );
}
