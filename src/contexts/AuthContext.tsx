import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { authService, UserProfile } from '../services/supabase/authService';
import { creditService } from '../services/supabase/creditService';
import { cleanupOnLogin } from '../utils/localStorageCleanup';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  deductCredit: (simulationId?: string, simulationName?: string) => Promise<boolean>;
  addCredits: (credits: number) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Convertir UserProfile en User
 */
const profileToUser = (profile: UserProfile): User => {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    plan: profile.plan,
    remainingCredits: profile.remainingCredits,
    totalCredits: profile.totalCredits,
    createdAt: profile.createdAt,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  // Initialiser la session au montage
  useEffect(() => {
    let mounted = true;
    const INIT_TIMEOUT_MS = 10000; // 10 secondes maximum pour l'initialisation
    
    // Timeout de sécurité pour éviter que l'application reste bloquée
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Timeout de sécurité: libération du chargement après', INIT_TIMEOUT_MS, 'ms');
        setLoading(false);
      }
    }, INIT_TIMEOUT_MS);
    
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      clearTimeout(safetyTimeout);
      if (session?.user) {
        loadUserProfile(session.user.id, false).catch((error) => {
          console.error('❌ Erreur lors du chargement initial du profil:', error);
          // Même en cas d'erreur, libérer le chargement pour permettre à l'utilisateur de se connecter
          if (mounted) {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('❌ Erreur lors de la récupération de la session:', error);
      clearTimeout(safetyTimeout);
      if (mounted) {
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Événement auth:', event, 'Session:', session?.user?.id);
      
      // Ignorer certains événements pour éviter les appels multiples
      if (event === 'TOKEN_REFRESHED') {
        // Ne pas recharger le profil pour le refresh de token
        return;
      }
      
      // Ignorer SIGNED_IN car la fonction login() gère déjà le chargement du profil
      // avec création automatique si nécessaire
      if (event === 'SIGNED_IN') {
        console.log('⏭️ Événement SIGNED_IN ignoré, la fonction login() gère le chargement du profil');
        return;
      }
      
      if (event === 'SIGNED_OUT') {
        // Libérer le garde-fou lors de la déconnexion
        loadingProfileRef.current = null;
        loadingStartTimeRef.current = null;
        setAuthState({
          user: null,
          isAuthenticated: false,
        });
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        // Ne pas créer automatiquement le profil ici pour éviter les boucles
        // Le profil sera créé lors du login si nécessaire
        // Vérifier que ce n'est pas le même utilisateur déjà chargé
        if (authState.user?.id !== session.user.id && loadingProfileRef.current !== session.user.id) {
          await loadUserProfile(session.user.id, false);
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
        });
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Garde-fou pour éviter les appels multiples simultanés
  const loadingProfileRef = React.useRef<string | null>(null);
  const loadingStartTimeRef = React.useRef<number | null>(null);

  /**
   * Charger le profil utilisateur depuis Supabase
   */
  const loadUserProfile = async (userId: string, createIfMissing: boolean = false) => {
    const now = Date.now();
    const TIMEOUT_MS = 10000; // 10 secondes de timeout
    
    // Éviter les appels multiples pour le même utilisateur, sauf si le timeout est dépassé
    // ou si le nouvel appel a createIfMissing=true et que le précédent avait createIfMissing=false
    if (loadingProfileRef.current === userId) {
      const elapsed = loadingStartTimeRef.current ? now - loadingStartTimeRef.current : 0;
      if (elapsed < TIMEOUT_MS) {
        // Si le nouvel appel peut créer le profil et que le précédent ne le pouvait pas,
        // on permet le nouvel appel en libérant le garde-fou
        if (createIfMissing) {
          console.log('🔄 Nouvel appel avec createIfMissing=true, libération du garde-fou pour permettre la création');
          loadingProfileRef.current = null;
          loadingStartTimeRef.current = null;
        } else {
          console.log('⏸️ Chargement du profil déjà en cours pour:', userId, `(${Math.round(elapsed/1000)}s)`);
          return;
        }
      } else {
        console.warn('⚠️ Timeout du chargement précédent, relance...');
        // Libérer le garde-fou pour permettre un nouveau chargement
        loadingProfileRef.current = null;
        loadingStartTimeRef.current = null;
      }
    }

    try {
      loadingProfileRef.current = userId;
      loadingStartTimeRef.current = now;
      setLoading(true);
      console.log('📥 Début du chargement du profil pour:', userId);
      
      const profile = await authService.getUserProfile(userId);
      if (profile) {
        // Vérifier si le nom doit être mis à jour depuis les métadonnées
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const nameFromMetadata = authUser?.user_metadata?.name;
        const shouldUpdateName = nameFromMetadata && 
          (nameFromMetadata !== profile.name || !profile.name || profile.name.trim() === '');
        
        if (shouldUpdateName) {
          // Le nom dans les métadonnées est différent ou le nom dans la BD est vide, mettre à jour
          console.log('🔄 Mise à jour du nom depuis les métadonnées:', {
            ancien: profile.name,
            nouveau: nameFromMetadata
          });
          try {
            const updatedProfile = await authService.updateUserProfile(userId, {
              name: nameFromMetadata
            });
            console.log('✅ Nom mis à jour avec succès:', updatedProfile.name);
            setAuthState({
              user: profileToUser(updatedProfile),
              isAuthenticated: true,
            });
          } catch (updateError) {
            console.error('Erreur lors de la mise à jour du nom:', updateError);
            // Utiliser le profil existant même si la mise à jour échoue
            setAuthState({
              user: profileToUser(profile),
              isAuthenticated: true,
            });
          }
        } else {
          console.log('✅ Nom du profil:', profile.name);
          setAuthState({
            user: profileToUser(profile),
            isAuthenticated: true,
          });
        }
        setLoading(false);
        return;
      }
      
      // Si le profil n'existe pas et qu'on peut le créer
      if (createIfMissing) {
        console.log('Profil non trouvé, création automatique...');
        try {
          // Récupérer les infos de l'utilisateur depuis auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Essayer de récupérer le nom depuis différentes sources
            const nameFromMetadata = authUser.user_metadata?.name;
            const nameFromEmail = authUser.email?.split('@')[0];
            const name = nameFromMetadata || nameFromEmail || 'Utilisateur';
            console.log('📝 Création du profil avec le nom:', name, '(depuis metadata:', nameFromMetadata, ', depuis email:', nameFromEmail, ')');
            await authService.createUserProfileManually(authUser.id, authUser.email || '', name);
            
            // Recharger le profil
            const newProfile = await authService.getUserProfile(userId);
            if (newProfile) {
              setAuthState({
                user: profileToUser(newProfile),
                isAuthenticated: true,
              });
              setLoading(false);
              return;
            }
          }
        } catch (createError) {
          console.error('Erreur lors de la création automatique du profil:', createError);
        }
      }
      
      // Si on arrive ici, le profil n'existe pas et n'a pas pu être créé
      console.warn('⚠️ Le profil n\'a pas pu être chargé après la connexion');
      // Libérer le garde-fou immédiatement pour permettre un nouvel appel avec createIfMissing=true
      if (loadingProfileRef.current === userId) {
        loadingProfileRef.current = null;
        loadingStartTimeRef.current = null;
      }
      // Ne pas mettre isAuthenticated: false car l'utilisateur est authentifié dans Supabase Auth
      // Juste ne pas avoir de profil chargé
      setAuthState({
        user: null,
        isAuthenticated: false, // On doit quand même mettre false car sans profil, l'app ne peut pas fonctionner
      });
    } catch (error: any) {
      console.error('Erreur lors du chargement du profil:', error);
      // Si c'est une erreur "not found", essayer de créer le profil si autorisé
      if (error?.code === 'PGRST116' && createIfMissing) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            // Essayer de récupérer le nom depuis différentes sources
            const nameFromMetadata = authUser.user_metadata?.name;
            const nameFromEmail = authUser.email?.split('@')[0];
            const name = nameFromMetadata || nameFromEmail || 'Utilisateur';
            console.log('📝 Création du profil avec le nom:', name, '(depuis metadata:', nameFromMetadata, ', depuis email:', nameFromEmail, ')');
            await authService.createUserProfileManually(authUser.id, authUser.email || '', name);
            // Recharger
            const newProfile = await authService.getUserProfile(userId);
            if (newProfile) {
              setAuthState({
                user: profileToUser(newProfile),
                isAuthenticated: true,
              });
              setLoading(false);
              return;
            }
          }
        } catch (createError) {
          console.error('Erreur lors de la création du profil:', createError);
        }
      }
      
      // En cas d'erreur, ne pas bloquer complètement mais marquer comme non authentifié
      console.error('Erreur détaillée lors du chargement du profil:', {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
      });
      
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      // TOUJOURS mettre loading à false, même en cas d'erreur
      setLoading(false);
      // Libérer le garde-fou
      if (loadingProfileRef.current === userId) {
        loadingProfileRef.current = null;
        loadingStartTimeRef.current = null;
        console.log('✅ Garde-fou libéré pour:', userId);
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const LOGIN_TIMEOUT_MS = 15000; // 15 secondes maximum pour la connexion
    
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion pour:', email);
      
      // Ajouter un timeout global pour éviter que la connexion reste bloquée
      const loginPromise = (async () => {
        const result = await authService.signIn(email, password);
        console.log('✅ Connexion Supabase Auth réussie:', result.user?.id);
        
        if (result.user) {
          // Nettoyer le localStorage des données critiques (user, orders, etc.)
          cleanupOnLogin();
          
          // Attendre un peu pour que le profil soit disponible (si créé par trigger)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Charger le profil avec création automatique si manquant
          console.log('📥 Chargement du profil utilisateur...');
          try {
            await loadUserProfile(result.user.id, true);
            
            // Vérifier que le profil a bien été chargé après un court délai
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Si le profil n'a toujours pas été chargé, réessayer une fois
            if (!authState.user) {
              console.warn('⚠️ Le profil n\'a pas pu être chargé après la connexion, nouvelle tentative...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              await loadUserProfile(result.user.id, true);
              
              // Vérifier à nouveau
              await new Promise(resolve => setTimeout(resolve, 500));
              if (!authState.user) {
                console.error('❌ Le profil n\'a toujours pas pu être chargé après deux tentatives');
                // Même si le profil ne peut pas être chargé, l'utilisateur est authentifié
                // On va permettre la connexion mais avec un message d'erreur
                throw new Error('Le profil utilisateur n\'a pas pu être chargé. Vérifiez les politiques RLS dans Supabase. Consultez GUIDE_FIX_PROFIL_CONNEXION.md');
              } else {
                console.log('✅ Profil utilisateur chargé avec succès après nouvelle tentative');
              }
            } else {
              console.log('✅ Profil utilisateur chargé avec succès');
            }
          } catch (profileError: any) {
            console.error('❌ Erreur lors du chargement du profil après connexion:', profileError);
            // Si c'est une erreur 500 ou RLS, donner un message plus clair
            if (profileError?.status === 500 || profileError?.statusCode === 500 || 
                profileError?.code === '42501' || profileError?.message?.includes('RLS')) {
              throw new Error('Erreur serveur lors du chargement du profil. Exécutez FIX_RLS_PROFIL_CONNEXION.sql dans Supabase. Consultez GUIDE_FIX_PROFIL_CONNEXION.md');
            }
            throw profileError;
          }
          
          return true;
        }
        
        console.warn('⚠️ Aucun utilisateur retourné par signIn');
        return false;
      })();
      
      // Ajouter un timeout pour éviter que la connexion reste bloquée
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('La connexion a pris trop de temps. Vérifiez votre connexion internet et réessayez.'));
        }, LOGIN_TIMEOUT_MS);
      });
      
      return await Promise.race([loginPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', {
        error,
        code: error?.code,
        message: error?.message,
        details: error?.details,
        status: error?.status,
        statusCode: error?.statusCode,
      });
      
      // Propager l'erreur pour que LoginForm puisse l'afficher
      throw error;
    } finally {
      // TOUJOURS mettre loading à false, même en cas d'erreur ou de timeout
      setLoading(false);
      console.log('✅ État de chargement réinitialisé après connexion');
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, name);
      
      // Si Supabase nécessite une confirmation d'email, l'utilisateur sera null
      // mais l'inscription est réussie
      if (result.user) {
        // Attendre un peu pour que le trigger crée le profil
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Essayer de charger le profil
        try {
          await loadUserProfile(result.user.id);
        } catch (profileError) {
          console.warn('Le profil n\'a pas pu être chargé immédiatement. Il sera créé automatiquement.');
          // Ne pas bloquer l'inscription, le profil sera créé par le trigger
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      setLoading(false);
      // Propager l'erreur pour que RegisterForm puisse l'afficher
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.signOut();
      
      // Nettoyer le localStorage lors de la déconnexion
      const { cleanupLocalStorage } = await import('../utils/localStorageCleanup');
      cleanupLocalStorage(true);
      
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!authState.user) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      const updatedProfile = await authService.updateUserProfile(authState.user.id, updates);
      setAuthState({
        user: profileToUser(updatedProfile),
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  const deductCredit = async (simulationId?: string, simulationName?: string): Promise<boolean> => {
    if (!authState.user) {
      return false;
    }

    try {
      const result = await creditService.consumeCredit(
        authState.user.id,
        simulationId || 'unknown',
        simulationName || 'Simulation'
      );

      if (result.success) {
        // Rafraîchir le profil pour obtenir les crédits mis à jour
        await refreshUser();
        console.log(`✅ Crédit consommé avec succès (Pool: ${result.creditPool?.orderNumber})`);
        return true;
      } else {
        console.error('❌ Échec de la consommation du crédit:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la consommation du crédit:', error);
      return false;
    }
  };

  const addCredits = async (credits: number): Promise<boolean> => {
    if (!authState.user || credits <= 0) {
      return false;
    }

    try {
      await updateUser({
        remainingCredits: authState.user.remainingCredits + credits,
        totalCredits: authState.user.totalCredits + credits,
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de crédits:', error);
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!authState.user) {
      return;
    }

    try {
      await loadUserProfile(authState.user.id);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de l\'utilisateur:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
        deductCredit,
        addCredits,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
