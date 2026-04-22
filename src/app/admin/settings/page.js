'use client';
import { useState, useEffect } from 'react';
import { Save, Store, Bell, CreditCard, Truck, Lock, Eye, EyeOff, User, RefreshCw, Upload, QrCode } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const DEFAULTS = {
  storeName: 'Daami Clothing',
  storeEmail: 'hello@daamiclothing.com',
  storePhone: '+977 980-0000000',
  storeAddress: 'New Road, Kathmandu, Nepal',
  freeShippingThreshold: '2500',
  shippingFee: '150',
  khaltiEnabled: 'true',
  esewaEnabled: 'true',
  stripeEnabled: 'true',
  codEnabled: 'true',
  emailNotifications: 'true',
  smsNotifications: 'false',
  maintenanceMode: 'false',
};

export default function AdminSettingsPage() {
  const { authFetch, user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const qrInputRef = useRef(null);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    authFetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(s => ({ ...s, ...data.settings }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  const bool = (key) => settings[key] === 'true' || settings[key] === true;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(s => ({ ...s, [name]: type === 'checkbox' ? String(checked) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
      if (!res.ok) { toast.error('Failed to save settings'); return; }
      toast.success('Settings saved!');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Please fill in all password fields'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setPwSaving(true);
    try {
      const res = await authFetch('/api/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to change password'); return; }
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Network error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileForm.name || !profileForm.email) { toast.error('Name and email are required'); return; }
    setProfileSaving(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to update profile'); return; }
      toast.success('Profile updated!');
    } catch {
      toast.error('Network error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('daami_token')}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setSettings(s => ({ ...s, paymentQrCode: data.url }));
      toast.success('QR code uploaded! Click "Save Store Settings" to apply.');
    } catch {
      toast.error('Upload failed');
    } finally {
      setQrUploading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-daami-black">Settings</h1>
        <p className="text-sm text-daami-gray mt-0.5">Manage your store configuration</p>
      </div>

      {/* Store Info */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <Store size={16} className="text-daami-gold" /> Store Information
        </h2>
        <div className="space-y-4">
          {[
            { name: 'storeName', label: 'Store Name', type: 'text' },
            { name: 'storeEmail', label: 'Store Email', type: 'email' },
            { name: 'storePhone', label: 'Phone Number', type: 'text' },
            { name: 'storeAddress', label: 'Address', type: 'text' },
          ].map(field => (
            <div key={field.name}>
              <label className="label-field">{field.label}</label>
              <input type={field.type} name={field.name} value={settings[field.name] || ''} onChange={handleChange} className="input-field" />
            </div>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <Truck size={16} className="text-daami-gold" /> Shipping Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label-field">Free Shipping Above (NPR)</label>
            <input type="number" name="freeShippingThreshold" value={settings.freeShippingThreshold || ''} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Standard Shipping Fee (NPR)</label>
            <input type="number" name="shippingFee" value={settings.shippingFee || ''} onChange={handleChange} className="input-field" />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <CreditCard size={16} className="text-daami-gold" /> Payment Methods
        </h2>
        <div className="space-y-3">
          {[
            { name: 'khaltiEnabled', label: 'Khalti', color: '#5C2D91' },
            { name: 'esewaEnabled', label: 'eSewa', color: '#60BB46' },
            { name: 'stripeEnabled', label: 'Stripe (Card Payments)', color: '#635BFF' },
            { name: 'codEnabled', label: 'Cash on Delivery (COD)', color: '#374151' },
          ].map(({ name, label, color }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-100 hover:bg-daami-cream/50 transition-colors">
              <input type="checkbox" name={name} checked={bool(name)} onChange={handleChange} className="accent-daami-gold w-4 h-4" />
              <span className="text-sm font-medium" style={{ color }}>{label}</span>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${bool(name) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {bool(name) ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Payment QR Code */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-2">
          <QrCode size={16} className="text-daami-gold" /> Payment QR Code
        </h2>
        <p className="text-xs text-daami-gray mb-5">This QR code is shown to customers when they choose "Online Payment" at checkout.</p>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="w-40 h-40 border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 relative overflow-hidden">
            {settings.paymentQrCode ? (
              <Image src={settings.paymentQrCode} alt="Payment QR" fill className="object-contain p-2" sizes="160px" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-300">
                <QrCode size={40} />
                <span className="text-[10px] text-center">No QR code yet</span>
              </div>
            )}
          </div>
          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="label-field">QR Code Image URL</label>
              <input
                value={settings.paymentQrCode || ''}
                onChange={e => setSettings(s => ({ ...s, paymentQrCode: e.target.value }))}
                placeholder="Paste image URL or upload below..."
                className="input-field"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => qrInputRef.current?.click()}
                disabled={qrUploading}
                className="btn-gold flex items-center gap-2 py-2.5 px-5 disabled:opacity-60"
              >
                {qrUploading
                  ? <span className="w-4 h-4 border-2 border-daami-black border-t-transparent rounded-full animate-spin" />
                  : <Upload size={15} />}
                {qrUploading ? 'Uploading...' : 'Upload QR Code'}
              </button>
              <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
              {settings.paymentQrCode && (
                <button
                  type="button"
                  onClick={() => setSettings(s => ({ ...s, paymentQrCode: '' }))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-daami-gray">After uploading, click <strong>"Save Store Settings"</strong> below to apply.</p>
          </div>
        </div>
      </div>

      {/* Notifications & Maintenance */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <Bell size={16} className="text-daami-gold" /> Notifications & Maintenance
        </h2>
        <div className="space-y-3">
          {[
            { name: 'emailNotifications', label: 'Email notifications for new orders' },
            { name: 'smsNotifications', label: 'SMS notifications for new orders' },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name={name} checked={bool(name)} onChange={handleChange} className="accent-daami-gold w-4 h-4" />
              <span className="text-sm text-daami-dark-gray">{label}</span>
            </label>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="maintenanceMode" checked={bool('maintenanceMode')} onChange={handleChange} className="accent-red-500 w-4 h-4" />
              <div>
                <span className="text-sm font-medium text-daami-dark-gray">Maintenance Mode</span>
                <p className="text-[10px] text-daami-gray">Disables the store for customers</p>
              </div>
              {bool('maintenanceMode') && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">Active</span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 py-3 px-8 disabled:opacity-60">
        {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : 'Save Store Settings'}
      </button>

      <hr className="border-gray-200" />

      {/* Admin Profile */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <User size={16} className="text-daami-gold" /> Admin Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label-field">Full Name</label>
            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="label-field">Email Address</label>
            <input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="label-field">Phone Number</label>
            <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="input-field" />
          </div>
        </div>
        <button onClick={handleProfileSave} disabled={profileSaving} className="btn-secondary flex items-center gap-2 py-2.5 px-6 mt-5 disabled:opacity-60">
          {profileSaving ? <span className="w-4 h-4 border-2 border-daami-gold border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
          {profileSaving ? 'Saving...' : 'Update Profile'}
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-daami-black uppercase tracking-wider flex items-center gap-2 mb-5">
          <Lock size={16} className="text-daami-gold" /> Change Password
        </h2>
        <div className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', show: 'current' },
            { key: 'newPassword', label: 'New Password', show: 'new' },
            { key: 'confirmPassword', label: 'Confirm New Password', show: 'confirm' },
          ].map(({ key, label, show }) => (
            <div key={key}>
              <label className="label-field">{label}</label>
              <div className="relative">
                <input
                  type={showPw[show] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === 'currentPassword' ? 'Enter current password' : 'At least 6 characters'}
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => ({ ...s, [show]: !s[show] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-daami-gray hover:text-daami-black"
                >
                  {showPw[show] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handlePasswordChange} disabled={pwSaving} className="btn-primary flex items-center gap-2 py-2.5 px-6 mt-5 disabled:opacity-60">
          {pwSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={15} />}
          {pwSaving ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
