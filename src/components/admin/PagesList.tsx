'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageCard } from './PageCard';
import type { PageListItem } from '@/types';

interface PagesListProps {
    initialPages: PageListItem[];
}

export function PagesList({ initialPages }: PagesListProps) {
    const [pages, setPages] = useState<PageListItem[]>(initialPages);

    const handleDelete = (id: number) => {
        setPages((prev) => prev.filter((page) => page.id !== id));
    };

    const handleToggleFavorite = (id: number, isFavorite: boolean) => {
        setPages((prev) =>
            prev.map((page) => (page.id === id ? { ...page, isFavorite } : page))
        );
    };

    // Sort pages: favorites first, then by updatedAt
    const sortedPages = [...pages].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
            return a.isFavorite ? -1 : 1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    if (pages.length === 0) {
        return (
            <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-50/50">
                <div className="mb-4 rounded-full bg-surface-100 p-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-bold text-muted-foreground text-lg">
                    <span>No pages yet</span>
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                    <span>Create your first page from the button above.</span>
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPages.map((page) => (
                <PageCard
                    key={page.id}
                    page={page}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                />
            ))}
        </div>
    );
}
