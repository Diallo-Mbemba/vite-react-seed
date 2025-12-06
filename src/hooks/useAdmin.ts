import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/supabase/adminService';

/**
 * Hook pour vérifier si l'utilisateur actuel est un admin
 */
export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCashier, setIsCashier] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'cashier' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsCashier(false);
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const role = await adminService.getUserRole(user.id);
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsCashier(role === 'cashier');
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        setIsAdmin(false);
        setIsCashier(false);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return { isAdmin, isCashier, userRole, loading };
};

