"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DailyData {
    date: string;
    count: number;
    cost: number;
    errors: number;
}

export function DailyUsageChart({ data }: { data: DailyData[] }) {
    const formattedData = data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        cost: Number(d.cost.toFixed(4))
    }));

    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Daily API Usage
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            stroke="#9ca3af"
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => {
                                if (name === 'count') return [value, 'API Calls'];
                                if (name === 'cost') return [`$${value.toFixed(4)}`, 'Cost'];
                                return [value, name];
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                            activeDot={{ r: 5 }}
                            name="count"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
