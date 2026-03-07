// Custom React Context for global app state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig, ENERGY_SCORES } from '@/types';
import * as Storage from '@/store/storage';

interface AppContextType {
  // State
  visions: Vision[];
  records: EnergyRecord[];
  activeCommitments: Commitment[];
  stats: UserStats;
  hasOnboarded: boolean;
  isLoading: boolean;
  aiConfig: AiConfig | null;
  
  // Actions
  refreshVisions: () => Promise<void>;
  addVision: (vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vision>;
  updateVision: (id: string, updates: Partial<Vision>) => Promise<void>;
  deleteVision: (id: string) => Promise<void>;
  
  refreshRecords: () => Promise<void>;
  addRecord: (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => Promise<EnergyRecord>;
  updateRecordAiReport: (id: string, report: EnergyRecord['aiReport']) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  refreshActiveCommitments: () => Promise<void>;
  addCommitment: (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => Promise<Commitment>;
  completeCommitment: (id: string) => Promise<void>;
  failCommitment: (id: string, reason?: string, tag?: string) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  
  refreshStats: () => Promise<void>;
  updateStats: (updates: Partial<UserStats>) => Promise<void>;
  
  completeOnboarding: () => Promise<void>;
  
  saveAiConfig: (config: AiConfig) => Promise<void>;
  clearAiConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [activeCommitments, setActiveCommitments] = useState<Commitment[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalEnergy: 0,
    streak: 0,
    maxStreak: 0,
    lastRecordDate: '',
    completedCommitments: 0,
  });
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    async function loadData() {
      try {
        await Storage.initDatabase();
        const [loadedVisions, loadedRecords, loadedCommitments, loadedStats, onboarded, loadedAiConfig] = await Promise.all([
          Storage.getVisions(),
          Storage.getRecords(50),
          Storage.getActiveCommitments(),
          Storage.getUserStats(),
          Storage.getHasOnboarded(),
          Storage.getAiConfig(),
        ]);
        
        setVisions(loadedVisions);
        setRecords(loadedRecords);
        setActiveCommitments(loadedCommitments);
        setStats(loadedStats);
        setHasOnboarded(onboarded);
        setAiConfig(loadedAiConfig);
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
    const commitmentsToDelete = activeCommitments.filter(c => c.visionId === id && c.status === 'active');
    for (const commitment of commitmentsToDelete) {
      await Storage.deleteCommitment(commitment.id);
    }
    
    await Storage.deleteVision(id);
    setVisions(prev => prev.filter(v => v.id !== id));
    
    if (commitmentsToDelete.length > 0) {
      setActiveCommitments(prev => prev.filter(c => c.visionId !== id));
    }
  };
  
  // Record actions
  const refreshRecords = async () => {
    const data = await Storage.getRecords(50);
    setRecords(data);
  };
  
  const addRecord = async (record: Omit<EnergyRecord, 'id' | 'createdAt'>) => {
    const newRecord = await Storage.addRecord(record);
    setRecords(prev => [newRecord, ...prev]);
    
    if (record.visions.length > 0) {
      const energyPerVision = Math.floor(ENERGY_SCORES.RECORD_WITH_VISION_BONUS / record.visions.length);
      for (const visionId of record.visions) {
        await Storage.updateVisionEnergyScore(visionId, energyPerVision);
      }
      setVisions(prev => prev.map(v => 
        record.visions.includes(v.id)
          ? { ...v, energyScore: v.energyScore + energyPerVision, updatedAt: Date.now() }
          : v
      ));
    }
    
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
  
  const deleteRecord = async (id: string) => {
    await Storage.deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };
  
  // Commitment actions
  const refreshActiveCommitments = async () => {
    const data = await Storage.getActiveCommitments();
    setActiveCommitments(data);
  };
  
  const addCommitment = async (commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>) => {
    const newCommitment = await Storage.addCommitment(commitment);
    setActiveCommitments(prev => [...prev, newCommitment]);
    return newCommitment;
  };
  
  const completeCommitment = async (id: string) => {
    const commitment = activeCommitments.find(c => c.id === id);
    if (!commitment) {
      console.warn('Commitment not found:', id);
      return;
    }
    
    await Storage.completeCommitment(id);
    await refreshActiveCommitments();
    
    if (commitment.visionId) {
      await Storage.updateVisionEnergyScore(commitment.visionId, ENERGY_SCORES.COMMITMENT_BONUS);
      setVisions(prev => prev.map(v => 
        v.id === commitment.visionId 
          ? { ...v, energyScore: v.energyScore + ENERGY_SCORES.COMMITMENT_BONUS, updatedAt: Date.now() }
          : v
      ));
    }
    
    const newCompletedCount = stats.completedCommitments + 1;
    await Storage.updateUserStats({ completedCommitments: newCompletedCount });
    setStats(prev => ({ ...prev, completedCommitments: newCompletedCount }));
  };
  
  const failCommitment = async (id: string, reason?: string, tag?: string) => {
    await Storage.failCommitment(id, reason, tag);
    await refreshActiveCommitments();
  };
  
  const deleteCommitment = async (id: string) => {
    await Storage.deleteCommitment(id);
    setActiveCommitments(prev => prev.filter(c => c.id !== id));
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
  
  const saveAiConfig = async (config: AiConfig) => {
    await Storage.setAiConfig(config);
    setAiConfig(config);
  };
  
  const clearAiConfig = async () => {
    await Storage.deleteAiConfig();
    setAiConfig(null);
  };
  
  return (
    <AppContext.Provider
      value={{
        visions,
        records,
        activeCommitments,
        stats,
        hasOnboarded,
        isLoading,
        aiConfig,
        refreshVisions,
        addVision,
        updateVision,
        deleteVision,
        refreshRecords,
        addRecord,
        updateRecordAiReport,
        deleteRecord,
        refreshActiveCommitments,
        addCommitment,
        completeCommitment,
        failCommitment,
        deleteCommitment,
        refreshStats,
        updateStats,
        completeOnboarding,
        saveAiConfig,
        clearAiConfig,
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