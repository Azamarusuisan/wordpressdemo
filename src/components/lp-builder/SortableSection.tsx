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
            className={`group relative rounded-xl border transition-all duration-300 ${isSelected
                ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-xl z-10'
                : 'border-transparent bg-white shadow-sm hover:shadow-lg hover:shadow-indigo-500/5'
                }`}
        >
            <div className="flex items-start gap-4 p-4 lg:p-5">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-md"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </button>

                <div className="flex-1 min-w-0" onClick={() => onSelect(section.id)}>
                    <div className="flex items-center gap-3 mb-4 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-xl border border-gray-100 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all duration-300">
                            {template?.icon || '📄'}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight">{section.name}</h3>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wide">{template?.description || section.type}</p>
                        </div>
                    </div>

                    {/* Mini Preview */}
                    <div
                        className="rounded-lg border border-gray-100 overflow-hidden cursor-pointer transition-colors group-hover:border-indigo-100"
                        style={{
                            backgroundColor: section.properties.backgroundColor || '#ffffff',
                            color: section.properties.textColor || '#000000',
                        }}
                    >
                        <div className="p-6 opacity-90 scale-95 origin-top-left w-full">
                            <h2 className="text-lg font-bold mb-2 line-clamp-1 leading-tight">{section.properties.title || 'Untitled Section'}</h2>
                            {section.properties.subtitle && (
                                <h3 className="text-xs font-medium opacity-70 mb-2 line-clamp-1">{section.properties.subtitle}</h3>
                            )}
                            <p className="text-xs opacity-60 line-clamp-2 leading-relaxed max-w-full">
                                {section.properties.description || 'No content description.'}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(section.id);
                    }}
                    className="mt-2 opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete section"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Active Indicator Bar */}
            {isSelected && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full"></div>
            )}
        </div>
    );
}
