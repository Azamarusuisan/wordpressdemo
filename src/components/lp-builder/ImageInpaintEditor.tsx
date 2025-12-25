"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Loader2, Wand2, RotateCcw, ZoomIn, ZoomOut, Move, Trash2, Plus, DollarSign, Clock, Check } from 'lucide-react';

interface ImageInpaintEditorProps {
    imageUrl: string;
    onClose: () => void;
    onSave: (newImageUrl: string) => void;
}

interface SelectionRect {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export function ImageInpaintEditor({ imageUrl, onClose, onSave }: ImageInpaintEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [selections, setSelections] = useState<SelectionRect[]>([]);
    const [currentSelection, setCurrentSelection] = useState<SelectionRect | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [tool, setTool] = useState<'select' | 'pan'>('select');
    const [costInfo, setCostInfo] = useState<{ model: string; estimatedCost: number; durationMs: number } | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // 画像を読み込み
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            setImage(img);
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth - 40;
                const containerHeight = containerRef.current.clientHeight - 40;
                const scaleX = containerWidth / img.width;
                const scaleY = containerHeight / img.height;
                const newScale = Math.min(scaleX, scaleY, 1);
                setScale(newScale);
                setOffset({
                    x: (containerWidth - img.width * newScale) / 2,
                    y: (containerHeight - img.height * newScale) / 2
                });
            }
        };
        img.onerror = () => {
            setError('画像の読み込みに失敗しました');
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // キャンバスに描画
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (containerRef.current) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
        }

        // Draw neutral background instead of dark
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);
        ctx.restore();

        // 全ての選択範囲を描画
        const allSelections = currentSelection
            ? [...selections, currentSelection]
            : selections;

        allSelections.forEach((sel: SelectionRect, index: number) => {
            const scaledSel = {
                x: offset.x + sel.x * scale,
                y: offset.y + sel.y * scale,
                width: sel.width * scale,
                height: sel.height * scale
            };

            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const color = colors[index % colors.length];

            // Glow Effect
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledSel.x, scaledSel.y, scaledSel.width, scaledSel.height);
            ctx.restore();

            // Border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.strokeRect(scaledSel.x, scaledSel.y, scaledSel.width, scaledSel.height);

            // Number Label with premium pill shape
            ctx.fillStyle = color;
            const labelWidth = 28;
            const labelHeight = 20;
            const labelX = scaledSel.x;
            const labelY = scaledSel.y - labelHeight - 4;

            // Draw rounded rect for label
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 6);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'black 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${index + 1}`, labelX + labelWidth / 2, labelY + 14);

            // Subtle corner accents
            const accentSize = 8;
            ctx.fillStyle = 'white';
            // Top-left
            ctx.fillRect(scaledSel.x - 2, scaledSel.y - 2, accentSize, 2);
            ctx.fillRect(scaledSel.x - 2, scaledSel.y - 2, 2, accentSize);
            // Top-right
            ctx.fillRect(scaledSel.x + scaledSel.width - accentSize + 2, scaledSel.y - 2, accentSize, 2);
            ctx.fillRect(scaledSel.x + scaledSel.width, scaledSel.y - 2, 2, accentSize);
        });
    }, [image, selections, currentSelection, scale, offset]);

    const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;
        return { x, y };
    }, [offset, scale]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'pan') {
            setIsPanning(true);
            setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            return;
        }

        const coords = getCanvasCoords(e);
        setIsSelecting(true);
        setStartPoint(coords);
        setCurrentSelection(null);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning) {
            setOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
            return;
        }

        if (!isSelecting || !image) return;

        const coords = getCanvasCoords(e);
        const newSelection: SelectionRect = {
            id: 'temp',
            x: Math.max(0, Math.min(startPoint.x, coords.x)),
            y: Math.max(0, Math.min(startPoint.y, coords.y)),
            width: Math.min(Math.abs(coords.x - startPoint.x), image.width - Math.min(startPoint.x, coords.x)),
            height: Math.min(Math.abs(coords.y - startPoint.y), image.height - Math.min(startPoint.y, coords.y))
        };
        setCurrentSelection(newSelection);
    };

    const handleMouseUp = () => {
        if (currentSelection && currentSelection.width > 10 && currentSelection.height > 10) {
            // 選択範囲を確定して追加
            setSelections(prev => [...prev, { ...currentSelection, id: Date.now().toString() }]);
        }
        setCurrentSelection(null);
        setIsSelecting(false);
        setIsPanning(false);
    };

    const removeSelection = (id: string) => {
        setSelections(prev => prev.filter(s => s.id !== id));
    };

    const clearAllSelections = () => {
        setSelections([]);
    };

    // インペインティング実行
    const handleInpaint = async () => {
        if (selections.length === 0 || !prompt.trim()) {
            setError('範囲を選択してプロンプトを入力してください');
            return;
        }

        if (!image) {
            setError('画像が読み込まれていません');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 複数の選択範囲を0-1の比率に変換
            const masks = selections.map(sel => ({
                x: sel.x / image.width,
                y: sel.y / image.height,
                width: sel.width / image.width,
                height: sel.height / image.height
            }));

            const response = await fetch('/api/ai/inpaint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    masks, // 複数のマスク
                    mask: masks[0], // 後方互換性のため
                    prompt: prompt.trim()
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'インペインティングに失敗しました');
            }

            if (result.success && result.media?.filePath) {
                // コスト情報を保存
                if (result.costInfo) {
                    setCostInfo(result.costInfo);
                }
                setShowSuccess(true);
                // 少し待ってから閉じる（コストを表示するため）
                setTimeout(() => {
                    onSave(result.media.filePath);
                }, 2000);
            } else {
                throw new Error(result.message || '画像の生成に失敗しました');
            }
        } catch (err: any) {
            setError(err.message || 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.2));
    const handleReset = () => {
        if (image && containerRef.current) {
            const containerWidth = containerRef.current.clientWidth - 40;
            const containerHeight = containerRef.current.clientHeight - 40;
            const scaleX = containerWidth / image.width;
            const scaleY = containerHeight / image.height;
            const newScale = Math.min(scaleX, scaleY, 1);
            setScale(newScale);
            setOffset({
                x: (containerWidth - image.width * newScale) / 2,
                y: (containerHeight - image.height * newScale) / 2
            });
        }
        setSelections([]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
            <div className="relative w-full h-full max-w-[1600px] max-h-[900px] bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border animate-in fade-in zoom-in duration-200">
                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="text-center p-8 bg-surface-50 rounded-xl border border-border shadow-lg">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                                <Check className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">編集完了</h3>
                            <p className="text-muted-foreground text-sm mb-6">画像を保存して閉じています...</p>

                            {costInfo && (
                                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">コスト</p>
                                        <p className="text-lg font-bold text-foreground font-mono">${costInfo.estimatedCost.toFixed(4)}</p>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">処理時間</p>
                                        <p className="text-lg font-bold text-foreground font-mono">{(costInfo.durationMs / 1000).toFixed(1)}s</p>
                                    </div>
                                    <div className="w-px h-8 bg-border" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">モデル</p>
                                        <p className="text-sm font-bold text-foreground">{costInfo.model}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md text-primary border border-primary/20">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">画象部分編集</h2>
                            <p className="text-xs text-muted-foreground font-medium">画像の一部を選択してAIで編集・修正します（複数選択可）</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Cost Info */}
                        {costInfo && (
                            <div className="flex items-center gap-3 bg-surface-100 rounded-md px-4 py-2 border border-border">
                                <span className="text-xs font-bold text-muted-foreground">前回:</span>
                                <div className="flex items-center gap-1 text-foreground">
                                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-mono font-bold">${costInfo.estimatedCost.toFixed(4)}</span>
                                </div>
                                <div className="w-px h-3 bg-border" />
                                <div className="flex items-center gap-1 text-foreground">
                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs font-mono font-bold">{(costInfo.durationMs / 1000).toFixed(1)}s</span>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-surface-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Canvas Area */}
                    <div
                        ref={containerRef}
                        className="flex-1 relative bg-surface-100 overflow-hidden"
                    >
                        {/* Checkerboard background for transparency hint */}
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                        />

                        <canvas
                            ref={canvasRef}
                            className={`w-full h-full relative z-10 ${tool === 'select' ? 'cursor-crosshair' : 'cursor-grab'}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />

                        {/* Toolbar */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2 bg-background p-1.5 rounded-lg border border-border shadow-lg z-20">
                            <button
                                onClick={() => setTool('select')}
                                className={`p-2.5 rounded-md transition-all ${tool === 'select' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'}`}
                                title="選択ツール"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setTool('pan')}
                                className={`p-2.5 rounded-md transition-all ${tool === 'pan' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'}`}
                                title="移動ツール"
                            >
                                <Move className="w-5 h-5" />
                            </button>
                            <div className="h-px bg-border mx-1 my-1" />
                            <button
                                onClick={handleZoomIn}
                                className="p-2.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-100 transition-all"
                                title="拡大"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleZoomOut}
                                className="p-2.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-100 transition-all"
                                title="縮小"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleReset}
                                className="p-2.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-100 transition-all"
                                title="リセット"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scale Indicator */}
                        <div className="absolute bottom-6 left-6 text-xs font-bold text-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border shadow-sm z-20">
                            {Math.round(scale * 100)}%
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="w-80 bg-background border-l border-border p-6 flex flex-col z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1">編集設定</h3>
                            <p className="text-xs text-muted-foreground">編集したい領域を選択してください。</p>
                        </div>

                        {/* Selections List */}
                        {selections.length > 0 ? (
                            <div className="mb-6 flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-foreground">{selections.length} 箇所の選択範囲</p>
                                    <button
                                        onClick={clearAllSelections}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 border border-red-100 bg-red-50 px-2 py-1 rounded-sm transition-colors"
                                    >
                                        全て削除
                                    </button>
                                </div>
                                <div className="space-y-2 overflow-y-auto pr-1">
                                    {selections.map((sel, index) => {
                                        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
                                        return (
                                            <div key={sel.id} className="flex items-center justify-between p-3 bg-surface-50 border border-border rounded-md hover:border-primary/30 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${colors[index % colors.length]}`}>
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {Math.round(sel.width)} x {Math.round(sel.height)} px
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => removeSelection(sel.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-sm transition-all opacity-50 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-6 bg-surface-50 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center mb-3">
                                    <Plus className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-bold text-foreground">範囲を選択</p>
                                <p className="text-xs text-muted-foreground mt-1">画像上をドラッグして<br />編集エリアを指定します。</p>
                            </div>
                        )}

                        {/* Prompt Input */}
                        <div className="mb-6 mt-auto">
                            <label className="block text-xs font-bold text-foreground uppercase tracking-widest mb-3">
                                編集プロンプト
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="例: テキストを消す、背景を青空にする..."
                                className="w-full h-32 px-4 py-3 rounded-md border border-input bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none shadow-sm"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md">
                                <p className="text-xs text-red-600 font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3 pt-6 border-t border-border">
                            <button
                                onClick={handleInpaint}
                                disabled={isLoading || selections.length === 0 || !prompt.trim()}
                                className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        実行する ({selections.length})
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-surface-100 text-muted-foreground font-bold text-sm rounded-md hover:bg-surface-200 hover:text-foreground transition-all disabled:opacity-50"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
