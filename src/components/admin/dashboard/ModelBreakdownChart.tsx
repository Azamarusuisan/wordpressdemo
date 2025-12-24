"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Cpu } from 'lucide-react';

interface ModelData {
    model: string;
    count: number;
    cost: number;
    images: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export function ModelBreakdownChart({ data }: { data: ModelData[] }) {
    const formattedData = data.map((d, i) => ({
        name: d.model.replace('gemini-', '').replace('-preview', '').replace('-image-generation', ''),
        calls: d.count,
        cost: Number(d.cost.toFixed(4)),
        images: d.images || 0,
        color: COLORS[i % COLORS.length]
    }));

    return (
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                Usage by Model
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 10 }}
                            width={100}
                            stroke="#9ca3af"
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => {
                                if (name === 'calls') return [value, 'API Calls'];
                                if (name === 'cost') return [`$${value.toFixed(4)}`, 'Cost'];
                                return [value, name];
                            }}
                        />
                        <Bar dataKey="calls" radius={[0, 4, 4, 0]} name="calls">
                            {formattedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
