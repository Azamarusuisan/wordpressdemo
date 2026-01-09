"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, ImageIcon, FolderOpen, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    insertIndex: number; // 挿入位置（この位置に挿入される）
    onClose: () => void;
    onInsert: (imageFile: File, insertIndex: number) => Promise<void>;
    onSelectFromLibrary: (insertIndex: number) => void;
}

export default function SectionInsertModal({
    isOpen,
    insertIndex,
    onClose,
    onInsert,
    onSelectFromLibrary,
}: Props) {
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('画像ファイルを選択してください');
            return;
        }

        setIsUploading(true);
        try {
            await onInsert(file, insertIndex);
            onClose();
        } catch (error: any) {
            toast.error(error.message || '画像のアップロードに失敗しました');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-500 to-indigo-500">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ImageIcon className="h-5 w-5" />
                            セクションを挿入
                        </h2>
                        <p className="text-xs text-blue-100 mt-0.5">
                            セクション {insertIndex + 1} の位置に挿入します
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="p-5">
                    {isUploading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                            <p className="text-sm text-gray-600">アップロード中...</p>
                        </div>
                    ) : (
                        <>
                            {/* ドラッグ＆ドロップエリア */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                                    dragOver
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700">
                                    画像をドラッグ＆ドロップ
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    またはクリックしてファイルを選択
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileInputChange}
                                />
                            </div>

                            {/* 区切り線 */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400">または</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* アセットライブラリから選択 */}
                            <button
                                onClick={() => {
                                    onSelectFromLibrary(insertIndex);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                            >
                                <FolderOpen className="h-5 w-5" />
                                <span className="font-medium">アセットライブラリから選択</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
