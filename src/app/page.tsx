'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Lock, Mail, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          setMessage('確認リンクをメールで送信しました。');
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          router.push('/admin');
          router.refresh();
        }
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
              {isSignUp ? 'アカウント作成' : 'おかえりなさい'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp ? 'メールアドレスを入力してアカウントを作成してください' : 'メールアドレスを入力してログインしてください'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-bold text-foreground">
                メールアドレス
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-bold text-foreground">
                  パスワード
                </label>
                {!isSignUp && (
                  <button type="button" className="text-sm font-medium text-primary hover:underline">
                    パスワードをお忘れですか？
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="******"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-md border border-red-100 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 text-green-600 text-sm font-medium rounded-md border border-green-100 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">
                {message}
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
                  {isSignUp ? 'アカウント作成' : 'ログイン'}
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'すでにアカウントをお持ちですか？ ログイン' : 'アカウントをお持ちでないですか？ 新規登録'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
