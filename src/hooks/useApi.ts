'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ApiRequestOptions<T> {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    showToast?: boolean;
}

interface UseApiReturn<T> {
    execute: (options: ApiRequestOptions<T>) => Promise<T | null>;
    loading: boolean;
    error: string | null;
    data: T | null;
}

export function useApi<T = unknown>(): UseApiReturn<T> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async ({
        endpoint,
        method = 'GET',
        body,
        successMessage,
        errorMessage = 'エラーが発生しました',
        onSuccess,
        onError,
        showToast = true,
    }: ApiRequestOptions<T>): Promise<T | null> => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(endpoint, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.error || errorMessage);
            }

            setData(responseData);

            if (showToast && successMessage) {
                toast.success(successMessage);
            }

            onSuccess?.(responseData);
            return responseData;
        } catch (err) {
            const message = err instanceof Error ? err.message : errorMessage;
            setError(message);

            if (showToast) {
                toast.error(message);
            }

            onError?.(err instanceof Error ? err : new Error(message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { execute, loading, error, data };
}

// Convenience hooks for common operations
export function useApiMutation<T = unknown>() {
    return useApi<T>();
}

export function useApiGet<T = unknown>() {
    const api = useApi<T>();

    const get = useCallback((endpoint: string, options?: Omit<ApiRequestOptions<T>, 'endpoint' | 'method'>) => {
        return api.execute({ endpoint, method: 'GET', showToast: false, ...options });
    }, [api]);

    return { ...api, get };
}

export function useApiPost<T = unknown>() {
    const api = useApi<T>();

    const post = useCallback((
        endpoint: string,
        body: Record<string, unknown>,
        options?: Omit<ApiRequestOptions<T>, 'endpoint' | 'method' | 'body'>
    ) => {
        return api.execute({ endpoint, method: 'POST', body, ...options });
    }, [api]);

    return { ...api, post };
}
