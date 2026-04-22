'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Phone, User, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register, googleSignIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);
  const googleCallbackRef = useRef(null);

  if (isAuthenticated) { router.push('/'); return null; }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const passwordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'][strength];

  googleCallbackRef.current = async (response) => {
    setError('');
    setGoogleLoading(true);
    const result = await googleSignIn(response.credential);
    setGoogleLoading(false);
    if (result.success) router.push('/');
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
        text: 'signup_with',
        width: googleBtnRef.current.offsetWidth || 400,
      });
    };
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.password) { setError('Name and password are required'); return; }
    if (tab === 'email') {
      if (!form.email) { setError('Email address is required'); return; }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) { setError('Enter a valid email address'); return; }
    }
    if (tab === 'phone') {
      if (!form.phone) { setError('Phone number is required'); return; }
      if (!/^[0-9]{10}$/.test(form.phone)) { setError('Enter a valid 10-digit phone number'); return; }
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    const email = tab === 'email' ? form.email : '';
    const phone = tab === 'phone' ? form.phone : form.phone;
    const result = await register(form.name, email, phone, form.password);
    setLoading(false);
    if (result.success) router.push('/');
    else setError(result.error);
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
          <h1 className="text-2xl font-bold text-daami-black mt-6">Create Account</h1>
          <p className="text-daami-gray text-sm mt-1">Join the Daami family today</p>
        </div>

        <div className="bg-white p-8 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-5">{error}</div>
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

          {/* Email / Phone Tabs */}
          <div className="flex border border-gray-200 mb-5">
            <button
              type="button"
              onClick={() => { setTab('email'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                tab === 'email' ? 'bg-daami-black text-white' : 'text-daami-gray hover:text-daami-black'
              }`}
            >
              <Mail size={14} /> Email
            </button>
            <button
              type="button"
              onClick={() => { setTab('phone'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                tab === 'phone' ? 'bg-daami-black text-white' : 'text-daami-gray hover:text-daami-black'
              }`}
            >
              <Phone size={14} /> Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="input-field pl-10" />
              </div>
            </div>

            {tab === 'email' ? (
              <div>
                <label className="label-field">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field pl-10" />
                </div>
              </div>
            ) : (
              <div>
                <label className="label-field">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="9800000000" maxLength={10} className="input-field pl-10" />
                </div>
              </div>
            )}

            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${strengthColor}`} style={{ width: `${(strength / 4) * 100}%` }} />
                  </div>
                  <span className={`text-[10px] font-medium ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-600' : strength === 3 ? 'text-blue-500' : 'text-green-500'}`}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="label-field">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-daami-gray" />
                <input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="Repeat your password" className="input-field pl-10 pr-10" />
                {form.confirm && form.password === form.confirm && (
                  <Check size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Account...</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-daami-gray mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-daami-gold font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
