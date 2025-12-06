import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/supabase/settingsService';
import { useAuth } from './AuthContext';

export interface SettingsState {
  // Ajoutez ici les propriétés de vos paramètres
  [key: string]: any;
}

const DEFAULT_SETTINGS: SettingsState = {};

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (partial: Partial<SettingsState>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    // Attendre que l'authentification soit terminée
    if (authLoading) {
      return; // Ne rien faire tant que l'auth est en cours de chargement
    }
    
    if (user) {
      loadSettings();
    } else {
      // Pas d'utilisateur, utiliser les valeurs par défaut
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadSettings = async () => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Chargement des paramètres pour:', user.id);
      const userSettings = await settingsService.getUserSettings(user.id);
      console.log('✅ Paramètres chargés:', userSettings);
      setSettings({ ...DEFAULT_SETTINGS, ...userSettings });
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des paramètres:', error);
      // Même en cas d'erreur, utiliser les valeurs par défaut pour permettre l'utilisation
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
      console.log('✅ Chargement des paramètres terminé');
    }
  };

  const updateSettings = async (partial: Partial<SettingsState>): Promise<void> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const newSettings = { ...settings, ...partial };
      await settingsService.updateUserSettings(user.id, newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}; 
