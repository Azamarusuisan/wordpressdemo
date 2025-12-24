"use client";

import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'red' | 'gray' | 'amber';
    subValue?: string;
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
    amber: 'bg-amber-50 text-amber-600'
};

export function StatCard({ title, value, icon: Icon, color, subValue }: StatCardProps) {
    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={clsx('rounded-xl p-3', colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            {subValue && (
                <p className="text-xs text-gray-500 mt-2">{subValue}</p>
            )}
        </div>
    );
}
