'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import LoginModal from '@/components/auth/LoginModal';

const LoginModalContext = createContext(null);

export function LoginModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  const openLoginModal = useCallback((onSuccess) => {
    setOnSuccessCallback(() => onSuccess || null);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ openLoginModal }}>
      {children}
      <LoginModal isOpen={open} onClose={close} onSuccess={onSuccessCallback} />
    </LoginModalContext.Provider>
  );
}

export const useLoginModal = () => {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error('useLoginModal must be used within LoginModalProvider');
  return ctx;
};
