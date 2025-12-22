import Link from 'next/link';
import { FileText, Settings, Layout, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';

export default async function Home() {
  // 公開中のページを取得
  let publishedPages: { id: number; title: string; slug: string }[] = [];
  try {
    publishedPages = await prisma.page.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, slug: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });
  } catch (e) {
    console.error('DB connection failed', e);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Layout className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">LP Builder</span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
          >
            <Settings className="h-4 w-4" />
            管理画面
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            ランディングページビルダー
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AIを活用して、美しいランディングページを簡単に作成できます。
            <br />
            コーディング不要で、プロフェッショナルなページを数分で公開。
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200"
            >
              はじめる
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Published Pages */}
        {publishedPages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              公開中のページ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publishedPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/p/${page.slug}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">/{page.slug}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Features */}
        <section className="mt-20 grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Layout className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">ドラッグ&ドロップ</h3>
            <p className="text-sm text-gray-600">
              直感的な操作でセクションを追加・並べ替え。コード不要で簡単編集。
            </p>
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">AI コピーライティング</h3>
            <p className="text-sm text-gray-600">
              AIがキャッチコピーや説明文を自動生成。効果的な文章を瞬時に作成。
            </p>
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">AI 画像生成</h3>
            <p className="text-sm text-gray-600">
              Imagen 3による高品質な画像生成。イメージに合った画像を自動作成。
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-20">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-gray-500">
          <p>LP Builder v0.0.0.0</p>
        </div>
      </footer>
    </div>
  );
}
