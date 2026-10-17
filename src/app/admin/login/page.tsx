'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdminAction } from '@/actions/auth';
import { CurrentYear } from '@/components/CurrentYear';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('from') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('password', password);

      const res = await loginAdminAction(formData);

      if (!res.success) {
        setErrorMessage(res.error || 'Autentikasi gagal. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      // Success: redirect to target dashboard
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat memproses login.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-900 selection:bg-red-600 selection:text-white antialiased">
      {/* Unified Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center group focus:outline-none">
          <Image
            src="/Logo-Sharingvision-Main.png"
            alt="Sharing Vision Logo"
            width={160}
            height={32}
            className="h-8 w-auto object-contain transition-opacity group-hover:opacity-85"
            priority
          />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
          {/* Card Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
              Login Portal Admin
            </h1>
            <p className="text-sm text-slate-600">
              Masuk dengan kredensial administrator terdaftar
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in fade-in duration-150">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm text-rose-800 leading-snug">
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                EMAIL ADMIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="admin@sharingvision.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-3 w-full text-sm focus:bg-white focus:border-[#DF1A3D] focus:ring-1 focus:ring-[#DF1A3D] outline-none transition-all disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  PASSWORD
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-500 rounded-xl pl-10 pr-11 py-3 w-full text-sm focus:bg-white focus:border-[#DF1A3D] focus:ring-1 focus:ring-[#DF1A3D] outline-none transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Koneksi terenkripsi &amp; sesi aman PT. Sharing Vision Indonesia</span>
          </div>
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="text-slate-600 text-sm pb-6 text-center">
        &copy; <CurrentYear /> PT. Sharing Vision Indonesia. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
