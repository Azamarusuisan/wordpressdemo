'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, ArrowRight, Layers, Trash2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface Section {
    id: number;
    image_url: string;
    display_order: number;
}

interface LPData {
    id: number;
    title: string;
    sections: Section[];
}

interface SelectedBlock {
    lpIndex: number;
    sectionId: number;
    imageUrl: string;
    displayOrder: number;
}

interface LPCompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPageId: number;
    currentSections: Section[];
    onApplySelection: (selectedBlocks: SelectedBlock[]) => void;
}

export default function LPCompareModal({
    isOpen,
    onClose,
    currentPageId,
    currentSections,
    onApplySelection,
}: LPCompareModalProps) {
    const [lpUrl, setLpUrl] = useState('');
    const [compareLPs, setCompareLPs] = useState<LPData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlock[]>([]);

    // 現在のLPを最初に追加
    useEffect(() => {
        if (isOpen && compareLPs.length === 0) {
            setCompareLPs([{
                id: currentPageId,
                title: '現在のLP',
                sections: currentSections,
            }]);
            // 初期状態では現在のLPの全ブロックを選択
            setSelectedBlocks(currentSections.map((s, idx) => ({
                lpIndex: 0,
                sectionId: s.id,
                imageUrl: s.image_url,
                displayOrder: idx,
            })));
        }
    }, [isOpen, currentPageId, currentSections, compareLPs.length]);

    const handleAddLP = async () => {
        if (!lpUrl.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // URLからページIDを抽出（/admin/pages/123 または ?id=123 形式）
            const urlMatch = lpUrl.match(/\/pages\/(\d+)|[?&]id=(\d+)/);
            if (!urlMatch) {
                throw new Error('LPのURLが正しくありません。ページ編集画面のURLを入力してください。');
            }
            const pageId = parseInt(urlMatch[1] || urlMatch[2]);

            if (pageId === currentPageId) {
                throw new Error('現在編集中のLPと同じです。別のLPを選択してください。');
            }

            if (compareLPs.some(lp => lp.id === pageId)) {
                throw new Error('このLPは既に追加されています。');
            }

            // ページ情報を取得
            const pageRes = await fetch(`/api/pages/${pageId}`);
            if (!pageRes.ok) throw new Error('LPが見つかりませんでした。');
            const pageData = await pageRes.json();

            // セクション情報を取得
            const sectionsRes = await fetch(`/api/pages/${pageId}/sections`);
            if (!sectionsRes.ok) throw new Error('LPのセクション情報を取得できませんでした。');
            const sectionsData = await sectionsRes.json();

            const newLP: LPData = {
                id: pageId,
                title: pageData.title || `LP ${pageId}`,
                sections: sectionsData.sections || [],
            };

            setCompareLPs(prev => [...prev, newLP]);
            setLpUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveLP = (index: number) => {
        if (index === 0) return; // 現在のLPは削除不可
        setCompareLPs(prev => prev.filter((_, i) => i !== index));
        // 削除されたLPから選択されていたブロックも削除
        setSelectedBlocks(prev => prev.filter(b => b.lpIndex !== index).map(b => ({
            ...b,
            lpIndex: b.lpIndex > index ? b.lpIndex - 1 : b.lpIndex,
        })));
    };

    const handleSelectBlock = (lpIndex: number, section: Section) => {
        setSelectedBlocks(prev => {
            // 同じdisplayOrderの既存選択を探す
            const existingIndex = prev.findIndex(b => b.displayOrder === section.display_order);

            if (existingIndex >= 0) {
                // 同じブロックをクリックした場合は選択解除
                if (prev[existingIndex].lpIndex === lpIndex && prev[existingIndex].sectionId === section.id) {
                    return prev.filter((_, i) => i !== existingIndex);
                }
                // 別のLPの同じ位置のブロックに置き換え
                const newBlocks = [...prev];
                newBlocks[existingIndex] = {
                    lpIndex,
                    sectionId: section.id,
                    imageUrl: section.image_url,
                    displayOrder: section.display_order,
                };
                return newBlocks;
            } else {
                // 新規追加
                return [...prev, {
                    lpIndex,
                    sectionId: section.id,
                    imageUrl: section.image_url,
                    displayOrder: section.display_order,
                }].sort((a, b) => a.displayOrder - b.displayOrder);
            }
        });
    };

    const isBlockSelected = (lpIndex: number, sectionId: number) => {
        return selectedBlocks.some(b => b.lpIndex === lpIndex && b.sectionId === sectionId);
    };

    const getBlockSelectionOrder = (displayOrder: number) => {
        const block = selectedBlocks.find(b => b.displayOrder === displayOrder);
        return block ? selectedBlocks.indexOf(block) + 1 : null;
    };

    const handleApply = () => {
        onApplySelection(selectedBlocks);
        onClose();
    };

    const handleClose = () => {
        setCompareLPs([]);
        setSelectedBlocks([]);
        setLpUrl('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    // 最大ブロック数を計算
    const maxSections = Math.max(...compareLPs.map(lp => lp.sections.length), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
                {/* ヘッダー */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">LP比較</h2>
                            <p className="text-xs text-gray-500">複数のLPを並べて、いいとこ取りで組み合わせ</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* LP追加エリア */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={lpUrl}
                                onChange={(e) => setLpUrl(e.target.value)}
                                placeholder="比較したいLPのURL（例: /admin/pages/123）"
                                className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLP()}
                            />
                            <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        </div>
                        <button
                            onClick={handleAddLP}
                            disabled={isLoading || !lpUrl.trim()}
                            className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            LPを追加
                        </button>
                    </div>
                    {error && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                    <p className="mt-2 text-[10px] text-gray-400">
                        追加したLPが横に並びます。各ブロックをクリックして選択すると、最終的なLPに使用されます。
                    </p>
                </div>

                {/* 比較エリア */}
                <div className="flex-1 overflow-auto p-6">
                    {compareLPs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <p>LPを読み込み中...</p>
                        </div>
                    ) : (
                        <div className="flex gap-4" style={{ minWidth: `${compareLPs.length * 280}px` }}>
                            {compareLPs.map((lp, lpIndex) => (
                                <div key={lp.id} className="flex-shrink-0 w-64">
                                    {/* LPヘッダー */}
                                    <div className={clsx(
                                        "mb-3 p-3 rounded-xl flex items-center justify-between",
                                        lpIndex === 0 ? "bg-violet-100 border-2 border-violet-300" : "bg-gray-100 border border-gray-200"
                                    )}>
                                        <div>
                                            <p className={clsx(
                                                "text-xs font-bold",
                                                lpIndex === 0 ? "text-violet-700" : "text-gray-700"
                                            )}>
                                                {lpIndex === 0 ? '現在のLP' : lp.title}
                                            </p>
                                            <p className="text-[10px] text-gray-500">{lp.sections.length}ブロック</p>
                                        </div>
                                        {lpIndex > 0 && (
                                            <button
                                                onClick={() => handleRemoveLP(lpIndex)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* セクション一覧 */}
                                    <div className="space-y-2">
                                        {lp.sections.map((section, sectionIndex) => {
                                            const isSelected = isBlockSelected(lpIndex, section.id);
                                            const selectionOrder = getBlockSelectionOrder(section.display_order);

                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => handleSelectBlock(lpIndex, section)}
                                                    className={clsx(
                                                        "w-full relative rounded-xl overflow-hidden border-2 transition-all",
                                                        isSelected
                                                            ? "border-violet-500 ring-2 ring-violet-200 shadow-lg"
                                                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                                    )}
                                                >
                                                    {/* サムネイル */}
                                                    <div className="aspect-[16/9] bg-gray-100 relative">
                                                        <img
                                                            src={section.image_url}
                                                            alt={`Block ${sectionIndex + 1}`}
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                        {/* 選択インジケーター */}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                                                                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                                                                    <Check className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* ブロック番号 */}
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded-lg">
                                                        {sectionIndex + 1}
                                                    </div>
                                                    {/* 選択順序 */}
                                                    {selectionOrder && (
                                                        <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                                            {selectionOrder}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* 追加プレースホルダー */}
                            {compareLPs.length < 4 && (
                                <div className="flex-shrink-0 w-64">
                                    <div className="h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">上のフォームから<br />LPを追加</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* プレビューエリア */}
                {selectedBlocks.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-gray-700">
                                選択中のブロック（{selectedBlocks.length}個）
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span>クリックで選択</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>組み合わせて新しいLPに</span>
                            </div>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {selectedBlocks.map((block, index) => (
                                <div
                                    key={`${block.lpIndex}-${block.sectionId}`}
                                    className="flex-shrink-0 w-20 relative"
                                >
                                    <div className="aspect-[16/9] rounded-lg overflow-hidden border-2 border-violet-300 bg-gray-100">
                                        <img
                                            src={block.imageUrl}
                                            alt={`Selected ${index + 1}`}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    </div>
                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <p className="text-[9px] text-gray-500 text-center mt-1 truncate">
                                        {compareLPs[block.lpIndex]?.title?.slice(0, 8) || 'LP'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* フッター */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                    <button
                        onClick={handleClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={selectedBlocks.length === 0}
                        className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <Check className="h-4 w-4" />
                        選択したブロックで作成（{selectedBlocks.length}個）
                    </button>
                </div>
            </div>
        </div>
    );
}
