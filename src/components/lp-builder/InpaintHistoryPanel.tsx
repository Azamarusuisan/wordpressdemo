"use client";

import React, { useState, useEffect } from 'react';
import { History, ArrowRight, DollarSign, Clock, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';

interface MaskArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface InpaintHistoryItem {
    id: number;
    originalImage: string;
    resultImage: string;
    prompt: string;
    masks: MaskArea[];
    model: string;
    estimatedCost: number | null;
    durationMs: number | null;
    createdAt: string;
}

interface InpaintHistoryPanelProps {
    originalImage?: string; // 特定の画像の履歴のみ表示する場合
    onSelectHistory?: (history: InpaintHistoryItem) => void;
    onClose?: () => void;
    isModal?: boolean;
}

export function InpaintHistoryPanel({
    originalImage,
    onSelectHistory,
    onClose,
    isModal = false,
}: InpaintHistoryPanelProps) {
    const [histories, setHistories] = useState<InpaintHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        fetchHistories();
    }, [originalImage]);

    const fetchHistories = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (originalImage) {
                params.set('originalImage', originalImage);
            }
            params.set('limit', '50');

            const response = await fetch(`/api/ai/inpaint-history?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch histories');
            }

            setHistories(data.histories);

            // 合計コストを計算
            const total = data.histories.reduce(
                (sum: number, h: InpaintHistoryItem) => sum + (h.estimatedCost || 0),
                0
            );
            setTotalCost(total);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPositionDesc = (mask: MaskArea) => {
        const xPercent = Math.round(mask.x * 100);
        const yPercent = Math.round(mask.y * 100);
        let pos = '';
        if (yPercent < 33) pos = '上';
        else if (yPercent < 66) pos = '中';
        else pos = '下';
        if (xPercent < 33) pos += '左';
        else if (xPercent < 66) pos += '央';
        else pos += '右';
        return pos;
    };

    const content = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-50">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">編集履歴</h3>
                    <span className="text-xs text-muted-foreground bg-surface-100 px-2 py-0.5 rounded-full">
                        {histories.length}件
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {totalCost > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-mono font-bold">${totalCost.toFixed(4)}</span>
                            <span>合計</span>
                        </div>
                    )}
                    {isModal && onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={fetchHistories}
                            className="mt-2 text-xs text-primary hover:underline"
                        >
                            再試行
                        </button>
                    </div>
                ) : histories.length === 0 ? (
                    <div className="text-center py-12">
                        <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">まだ編集履歴がありません</p>
                    </div>
                ) : (
                    histories.map((history) => (
                        <div
                            key={history.id}
                            className="bg-background border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
                        >
                            {/* Preview Row */}
                            <div
                                className="flex items-center gap-3 p-3 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === history.id ? null : history.id)}
                            >
                                {/* Before/After Images */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <div className="w-12 h-12 rounded overflow-hidden border border-border bg-surface-50">
                                        <img
                                            src={history.originalImage}
                                            alt="Before"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder.png';
                                            }}
                                        />
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    <div className="w-12 h-12 rounded overflow-hidden border border-primary/30 bg-surface-50">
                                        <img
                                            src={history.resultImage}
                                            alt="After"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                        {history.prompt}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                        <span>{formatDate(history.createdAt)}</span>
                                        {history.masks.length > 0 && (
                                            <>
                                                <span>|</span>
                                                <span>{history.masks.length}箇所</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Cost & Expand */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {history.estimatedCost && (
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            ${history.estimatedCost.toFixed(4)}
                                        </span>
                                    )}
                                    {expandedId === history.id ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === history.id && (
                                <div className="px-3 pb-3 pt-0 border-t border-border bg-surface-50">
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        {/* Before */}
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Before</p>
                                            <div className="aspect-video rounded overflow-hidden border border-border">
                                                <img
                                                    src={history.originalImage}
                                                    alt="Before"
                                                    className="w-full h-full object-contain bg-white"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder.png';
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* After */}
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">After</p>
                                            <div className="aspect-video rounded overflow-hidden border border-primary/30">
                                                <img
                                                    src={history.resultImage}
                                                    alt="After"
                                                    className="w-full h-full object-contain bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">プロンプト</p>
                                            <p className="text-xs text-foreground bg-background p-2 rounded border border-border">
                                                {history.prompt}
                                            </p>
                                        </div>

                                        {history.masks.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">選択範囲</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {history.masks.map((mask, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded"
                                                        >
                                                            {getPositionDesc(mask)} ({Math.round(mask.width * 100)}% x {Math.round(mask.height * 100)}%)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-2 border-t border-border">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <DollarSign className="w-3 h-3" />
                                                <span className="font-mono">${history.estimatedCost?.toFixed(4) || '0.0000'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span className="font-mono">{history.durationMs ? (history.durationMs / 1000).toFixed(1) : '0'}s</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {history.model}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {onSelectHistory && (
                                        <button
                                            onClick={() => onSelectHistory(history)}
                                            className="w-full mt-3 py-2 text-xs font-bold text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                                        >
                                            この結果を使用
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
                <div className="w-full max-w-2xl max-h-[80vh] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-background border-l border-border">
            {content}
        </div>
    );
}
