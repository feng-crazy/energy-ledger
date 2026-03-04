// Custom React Context for global app state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Vision, EnergyRecord, Commitment, UserStats } from '@/types';
import * as Storage from '@/store/storage';

interface AppContextType {
  // State
  visions: Vision[];
  records: EnergyRecord[];
  activeCommitment: Commitment | null;
  stats: UserStats;
  hasOnboarded: boolean;
  isLoading: boolean;
  
  // Actions
  refreshVisions: () => Promise<void>;
  addVision: (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vision>;
  updateVision: (id: string, updates: Partial<Vision>) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;
  
  refreshRecords: () => Promise<void>;
  addRecord: (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => Promise<EnergyRecord>;
  updateRecordAiReport: (id: string, report: EnergyRecord['aiReport']) => Promise<void>;
  
  refreshActiveCommitment: () => Promise<void>;
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => Promise<Commitment>;
  completeCommitment: (id: string) => Promise<void>;
  failCommitment: (id: string, reason?: string, tag?: string) => Promise<void>;
  
  refreshStats: () => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
  
  completeOnboarding: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalEnergy: 0,
    streak: 0,
    maxStreak: 0,
    lastRecordDate: '',
    completedCommitments: 0,
  });
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize on mount
  useEffect(() => {
    async function loadData() {
      try {
        await Storage.initDatabase();
        const [loadedVisions, loadedRecords, loadedCommitment, loadedStats, onboarded] = await Promise.all([
          Storage.getVisions(),
          Storage.getRecords(50),
          Storage.getActiveCommitment(),
          Storage.getUserStats(),
          Storage.getHasOnboarded(),
        ]);
        
        setVisions(loadedVisions);
        setRecords(loadedRecords);
        setActiveCommitment(loadedCommitment);
        setStats(loadedStats);
        setHasOnboarded(onboarded);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Vision actions
  const refreshVisions = async () => {
    const data = await Storage.getVisions();
    setVisions(data);
  };
  
  const addVision = async (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVision = await Storage.addVision(vision);
    setVisions(prev => [...prev, newVision]);
    return newVision;
  };
  
  const updateVision = async (id: string, updates: Partial<Vision>) => {
    await Storage.updateVision(id, updates);
    setVisions(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };
  
  const deleteVision = async (id: string) => {
    await Storage.deleteVision(id);
    setVisions(prev => prev.filter(v => v.id !== id));
  };
  
  // Record actions
  const refreshRecords = async () => {
    const data = await Storage.getRecords(50);
    setRecords(data);
  };
  
  const addRecord = async (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => {
    const newRecord = await Storage.addRecord(record);
    setRecords(prev => [newRecord, ...prev]);
    
    // Update stats
    const newTotalEnergy = stats.totalEnergy + record.score;
    const today = new Date().toISOString().split('T')[0];
    const isConsecutiveDay = stats.lastRecordDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = isConsecutiveDay ? stats.streak + 1 : (stats.lastRecordDate === today ? stats.streak : 1);
    
    const newStats = {
      totalEnergy: newTotalEnergy,
      streak: newStreak,
      maxStreak: Math.max(stats.maxStreak, newStreak),
      lastRecordDate: today,
    };
    
    await Storage.updateUserStats(newStats);
    setStats(prev => ({ ...prev, ...newStats }));
    
    return newRecord;
  };
  
  const updateRecordAiReport = async (id: string, report: EnergyRecord['aiReport']) => {
    await Storage.updateRecordAiReport(id, report);
    setRecords(prev => prev.map(r => r.id === id ? { ...r, hasAiReport: true, aiReport: report } : r));
  };
  
  // Commitment actions
  const refreshActiveCommitment = async () => {
    const data = await Storage.getActiveCommitment();
    setActiveCommitment(data);
  };
  
  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => {
    const newCommitment = await Storage.addCommitment(commitment);
    setActiveCommitment(newCommitment);
    return newCommitment;
  };
  
  const completeCommitment = async (id: string) => {
    await Storage.completeCommitment(id);
    await refreshActiveCommitment();
    
    // Update stats
    const newCompletedCount = stats.completedCommitments + 1;
    await Storage.updateUserStats({ completedCommitments: newCompletedCount });
    setStats(prev => ({ ...prev, completedCommitments: newCompletedCount }));
  };
  
  const failCommitment = async (id: string, reason?: string, tag?: string) => {
    await Storage.failCommitment(id, reason, tag);
    await refreshActiveCommitment();
  };
  
  // Stats actions
  const refreshStats = async () => {
    const data = await Storage.getUserStats();
    setStats(data);
  };
  
  const updateStats = async (updates: Partial<UserStats>) => {
    await Storage.updateUserStats(updates);
    setStats(prev => ({ ...prev, ...updates }));
  };
  
  // Onboarding
  const completeOnboarding = async () => {
    await Storage.setHasOnboarded(true);
    setHasOnboarded(true);
  };
  
  return (
    <AppContext.Provider
      value={{
        visions,
        records,
        activeCommitment,
        stats,
        hasOnboarded,
        isLoading,
        refreshVisions,
        addVision,
        updateVision,
        deleteVision,
        refreshRecords,
        addRecord,
        updateRecordAiReport,
        refreshActiveCommitment,
        addCommitment,
        completeCommitment,
        failCommitment,
        refreshStats,
        updateStats,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}