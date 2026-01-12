'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, RefreshCw, Shield, Clock, Mail, Zap, Database, FileText, Crown, Ban, AlertTriangle } from 'lucide-react';

// プラン定義（src/lib/plans.ts と同期）
const PLANS = {
    free: { name: 'Free', color: 'bg-gray-100 text-gray-700', description: '自分のAPIキー使用' },
    pro: { name: 'Pro', color: 'bg-purple-100 text-purple-700', description: '月$16.67クレジット' },
    expert: { name: 'Expert', color: 'bg-blue-100 text-blue-700', description: '月$50クレジット' },
    enterprise: { name: 'Enterprise', color: 'bg-amber-100 text-amber-700', description: '月$166.67クレジット' },
};

interface UserUsage {
    monthlyGenerations: number;
    monthlyUploads: number;
    totalPages: number;
    totalStorageMB: number;
}

interface User {
    id: string;
    email: string;
    createdAt: string;
    lastSignInAt: string | null;
    isApproved: boolean;
    approvedAt: string | null;
    isBanned: boolean;
    bannedAt: string | null;
    banReason: string | null;
    plan: keyof typeof PLANS;
    usage: UserUsage;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/admin/users');
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleApproval = async (userId: string, action: 'approve' | 'revoke') => {
        try {
            setProcessing(userId);
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update approval');
            }

            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, isApproved: action === 'approve', approvedAt: action === 'approve' ? new Date().toISOString() : null }
                    : u
            ));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handlePlanChange = async (userId: string, newPlan: string) => {
        try {
            setProcessing(userId);
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, plan: newPlan }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update plan');
            }

            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, plan: newPlan as keyof typeof PLANS } : u
            ));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleBan = async (userId: string, action: 'ban' | 'unban') => {
        if (action === 'ban') {
            const confirmed = window.confirm('このユーザーをBANしますか？BANされたユーザーはログインできなくなります。');
            if (!confirmed) return;
        }

        try {
            setProcessing(userId);
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update ban status');
            }

            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, isBanned: action === 'ban', bannedAt: action === 'ban' ? new Date().toISOString() : null }
                    : u
            ));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const pendingCount = users.filter(u => !u.isApproved && !u.isBanned).length;
    const bannedCount = users.filter(u => u.isBanned).length;

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">エラー</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        onClick={fetchUsers}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        再試行
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6" />
                        ユーザー管理
                    </h1>
                    <p className="text-gray-600 mt-1">
                        ユーザーの承認・プラン管理を行います
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    更新
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                    <p className="text-sm text-gray-500">総ユーザー数</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <p className="text-sm text-gray-500">承認待ち</p>
                    <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <p className="text-sm text-gray-500">BAN</p>
                    <p className="text-2xl font-bold text-red-600">{bannedCount}</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <p className="text-sm text-gray-500">有料プラン</p>
                    <p className="text-2xl font-bold text-purple-600">
                        {users.filter(u => u.plan !== 'free').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <p className="text-sm text-gray-500">今月の総生成数</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {users.reduce((sum, u) => sum + u.usage.monthlyGenerations, 0)}
                    </p>
                </div>
            </div>

            {/* User List */}
            <div className="bg-white rounded-lg border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>読み込み中...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>ユーザーがいません</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <div key={user.id} className={user.isBanned ? 'bg-red-50' : !user.isApproved ? 'bg-amber-50' : ''}>
                                {/* Main Row */}
                                <div
                                    className="px-4 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                >
                                    {/* Status */}
                                    <div className="w-24 flex-shrink-0">
                                        {user.isBanned ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                <Ban className="w-3 h-3" />
                                                BAN
                                            </span>
                                        ) : user.isApproved ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                <Check className="w-3 h-3" />
                                                承認済
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                <Clock className="w-3 h-3" />
                                                待機中
                                            </span>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-900 truncate">{user.email}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            登録: {formatDate(user.createdAt)}
                                        </p>
                                    </div>

                                    {/* Plan Badge */}
                                    <div className="w-28 flex-shrink-0">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${PLANS[user.plan]?.color || PLANS.free.color}`}>
                                            <Crown className="w-3 h-3" />
                                            {PLANS[user.plan]?.name || 'Free'}
                                        </span>
                                    </div>

                                    {/* Usage Summary */}
                                    <div className="w-32 flex-shrink-0 text-right">
                                        <div className="flex items-center justify-end gap-1 text-sm text-gray-700">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span>{user.usage.monthlyGenerations}回/月</span>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="w-32 flex-shrink-0 flex justify-end gap-2">
                                        {user.isBanned ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBan(user.id, 'unban'); }}
                                                disabled={processing === user.id}
                                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                BAN解除
                                            </button>
                                        ) : user.isApproved ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApproval(user.id, 'revoke'); }}
                                                disabled={processing === user.id}
                                                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                            >
                                                取消
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleApproval(user.id, 'approve'); }}
                                                disabled={processing === user.id}
                                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                承認
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedUser === user.id && (
                                    <div className="px-4 py-4 bg-gray-50 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Usage Details */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">使用状況</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                                            <Zap className="w-3 h-3" />
                                                            AI生成
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {user.usage.monthlyGenerations}
                                                            <span className="text-sm font-normal text-gray-500">/月</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                                            <FileText className="w-3 h-3" />
                                                            ページ数
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {user.usage.totalPages}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                                            <Database className="w-3 h-3" />
                                                            アップロード
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {user.usage.monthlyUploads}
                                                            <span className="text-sm font-normal text-gray-500">/月</span>
                                                        </p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-lg border">
                                                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                                            <Database className="w-3 h-3" />
                                                            ストレージ
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {user.usage.totalStorageMB}
                                                            <span className="text-sm font-normal text-gray-500">MB</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Plan Selection */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">プラン設定</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(PLANS).map(([planId, planInfo]) => (
                                                        <button
                                                            key={planId}
                                                            onClick={() => handlePlanChange(user.id, planId)}
                                                            disabled={processing === user.id || user.plan === planId}
                                                            className={`p-3 rounded-lg border text-left transition-all ${
                                                                user.plan === planId
                                                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                            } ${processing === user.id ? 'opacity-50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Crown className={`w-4 h-4 ${user.plan === planId ? 'text-blue-600' : 'text-gray-400'}`} />
                                                                <span className={`font-medium ${user.plan === planId ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                    {planInfo.name}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                                                {planInfo.description}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* BAN Controls */}
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">アカウント管理</h4>
                                            {user.isBanned ? (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-red-800">このユーザーはBANされています</p>
                                                            <p className="text-xs text-red-600 mt-1">BAN日時: {formatDate(user.bannedAt)}</p>
                                                            {user.banReason && (
                                                                <p className="text-xs text-red-600">理由: {user.banReason}</p>
                                                            )}
                                                            <button
                                                                onClick={() => handleBan(user.id, 'unban')}
                                                                disabled={processing === user.id}
                                                                className="mt-3 px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                            >
                                                                BAN解除
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleBan(user.id, 'ban')}
                                                    disabled={processing === user.id}
                                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                    このユーザーをBANする
                                                </button>
                                            )}
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                                            <p>ユーザーID: {user.id}</p>
                                            <p>最終ログイン: {formatDate(user.lastSignInAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">プラン説明</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(PLANS).map(([planId, planInfo]) => (
                        <div key={planId} className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${planInfo.color}`}>
                                {planInfo.name}
                            </span>
                            <span className="text-gray-600">{planInfo.description}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
