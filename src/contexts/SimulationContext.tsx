import React, { createContext, useContext, useState, useEffect } from 'react';
import { Simulation } from '../types';
import { simulationService } from '../services/supabase/simulationService';
import { useAuth } from './AuthContext';

interface SimulationContextType {
  simulations: Simulation[];
  addSimulation: (simulation: Omit<Simulation, 'id' | 'createdAt' | 'updatedAt'> & { status?: 'in_progress' | 'completed' }) => Promise<void>;
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
  getSimulationsByUser: (userId: string) => Simulation[];
  loading: boolean;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les simulations depuis Supabase
  useEffect(() => {
    if (user) {
      loadSimulations();
    } else {
      setSimulations([]);
      setLoading(false);
    }
  }, [user]);

  const loadSimulations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSimulations = await simulationService.getSimulationsByUser(user.id);
      setSimulations(userSimulations);
    } catch (error) {
      console.error('Erreur lors du chargement des simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSimulation = async (
    simulationData: Omit<Simulation, 'id' | 'createdAt' | 'updatedAt'> & { status?: 'in_progress' | 'completed' }
  ): Promise<void> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      const newSimulation = await simulationService.createSimulation({
        ...simulationData,
        userId: user.id,
        status: simulationData.status || 'in_progress',
      });
      setSimulations((prev) => [newSimulation, ...prev]);
    } catch (error) {
      console.error('Erreur lors de la création de la simulation:', error);
      throw error;
    }
  };

  const deleteSimulation = async (simulationId: string): Promise<void> => {
    try {
      await simulationService.deleteSimulation(simulationId);
      setSimulations((prev) => prev.filter((sim) => sim.id !== simulationId));
    } catch (error) {
      console.error('Erreur lors de la suppression de la simulation:', error);
      throw error;
    }
  };

  const updateSimulation = async (id: string, updates: Partial<Simulation>): Promise<void> => {
    try {
      const updated = await simulationService.updateSimulation(id, updates);
      setSimulations((prev) =>
        prev.map((sim) => (sim.id === id ? updated : sim))
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la simulation:', error);
      throw error;
    }
  };

  const getSimulationsByUser = (userId: string): Simulation[] => {
    return simulations.filter((sim) => sim.userId === userId && sim.status !== 'deleted');
  };

  return (
    <SimulationContext.Provider
      value={{
        simulations,
        addSimulation,
        updateSimulation,
        deleteSimulation,
        getSimulationsByUser,
        loading,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
