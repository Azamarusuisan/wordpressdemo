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
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    const template = SECTION_TEMPLATES.find(t => t.type === section.type);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-2xl border transition-all duration-300 ${isSelected
                ? 'border-indigo-500/50 bg-indigo-50/10 ring-4 ring-indigo-500/10 shadow-xl z-10 scale-[1.01]'
                : 'border-transparent bg-white shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'
                }`}
        >
            <div className="flex items-start gap-4 p-5">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-3 cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-600 transition-colors bg-gray-50/50 hover:bg-indigo-50 p-2 rounded-lg"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 min-w-0" onClick={() => onSelect(section.id)}>
                    <div className="flex items-center gap-4 mb-4 cursor-pointer">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-white text-2xl border border-gray-100 text-gray-400 shadow-sm group-hover:text-indigo-600 group-hover:from-indigo-50 group-hover:to-white group-hover:border-indigo-100/50 transition-all duration-300">
                            {template?.icon || '📄'}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight tracking-tight">{section.name}</h3>
                            <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-wider">{template?.description || section.type}</p>
                        </div>
                    </div>

                    {/* Mini Preview */}
                    <div
                        className="rounded-xl border border-gray-100 overflow-hidden cursor-pointer transition-colors group-hover:border-indigo-200/50 bg-gray-50/30"
                        style={{
                            backgroundColor: section.properties.backgroundColor || '#ffffff',
                            color: section.properties.textColor || '#000000',
                        }}
                    >
                        <div className="p-6 opacity-90 scale-[0.98] origin-top-left w-full">
                            <h2 className="text-lg font-bold mb-2 line-clamp-1 leading-tight tracking-tight">{section.properties.title || 'Untitled Section'}</h2>
                            {section.properties.subtitle && (
                                <h3 className="text-xs font-medium opacity-70 mb-2 line-clamp-1">{section.properties.subtitle}</h3>
                            )}
                            <p className="text-xs opacity-60 line-clamp-2 leading-relaxed max-w-full font-medium">
                                {section.properties.description || 'No content description.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(section.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete section"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Active Indicator Bar */}
            {isSelected && (
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500/50"></div>
            )}
        </div>
    );
}
