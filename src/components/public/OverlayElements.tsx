"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface OverlayItem {
    id: string;
    type: 'image' | 'lottie' | 'text';
    url?: string;
    text?: string;
    x: number;
    y: number;
    width: number;
    height?: number;
    fontSize?: number;
    fontColor?: string;
    fontWeight?: string;
    link?: string;
}

interface OverlayElementsProps {
    overlays: OverlayItem[];
}

// Lottieアニメーション用コンポーネント
function LottiePlayer({ url, className }: { url: string; className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // lottie-webを動的にロード
        import('lottie-web').then((lottie) => {
            if (!containerRef.current) return;

            const animation = lottie.default.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: url,
            });

            return () => {
                animation.destroy();
            };
        }).catch(console.error);
    }, [url]);

    return <div ref={containerRef} className={className} />;
}

export function OverlayElements({ overlays }: OverlayElementsProps) {
    return (
        <>
            {overlays.map((overlay) => {
                const style: React.CSSProperties = {
                    position: 'absolute',
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    width: `${overlay.width}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                };

                // テキストオーバーレイ
                if (overlay.type === 'text') {
                    const textStyle: React.CSSProperties = {
                        ...style,
                        fontSize: `${overlay.fontSize || 16}px`,
                        color: overlay.fontColor || '#ffffff',
                        fontWeight: overlay.fontWeight || 'normal',
                        textAlign: 'center',
                        whiteSpace: 'pre-wrap',
                    };

                    const content = (
                        <div style={textStyle}>
                            {overlay.text}
                        </div>
                    );

                    if (overlay.link) {
                        return (
                            <Link
                                key={overlay.id}
                                href={overlay.link}
                                target={overlay.link.startsWith('http') ? '_blank' : undefined}
                                rel={overlay.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            >
                                {content}
                            </Link>
                        );
                    }
                    return <div key={overlay.id}>{content}</div>;
                }

                // Lottieアニメーション
                if (overlay.type === 'lottie' && overlay.url) {
                    const content = (
                        <div style={style}>
                            <LottiePlayer
                                url={overlay.url}
                                className="w-full h-full"
                            />
                        </div>
                    );

                    if (overlay.link) {
                        return (
                            <Link
                                key={overlay.id}
                                href={overlay.link}
                                target={overlay.link.startsWith('http') ? '_blank' : undefined}
                                rel={overlay.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            >
                                {content}
                            </Link>
                        );
                    }
                    return <div key={overlay.id}>{content}</div>;
                }

                // 画像オーバーレイ
                if (overlay.type === 'image' && overlay.url) {
                    const content = (
                        <div style={style}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={overlay.url}
                                alt=""
                                className="w-full h-auto"
                                style={overlay.height ? { height: `${overlay.height}%` } : undefined}
                            />
                        </div>
                    );

                    if (overlay.link) {
                        return (
                            <Link
                                key={overlay.id}
                                href={overlay.link}
                                target={overlay.link.startsWith('http') ? '_blank' : undefined}
                                rel={overlay.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                className="block hover:opacity-90 transition-opacity"
                            >
                                {content}
                            </Link>
                        );
                    }
                    return <div key={overlay.id}>{content}</div>;
                }

                return null;
            })}
        </>
    );
}
