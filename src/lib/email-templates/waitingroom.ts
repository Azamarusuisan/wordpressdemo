// Waiting Room 登録完了メール（ユーザー向け）
export function getWaitingRoomConfirmationEmail(data: {
    name: string;
    accountType: string;
    companyName?: string;
}) {
    const accountTypeLabel = data.accountType === 'corporate' ? '法人' : '個人';

    return {
        subject: '【LP Builder】順番待ちリストへの登録が完了しました',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #111827; padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">LP Builder</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 20px; font-weight: 700;">
                                順番待ちリストへの登録が完了しました
                            </h2>

                            <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                                ${data.name} 様
                            </p>

                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                                LP Builderにご興味をお持ちいただき、誠にありがとうございます。<br>
                                順番待ちリストへの登録が完了いたしました。
                            </p>

                            <!-- Registration Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ご登録内容</p>
                                        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.8;">
                                            <strong>お名前：</strong>${data.name}<br>
                                            <strong>ご利用形態：</strong>${accountTypeLabel}
                                            ${data.companyName ? `<br><strong>会社名：</strong>${data.companyName}` : ''}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                                準備が整い次第、本登録のご案内メールをお送りいたします。<br>
                                今しばらくお待ちくださいませ。
                            </p>

                            <!-- Plan Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 8px 0; color: #d97706; font-size: 12px; font-weight: 700;">現在ご案内中のプラン</p>
                                        <p style="margin: 0 0 4px 0; color: #111827; font-size: 24px; font-weight: 800;">PoCプラン</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px;">¥20,000/月（税別）・初月無料トライアル</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                このメールは LP Builder からの自動送信です。
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                © 2026 ZettAI Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim(),
    };
}

// 管理者向け通知メール
export function getWaitingRoomAdminNotificationEmail(data: {
    name: string;
    email: string;
    accountType: string;
    companyName?: string;
    phone?: string;
    remarks?: string;
    createdAt: string;
}) {
    const accountTypeLabel = data.accountType === 'corporate' ? '法人' : '個人';

    return {
        subject: `【LP Builder】新規Waiting Room登録: ${data.name}様（${accountTypeLabel}）`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #d97706; padding: 24px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">新規 Waiting Room 登録</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.7;">
                                新しい順番待ち登録がありました。
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">お名前</span><br>
                                                    <strong style="color: #111827; font-size: 15px;">${data.name}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">メールアドレス</span><br>
                                                    <a href="mailto:${data.email}" style="color: #2563eb; font-size: 15px; text-decoration: none;">${data.email}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">ご利用形態</span><br>
                                                    <strong style="color: #111827; font-size: 15px;">${accountTypeLabel}</strong>
                                                </td>
                                            </tr>
                                            ${data.companyName ? `
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">会社名</span><br>
                                                    <strong style="color: #111827; font-size: 15px;">${data.companyName}</strong>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${data.phone ? `
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">電話番号</span><br>
                                                    <strong style="color: #111827; font-size: 15px;">${data.phone}</strong>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            ${data.remarks ? `
                                            <tr>
                                                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                                                    <span style="color: #6b7280; font-size: 13px;">備考</span><br>
                                                    <span style="color: #111827; font-size: 15px; white-space: pre-wrap;">${data.remarks}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <span style="color: #6b7280; font-size: 13px;">登録日時</span><br>
                                                    <span style="color: #111827; font-size: 15px;">${data.createdAt}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                LP Builder 管理者通知
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim(),
    };
}
