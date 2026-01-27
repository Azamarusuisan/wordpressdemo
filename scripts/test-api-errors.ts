#!/usr/bin/env ts-node

/**
 * API Error Testing Script
 *
 * テキストベースLP作成APIのエラーハンドリングをテストする
 *
 * 使用方法:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-api-errors.ts
 *
 * テストケース:
 * 1. suggest-benefits API:
 *    - 必須フィールド欠如
 *    - 型エラー
 *    - 空文字列
 * 2. lp-builder/generate API:
 *    - businessInfo なし
 *    - businessInfo 不正
 *    - enhancedContext 不正
 *    - designDefinition 不正
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

interface TestCase {
    name: string;
    endpoint: string;
    payload: any;
    expectedStatus: number;
    expectedError?: string;
}

const testCases: TestCase[] = [
    // ========================================
    // suggest-benefits API Tests
    // ========================================
    {
        name: '[suggest-benefits] 必須フィールド欠如 - businessName',
        endpoint: '/api/ai/suggest-benefits',
        payload: {
            // businessName が欠如
            industry: 'IT',
            businessType: 'B2B',
            productName: 'テスト商品',
            productDescription: 'これはテスト用の商品です',
            productCategory: 'ソフトウェア',
            targetAudience: '中小企業の経営者',
            painPoints: '業務効率が悪い、コストが高い',
            desiredOutcome: '業務効率を30%改善したい',
            generateType: 'benefits',
        },
        expectedStatus: 400,
        expectedError: '会社名は必須です',
    },
    {
        name: '[suggest-benefits] 文字数不足 - productDescription',
        endpoint: '/api/ai/suggest-benefits',
        payload: {
            businessName: 'テスト株式会社',
            industry: 'IT',
            businessType: 'B2B',
            productName: 'テスト商品',
            productDescription: '短い', // 10文字未満
            productCategory: 'ソフトウェア',
            targetAudience: '中小企業の経営者',
            painPoints: '業務効率が悪い、コストが高い',
            desiredOutcome: '業務効率を30%改善したい',
            generateType: 'benefits',
        },
        expectedStatus: 400,
        expectedError: '商品説明は10文字以上',
    },
    {
        name: '[suggest-benefits] 無効なgenerateType',
        endpoint: '/api/ai/suggest-benefits',
        payload: {
            businessName: 'テスト株式会社',
            industry: 'IT',
            businessType: 'B2B',
            productName: 'テスト商品',
            productDescription: 'これはテスト用の商品です',
            productCategory: 'ソフトウェア',
            targetAudience: '中小企業の経営者',
            painPoints: '業務効率が悪い、コストが高い',
            desiredOutcome: '業務効率を30%改善したい',
            generateType: 'invalid-type', // 無効な値
        },
        expectedStatus: 400,
    },
    {
        name: '[suggest-benefits] 空文字列 - targetAudience',
        endpoint: '/api/ai/suggest-benefits',
        payload: {
            businessName: 'テスト株式会社',
            industry: 'IT',
            businessType: 'B2B',
            productName: 'テスト商品',
            productDescription: 'これはテスト用の商品です',
            productCategory: 'ソフトウェア',
            targetAudience: '', // 空文字列
            painPoints: '業務効率が悪い、コストが高い',
            desiredOutcome: '業務効率を30%改善したい',
            generateType: 'benefits',
        },
        expectedStatus: 400,
        expectedError: 'ターゲット層は5文字以上',
    },

    // ========================================
    // lp-builder/generate API Tests
    // ========================================
    {
        name: '[lp-generate] businessInfo なし',
        endpoint: '/api/lp-builder/generate',
        payload: {
            mode: 'text-based',
            // businessInfo が欠如
        },
        expectedStatus: 400,
    },
    {
        name: '[lp-generate] businessInfo 不正 - service 文字数不足',
        endpoint: '/api/lp-builder/generate',
        payload: {
            mode: 'text-based',
            businessInfo: {
                businessName: 'テスト株式会社',
                industry: 'IT',
                service: '短い', // 10文字未満
                target: 'ターゲット顧客層',
                strengths: '我々の強み',
                tone: 'professional',
            },
        },
        expectedStatus: 400,
        expectedError: 'サービス概要は10文字以上',
    },
    {
        name: '[lp-generate] businessInfo 不正 - 無効なtone',
        endpoint: '/api/lp-builder/generate',
        payload: {
            mode: 'text-based',
            businessInfo: {
                businessName: 'テスト株式会社',
                industry: 'IT',
                service: 'これは10文字以上のサービス説明です',
                target: 'ターゲット顧客層',
                strengths: '我々の強み',
                tone: 'invalid-tone', // 無効な値
            },
        },
        expectedStatus: 400,
    },
    {
        name: '[lp-generate] enhancedContext 不正 - 無効なimageStyle',
        endpoint: '/api/lp-builder/generate',
        payload: {
            mode: 'text-based',
            businessInfo: {
                businessName: 'テスト株式会社',
                industry: 'IT',
                service: 'これは10文字以上のサービス説明です',
                target: 'ターゲット顧客層',
                strengths: '我々の強み',
                tone: 'professional',
            },
            enhancedContext: {
                imageStyle: 'invalid-style', // 無効な値
            },
        },
        expectedStatus: 400, // バリデーション失敗だが、警告のみで続行される可能性あり
    },
];

async function runTest(testCase: TestCase): Promise<{
    name: string;
    passed: boolean;
    message: string;
}> {
    try {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`   Endpoint: ${testCase.endpoint}`);

        const response = await fetch(`${API_BASE_URL}${testCase.endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.payload),
        });

        const data = await response.json();

        // ステータスコードチェック
        if (response.status !== testCase.expectedStatus) {
            return {
                name: testCase.name,
                passed: false,
                message: `❌ Expected status ${testCase.expectedStatus}, got ${response.status}`,
            };
        }

        // エラーメッセージチェック
        if (testCase.expectedError) {
            if (!data.error || !data.error.includes(testCase.expectedError)) {
                return {
                    name: testCase.name,
                    passed: false,
                    message: `❌ Expected error message to include "${testCase.expectedError}", got: ${data.error}`,
                };
            }
        }

        return {
            name: testCase.name,
            passed: true,
            message: `✅ Passed (Status: ${response.status}, Error: ${data.error || 'N/A'})`,
        };
    } catch (error: any) {
        return {
            name: testCase.name,
            passed: false,
            message: `❌ Exception: ${error.message}`,
        };
    }
}

async function runAllTests() {
    console.log('🚀 Starting API Error Handling Tests...');
    console.log(`   Base URL: ${API_BASE_URL}`);
    console.log(`   Total Tests: ${testCases.length}\n`);
    console.log('=' .repeat(80));

    const results = [];

    for (const testCase of testCases) {
        const result = await runTest(testCase);
        results.push(result);
        console.log(`   ${result.message}`);

        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // サマリー
    console.log('\n' + '='.repeat(80));
    console.log('📊 Test Summary:');
    console.log('=' .repeat(80));

    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;

    console.log(`\n✅ Passed: ${passedCount}/${results.length}`);
    console.log(`❌ Failed: ${failedCount}/${results.length}`);

    if (failedCount > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}`);
            console.log(`     ${r.message}`);
        });
    }

    console.log('\n' + '='.repeat(80));

    process.exit(failedCount > 0 ? 1 : 0);
}

// 実行
runAllTests().catch(err => {
    console.error('❌ Test runner error:', err);
    process.exit(1);
});
