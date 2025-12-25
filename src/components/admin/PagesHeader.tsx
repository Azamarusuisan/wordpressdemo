"use client";

import React, { useState } from 'react';
import { Plus, Globe, Loader2, X, Layout, Sparkles, Monitor, Smartphone, Copy, Wand2, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';

// スタイル定義
const STYLE_OPTIONS = [
    { id: 'professional', label: 'ビジネス', color: 'blue' },
    { id: 'pops', label: 'ポップ', color: 'pink' },
    { id: 'luxury', label: '高級', color: 'amber' },
    { id: 'minimal', label: 'シンプル', color: 'gray' },
    { id: 'emotional', label: '情熱', color: 'red' },
];

interface ImportProgress {
    message: string;
    total?: number;
    current?: number;
}

export function PagesHeader() {
    const router = useRouter();
    const [isImporting, setIsImporting] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [showSelection, setShowSelection] = useState(false);
    const [mode, setMode] = useState<'select' | 'import'>('select');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [importMode, setImportMode] = useState<'faithful' | 'light' | 'heavy'>('faithful');
    const [style, setStyle] = useState('professional');
    const [progress, setProgress] = useState<ImportProgress | null>(null);

    const handleImport = async () => {
        if (!importUrl) return;
        setIsImporting(true);
        setProgress({ message: 'インポートを開始しています...' });

        try {
            console.log('[Import] Starting import for URL:', importUrl, 'Mode:', importMode);

            const res = await fetch('/api/import-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: importUrl,
                    device,
                    importMode,
                    style: importMode !== 'faithful' ? style : undefined
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'インポートに失敗しました。');
            }

            // ストリーミングレスポンスを読み取る
            const reader = res.body?.getReader();
            if (!reader) throw new Error('ストリームの読み取りに失敗しました。');

            const decoder = new TextDecoder();
            let finalData: any = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                const lines = text.split('\n\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const jsonStr = line.replace('data: ', '');
                        const data = JSON.parse(jsonStr);
                        console.log('[Import] Stream event:', data);

                        if (data.type === 'progress') {
                            setProgress({
                                message: data.message,
                                total: data.total,
                                current: data.current
                            });
                        } else if (data.type === 'complete') {
                            finalData = data;
                        } else if (data.type === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (parseError) {
                        console.warn('[Import] Parse error:', parseError);
                    }
                }
            }

            if (!finalData) {
                throw new Error('インポート結果を取得できませんでした。');
            }

            console.log('[Import] Final data:', finalData);

            // ページ作成
            setProgress({ message: 'ページを作成中...' });

            const sectionsPayload = finalData.media.map((m: any, idx: number) => ({
                role: idx === 0 ? 'hero' : 'other',
                imageId: m.id,
                config: { layout: finalData.device }
            }));

            console.log('[Import] Creating page with sections:', sectionsPayload);

            const pageRes = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `Imported: ${importUrl}`,
                    sections: sectionsPayload
                })
            });
            const pageData = await pageRes.json();

            console.log('[Import] Page created:', pageData);

            router.push(`/admin/pages/${pageData.id}`);
        } catch (error: any) {
            console.error('[Import] Error:', error);
            alert(error.message || 'インポートに失敗しました。');
        } finally {
            setIsImporting(false);
            setProgress(null);
        }
    };

    return (
        <>
            {/* Modal */}
            {showSelection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
                    <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-background border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-foreground tracking-tight"><span>新規ページ作成</span></h2>
                                <button onClick={() => setShowSelection(false)} className="text-muted-foreground hover:text-foreground transition-colors" disabled={isImporting}>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {mode === 'select' ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <button
                                        onClick={() => router.push('/admin/pages/new')}
                                        className="group flex flex-col items-start rounded-lg border border-border p-6 text-left transition-all hover:border-primary hover:bg-surface-50"
                                    >
                                        <div className="mb-4 rounded-md bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                            <Layout className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-base font-bold text-foreground mb-1"><span>ゼロから作成</span></h3>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                            <span>画像をアップロードしたり、AIで生成して独自のLPを構築します。</span>
                                        </p>
                                    </button>

                                    <button
                                        onClick={() => setMode('import')}
                                        className="group flex flex-col items-start rounded-lg border border-border p-6 text-left transition-all hover:border-primary hover:bg-surface-50"
                                    >
                                        <div className="mb-4 rounded-md bg-secondary p-3 text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                            <Globe className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-base font-bold text-foreground mb-1"><span>URLからインポート</span></h3>
                                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                            <span>URLを入力してスクリーンショットからベースを自動生成します。</span>
                                        </p>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2"><span>対象URL</span></label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                placeholder="https://example.com"
                                                value={importUrl}
                                                onChange={(e) => setImportUrl(e.target.value)}
                                                disabled={isImporting}
                                                className="flex-1 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Device Select */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2"><span>デバイスビューポート</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setDevice('desktop')}
                                                disabled={isImporting}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all disabled:opacity-50 ${device === 'desktop'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                <Monitor className="h-4 w-4" />
                                                <span>Desktop</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDevice('mobile')}
                                                disabled={isImporting}
                                                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all disabled:opacity-50 ${device === 'mobile'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                <Smartphone className="h-4 w-4" />
                                                <span>Mobile</span>
                                            </button>
                                        </div>
                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                            {device === 'desktop' ? '1280×800px viewport' : '375×812px (iPhone) viewport'}
                                        </p>
                                    </div>

                                    {/* Import Mode */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2"><span>インポートモード</span></label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setImportMode('faithful')}
                                                disabled={isImporting}
                                                className={`flex-1 flex flex-col items-center gap-1 rounded-md py-3 px-2 text-xs font-bold transition-all disabled:opacity-50 ${importMode === 'faithful'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span>Original</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImportMode('light')}
                                                disabled={isImporting}
                                                className={`flex-1 flex flex-col items-center gap-1 rounded-md py-3 px-2 text-xs font-bold transition-all disabled:opacity-50 ${importMode === 'light'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                <Palette className="h-4 w-4" />
                                                <span>スタイル変更</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setImportMode('heavy')}
                                                disabled={isImporting}
                                                className={`flex-1 flex flex-col items-center gap-1 rounded-md py-3 px-2 text-xs font-bold transition-all disabled:opacity-50 ${importMode === 'heavy'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                    }`}
                                            >
                                                <Wand2 className="h-4 w-4" />
                                                <span>再デザイン</span>
                                            </button>
                                        </div>
                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                            {importMode === 'faithful' && 'そのままキャプチャします。'}
                                            {importMode === 'light' && 'レイアウトを維持し、色とスタイルを更新します。'}
                                            {importMode === 'heavy' && 'コンテンツに基づいてAIが完全に再デザインします。'}
                                        </p>
                                    </div>

                                    {/* Style Select */}
                                    {importMode !== 'faithful' && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2"><span>スタイルターゲット</span></label>
                                            <div className="flex gap-2 flex-wrap">
                                                {STYLE_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => setStyle(opt.id)}
                                                        disabled={isImporting}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-50 ${style === opt.id
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress */}
                                    {isImporting && progress && (
                                        <div className="animate-in fade-in duration-300">
                                            <div className="rounded-md bg-surface-50 border border-border p-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-sm font-bold text-foreground">{progress.message}</span>
                                                </div>
                                                {progress.total && progress.current !== undefined && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                                            <span>Progress</span>
                                                            <span>{progress.current} / {progress.total}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-500 ease-out"
                                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setMode('select')}
                                            disabled={isImporting}
                                            className="flex-1 rounded-md border border-border py-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-surface-50 transition-all disabled:opacity-50"
                                        >
                                            <span>戻る</span>
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={isImporting || !importUrl}
                                            className="flex-[2] flex items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            <span>{isImporting ? '処理中...' : 'インポート実行'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => { setShowSelection(true); setMode('select'); }}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
                <Plus className="h-4 w-4" />
                <span>新規ページ作成</span>
            </button>
        </>
    );
}
