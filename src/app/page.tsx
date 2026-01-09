'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Lock, Mail, ArrowRight, Loader2, UserPlus, User } from 'lucide-react';

// Fixed credentials
const FIXED_ID = 'ZettAI';
const FIXED_PASSWORD = 'Zettai20250722';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check fixed credentials
      if (userId === FIXED_ID && password === FIXED_PASSWORD) {
        // Call login API to set session
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password }),
        });

        if (res.ok) {
          router.push('/admin');
          router.refresh();
        } else {
          setError('認証に失敗しました');
        }
      } else {
        setError('IDまたはパスワードが正しくありません');
      }
    } catch (err) {
      setError('認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding/Visual */}
      <div className="hidden lg:flex flex-col justify-between bg-surface-50 border-r border-border p-12">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-8 bg-primary rounded-sm" />
            <span className="text-xl font-bold tracking-tight">LP Builder</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter leading-tight max-w-lg mb-6 text-foreground">
            洗練されたランディングページを、<br />
            極めるために。
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            美学とパフォーマンスを追求するプロフェッショナルのための、次世代ページビルダー。
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="h-2 w-2 rounded-full bg-primary/20" />
            <div className="h-2 w-2 rounded-full bg-primary/20" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            © 2024 ZettAI Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-sm" />
              <span className="text-xl font-bold tracking-tight">LP Builder</span>
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              おかえりなさい
            </h2>
            <p className="text-muted-foreground">
              IDとパスワードを入力してログインしてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-bold text-foreground">
                ID
              </label>
              <div className="relative">
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="ID を入力"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-bold text-foreground">
                パスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="******"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-6 rounded-md font-bold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  ログイン
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
