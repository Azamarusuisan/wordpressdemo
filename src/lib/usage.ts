/**
 * 使用量管理ユーティリティ
 * ユーザーの使用量を取得・チェックするための関数群
 */

import { prisma } from '@/lib/db';
import { getPlan, isWithinLimit, PlanType } from '@/lib/plans';

export interface UsageStats {
    // 今月のAI生成回数
    monthlyGenerations: number;
    // 今月のアップロード数
    monthlyUploads: number;
    // 総ページ数
    totalPages: number;
    // 総ストレージ使用量（MB）
    totalStorageMB: number;
}

export interface UsageLimitCheck {
    allowed: boolean;
    reason?: string;
    current: number;
    limit: number;
    remaining: number | 'unlimited';
}

/**
 * ユーザーの現在の使用量を取得
 */
export async function getUserUsage(userId: string): Promise<UsageStats> {
    // 今月の開始日を取得
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 並列でクエリを実行
    const [generationCount, uploadCount, pageCount] = await Promise.all([
        // 今月のAI生成回数
        prisma.generationRun.count({
            where: {
                userId,
                createdAt: { gte: startOfMonth },
                status: 'succeeded',
            },
        }),
        // 今月のアップロード数
        prisma.mediaImage.count({
            where: {
                userId,
                createdAt: { gte: startOfMonth },
                sourceType: 'upload',
            },
        }),
        // 総ページ数
        prisma.page.count({
            where: { userId },
        }),
    ]);

    // ストレージ使用量は概算（画像数 × 平均サイズ）
    // 本来はファイルサイズを保存して合計するべき
    const estimatedStorageMB = Math.round((generationCount + uploadCount) * 0.5);

    return {
        monthlyGenerations: generationCount,
        monthlyUploads: uploadCount,
        totalPages: pageCount,
        totalStorageMB: estimatedStorageMB,
    };
}

/**
 * ユーザーのプランを取得
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
    const settings = await prisma.userSettings.findUnique({
        where: { userId },
        select: { plan: true },
    });

    return (settings?.plan as PlanType) || 'free';
}

/**
 * AI生成が可能かチェック
 */
export async function checkGenerationLimit(userId: string): Promise<UsageLimitCheck> {
    const [usage, planId] = await Promise.all([
        getUserUsage(userId),
        getUserPlan(userId),
    ]);

    const plan = getPlan(planId);
    const limit = plan.limits.monthlyGenerations;
    const current = usage.monthlyGenerations;

    if (!isWithinLimit(current, limit)) {
        return {
            allowed: false,
            reason: `月間生成上限（${limit}回）に達しました。プランをアップグレードしてください。`,
            current,
            limit,
            remaining: 0,
        };
    }

    return {
        allowed: true,
        current,
        limit,
        remaining: limit === -1 ? 'unlimited' : limit - current,
    };
}

/**
 * アップロードが可能かチェック
 */
export async function checkUploadLimit(userId: string): Promise<UsageLimitCheck> {
    const [usage, planId] = await Promise.all([
        getUserUsage(userId),
        getUserPlan(userId),
    ]);

    const plan = getPlan(planId);
    const limit = plan.limits.monthlyUploads;
    const current = usage.monthlyUploads;

    if (!isWithinLimit(current, limit)) {
        return {
            allowed: false,
            reason: `月間アップロード上限（${limit}回）に達しました。`,
            current,
            limit,
            remaining: 0,
        };
    }

    return {
        allowed: true,
        current,
        limit,
        remaining: limit === -1 ? 'unlimited' : limit - current,
    };
}

/**
 * ページ作成が可能かチェック
 */
export async function checkPageLimit(userId: string): Promise<UsageLimitCheck> {
    const [usage, planId] = await Promise.all([
        getUserUsage(userId),
        getUserPlan(userId),
    ]);

    const plan = getPlan(planId);
    const limit = plan.limits.maxPages;
    const current = usage.totalPages;

    if (!isWithinLimit(current, limit)) {
        return {
            allowed: false,
            reason: `ページ上限（${limit}ページ）に達しました。`,
            current,
            limit,
            remaining: 0,
        };
    }

    return {
        allowed: true,
        current,
        limit,
        remaining: limit === -1 ? 'unlimited' : limit - current,
    };
}

/**
 * 機能が利用可能かチェック
 */
export async function checkFeatureAccess(
    userId: string,
    feature: 'upscale4K' | 'restyle' | 'export' | 'generateVideo' | 'setApiKey'
): Promise<{ allowed: boolean; reason?: string }> {
    const planId = await getUserPlan(userId);
    const plan = getPlan(planId);

    const featureMap = {
        upscale4K: { check: plan.limits.canUpscale4K, name: '4Kアップスケール' },
        restyle: { check: plan.limits.canRestyle, name: 'リスタイル' },
        export: { check: plan.limits.canExport, name: 'エクスポート' },
        generateVideo: { check: plan.limits.canGenerateVideo, name: '動画生成' },
        setApiKey: { check: plan.limits.canSetApiKey, name: 'APIキー設定' },
    };

    const featureInfo = featureMap[feature];
    if (!featureInfo.check) {
        return {
            allowed: false,
            reason: `${featureInfo.name}機能は${plan.name}プランでは利用できません。プランをアップグレードしてください。`,
        };
    }

    return { allowed: true };
}

/**
 * 使用量の完全なレポートを取得
 */
export async function getUsageReport(userId: string) {
    const [usage, planId] = await Promise.all([
        getUserUsage(userId),
        getUserPlan(userId),
    ]);

    const plan = getPlan(planId);

    return {
        plan: {
            id: plan.id,
            name: plan.name,
            description: plan.description,
        },
        usage,
        limits: plan.limits,
        percentages: {
            generations: plan.limits.monthlyGenerations === -1
                ? 0
                : Math.round((usage.monthlyGenerations / plan.limits.monthlyGenerations) * 100),
            uploads: plan.limits.monthlyUploads === -1
                ? 0
                : Math.round((usage.monthlyUploads / plan.limits.monthlyUploads) * 100),
            pages: plan.limits.maxPages === -1
                ? 0
                : Math.round((usage.totalPages / plan.limits.maxPages) * 100),
        },
    };
}
