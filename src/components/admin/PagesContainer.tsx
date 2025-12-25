'use client';

import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { PageCard } from './PageCard';
import type { PageListItem } from '@/types';

interface PagesContainerProps {
    initialPages: PageListItem[];
    headerContent: React.ReactNode;
}

export function PagesContainer({ initialPages, headerContent }: PagesContainerProps) {
    const [pages, setPages] = useState<PageListItem[]>(initialPages);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const handleDelete = (id: number) => {
        setPages((prev) => prev.filter((page) => page.id !== id));
    };

    const handleToggleFavorite = (id: number, isFavorite: boolean) => {
        setPages((prev) =>
            prev.map((page) => (page.id === id ? { ...page, isFavorite } : page))
        );
    };

    // Sort and filter pages
    const sortedPages = [...pages].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
            return a.isFavorite ? -1 : 1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const displayPages = showFavoritesOnly
        ? sortedPages.filter((page) => page.isFavorite)
        : sortedPages;

    const favoriteCount = pages.filter((page) => page.isFavorite).length;

    return (
        <>
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        <span>Pages</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        <span>Manage your landing pages.</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98] ${
                            showFavoritesOnly
                                ? 'bg-yellow-400 text-white shadow-sm hover:bg-yellow-500'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                    >
                        <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                        <span>{showFavoritesOnly ? 'All' : 'Favorites'}</span>
                        {favoriteCount > 0 && !showFavoritesOnly && (
                            <span className="ml-1 rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {favoriteCount}
                            </span>
                        )}
                    </button>
                    {headerContent}
                </div>
            </div>

            {displayPages.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-50/50">
                    <div className="mb-4 rounded-full bg-surface-100 p-4">
                        {showFavoritesOnly ? (
                            <Star className="h-8 w-8 text-muted-foreground" />
                        ) : (
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <p className="font-bold text-muted-foreground text-lg">
                        <span>{showFavoritesOnly ? 'No favorite pages' : 'No pages yet'}</span>
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                        <span>
                            {showFavoritesOnly
                                ? 'Star a page to add it to your favorites.'
                                : 'Create your first page from the button above.'}
                        </span>
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayPages.map((page) => (
                        <PageCard
                            key={page.id}
                            page={page}
                            onDelete={handleDelete}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
