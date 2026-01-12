"use client";

import React, { useState } from 'react';
import { X, Loader2, Sparkles, Settings2, ChevronRight, ChevronDown, Monitor, Smartphone, AlertCircle, CreditCard, Key, ExternalLink } from 'lucide-react';
import { SectionBoundaryEditor } from './SectionBoundaryEditor';
import Link from 'next/link';

interface Section {
    index: number;
    startY: number;
    endY: number;
    height: number;
    label: string;
    confidence?: number;
}

interface DetectResponse {
    success: boolean;
    screenshotBase64?: string;
    pageHeight: number;
    pageWidth: number;
    sections: Section[];
    error?: string;
}

interface SmartImportModalProps {
    onClose: () => void;
    onImportComplete: (pageId: number) => void;
}

type ImportStep = 'input' | 'detecting' | 'adjust' | 'generating' | 'complete' | 'error';

// スタイルオプション
const STYLE_OPTIONS = [
    { value: 'sampling', label: '元デザイン維持', desc: 'テキストの言い回しのみ変更' },
    { value: 'professional', label: 'プロフェッショナル', desc: '企業向け・信頼感' },
    { value: 'luxury', label: 'ラグジュアリー', desc: '高級・エレガント' },
    { value: 'pops', label: 'ポップ', desc: '明るく活気のある' },
    { value: 'minimal', label: 'ミニマル', desc: 'シンプル・余白重視' },
    { value: 'emotional', label: 'エモーショナル', desc: '情熱・エネルギー' },
];

const COLOR_OPTIONS = [
    { value: 'original', label: 'オリジナル' },
    { value: 'blue', label: 'ブルー' },
    { value: 'green', label: 'グリーン' },
    { value: 'purple', label: 'パープル' },
    { value: 'orange', label: 'オレンジ' },
    { value: 'monochrome', label: 'モノクロ' },
];

export function SmartImportModal({ onClose, onImportComplete }: SmartImportModalProps) {
    // Step state
    const [step, setStep] = useState<ImportStep>('input');

    // Input state
    const [url, setUrl] = useState('');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [importMode, setImportMode] = useState<'faithful' | 'light' | 'heavy'>('light');
    const [style, setStyle] = useState('sampling');
    const [colorScheme, setColorScheme] = useState('original');
    const [customPrompt, setCustomPrompt] = useState('');

    // Detection state
    const [detectResult, setDetectResult] = useState<DetectResponse | null>(null);

    // Generation state
    const [progress, setProgress] = useState('');
    const [generatedPageId, setGeneratedPageId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'generic' | 'credit' | 'apiKey' | 'subscription' | null>(null);

    // Step 1: Detect sections
    const handleDetect = async () => {
        if (!url.trim()) return;

        setStep('detecting');
        setError(null);

        try {
            const response = await fetch('/api/detect-sections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url.trim(),
                    device,
                    useAI: true
                })
            });

            const data: DetectResponse = await response.json();

            if (!data.success) {
                throw new Error(data.error || '検出に失敗しました');
            }

            setDetectResult(data);
            setStep('adjust');

        } catch (err: any) {
            setError(err.message);
            setStep('error');
        }
    };

    // Step 2: Generate with confirmed sections
    const handleGenerate = async (sections: Section[]) => {
        setStep('generating');
        setProgress('生成を開始しています...');
        setError(null);
        setErrorType(null);

        console.log('[SmartImport] Starting import:', { url, device, importMode, style, sectionsCount: sections.length });

        try {
            const response = await fetch('/api/import-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url.trim(),
                    device,
                    importMode,
                    style,
                    colorScheme,
                    customPrompt: customPrompt.trim() || undefined,
                    customSections: sections // カスタムセクション境界を送信
                })
            });

            // エラーレスポンスの詳細を取得
            if (!response.ok) {
                console.error('[SmartImport] API error:', response.status, response.statusText);

                let errorData: any = {};
                try {
                    errorData = await response.json();
                } catch {
                    // JSONパースに失敗した場合
                }

                console.error('[SmartImport] Error details:', errorData);

                // エラータイプを判定
                if (response.status === 402 || errorData.error === 'API_KEY_REQUIRED') {
                    setErrorType('apiKey');
                    throw new Error(errorData.message || 'Freeプランでは自分のGoogle AI APIキーの設定が必要です。設定画面でAPIキーを入力してください。');
                } else if (response.status === 429) {
                    if (errorData.needPurchase || errorData.message?.includes('クレジット')) {
                        setErrorType('credit');
                        throw new Error(errorData.message || `クレジットが不足しています。現在の残高: $${errorData.usage?.current?.toFixed(2) || '0.00'}`);
                    } else if (errorData.needSubscription) {
                        setErrorType('subscription');
                        throw new Error(errorData.message || 'サブスクリプションが必要です。プランを選択してください。');
                    }
                    throw new Error(errorData.message || errorData.reason || '使用量制限に達しました。');
                } else if (response.status === 401) {
                    throw new Error('ログインが必要です。再ログインしてください。');
                } else if (response.status === 400) {
                    throw new Error(errorData.error || '入力内容に問題があります。URLを確認してください。');
                } else {
                    throw new Error(errorData.error || errorData.message || `サーバーエラーが発生しました (${response.status})`);
                }
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('レスポンスストリームがありません');
            }

            console.log('[SmartImport] Reading stream...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        console.log('[SmartImport] Stream data:', data.type, data.message || '');

                        if (data.type === 'progress') {
                            setProgress(data.message || '');
                        } else if (data.type === 'complete' && data.pageId) {
                            console.log('[SmartImport] Complete! PageId:', data.pageId);
                            setGeneratedPageId(data.pageId);
                            setStep('complete');
                        } else if (data.type === 'error') {
                            console.error('[SmartImport] Stream error:', data.error);
                            throw new Error(data.error || '生成中にエラーが発生しました');
                        }
                    } catch (parseError) {
                        // Skip invalid JSON (but log it for debugging)
                        if (line.trim() && !line.includes('undefined')) {
                            console.warn('[SmartImport] Failed to parse:', line);
                        }
                    }
                }
            }

        } catch (err: any) {
            console.error('[SmartImport] Error:', err);
            setError(err.message);
            if (!errorType) {
                setErrorType('generic');
            }
            setStep('error');
        }
    };

    // Render based on step
    if (step === 'adjust' && detectResult) {
        return (
            <SectionBoundaryEditor
                screenshotBase64={detectResult.screenshotBase64 || ''}
                pageHeight={detectResult.pageHeight}
                pageWidth={detectResult.pageWidth}
                sections={detectResult.sections}
                onConfirm={handleGenerate}
                onCancel={onClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white border-gray-100 shrink-0">
                    <div className="flex items-center gap-3 text-gray-900">
                        <div className="bg-black p-2 rounded-lg">
                            <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">スマートインポート</h2>
                            <p className="text-sm text-gray-500">AIがセクション境界を自動検出</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'input' && (
                        <div className="space-y-6">
                            {/* URL Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    インポートするURL
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent accent-black"
                                />
                            </div>

                            {/* Device Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    デバイス
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDevice('desktop')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${device === 'desktop'
                                                ? 'border-gray-900 bg-gray-50 text-gray-900'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Monitor className="w-5 h-5" />
                                        デスクトップ
                                    </button>
                                    <button
                                        onClick={() => setDevice('mobile')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${device === 'mobile'
                                                ? 'border-gray-900 bg-gray-50 text-gray-900'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Smartphone className="w-5 h-5" />
                                        モバイル
                                    </button>
                                </div>
                            </div>

                            {/* Import Mode */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    インポートモード
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'faithful', label: '忠実', desc: 'そのままコピー' },
                                        { value: 'light', label: 'ライト', desc: 'スタイル変更のみ' },
                                        { value: 'heavy', label: 'ヘビー', desc: 'レイアウトも変更' },
                                    ].map(mode => (
                                        <button
                                            key={mode.value}
                                            onClick={() => setImportMode(mode.value as any)}
                                            className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${importMode === mode.value
                                                    ? 'border-gray-900 bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className={`font-medium ${importMode === mode.value ? 'text-gray-900' : 'text-gray-800'}`}>
                                                {mode.label}
                                            </div>
                                            <div className="text-xs text-gray-500">{mode.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style & Color (only for light/heavy) */}
                            {importMode !== 'faithful' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            デザインスタイル
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STYLE_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setStyle(opt.value)}
                                                    className={`px-3 py-2.5 rounded-lg text-left transition-all border ${style === opt.value
                                                            ? 'bg-gray-50 border-gray-900 ring-1 ring-gray-900'
                                                            : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'
                                                        }`}
                                                >
                                                    <div className={`font-medium text-sm ${style === opt.value ? 'text-gray-900' : 'text-gray-800'
                                                        }`}>
                                                        {opt.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            カラースキーム
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setColorScheme(opt.value)}
                                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${colorScheme === opt.value
                                                            ? 'bg-black text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            追加の指示（オプション）
                                        </label>
                                        <textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="例: サービス名を「Filtia」に変更してください"
                                            rows={2}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleDetect}
                                disabled={!url.trim()}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-medium"
                            >
                                <ChevronRight className="w-5 h-5" />
                                セクションを検出
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                AIがページを分析し、セクションの境界を自動検出します。
                                その後、境界を調整してから生成を開始できます。
                            </p>
                        </div>
                    )}

                    {step === 'detecting' && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                ページを分析中...
                            </h3>
                            <p className="text-gray-500">
                                AIがセクション境界を検出しています
                            </p>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="py-12 text-center">
                            <Loader2 className="w-12 h-12 text-gray-900 animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                生成中...
                            </h3>
                            <p className="text-gray-500">{progress}</p>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                インポート完了！
                            </h3>
                            <p className="text-gray-500 mb-6">
                                新しいページが作成されました
                            </p>
                            <button
                                onClick={() => {
                                    if (generatedPageId) {
                                        onImportComplete(generatedPageId);
                                    }
                                    onClose();
                                }}
                                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                ページを開く
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="py-8">
                            {/* Error Icon based on type */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                errorType === 'credit' ? 'bg-amber-100' :
                                errorType === 'apiKey' ? 'bg-blue-100' :
                                errorType === 'subscription' ? 'bg-purple-100' :
                                'bg-red-100'
                            }`}>
                                {errorType === 'credit' ? (
                                    <CreditCard className="w-8 h-8 text-amber-600" />
                                ) : errorType === 'apiKey' ? (
                                    <Key className="w-8 h-8 text-blue-600" />
                                ) : errorType === 'subscription' ? (
                                    <AlertCircle className="w-8 h-8 text-purple-600" />
                                ) : (
                                    <X className="w-8 h-8 text-red-600" />
                                )}
                            </div>

                            {/* Error Title */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                                {errorType === 'credit' ? 'クレジット不足' :
                                 errorType === 'apiKey' ? 'APIキーが必要です' :
                                 errorType === 'subscription' ? 'プランの選択が必要です' :
                                 'エラーが発生しました'}
                            </h3>

                            {/* Error Message Box */}
                            <div className={`mx-auto max-w-md p-4 rounded-lg mb-6 ${
                                errorType === 'credit' ? 'bg-amber-50 border border-amber-200' :
                                errorType === 'apiKey' ? 'bg-blue-50 border border-blue-200' :
                                errorType === 'subscription' ? 'bg-purple-50 border border-purple-200' :
                                'bg-red-50 border border-red-200'
                            }`}>
                                <p className={`text-sm ${
                                    errorType === 'credit' ? 'text-amber-800' :
                                    errorType === 'apiKey' ? 'text-blue-800' :
                                    errorType === 'subscription' ? 'text-purple-800' :
                                    'text-red-800'
                                }`}>
                                    {error}
                                </p>
                            </div>

                            {/* Action Buttons based on error type */}
                            <div className="flex flex-col items-center gap-3">
                                {errorType === 'credit' && (
                                    <>
                                        <p className="text-sm text-gray-500 mb-2">
                                            クレジットを追加するか、管理者に連絡してください。
                                        </p>
                                        <div className="flex gap-3">
                                            <Link
                                                href="/admin/settings"
                                                className="px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 font-medium"
                                            >
                                                <CreditCard className="w-4 h-4" />
                                                設定画面へ
                                            </Link>
                                            <button
                                                onClick={() => setStep('input')}
                                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                やり直す
                                            </button>
                                        </div>
                                    </>
                                )}

                                {errorType === 'apiKey' && (
                                    <>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Google AI Studio でAPIキーを取得し、設定画面で入力してください。
                                        </p>
                                        <div className="flex gap-3">
                                            <Link
                                                href="/admin/settings"
                                                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                                            >
                                                <Key className="w-4 h-4" />
                                                設定画面へ
                                            </Link>
                                            <a
                                                href="https://aistudio.google.com/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                                            >
                                                APIキー取得
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </>
                                )}

                                {errorType === 'subscription' && (
                                    <>
                                        <p className="text-sm text-gray-500 mb-2">
                                            有料プランに登録するか、Freeプランで自分のAPIキーを設定してください。
                                        </p>
                                        <Link
                                            href="/admin/settings"
                                            className="px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 font-medium"
                                        >
                                            プラン設定へ
                                        </Link>
                                    </>
                                )}

                                {errorType === 'generic' && (
                                    <button
                                        onClick={() => setStep('input')}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        やり直す
                                    </button>
                                )}
                            </div>

                            {/* Debug info for developers */}
                            <details className="mt-6 text-xs text-gray-400">
                                <summary className="cursor-pointer hover:text-gray-600">デバッグ情報</summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-auto text-left">
                                    {JSON.stringify({ errorType, error, url, importMode, style }, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
