"use client";

import { Sidebar } from '@/components/admin/Sidebar';
import { SWRProvider } from '@/components/providers/SWRProvider';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SWRProvider>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </SWRProvider>
    );
}
