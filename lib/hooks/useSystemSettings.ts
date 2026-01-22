import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';

export interface SystemSettings {
  isPricingPageVisible: boolean;
  isMaintenancePageVisible: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  isPricingPageVisible: true,
  isMaintenancePageVisible: true,
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const db = getFirestoreDb();
    const docRef = doc(db, 'system_settings', 'general');

    const unsubscribe = onSnapshot(
      docRef,
      snap => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      error => {
        console.error('Error fetching system settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const db = getFirestoreDb();
    const docRef = doc(db, 'system_settings', 'general');
    await setDoc(docRef, newSettings, { merge: true });
  };

  return { settings, loading, updateSettings };
}
