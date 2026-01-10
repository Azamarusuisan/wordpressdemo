/**
 * SaaSプラン定義
 * 各プランの制限値と機能を定義
 */

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
    // 月間AI生成回数
    monthlyGenerations: number;
    // 月間画像アップロード数
    monthlyUploads: number;
    // 最大ページ数
    maxPages: number;
    // 最大ストレージ（MB）
    maxStorageMB: number;
    // 4Kアップスケール可能か
    canUpscale4K: boolean;
    // リスタイル機能使用可能か
    canRestyle: boolean;
    // エクスポート機能使用可能か
    canExport: boolean;
    // 動画生成可能か
    canGenerateVideo: boolean;
    // API キー設定可能か
    canSetApiKey: boolean;
    // 優先サポート
    prioritySupport: boolean;
}

export interface Plan {
    id: PlanType;
    name: string;
    description: string;
    limits: PlanLimits;
    // 表示用の価格（参考）
    priceDisplay?: string;
}

export const PLANS: Record<PlanType, Plan> = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'お試し用の無料プラン',
        priceDisplay: '¥0/月',
        limits: {
            monthlyGenerations: 10,
            monthlyUploads: 20,
            maxPages: 2,
            maxStorageMB: 100,
            canUpscale4K: false,
            canRestyle: false,
            canExport: false,
            canGenerateVideo: false,
            canSetApiKey: false,
            prioritySupport: false,
        },
    },
    starter: {
        id: 'starter',
        name: 'Starter',
        description: '個人・小規模向けプラン',
        priceDisplay: '¥2,980/月',
        limits: {
            monthlyGenerations: 100,
            monthlyUploads: 200,
            maxPages: 10,
            maxStorageMB: 1000,
            canUpscale4K: true,
            canRestyle: true,
            canExport: true,
            canGenerateVideo: false,
            canSetApiKey: false,
            prioritySupport: false,
        },
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        description: 'プロフェッショナル向けプラン',
        priceDisplay: '¥9,800/月',
        limits: {
            monthlyGenerations: 500,
            monthlyUploads: 1000,
            maxPages: 50,
            maxStorageMB: 10000,
            canUpscale4K: true,
            canRestyle: true,
            canExport: true,
            canGenerateVideo: true,
            canSetApiKey: true,
            prioritySupport: true,
        },
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        description: '企業向け無制限プラン',
        priceDisplay: 'お問い合わせ',
        limits: {
            monthlyGenerations: -1, // -1 = 無制限
            monthlyUploads: -1,
            maxPages: -1,
            maxStorageMB: -1,
            canUpscale4K: true,
            canRestyle: true,
            canExport: true,
            canGenerateVideo: true,
            canSetApiKey: true,
            prioritySupport: true,
        },
    },
};

// デフォルトプラン
export const DEFAULT_PLAN: PlanType = 'free';

// プラン取得ヘルパー
export function getPlan(planId: string | null | undefined): Plan {
    if (!planId || !(planId in PLANS)) {
        return PLANS[DEFAULT_PLAN];
    }
    return PLANS[planId as PlanType];
}

// 制限値が無制限かどうかをチェック
export function isUnlimited(value: number): boolean {
    return value === -1;
}

// 使用量が制限内かチェック
export function isWithinLimit(used: number, limit: number): boolean {
    if (isUnlimited(limit)) return true;
    return used < limit;
}

// 残り使用可能数を計算
export function getRemainingUsage(used: number, limit: number): number | 'unlimited' {
    if (isUnlimited(limit)) return 'unlimited';
    return Math.max(0, limit - used);
}

// 使用率を計算（パーセント）
export function getUsagePercentage(used: number, limit: number): number {
    if (isUnlimited(limit)) return 0;
    if (limit === 0) return 100;
    return Math.min(100, Math.round((used / limit) * 100));
}
