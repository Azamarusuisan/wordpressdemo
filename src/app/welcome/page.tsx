'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Loader2, ArrowRight, AlertCircle, Mail } from 'lucide-react';

interface WelcomeData {
  email: string;
  planName: string;
  isNewUser: boolean;
}

function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<WelcomeData | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('セッションIDが見つかりません');
      setLoading(false);
      return;
    }

    // Checkout Session情報を取得
    fetch(`/api/billing/checkout/complete?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      })
      .catch((err) => {
        setError('情報の取得に失敗しました');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">アカウント情報を取得中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-100 rounded-xl p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-600 mb-2">エラーが発生しました</h1>
            <p className="text-red-600/80 mb-6">{error || '情報の取得に失敗しました'}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-sm" />
            <span className="text-xl font-bold tracking-tight">LP Builder</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            ご登録ありがとうございます！
          </h1>
          <p className="text-muted-foreground">
            {data.planName}プランのお申し込みが完了しました
          </p>
        </div>

        {/* Email Sent Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-blue-50 px-6 py-6 text-center">
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="font-bold text-xl text-blue-800 mb-2">
              ログイン情報をメールで送信しました
            </h2>
            <p className="text-blue-700">
              <span className="font-mono font-bold">{data.email}</span>
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-gray-600 leading-relaxed">
              上記のメールアドレス宛に、ログインに必要なパスワードを送信しました。
              メールをご確認の上、ログインしてください。
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">メールが届かない場合</p>
              <p className="text-sm text-amber-700 mt-1">
                迷惑メールフォルダをご確認ください。<br />
                数分経ってもメールが届かない場合は、サポートまでお問い合わせください。
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors"
        >
          ログインページへ進む
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          メールに記載されたパスワードでログインできます
        </p>
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
