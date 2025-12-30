"use client";

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
    children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                // グローバル設定
                fetcher: (url: string) => fetch(url).then(res => res.json()),
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
                dedupingInterval: 60000,
                keepPreviousData: true,
                // エラー時のリトライ設定
                errorRetryCount: 2,
                errorRetryInterval: 5000,
                // キャッシュプロバイダー（メモリキャッシュ）
                provider: () => new Map(),
            }}
        >
            {children}
        </SWRConfig>
    );
}
