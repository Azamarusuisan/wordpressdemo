'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
    return (
        <HotToaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1f2937',
                    color: '#f9fafb',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#f9fafb',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#f9fafb',
                    },
                    duration: 5000,
                },
            }}
        />
    );
}
