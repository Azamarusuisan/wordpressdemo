import { prisma } from '@/lib/db';

// Google AI APIキーを取得（DB優先、なければ環境変数）
export async function getGoogleApiKey(): Promise<string | null> {
    try {
        const config = await prisma.globalConfig.findUnique({
            where: { key: 'googleApiKey' }
        });

        if (config?.value) {
            // JSON文字列として保存されている場合はパース
            try {
                return JSON.parse(config.value);
            } catch {
                return config.value;
            }
        }
    } catch (e) {
        console.error('Failed to fetch API key from DB:', e);
    }

    // フォールバック: 環境変数
    return process.env.GOOGLE_GENERATIVE_AI_API_KEY || null;
}
