'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, googleSignIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);
  const googleCallbackRef = useRef(null);

  if (isAuthenticated) { router.push(redirectTo); return null; }

  googleCallbackRef.current = async (response) => {
    setError('');
    setGoogleLoading(true);
    const result = await googleSignIn(response.credential);
    setGoogleLoading(false);
    if (result.success) router.push(result.user.role === 'admin' ? '/admin' : redirectTo);
    else setError(result.error);
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => googleCallbackRef.current(r),
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: googleBtnRef.current.offsetWidth || 400,
      });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const result = await login(identifier, password);
    setLoading(false);
    if (result.success) {
      router.push(result.user.role === 'admin' ? '/admin' : redirectTo);
    } else {
      setError(result.error);
    }
  };

  const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center bg-daami-cream px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-3xl font-bold tracking-[0.2em] text-daami-black uppercase">DAAMI</span>
            <span className="text-[9px] tracking-[0.4em] text-daami-gray uppercase font-medium">CLOTHING</span>
          </Link>
          <h1 className="text-2xl font-bold text-daami-black mt-6">Welcome Back</h1>
          <p className="text-daami-gray text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-5">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          {hasGoogleClientId && (
            <>
              <div ref={googleBtnRef} className="w-full flex justify-center mb-4" />
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-daami-gray mb-4">
                  <span className="w-4 h-4 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
                  Signing in with Google...
                </div>
              )}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-daami-gray font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Email or Phone Number</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray">
                  {identifier.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@example.com or 9800000000"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-field mb-0">Password</label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-daami-gray mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-daami-gold font-semibold hover:underline">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-daami-gray mt-6">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline hover:text-daami-gold">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-daami-gold">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
