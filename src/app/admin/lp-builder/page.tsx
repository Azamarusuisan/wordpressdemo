"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, Eye, Trash2, GripVertical, Plus, Maximize2, X, FolderOpen, FileText, ChevronDown, Sparkles, Layout, Settings, Type, ExternalLink } from 'lucide-react';
import { GeminiGeneratorModal } from '@/components/lp-builder/GeminiGeneratorModal';

const SECTION_TEMPLATES = [
    { type: 'hero', name: 'ヒーロー', icon: '🎯', description: 'メインビジュアル' },
    { type: 'features', name: '特徴', icon: '✨', description: '製品の特徴' },
    { type: 'pricing', name: '料金', icon: '💰', description: '価格プラン' },
    { type: 'faq', name: 'FAQ', icon: '❓', description: 'よくある質問' },
    { type: 'cta', name: 'CTA', icon: '🚀', description: '行動喚起' },
    { type: 'testimonials', name: 'お客様の声', icon: '💬', description: 'レビュー' },
];

interface Section {
    id: string;
    type: string;
    name: string;
    properties: {
        title?: string;
        subtitle?: string;
        description?: string;
        image?: string;
        backgroundColor?: string;
        textColor?: string;
        [key: string]: any;
    };
    imageId?: number | null;
}

interface ExistingPage {
    id: number;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    sections: any[];
}

interface SortableSectionProps {
    section: Section;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
}

function SortableSection({ section, onSelect, onDelete, isSelected }: SortableSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const template = SECTION_TEMPLATES.find(t => t.type === section.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-2xl border-2 transition-all duration-200 ${isSelected
                ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
        >
            <div className="flex items-center gap-4 p-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                <button
                    onClick={() => onSelect(section.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-md">
                        {template?.icon || '📄'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900">{section.name}</h3>
                        <p className="text-xs text-gray-500">{template?.description || section.type}</p>
                    </div>
                </button>

                <button
                    onClick={() => onDelete(section.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div
                className="px-4 pb-4"
                style={{
                    backgroundColor: section.properties.backgroundColor || '#ffffff',
                    color: section.properties.textColor || '#000000',
                }}
            >
                <div className="rounded-xl border border-gray-200 bg-white/50 p-6 backdrop-blur-sm">
                    {section.properties.title && (
                        <h2 className="text-xl font-bold mb-2">{section.properties.title}</h2>
                    )}
                    {section.properties.subtitle && (
                        <h3 className="text-sm font-medium text-gray-600 mb-2">{section.properties.subtitle}</h3>
                    )}
                    {section.properties.description && (
                        <p className="text-sm text-gray-500">{section.properties.description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function DroppableTemplate({ template, onAdd }: { template: typeof SECTION_TEMPLATES[0]; onAdd: () => void }) {
    return (
        <button
            onClick={onAdd}
            className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl shadow-sm group-hover:from-blue-500 group-hover:to-purple-600 transition-all">
                {template.icon}
            </div>
            <div className="text-center">
                <p className="text-sm font-bold text-gray-900">{template.name}</p>
                <p className="text-xs text-gray-500">{template.description}</p>
            </div>
            <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>
    );
}

export default function LPBuilderPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showPageSelector, setShowPageSelector] = useState(false);
    const [existingPages, setExistingPages] = useState<ExistingPage[]>([]);
    const [currentPageId, setCurrentPageId] = useState<number | null>(null);
    const [currentPageTitle, setCurrentPageTitle] = useState<string>('新規LP');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 既存ページ一覧を取得
    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await fetch('/api/lp-builder');
            const data = await res.json();
            if (data.pages) {
                setExistingPages(data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch pages:', error);
        }
    };

    // 既存ページを読み込む
    const loadPage = async (page: ExistingPage) => {
        setIsLoading(true);
        try {
            const loadedSections: Section[] = page.sections.map((s: any, idx: number) => {
                let config: any = {};
                try {
                    config = s.config ? JSON.parse(s.config) : {};
                } catch { }

                return {
                    id: `section-${s.id || idx}`,
                    type: config.type || s.role || 'custom',
                    name: config.name || SECTION_TEMPLATES.find(t => t.type === (config.type || s.role))?.name || s.role,
                    properties: config.properties || {
                        title: '',
                        subtitle: '',
                        description: '',
                        backgroundColor: '#ffffff',
                        textColor: '#000000',
                    },
                    imageId: s.image?.id || null,
                };
            });

            setSections(loadedSections);
            setCurrentPageId(page.id);
            setCurrentPageTitle(page.title);
            setShowPageSelector(false);
        } catch (error) {
            console.error('Failed to load page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 新規作成
    const createNew = () => {
        setSections([]);
        setCurrentPageId(null);
        setCurrentPageTitle('新規LP');
        setShowPageSelector(false);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }

        setActiveId(null);
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const addSection = (type: string) => {
        const template = SECTION_TEMPLATES.find(t => t.type === type);
        if (!template) return;

        const newSection: Section = {
            id: `section-${Date.now()}`,
            type: template.type,
            name: template.name,
            properties: {
                title: `${template.name}セクション`,
                subtitle: '',
                description: '',
                backgroundColor: '#ffffff',
                textColor: '#000000',
            },
        };

        setSections((prev) => [...prev, newSection]);
        setSelectedSectionId(newSection.id);
    };

    const deleteSection = (id: string) => {
        setSections((prev) => prev.filter((s) => s.id !== id));
        if (selectedSectionId === id) {
            setSelectedSectionId(null);
        }
    };

    const updateSectionProperty = (id: string, key: keyof Section['properties'], value: string) => {
        setSections((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, properties: { ...s.properties, [key]: value } }
                    : s
            )
        );
    };

    // Gemini AI生成結果を適用
    const handleGeminiGenerated = (generatedSections: any[]) => {
        const newSections = generatedSections.map((s: any, idx: number) => ({
            id: `section-${Date.now()}-${idx}`,
            type: s.type,
            name: SECTION_TEMPLATES.find(t => t.type === s.type)?.name || s.type,
            properties: {
                ...s.properties,
            },
            imageId: s.imageId || null, // 生成された画像IDを保持
        }));

        setSections((prev) => [...prev, ...newSections]);

        if (newSections.length > 0) {
            setSelectedSectionId(newSections[0].id);
        }
        setIsGeminiModalOpen(false);
    };

    const selectedSection = sections.find((s) => s.id === selectedSectionId);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/lp-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId: currentPageId,
                    title: currentPageTitle,
                    sections: sections,
                }),
            });

            const data = await res.json();
            if (data.success) {
                if (!currentPageId && data.pageId) {
                    setCurrentPageId(data.pageId);
                }
                await fetchPages();
                alert('保存しました！');
            } else {
                alert('保存に失敗しました: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Top Bar */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black tracking-tight text-gray-900">ZettAI LP Builder</h1>
                    <div className="h-4 w-px bg-gray-200" />

                    {/* Page Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPageSelector(!showPageSelector)}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                        >
                            <FileText className="h-4 w-4" />
                            {currentPageTitle}
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        {showPageSelector && (
                            <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl z-50">
                                <div className="p-4 border-b border-gray-100">
                                    <button
                                        onClick={createNew}
                                        className="w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all"
                                    >
                                        <Plus className="h-5 w-5" />
                                        新規LPを作成
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2">
                                    <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                                        既存のLP
                                    </div>
                                    {existingPages.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                                            まだLPがありません
                                        </div>
                                    ) : (
                                        existingPages.map((page) => (
                                            <button
                                                key={page.id}
                                                onClick={() => loadPage(page)}
                                                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-gray-50 ${currentPageId === page.id ? 'bg-blue-50 border border-blue-200' : ''
                                                    }`}
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
                                                    📄
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="font-bold text-gray-900 truncate">{page.title}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {page.sections.length}セクション • {new Date(page.updatedAt).toLocaleDateString('ja-JP')}
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${page.status === 'published'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {page.status === 'published' ? '公開' : '下書き'}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Edit Title */}
                    <input
                        type="text"
                        value={currentPageTitle}
                        onChange={(e) => setCurrentPageTitle(e.target.value)}
                        className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-gray-700 hover:border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        placeholder="LP名を入力"
                    />
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/lp-builder"
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                    >
                        <Layout className="h-4 w-4" />
                        紹介ページ
                    </Link>
                    {currentPageId && (
                        <a
                            href={`/p/${existingPages.find(p => p.id === currentPageId)?.slug || currentPageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                        >
                            <ExternalLink className="h-4 w-4" />
                            公開ページ
                        </a>
                    )}
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300"
                    >
                        <Eye className="h-4 w-4" />
                        プレビュー
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || sections.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Section Templates */}
                {sections.length > 0 && (
                    <div className="w-80 border-r border-gray-100 bg-white flex flex-col pt-8 pb-6 px-6 overflow-hidden">
                        {/* Sidebar Header */}
                        <div className="mb-10 px-2 transition-all hover:scale-[1.02] cursor-default">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-2 w-8 bg-yellow-400 rounded-full" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Builder</h2>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">ZettAI <span className="text-blue-600">.</span></h1>
                        </div>

                        {/* Gemini Generation Section - Top Tier */}
                        <div className="mb-10">
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: '#4f46e5' }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 p-4 text-sm font-black text-white shadow-xl shadow-indigo-100 transition-all group"
                                onClick={() => setIsGeminiModalOpen(true)}
                            >
                                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                AIで一括作成
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            <div className="mb-6 flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="sidebar-indicator w-1 h-4 bg-cyan-400 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800">セクション</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {SECTION_TEMPLATES.map((template) => (
                                    <DroppableTemplate
                                        key={template.type}
                                        template={template}
                                        onAdd={() => addSection(template.type)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                Riverside

                {/* Center - Canvas Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-4xl">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-16 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                                <p className="text-sm text-gray-500">読み込み中...</p>
                            </div>
                        ) : sections.length === 0 ? (
                            <div className="relative flex flex-col items-center justify-center min-h-[75vh] px-4 overflow-hidden rounded-[64px]">
                                {/* Background Decorative Elements */}
                                <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-100/30 rounded-full blur-[100px] -z-10 animate-pulse" />
                                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-pink-100/30 rounded-full blur-[100px] -z-10 animate-pulse" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] -z-10" />

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="text-center mb-12 relative z-10"
                                >
                                    <h3 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
                                        ページ作成を<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">魔法のように</span>
                                    </h3>
                                    <p className="text-slate-400 text-lg font-medium">
                                        あなたのビジョンに合わせた最適な方法を選択してください
                                    </p>
                                </motion.div>

                                {/* Scrollable Container for Cards */}
                                <div className="w-full overflow-x-auto pb-12 custom-scrollbar relative z-10 flex justify-center">
                                    <div className="flex flex-row gap-6 px-8 min-w-max">
                                        {/* AI Magic Card */}
                                        <motion.button
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsGeminiModalOpen(true)}
                                            className="w-[320px] group relative flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_20px_48px_0_rgba(99,102,241,0.15)] transition-all duration-500"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <div className="relative p-5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                                                    <Sparkles className="h-8 w-8 text-white" />
                                                </div>
                                            </div>

                                            <div className="relative text-center">
                                                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">AIでおまかせ</h4>
                                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                                    あなたのビジネスを理解し、<br />
                                                    <span className="text-indigo-600 font-bold text-[14px]">最高の結果を出すコピー</span>を<br />
                                                    一瞬で生成します。
                                                </p>
                                            </div>

                                            <div className="relative mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs shadow-lg group-hover:shadow-indigo-200 group-hover:bg-indigo-600 transition-all">
                                                作成をはじめる
                                            </div>
                                        </motion.button>

                                        {/* Manual Creation Card */}
                                        <motion.button
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                const sidebar = document.querySelector('.sidebar-indicator');
                                                sidebar?.classList.add('animate-bounce');
                                                setTimeout(() => sidebar?.classList.remove('animate-bounce'), 2000);
                                            }}
                                            className="w-[320px] group relative flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_20px_48px_0_rgba(59,130,246,0.15)] transition-all duration-500"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/50 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <div className="relative p-5 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-2xl shadow-xl transform group-hover:-rotate-6 transition-transform duration-500">
                                                    <Plus className="h-8 w-8 text-white" />
                                                </div>
                                            </div>

                                            <div className="relative text-center">
                                                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">パーツで作る</h4>
                                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                                    セクションを自由に組み合わせ、<br />
                                                    <span className="text-blue-600 font-bold text-[14px]">こだわりのデザイン</span>を<br />
                                                    形にします。
                                                </p>
                                            </div>

                                            <div className="relative mt-8 px-6 py-2.5 bg-slate-100 text-slate-900 rounded-full font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                手動で組み立てる
                                            </div>
                                        </motion.button>

                                        {/* Open Project Card */}
                                        <motion.button
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setShowPageSelector(true)}
                                            className="w-[320px] group relative flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[40px] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_20px_48px_0_rgba(100,116,139,0.15)] transition-all duration-500"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-zinc-50/50 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-slate-400 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                                <div className="relative p-5 bg-slate-900 rounded-2xl shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                                                    <FolderOpen className="h-8 w-8 text-white" />
                                                </div>
                                            </div>

                                            <div className="relative text-center">
                                                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">続きを開く</h4>
                                                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                                    保存したプロジェクトを選択し、<br />
                                                    <span className="text-slate-900 font-bold text-[14px]">編集を再開</span>します。
                                                </p>
                                            </div>

                                            <div className="relative mt-8 px-6 py-2.5 bg-white text-slate-400 border border-slate-200 rounded-full font-bold text-xs group-hover:border-slate-900 group-hover:text-slate-900 transition-all">
                                                プロジェクト一覧へ
                                            </div>
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragCancel={handleDragCancel}
                            >
                                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {sections.map((section) => (
                                            <SortableSection
                                                key={section.id}
                                                section={section}
                                                onSelect={setSelectedSectionId}
                                                onDelete={deleteSection}
                                                isSelected={selectedSectionId === section.id}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>

                                <DragOverlay>
                                    {activeId ? (
                                        <div className="rounded-2xl border-2 border-blue-500 bg-white p-4 shadow-2xl opacity-90">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="h-5 w-5 text-gray-400" />
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-md">
                                                    {SECTION_TEMPLATES.find(t => t.type === sections.find(s => s.id === activeId)?.type)?.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900">
                                                        {sections.find(s => s.id === activeId)?.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}

                        {sections.length > 0 && (
                            <div className="mt-8 flex justify-center">
                                <div className="text-xs font-medium text-gray-400">
                                    左のサイドバーから追加のセクションを選択
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                {sections.length > 0 && (
                    <div className="w-96 border-l border-gray-200 bg-white p-6 overflow-y-auto">
                        {selectedSection ? (
                            <>
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Settings className="h-5 w-5 text-gray-700" />
                                        <h2 className="text-lg font-bold text-gray-900">プロパティ</h2>
                                    </div>
                                    <p className="text-xs text-gray-500">選択したセクションの設定</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            セクション名
                                        </label>
                                        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-xl">
                                                {SECTION_TEMPLATES.find(t => t.type === selectedSection.type)?.icon || '📄'}
                                            </div>
                                            <span className="font-bold text-gray-900">{selectedSection.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            <Type className="inline h-3 w-3 mr-1" />
                                            タイトル
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedSection.properties.title || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'title', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                            placeholder="セクションのタイトル"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            サブタイトル
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedSection.properties.subtitle || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'subtitle', e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                            placeholder="サブタイトル（オプション）"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            説明文
                                        </label>
                                        <textarea
                                            value={selectedSection.properties.description || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'description', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 resize-none"
                                            placeholder="セクションの説明文"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            背景色
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                value={selectedSection.properties.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'backgroundColor', e.target.value)}
                                                className="h-12 w-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={selectedSection.properties.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'backgroundColor', e.target.value)}
                                                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-400">
                                            文字色
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                type="color"
                                                value={selectedSection.properties.textColor || '#000000'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'textColor', e.target.value)}
                                                className="h-12 w-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={selectedSection.properties.textColor || '#000000'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'textColor', e.target.value)}
                                                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-mono outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => deleteSection(selectedSection.id)}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            セクションを削除
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                                    👈
                                </div>
                                <h3 className="mb-2 text-base font-bold text-gray-900">セクションを選択</h3>
                                <p className="text-sm text-gray-500">
                                    編集するセクションをクリックしてください
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="relative h-full w-full max-w-6xl overflow-hidden rounded-[40px] bg-white shadow-2xl border-4 border-slate-900"
                        >
                            <div className="flex items-center justify-between border-b-4 border-slate-900 bg-white px-8 py-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-slate-900">PREVIEW</h2>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="rounded-full bg-slate-100 p-3 text-slate-900 hover:bg-red-100 hover:text-red-600 transition-all border-2 border-slate-900"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="h-[calc(100%-80px)] overflow-y-auto">
                                {sections.map((section) => (
                                    <div
                                        key={section.id}
                                        className="p-12"
                                        style={{
                                            backgroundColor: section.properties.backgroundColor,
                                            color: section.properties.textColor,
                                        }}
                                    >
                                        <div className="mx-auto max-w-4xl">
                                            {section.properties.title && (
                                                <h2 className="mb-4 text-5xl font-black tracking-tight">{section.properties.title}</h2>
                                            )}
                                            {section.properties.subtitle && (
                                                <h3 className="mb-6 text-2xl font-bold opacity-80">{section.properties.subtitle}</h3>
                                            )}
                                            {section.properties.description && (
                                                <p className="text-xl leading-relaxed opacity-90">{section.properties.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close page selector */}
            {showPageSelector && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
                    onClick={() => setShowPageSelector(false)}
                />
            )}

            {/* Gemini Generator Modal */}
            <GeminiGeneratorModal
                isOpen={isGeminiModalOpen}
                onClose={() => setIsGeminiModalOpen(false)}
                onGenerated={handleGeminiGenerated}
            />
        </div>
    );
}
