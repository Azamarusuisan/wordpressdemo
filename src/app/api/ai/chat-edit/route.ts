import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGoogleApiKey } from '@/lib/apiKeys';
import { logGeneration, createTimer } from '@/lib/generation-logger';

export async function POST(request: NextRequest) {
    const startTime = createTimer();
    let prompt = '';

    try {
        const { message, currentText, role, dsl } = await request.json();

        const apiKey = await getGoogleApiKey();
        if (!apiKey) {
            return NextResponse.json({ error: '設定画面でAPIキーを設定してください。' }, { status: 500 });
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        prompt = `
            あなたは、LP制作の現場でデザイナーやライターに的確な指示を飛ばす【超一流のクリエイティブディレクター】です。
            ユーザーからの「修正指示」を受け取り、現在の「コピー」「役割」「DSL」を考慮した上で、最高の修正案を提示してください。

            【現在のコンテキスト】
            セクションの役割: ${role}
            現在のコピー: "${currentText}"
            設計データ(DSL): ${JSON.stringify(dsl)}

            【ユーザーからの修正指示】
            "${message}"

            【ディレクターとしての思考プロセス】
            1. 指示の翻訳: ユーザーの指示（例: 「もっと明るく」）を、マーケティング的・コピーライティング的な手法（例: 「ベネフィットを強調し、感嘆符を活用し、親しみやすい語彙に変換する」）に翻訳せよ。
            2. 整合性チェック: 修正によってセクションの本来の役割（共感、教育等）が損なわれないか確認せよ。
            3. 実行: 最適な修正コピー「revisedText」と、なぜそのように修正したかの専門的な根拠「reason」を生成せよ。

            出力形式（JSONのみ）:
            {
              "revisedText": "修正されたコピー全文",
              "reason": "修正の根拠・戦略（例: ターゲットの『損をしたくない』という心理を刺激するため、GDT法則を適用しました）"
            }
        `;

        const result = await model.generateContent(prompt);
        const resText = result.response.text();

        const jsonMatch = resText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON生成失敗');

        const resultData = JSON.parse(jsonMatch[0]);

        // ログ記録（成功）
        await logGeneration({
            userId: null,
            type: 'chat-edit',
            endpoint: '/api/ai/chat-edit',
            model: 'gemini-2.0-flash',
            inputPrompt: prompt,
            outputResult: JSON.stringify(resultData),
            status: 'succeeded',
            startTime
        });

        return NextResponse.json(resultData);
    } catch (error: any) {
        console.error('AI Chat Edit Final Error:', error);

        // ログ記録（エラー）
        await logGeneration({
            userId: null,
            type: 'chat-edit',
            endpoint: '/api/ai/chat-edit',
            model: 'gemini-2.0-flash',
            inputPrompt: prompt || 'Error before prompt',
            status: 'failed',
            errorMessage: error.message,
            startTime
        });

        return NextResponse.json({
            error: 'AI Chat Edit Failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
