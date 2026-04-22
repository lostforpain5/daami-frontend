'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULTS = {
  storeName: 'Daami Clothing',
  storeEmail: 'hello@daamiclothing.com',
  storePhone: '+977 980-0000000',
  storeAddress: 'New Road, Kathmandu, Nepal',
  freeShippingThreshold: 2500,
  shippingFee: 150,
  khaltiEnabled: true,
  esewaEnabled: true,
  stripeEnabled: true,
  codEnabled: true,
  maintenanceMode: false,
};

const SettingsContext = createContext(DEFAULTS);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(data => {
        const raw = data.settings || {};
        setSettings({
          storeName: raw.storeName || DEFAULTS.storeName,
          storeEmail: raw.storeEmail || DEFAULTS.storeEmail,
          storePhone: raw.storePhone || DEFAULTS.storePhone,
          storeAddress: raw.storeAddress || DEFAULTS.storeAddress,
          freeShippingThreshold: Number(raw.freeShippingThreshold) || DEFAULTS.freeShippingThreshold,
          shippingFee: Number(raw.shippingFee) || DEFAULTS.shippingFee,
          khaltiEnabled: raw.khaltiEnabled === 'true',
          esewaEnabled: raw.esewaEnabled === 'true',
          stripeEnabled: raw.stripeEnabled === 'true',
          codEnabled: raw.codEnabled === 'true',
          maintenanceMode: raw.maintenanceMode === 'true',
        });
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
