import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface FormSubmissionRequest {
    pageSlug: string;
    areaId: string;
    formTitle?: string;
    formFields: Array<{
        fieldName: string;
        fieldLabel: string;
        value: string;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        const body: FormSubmissionRequest = await request.json();
        const { pageSlug, areaId, formTitle, formFields } = body;

        // バリデーション
        if (!pageSlug || !areaId || !formFields || formFields.length === 0) {
            return NextResponse.json(
                { success: false, error: '必須フィールドが不足しています' },
                { status: 400 }
            );
        }

        // ページの存在確認
        const page = await prisma.page.findFirst({
            where: {
                OR: [
                    { slug: pageSlug },
                    { id: isNaN(parseInt(pageSlug)) ? -1 : parseInt(pageSlug) }
                ]
            },
            select: { id: true, title: true }
        });

        if (!page) {
            return NextResponse.json(
                { success: false, error: 'ページが見つかりません' },
                { status: 404 }
            );
        }

        // フォームデータを整形
        const submissionData = {
            pageId: page.id,
            pageTitle: page.title,
            pageSlug,
            areaId,
            formTitle: formTitle || 'お問い合わせ',
            fields: formFields,
            submittedAt: new Date().toISOString(),
        };

        // ログ出力（将来的にはデータベースやメール送信に変更可能）
        console.log('=== フォーム送信 ===');
        console.log('ページ:', page.title, `(${pageSlug})`);
        console.log('フォーム:', formTitle || 'お問い合わせ');
        console.log('送信内容:');
        formFields.forEach(field => {
            console.log(`  ${field.fieldLabel}: ${field.value}`);
        });
        console.log('==================');

        // 将来的にはここでデータベースに保存したり、メール送信したりできます
        // 例: await prisma.formSubmission.create({ data: submissionData });
        // 例: await sendEmail(submissionData);

        return NextResponse.json({
            success: true,
            message: '送信が完了しました',
            data: {
                submittedAt: submissionData.submittedAt,
            }
        });

    } catch (error: any) {
        console.error('フォーム送信エラー:', error);
        return NextResponse.json(
            { success: false, error: error.message || '送信に失敗しました' },
            { status: 500 }
        );
    }
}

// フォーム送信一覧を取得（管理画面用）
export async function GET(request: NextRequest) {
    // 将来的にデータベースから送信履歴を取得する場合に使用
    return NextResponse.json({
        success: true,
        message: 'フォーム送信履歴機能は準備中です',
        data: []
    });
}
