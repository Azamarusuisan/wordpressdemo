"use client";

interface VideoConfig {
    url: string;
    type?: 'youtube' | 'upload' | 'generated';
    displayMode?: 'full' | 'partial';
    x?: number;
    y?: number;
    width?: number;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
}

interface VideoPlayerProps {
    video: VideoConfig;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
    const isYouTube = video.type === 'youtube' || video.url?.includes('youtube.com') || video.url?.includes('youtu.be');
    const isPartial = video.displayMode === 'partial';

    // YouTube URLをembed形式に変換
    const getYouTubeEmbedUrl = (url: string) => {
        let videoId = '';

        if (url.includes('youtube.com/watch')) {
            const urlParams = new URL(url).searchParams;
            videoId = urlParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
        }

        if (!videoId) return url;

        const params = new URLSearchParams();
        if (video.autoplay) params.set('autoplay', '1');
        if (video.loop) params.set('loop', '1');
        if (video.muted) params.set('mute', '1');

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    };

    // 部分配置（位置・サイズ指定あり）
    if (isPartial) {
        return (
            <div
                className="absolute z-30"
                style={{
                    left: `${video.x || 50}%`,
                    top: `${video.y || 50}%`,
                    width: `${video.width || 40}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div className="rounded-lg overflow-hidden shadow-2xl">
                    {isYouTube ? (
                        <iframe
                            src={getYouTubeEmbedUrl(video.url)}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={video.url}
                            controls
                            className="w-full"
                            autoPlay={video.autoplay}
                            loop={video.loop}
                            muted={video.muted}
                            playsInline
                        />
                    )}
                </div>
            </div>
        );
    }

    // 全画面オーバーレイ
    return (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-center justify-center">
            {isYouTube ? (
                <iframe
                    src={getYouTubeEmbedUrl(video.url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <video
                    src={video.url}
                    controls
                    className="max-w-full max-h-full"
                    autoPlay={video.autoplay}
                    loop={video.loop}
                    muted={video.muted}
                    playsInline
                />
            )}
        </div>
    );
}
