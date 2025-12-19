"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Images, Settings, LogOut, FileText, Navigation } from 'lucide-react';
import clsx from 'clsx';
import { logout } from '@/lib/auth';

const navItems = [
    { name: 'ページ一覧', href: '/admin/pages', icon: FileText },
    { name: 'メディア', href: '/admin/media', icon: Images },
    { name: '設定', href: '/admin/settings', icon: Settings },
    { name: 'ナビ', href: '/admin/navigation', icon: Navigation },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="flex h-20 items-center px-8">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-200" />
                    <span className="text-xl font-black tracking-tight text-gray-900">LP Builder</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-4 py-4">
                <div className="mb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">メインメニュー</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <Icon className={clsx(
                                'h-5 w-5 transition-transform group-hover:scale-110',
                                isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-50 p-6">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-b from-gray-200 to-gray-300 ring-2 ring-white" />
                    <div className="flex-1 overflow-hidden">
                        <div className="truncate text-xs font-bold text-gray-900">Admin User</div>
                        <div className="truncate text-[10px] text-gray-500">Premium Plan</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
