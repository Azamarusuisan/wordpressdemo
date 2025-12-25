"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, Eye, Trash2, GripVertical, Plus, Maximize2, X, FolderOpen, FileText, ChevronDown, Sparkles, Layout, Settings, Type, ExternalLink, Box } from 'lucide-react';
import { GeminiGeneratorModal } from '@/components/lp-builder/GeminiGeneratorModal';

const SECTION_TEMPLATES = [
    { type: 'hero', name: 'ヒーロー', icon: '🎯', description: 'メインビジュアルエリア' },
    { type: 'features', name: '特徴', icon: '✨', description: '製品の特徴' },
    { type: 'pricing', name: '価格', icon: '💰', description: '料金プラン' },
    { type: 'faq', name: 'FAQ', icon: '❓', description: 'よくある質問' },
    { type: 'cta', name: 'CTA', icon: '🚀', description: '行動喚起' },
    { type: 'testimonials', name: 'お客様の声', icon: '💬', description: 'ユーザーレビュー' },
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
            className={`group relative rounded-sm border transition-all duration-200 ${isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:border-primary/50'
                }`}
        >
            <div className="flex items-center gap-4 p-4">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                <button
                    onClick={() => onSelect(section.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-100 text-xl border border-border">
                        {template?.icon || '📄'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground">{section.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{template?.description || section.type}</p>
                    </div>
                </button>

                <button
                    onClick={() => onDelete(section.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-sm p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all"
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
                <div className="rounded-sm border border-border/50 bg-background/50 p-6 backdrop-blur-sm">
                    {section.properties.title && (
                        <h2 className="text-xl font-bold mb-2">{section.properties.title}</h2>
                    )}
                    {section.properties.subtitle && (
                        <h3 className="text-sm font-medium opacity-80 mb-2">{section.properties.subtitle}</h3>
                    )}
                    {section.properties.description && (
                        <p className="text-sm opacity-70">{section.properties.description}</p>
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
            className="group flex flex-col items-center gap-2 rounded-sm border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-100 text-xl group-hover:bg-background transition-colors">
                {template.icon}
            </div>
            <div className="text-center w-full">
                <p className="text-xs font-bold text-foreground">{template.name}</p>
            </div>
            <div className="w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="h-4 w-4 text-primary" />
            </div>
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
    const [currentPageTitle, setCurrentPageTitle] = useState<string>('新規ページ');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch existing pages
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

    // Load existing page
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

    // Create new page
    const createNew = () => {
        setSections([]);
        setCurrentPageId(null);
        setCurrentPageTitle('新規ページ');
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
                title: `${template.name} セクション`,
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

    // Apply Gemini Generated Result
    const handleGeminiGenerated = (generatedSections: any[]) => {
        const newSections = generatedSections.map((s: any, idx: number) => ({
            id: `section-${Date.now()}-${idx}`,
            type: s.type,
            name: SECTION_TEMPLATES.find(t => t.type === s.type)?.name || s.type,
            properties: {
                ...s.properties,
            },
            imageId: s.imageId || null,
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
                alert('保存に失敗しました: ' + (data.error || '不明なエラー'));
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Top Bar */}
            <div className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold tracking-tight text-foreground">LP Builder</h1>
                    <div className="h-4 w-px bg-border" />

                    {/* Page Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPageSelector(!showPageSelector)}
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-100 transition-all"
                        >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {currentPageTitle}
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </button>

                        {showPageSelector && (
                            <div className="absolute top-full left-0 mt-2 w-72 rounded-md border border-border bg-background shadow-lg z-50">
                                <div className="p-2 border-b border-border">
                                    <button
                                        onClick={createNew}
                                        className="w-full flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all"
                                    >
                                        <Plus className="h-4 w-4" />
                                        新規ページ作成
                                    </button>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-1">
                                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        既存のページ
                                    </div>
                                    {existingPages.length === 0 ? (
                                        <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                                            ページが見つかりません
                                        </div>
                                    ) : (
                                        existingPages.map((page) => (
                                            <button
                                                key={page.id}
                                                onClick={() => loadPage(page)}
                                                className={`w-full flex items-center gap-3 rounded-sm px-3 py-2 text-left transition-all hover:bg-surface-50 ${currentPageId === page.id ? 'bg-surface-100' : ''
                                                    }`}
                                            >
                                                <div className="text-base">
                                                    📄
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="font-medium text-foreground truncate text-sm">{page.title}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {page.sections.length} セクション • {new Date(page.updatedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${page.status === 'published'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-surface-200 text-muted-foreground'
                                                    }`}>
                                                    {page.status === 'published' ? '公開済' : '下書き'}
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
                        className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-foreground hover:border-border focus:border-primary focus:bg-surface-50 focus:outline-none transition-all"
                        placeholder="ページタイトル"
                    />
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/lp-builder"
                        className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface-50 transition-all"
                    >
                        <Layout className="h-3 w-3" />
                        イントロ
                    </Link>
                    {currentPageId && (
                        <a
                            href={`/p/${existingPages.find(p => p.id === currentPageId)?.slug || currentPageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface-50 transition-all"
                        >
                            <ExternalLink className="h-3 w-3" />
                            公開ページ
                        </a>
                    )}
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-surface-50 transition-all"
                    >
                        <Eye className="h-3 w-3" />
                        プレビュー
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || sections.length === 0}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Save className="h-3 w-3" />
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Section Templates */}
                {sections.length > 0 && (
                    <div className="w-72 border-r border-border bg-background flex flex-col pt-6 pb-6 px-4 overflow-hidden">
                        {/* Gemini Generation Section */}
                        <div className="mb-8">
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-600/10 border border-indigo-600/20 p-3 text-xs font-bold text-indigo-600 hover:bg-indigo-600/20 transition-all group"
                                onClick={() => setIsGeminiModalOpen(true)}
                            >
                                <Sparkles className="h-4 w-4 group-hover:text-indigo-500" />
                                AIでページを生成
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                            <div className="mb-4 flex items-center gap-2 px-1">
                                <Box className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">セクション</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
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

                {/* Center - Canvas Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-surface-50">
                    <div className="mx-auto max-w-4xl">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-background p-16 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-4"></div>
                                <p className="text-xs font-medium text-muted-foreground">読み込み中...</p>
                            </div>
                        ) : sections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center mb-12"
                                >
                                    <h3 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
                                        ページを作成
                                    </h3>
                                    <p className="text-muted-foreground text-lg">
                                        以下のオプションから選択して開始してください。
                                    </p>
                                </motion.div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full px-6">
                                    {/* AI Magic Card */}
                                    <button
                                        onClick={() => setIsGeminiModalOpen(true)}
                                        className="group flex flex-col items-center justify-center p-8 bg-background border border-border hover:border-indigo-500/50 rounded-lg hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                                    >
                                        <div className="mb-6 p-4 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform">
                                            <Sparkles className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-foreground mb-2">AI 生成</h4>
                                        <p className="text-muted-foreground text-xs text-center leading-relaxed mb-6">
                                            ビジネスに合わせたLP構成とコピーを自動生成します。
                                        </p>
                                        <span className="text-xs font-bold text-indigo-600 group-hover:underline">AIで開始</span>
                                    </button>

                                    {/* Manual Creation Card */}
                                    <button
                                        onClick={() => {
                                            const newSection: Section = {
                                                id: `section-${Date.now()}`,
                                                type: 'hero',
                                                name: 'Hero',
                                                properties: {
                                                    title: 'Hero Section',
                                                    subtitle: '',
                                                    description: '',
                                                    backgroundColor: '#ffffff',
                                                    textColor: '#000000',
                                                },
                                            };
                                            setSections([newSection]);
                                            setSelectedSectionId(newSection.id);
                                        }}
                                        className="group flex flex-col items-center justify-center p-8 bg-background border border-border hover:border-blue-500/50 rounded-lg hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                                    >
                                        <div className="mb-6 p-4 bg-blue-50 rounded-full group-hover:scale-110 transition-transform">
                                            <Plus className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-foreground mb-2">空白から作成</h4>
                                        <p className="text-muted-foreground text-xs text-center leading-relaxed mb-6">
                                            ゼロからセクションを組み立てて作成します。
                                        </p>
                                        <span className="text-xs font-bold text-blue-600 group-hover:underline">手動で作成</span>
                                    </button>

                                    {/* Open Project Card */}
                                    <button
                                        onClick={() => setShowPageSelector(true)}
                                        className="group flex flex-col items-center justify-center p-8 bg-background border border-border hover:border-foreground/50 rounded-lg hover:shadow-lg transition-all duration-300"
                                    >
                                        <div className="mb-6 p-4 bg-surface-100 rounded-full group-hover:scale-110 transition-transform">
                                            <FolderOpen className="h-6 w-6 text-foreground" />
                                        </div>
                                        <h4 className="text-lg font-bold text-foreground mb-2">既存を開く</h4>
                                        <p className="text-muted-foreground text-xs text-center leading-relaxed mb-6">
                                            以前保存したプロジェクトを編集します。
                                        </p>
                                        <span className="text-xs font-bold text-foreground group-hover:underline">ページ一覧</span>
                                    </button>
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
                                        <div className="rounded-sm border border-primary bg-background p-4 shadow-xl opacity-90">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-100/50 text-xl">
                                                    {SECTION_TEMPLATES.find(t => t.type === sections.find(s => s.id === activeId)?.type)?.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground">
                                                        {sections.find(s => s.id === activeId)?.name}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                {sections.length > 0 && (
                    <div className="w-80 border-l border-border bg-background p-6 overflow-y-auto">
                        {selectedSection ? (
                            <>
                                <div className="mb-6 border-b border-border pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Settings className="h-4 w-4 text-foreground" />
                                        <h2 className="text-sm font-bold text-foreground">プロパティ</h2>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">選択中のセクションの設定</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            タイプ
                                        </label>
                                        <div className="flex items-center gap-3 rounded-sm bg-surface-50 p-3 border border-border">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-background text-lg border border-border">
                                                {SECTION_TEMPLATES.find(t => t.type === selectedSection.type)?.icon || '📄'}
                                            </div>
                                            <span className="text-sm font-bold text-foreground">{selectedSection.name}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <Type className="inline h-3 w-3 mr-1" />
                                            タイトル
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedSection.properties.title || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'title', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="セクションタイトル"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            サブタイトル
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedSection.properties.subtitle || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'subtitle', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="サブタイトル (任意)"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            説明文
                                        </label>
                                        <textarea
                                            value={selectedSection.properties.description || ''}
                                            onChange={(e) => updateSectionProperty(selectedSection.id, 'description', e.target.value)}
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                                            placeholder="コンテンツの説明"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            背景色
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={selectedSection.properties.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'backgroundColor', e.target.value)}
                                                className="h-9 w-9 rounded-md border border-input cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={selectedSection.properties.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'backgroundColor', e.target.value)}
                                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            文字色
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={selectedSection.properties.textColor || '#000000'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'textColor', e.target.value)}
                                                className="h-9 w-9 rounded-md border border-input cursor-pointer p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={selectedSection.properties.textColor || '#000000'}
                                                onChange={(e) => updateSectionProperty(selectedSection.id, 'textColor', e.target.value)}
                                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-border">
                                        <button
                                            onClick={() => deleteSection(selectedSection.id)}
                                            className="w-full flex items-center justify-center gap-2 rounded-md bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 border border-red-100"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            セクションを削除
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center opacity-50">
                                <Settings className="mb-4 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm font-medium text-muted-foreground">セクションを選択してプロパティを編集</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Gemini Modal */}
            <GeminiGeneratorModal
                isOpen={isGeminiModalOpen}
                onClose={() => setIsGeminiModalOpen(false)}
                onGenerated={handleGeminiGenerated}
            />

            {/* Preview Modal (Simple implementation) */}
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-8"
                    >
                        <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-white shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                                <h3 className="font-bold text-gray-700">プレビュー</h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="rounded-full bg-gray-200 p-2 text-gray-500 hover:bg-gray-300 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-white p-8">
                                <div className="mx-auto max-w-5xl space-y-8">
                                    {sections.map((section) => (
                                        <div
                                            key={section.id}
                                            className="rounded-lg p-12 text-center"
                                            style={{
                                                backgroundColor: section.properties.backgroundColor,
                                                color: section.properties.textColor,
                                            }}
                                        >
                                            <h2 className="text-4xl font-bold mb-4">{section.properties.title}</h2>
                                            <p className="text-xl opacity-80 mb-8">{section.properties.subtitle}</p>
                                            <p className="max-w-2xl mx-auto">{section.properties.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
