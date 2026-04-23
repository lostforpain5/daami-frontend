'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Eye, EyeOff, Lock, Mail, Phone, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { login, googleSignIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);
  const googleCallbackRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIdentifier(''); setPassword(''); setError('');
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleBtnRef.current) return;
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
        theme: 'outline', size: 'large', text: 'signin_with',
        width: googleBtnRef.current.offsetWidth || 340,
      });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, [isOpen]);

  googleCallbackRef.current = async (response) => {
    setError('');
    setGoogleLoading(true);
    const result = await googleSignIn(response.credential);
    setGoogleLoading(false);
    if (result.success) { onClose(); onSuccess?.(); }
    else setError(result.error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    const result = await login(identifier, password);
    setLoading(false);
    if (result.success) { onClose(); onSuccess?.(); }
    else setError(result.error);
  };

  if (!isOpen) return null;

  const hasGoogleClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-sm shadow-2xl animate-fade-in">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-daami-gray hover:text-daami-black transition-colors z-10">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-daami-black px-6 pt-7 pb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ShoppingBag size={20} className="text-daami-gold" />
            <span className="text-xs font-bold tracking-[0.25em] text-daami-gold uppercase">Please Login to Purchase</span>
          </div>
          <Link href="/" className="inline-flex flex-col items-center" onClick={onClose}>
            <span className="text-2xl font-bold tracking-[0.2em] text-white uppercase">DAAMI</span>
            <span className="text-[8px] tracking-[0.4em] text-daami-gold/70 uppercase font-medium">CLOTHING</span>
          </Link>
          <p className="text-white/50 text-xs mt-2">Sign in to add items to cart or buy now</p>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 mb-4">
              {error}
            </div>
          )}

          {hasGoogleClientId && (
            <>
              <div ref={googleBtnRef} className="w-full flex justify-center mb-3" />
              {googleLoading && (
                <div className="flex items-center justify-center gap-2 text-xs text-daami-gray mb-3">
                  <span className="w-3.5 h-3.5 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
                  Signing in with Google...
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-daami-gray font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray">
                {identifier.includes('@') ? <Mail size={14} /> : <Phone size={14} />}
              </div>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Email or phone number"
                className="input-field pl-9 text-sm py-2.5"
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-daami-gray" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field pl-9 pr-9 text-sm py-2.5"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-daami-gray mt-4">
            No account?{' '}
            <Link href="/auth/register" onClick={onClose} className="text-daami-gold font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
