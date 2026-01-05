"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Trash2, GripVertical } from 'lucide-react';

interface Section {
    index: number;
    startY: number;
    endY: number;
    height: number;
    label: string;
    confidence?: number;
}

interface SectionBoundaryEditorProps {
    screenshotBase64: string;
    pageHeight: number;
    pageWidth: number;
    sections: Section[];
    onConfirm: (sections: Section[]) => void;
    onCancel: () => void;
}

export function SectionBoundaryEditor({
    screenshotBase64,
    pageHeight,
    pageWidth,
    sections: initialSections,
    onConfirm,
    onCancel
}: SectionBoundaryEditorProps) {
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [hoveredBoundary, setHoveredBoundary] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // 画像の表示サイズに対するスケール
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (imageRef.current && containerRef.current) {
                const displayHeight = imageRef.current.clientHeight;
                setScale(displayHeight / pageHeight);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [pageHeight]);

    // 境界線をドラッグ
    const handleBoundaryMouseDown = useCallback((boundaryIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingIndex(boundaryIndex);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const y = (e.clientY - rect.top) / scale;

        // ドラッグ中の境界線移動
        if (draggingIndex !== null) {
            const minDistance = 100;
            const minY = draggingIndex > 0 ? sections[draggingIndex - 1].startY + minDistance : minDistance;
            const maxY = draggingIndex < sections.length - 1
                ? sections[draggingIndex + 1].endY - minDistance
                : pageHeight - minDistance;

            const newY = Math.max(minY, Math.min(maxY, y));

            setSections(prev => {
                const updated = [...prev];
                if (draggingIndex > 0) {
                    updated[draggingIndex - 1] = {
                        ...updated[draggingIndex - 1],
                        endY: Math.round(newY),
                        height: Math.round(newY - updated[draggingIndex - 1].startY)
                    };
                }
                updated[draggingIndex] = {
                    ...updated[draggingIndex],
                    startY: Math.round(newY),
                    height: Math.round(updated[draggingIndex].endY - newY)
                };
                return updated;
            });
        }
    }, [draggingIndex, scale, sections, pageHeight]);

    const handleMouseUp = useCallback(() => {
        setDraggingIndex(null);
    }, []);

    // セクションを削除（上のセクションと結合）
    const removeSection = useCallback((sectionIndex: number) => {
        if (sections.length <= 1) return;

        setSections(prev => {
            if (sectionIndex === 0) {
                const merged = {
                    ...prev[0],
                    endY: prev[1].endY,
                    height: prev[1].endY - prev[0].startY
                };
                return [merged, ...prev.slice(2).map((s, i) => ({ ...s, index: i + 1 }))];
            } else {
                const merged = {
                    ...prev[sectionIndex - 1],
                    endY: prev[sectionIndex].endY,
                    height: prev[sectionIndex].endY - prev[sectionIndex - 1].startY
                };
                return [
                    ...prev.slice(0, sectionIndex - 1),
                    merged,
                    ...prev.slice(sectionIndex + 1).map((s, i) => ({ ...s, index: sectionIndex + i }))
                ];
            }
        });
    }, [sections.length]);

    // リセット
    const handleReset = () => {
        setSections(initialSections);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="text-white">
                        <h2 className="text-xl font-bold">セクション境界の調整</h2>
                        <p className="text-sm text-white/80">
                            境界線をドラッグして調整できます
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-white/80 text-sm">{sections.length} セクション</span>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Screenshot with boundaries */}
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-auto p-4 bg-gray-100"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div className="relative inline-block mx-auto">
                            <img
                                ref={imageRef}
                                src={`data:image/jpeg;base64,${screenshotBase64}`}
                                alt="Page screenshot"
                                className="max-h-[calc(90vh-200px)] w-auto shadow-lg rounded"
                                onLoad={() => {
                                    if (imageRef.current) {
                                        setScale(imageRef.current.clientHeight / pageHeight);
                                    }
                                }}
                            />

                            {/* Boundary lines */}
                            {sections.slice(1).map((section, idx) => {
                                const boundaryIndex = idx + 1;
                                const y = section.startY * scale;
                                const isDragging = draggingIndex === boundaryIndex;
                                const isHovered = hoveredBoundary === boundaryIndex;

                                return (
                                    <div
                                        key={`boundary-${boundaryIndex}`}
                                        className={`absolute left-0 right-0 cursor-row-resize group transition-all ${
                                            isDragging ? 'z-50' : 'z-40'
                                        }`}
                                        style={{ top: `${y}px` }}
                                        onMouseDown={(e) => handleBoundaryMouseDown(boundaryIndex, e)}
                                        onMouseEnter={() => setHoveredBoundary(boundaryIndex)}
                                        onMouseLeave={() => setHoveredBoundary(null)}
                                    >
                                        {/* Wider hit area */}
                                        <div className="absolute -top-3 left-0 right-0 h-6" />

                                        {/* Visual line */}
                                        <div className={`h-1 transition-all ${
                                            isDragging
                                                ? 'bg-purple-600 shadow-lg shadow-purple-500/50'
                                                : isHovered
                                                    ? 'bg-purple-500'
                                                    : 'bg-purple-400/70'
                                        }`} />

                                        {/* Drag handle */}
                                        <div className={`absolute left-1/2 -translate-x-1/2 -top-4 px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                                            isDragging
                                                ? 'bg-purple-600 text-white scale-110'
                                                : isHovered
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white text-purple-600 border-2 border-purple-400'
                                        }`}>
                                            <GripVertical className="w-5 h-5" />
                                            <span className="text-sm font-bold">境界 {boundaryIndex}</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Section overlays */}
                            {sections.map((section, idx) => (
                                <div
                                    key={`section-${idx}`}
                                    className="absolute left-0 right-0 pointer-events-none"
                                    style={{
                                        top: `${section.startY * scale}px`,
                                        height: `${section.height * scale}px`
                                    }}
                                >
                                    {/* Section label */}
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        {section.label}
                                        <span className="ml-2 text-white/60">
                                            {Math.round(section.height)}px
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section List Panel */}
                    <div className="w-80 border-l bg-white flex flex-col">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-800">セクション一覧</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                右のボタンでセクションを結合（削除）
                            </p>
                        </div>

                        <div className="flex-1 overflow-auto p-2 space-y-2">
                            {sections.map((section, idx) => (
                                <div
                                    key={`list-${idx}`}
                                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-800">
                                                {section.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {section.startY}px ~ {section.endY}px
                                                <span className="ml-2">({section.height}px)</span>
                                            </div>
                                        </div>
                                        {sections.length > 1 && (
                                            <button
                                                onClick={() => removeSection(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="上のセクションと結合"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        リセット
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={() => onConfirm(sections)}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg"
                        >
                            <Check className="w-4 h-4" />
                            この境界で生成開始
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
