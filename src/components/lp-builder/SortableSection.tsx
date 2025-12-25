'use client';

import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LPSection } from '@/types';
import { SECTION_TEMPLATES } from './constants';

interface SortableSectionProps {
    section: LPSection;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
}

export function SortableSection({ section, onSelect, onDelete, isSelected }: SortableSectionProps) {
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
