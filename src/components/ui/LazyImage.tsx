"use client";

import React, { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
}

// Intersection Observerを使った遅延ロード画像コンポーネント
export const LazyImage = memo(function LazyImage({
    src,
    alt,
    className = '',
    placeholderClassName = 'bg-gray-100 animate-pulse',
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '100px', // 100px手前からロード開始
                threshold: 0,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className="relative h-full w-full">
            {/* プレースホルダー */}
            {!isLoaded && (
                <div className={`absolute inset-0 ${placeholderClassName}`} />
            )}

            {/* 実際の画像（ビューポート内のみロード） */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                    onLoad={() => setIsLoaded(true)}
                    loading="lazy"
                    decoding="async"
                />
            )}
        </div>
    );
});

// 複数画像のプリロード用ユーティリティ
export function preloadImages(urls: string[]): void {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}
