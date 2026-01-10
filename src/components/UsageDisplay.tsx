'use client';

import { useState, useEffect } from 'react';
import { Zap, Upload, FileText, Database, Crown, Check, X, Loader2 } from 'lucide-react';

interface UsageReport {
    plan: {
        id: string;
        name: string;
        description: string;
    };
    usage: {
        monthlyGenerations: number;
        monthlyUploads: number;
        totalPages: number;
        totalStorageMB: number;
    };
    limits: {
        monthlyGenerations: number;
        monthlyUploads: number;
        maxPages: number;
        maxStorageMB: number;
        canUpscale4K: boolean;
        canRestyle: boolean;
        canExport: boolean;
        canGenerateVideo: boolean;
        canSetApiKey: boolean;
        prioritySupport: boolean;
    };
    percentages: {
        generations: number;
        uploads: number;
        pages: number;
    };
}

// プランカラー定義
const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700 border-gray-200',
    starter: 'bg-blue-100 text-blue-700 border-blue-200',
    pro: 'bg-purple-100 text-purple-700 border-purple-200',
    enterprise: 'bg-amber-100 text-amber-700 border-amber-200',
};

// プログレスバーの色
function getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-blue-500';
}

// 数値表示（無制限対応）
function formatLimit(value: number): string {
    return value === -1 ? '∞' : value.toLocaleString();
}

export function UsageDisplay() {
    const [report, setReport] = useState<UsageReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsage() {
            try {
                setLoading(true);
                const res = await fetch('/api/user/usage');
                if (!res.ok) {
                    throw new Error('Failed to fetch usage data');
                }
                const data = await res.json();
                setReport(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">読み込み中...</span>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="bg-white rounded-lg border p-6">
                <div className="text-center text-red-500 py-4">
                    <p>使用量の取得に失敗しました</p>
                    <p className="text-sm text-gray-500 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const { plan, usage, limits, percentages } = report;

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            {/* プランヘッダー */}
            <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${PLAN_COLORS[plan.id] || PLAN_COLORS.free}`}>
                                <Crown className="w-4 h-4" />
                                {plan.name}プラン
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </div>
                </div>
            </div>

            {/* 使用量セクション */}
            <div className="p-6 space-y-6">
                <h3 className="text-sm font-medium text-gray-900">今月の使用状況</h3>

                {/* 使用量プログレスバー */}
                <div className="space-y-4">
                    {/* AI生成 */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Zap className="w-4 h-4 text-amber-500" />
                                AI生成
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {usage.monthlyGenerations.toLocaleString()} / {formatLimit(limits.monthlyGenerations)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getProgressColor(percentages.generations)} transition-all duration-300`}
                                style={{ width: `${Math.min(100, percentages.generations)}%` }}
                            />
                        </div>
                        {percentages.generations >= 80 && percentages.generations < 100 && (
                            <p className="text-xs text-amber-600 mt-1">残り{limits.monthlyGenerations - usage.monthlyGenerations}回です</p>
                        )}
                        {percentages.generations >= 100 && (
                            <p className="text-xs text-red-600 mt-1">上限に達しました</p>
                        )}
                    </div>

                    {/* アップロード */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Upload className="w-4 h-4 text-blue-500" />
                                アップロード
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {usage.monthlyUploads.toLocaleString()} / {formatLimit(limits.monthlyUploads)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getProgressColor(percentages.uploads)} transition-all duration-300`}
                                style={{ width: `${Math.min(100, percentages.uploads)}%` }}
                            />
                        </div>
                    </div>

                    {/* ページ数 */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <FileText className="w-4 h-4 text-green-500" />
                                ページ数
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {usage.totalPages.toLocaleString()} / {formatLimit(limits.maxPages)}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getProgressColor(percentages.pages)} transition-all duration-300`}
                                style={{ width: `${Math.min(100, percentages.pages)}%` }}
                            />
                        </div>
                    </div>

                    {/* ストレージ */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Database className="w-4 h-4 text-purple-500" />
                                ストレージ
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {usage.totalStorageMB.toLocaleString()} MB / {formatLimit(limits.maxStorageMB)} MB
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-purple-500 transition-all duration-300`}
                                style={{ width: `${limits.maxStorageMB === -1 ? 0 : Math.min(100, (usage.totalStorageMB / limits.maxStorageMB) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 利用可能な機能 */}
                <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">利用可能な機能</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <FeatureItem label="4Kアップスケール" enabled={limits.canUpscale4K} />
                        <FeatureItem label="リスタイル" enabled={limits.canRestyle} />
                        <FeatureItem label="エクスポート" enabled={limits.canExport} />
                        <FeatureItem label="動画生成" enabled={limits.canGenerateVideo} />
                        <FeatureItem label="APIキー設定" enabled={limits.canSetApiKey} />
                        <FeatureItem label="優先サポート" enabled={limits.prioritySupport} />
                    </div>
                </div>
            </div>

            {/* アップグレード案内（Freeプランの場合） */}
            {plan.id === 'free' && (
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                    <p className="text-sm text-blue-800">
                        <strong>Starterプラン</strong>にアップグレードすると、月間100回の生成と全ての機能が利用できます。
                    </p>
                </div>
            )}
        </div>
    );
}

// 機能アイテムコンポーネント
function FeatureItem({ label, enabled }: { label: string; enabled: boolean }) {
    return (
        <div className={`flex items-center gap-2 text-sm ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>
            {enabled ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
                <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}
            <span>{label}</span>
        </div>
    );
}

// サイドバー用のコンパクト版
export function UsageBadge() {
    const [report, setReport] = useState<UsageReport | null>(null);

    useEffect(() => {
        fetch('/api/user/usage')
            .then(res => res.ok ? res.json() : null)
            .then(data => setReport(data))
            .catch(() => null);
    }, []);

    if (!report) return null;

    const { plan, percentages } = report;
    const highUsage = percentages.generations >= 80;

    return (
        <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_COLORS[plan.id] || PLAN_COLORS.free}`}>
                    {plan.name}
                </span>
                {highUsage && (
                    <span className="text-xs text-amber-600">残りわずか</span>
                )}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getProgressColor(percentages.generations)}`}
                    style={{ width: `${Math.min(100, percentages.generations)}%` }}
                />
            </div>
        </div>
    );
}
