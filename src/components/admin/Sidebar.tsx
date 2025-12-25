"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Images, Settings, LogOut, FileText, Navigation, Crown, History, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
    { name: 'Pages', href: '/admin/pages', icon: FileText },
    { name: 'Media', href: '/admin/media', icon: Images },
    { name: 'API Usage', href: '/admin/api-usage', icon: BarChart3 },
    { name: 'History', href: '/admin/import-history', icon: History },
    { name: 'Navigation', href: '/admin/navigation', icon: Navigation },
    { name: 'Builder', href: '/admin/lp-builder', icon: LayoutDashboard },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [plan, setPlan] = useState<'normal' | 'premium'>('normal');

    useEffect(() => {
        const supabase = createClient();

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const fetchPlan = async () => {
            try {
                const res = await fetch('/api/user/settings');
                const data = await res.json();
                setPlan(data.plan || 'normal');
            } catch (e) {
                console.error('Failed to fetch plan', e);
            }
        };
        fetchPlan();
    }, []);

    return (
        <div className="flex h-screen w-64 flex-col border-r border-border bg-background">
            <div className="flex h-16 items-center px-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-primary rounded-sm" />
                    <span className="text-lg font-bold tracking-tight text-foreground">LP Builder</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
                <div className="mb-4 px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Menu</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                                isActive
                                    ? 'bg-primary/5 text-primary'
                                    : 'text-muted-foreground hover:bg-surface-100 hover:text-foreground'
                            )}
                        >
                            <Icon className={clsx(
                                'h-4 w-4 transition-colors',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 rounded-md border border-border bg-surface-50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="truncate text-xs font-bold text-foreground">
                            {user?.email?.split('@')[0] || 'Admin User'}
                        </div>
                        <div className={clsx(
                            "truncate text-[10px] font-medium flex items-center gap-1",
                            plan === 'premium' ? "text-primary" : "text-muted-foreground"
                        )}>
                            {plan === 'premium' && <Crown className="h-3 w-3" />}
                            {plan === 'premium' ? 'Premium' : 'Standard'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
