'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, ArrowLeftRight, Layers, Trash2, ExternalLink, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
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

interface LPComparePanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentPageId: number;
    onSelectBlock: (sectionId: number, imageUrl: string, fromLpId: number) => void;
}

export default function LPComparePanel({
    isOpen,
    onClose,
    currentPageId,
    onSelectBlock,
}: LPComparePanelProps) {
    const [lpUrl, setLpUrl] = useState('');
    const [compareLPs, setCompareLPs] = useState<LPData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleAddLP = async () => {
        if (!lpUrl.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // URLからページIDを抽出
            const urlMatch = lpUrl.match(/\/pages\/(\d+)|[?&]id=(\d+)/);
            if (!urlMatch) {
                throw new Error('LPのURLが正しくありません');
            }
            const pageId = parseInt(urlMatch[1] || urlMatch[2]);

            if (pageId === currentPageId) {
                throw new Error('現在のLPと同じです');
            }

            if (compareLPs.some(lp => lp.id === pageId)) {
                throw new Error('既に追加されています');
            }

            // ページ情報を取得
            const pageRes = await fetch(`/api/pages/${pageId}`);
            if (!pageRes.ok) throw new Error('LPが見つかりません');
            const pageData = await pageRes.json();

            // セクション情報を取得
            const sectionsRes = await fetch(`/api/pages/${pageId}/sections`);
            if (!sectionsRes.ok) throw new Error('セクション取得失敗');
            const sectionsData = await sectionsRes.json();

            const newLP: LPData = {
                id: pageId,
                title: pageData.title || `LP ${pageId}`,
                sections: sectionsData.sections || [],
            };

            setCompareLPs(prev => [...prev, newLP]);
            setLpUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラー');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveLP = (index: number) => {
        setCompareLPs(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    // 折りたたみ状態
    if (isCollapsed) {
        return (
            <div className="fixed right-[360px] top-1/2 -translate-y-1/2 z-40">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-2 px-3 py-4 bg-violet-600 text-white rounded-l-xl shadow-lg hover:bg-violet-700 transition-all"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    <Layers className="h-4 w-4" />
                    <span className="text-xs font-bold">LP比較</span>
                    <ChevronLeft className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div
            className="fixed right-[360px] top-0 bottom-0 w-[320px] bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
        >
            {/* ヘッダー */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                        <Layers className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">LP比較</h3>
                        <p className="text-[10px] text-gray-500">クリックでブロックを取り込み</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="折りたたむ"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* LP追加 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={lpUrl}
                        onChange={(e) => setLpUrl(e.target.value)}
                        placeholder="/admin/pages/123"
                        className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLP()}
                    />
                    <button
                        onClick={handleAddLP}
                        disabled={isLoading || !lpUrl.trim()}
                        className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                {error && (
                    <p className="mt-2 text-[10px] text-red-600">{error}</p>
                )}
            </div>

            {/* LP一覧 */}
            <div className="flex-1 overflow-y-auto">
                {compareLPs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 px-6">
                        <Layers className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-xs text-center">
                            比較したいLPのURLを<br />上の入力欄に貼り付けてください
                        </p>
                        <p className="text-[10px] mt-2 text-gray-300">
                            例: /admin/pages/42
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {compareLPs.map((lp, lpIndex) => (
                            <div key={lp.id} className="bg-gray-50 rounded-xl p-3">
                                {/* LPヘッダー */}
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">{lp.title}</p>
                                        <p className="text-[10px] text-gray-400">{lp.sections.length}ブロック</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveLP(lpIndex)}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* セクション一覧 */}
                                <div className="space-y-2">
                                    {lp.sections.map((section, sectionIndex) => (
                                        <button
                                            key={section.id}
                                            onClick={() => onSelectBlock(section.id, section.image_url, lp.id)}
                                            className="w-full relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-violet-400 hover:shadow-md transition-all group"
                                        >
                                            <div className="aspect-[16/9] bg-gray-100">
                                                <img
                                                    src={section.image_url}
                                                    alt={`Block ${sectionIndex + 1}`}
                                                    className="w-full h-full object-cover object-top"
                                                />
                                            </div>
                                            {/* ブロック番号 */}
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">
                                                {sectionIndex + 1}
                                            </div>
                                            {/* ホバー時のオーバーレイ */}
                                            <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/20 flex items-center justify-center transition-all">
                                                <div className="opacity-0 group-hover:opacity-100 bg-violet-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg transition-all">
                                                    <ArrowLeftRight className="h-3 w-3 inline mr-1" />
                                                    取り込む
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* フッター */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-[10px] text-gray-400 text-center">
                    クリックしたブロックを現在のLPに挿入できます
                </p>
            </div>
        </div>
    );
}
