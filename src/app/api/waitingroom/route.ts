import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/resend';
import {
    getWaitingRoomConfirmationEmail,
    getWaitingRoomAdminNotificationEmail
} from '@/lib/email-templates/waitingroom';

interface WaitingRoomRequest {
    accountType: 'individual' | 'corporate';
    companyName?: string;
    name: string;
    email: string;
    phone?: string;
    remarks?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: WaitingRoomRequest = await request.json();
        const { accountType, companyName, name, email, phone, remarks } = body;

        // バリデーション
        if (!accountType || !name || !email) {
            return NextResponse.json(
                { success: false, error: '必須フィールドが不足しています' },
                { status: 400 }
            );
        }

        // 法人の場合は会社名必須
        if (accountType === 'corporate' && !companyName) {
            return NextResponse.json(
                { success: false, error: '法人の場合は会社名が必須です' },
                { status: 400 }
            );
        }

        // メールアドレスの簡易バリデーション
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: '有効なメールアドレスを入力してください' },
                { status: 400 }
            );
        }

        // 既存の登録チェック
        const existingEntry = await prisma.waitingRoomEntry.findFirst({
            where: { email }
        });

        if (existingEntry) {
            return NextResponse.json(
                { success: false, error: 'このメールアドレスは既に登録されています' },
                { status: 409 }
            );
        }

        // データベースに保存
        const entry = await prisma.waitingRoomEntry.create({
            data: {
                accountType,
                companyName: companyName || null,
                name,
                email,
                phone: phone || null,
                remarks: remarks || null,
                status: 'pending',
            }
        });

        console.log('=== Waiting Room 登録 ===');
        console.log('タイプ:', accountType === 'corporate' ? '法人' : '個人');
        if (companyName) console.log('会社名:', companyName);
        console.log('名前:', name);
        console.log('メール:', email);
        if (phone) console.log('電話:', phone);
        if (remarks) console.log('備考:', remarks);
        console.log('========================');

        // メール送信（非同期で実行、エラーがあってもレスポンスには影響させない）
        const sendEmails = async () => {
            try {
                // 1. ユーザーへの確認メール
                const confirmationEmail = getWaitingRoomConfirmationEmail({
                    name,
                    accountType,
                    companyName: companyName || undefined,
                });

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: email,
                    subject: confirmationEmail.subject,
                    html: confirmationEmail.html,
                });
                console.log('✅ ユーザー確認メール送信完了:', email);

                // 2. 管理者への通知メール
                const adminEmail = getWaitingRoomAdminNotificationEmail({
                    name,
                    email,
                    accountType,
                    companyName: companyName || undefined,
                    phone: phone || undefined,
                    remarks: remarks || undefined,
                    createdAt: entry.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                });

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: ADMIN_EMAIL,
                    subject: adminEmail.subject,
                    html: adminEmail.html,
                });
                console.log('✅ 管理者通知メール送信完了:', ADMIN_EMAIL);

            } catch (emailError) {
                console.error('❌ メール送信エラー:', emailError);
            }
        };

        // メール送信を非同期で実行（レスポンスを待たせない）
        sendEmails();

        return NextResponse.json({
            success: true,
            message: '順番待ちリストへの登録が完了しました',
            data: {
                id: entry.id,
                createdAt: entry.createdAt.toISOString(),
            }
        });

    } catch (error: any) {
        console.error('Waiting Room登録エラー:', error);
        return NextResponse.json(
            { success: false, error: error.message || '登録に失敗しました' },
            { status: 500 }
        );
    }
}
