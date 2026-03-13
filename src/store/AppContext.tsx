// Custom React Context for global app state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig, ENERGY_SCORES } from '@/types';
import * as Storage from '@/store/storage';

// Helper functions for commitment stats
const getToday = () => new Date().toISOString().split('T')[0];
const getYesterday = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];

// Calculate new streak based on last activity date
// Returns: -1 (no change needed), 0 (reset to 1), 1 (increment)
const calculateNewStreak = (lastActivityDate: string): number => {
  const today = getToday();
  const yesterday = getYesterday();
  
  if (lastActivityDate === today) {
    // Already processed today, streak unchanged
    return -1; // Signal: no change needed
  } else if (lastActivityDate === yesterday) {
    // Consecutive day
    return 1; // Signal: increment streak
  } else {
    // Broken streak
    return 0; // Signal: reset to 1
  }
};

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
  checkDailyCommitments: () => Promise<void>;
  
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
    totalCommitments: 0,
    commitmentStreak: 0,
    lastCommitmentActivityDate: '',
    lastDailyCountDate: '',
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
    
    const newTotalCommitments = stats.totalCommitments + 1;
    await Storage.updateUserStats({ totalCommitments: newTotalCommitments });
    setStats(prev => ({ ...prev, totalCommitments: newTotalCommitments }));
    
    return newCommitment;
  };
  
  const completeCommitment = async (id: string) => {
    const commitment = activeCommitments.find(c => c.id === id);
    if (!commitment) {
      console.warn('Commitment not found:', id);
      return;
    }
    
    const isDaily = commitment.timeOption === 'daily';
    const today = new Date().toISOString().split('T')[0];
    
    if (isDaily) {
      const newStreakCount = (commitment.streakCount || 0) + 1;
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      await Storage.completeDailyCommitment(id, today, newStreakCount);
      await refreshActiveCommitments();
    } else {
      await Storage.completeCommitment(id);
      await refreshActiveCommitments();
    }
    
    if (commitment.visionId) {
      await Storage.updateVisionEnergyScore(commitment.visionId, ENERGY_SCORES.COMMITMENT_BONUS);
      setVisions(prev => prev.map(v => 
        v.id === commitment.visionId 
          ? { ...v, energyScore: v.energyScore + ENERGY_SCORES.COMMITMENT_BONUS, updatedAt: Date.now() }
          : v
      ));
    }
    
    const newCompletedCount = stats.completedCommitments + 1;

    // Update commitment streak
    const streakResult = calculateNewStreak(stats.lastCommitmentActivityDate);
    let newCommitmentStreak = stats.commitmentStreak;
    let newLastActivityDate = stats.lastCommitmentActivityDate;

    if (streakResult === 1) {
      newCommitmentStreak = stats.commitmentStreak + 1;
      newLastActivityDate = getToday();
    } else if (streakResult === 0) {
      newCommitmentStreak = 1;
      newLastActivityDate = getToday();
    }
    // streakResult === -1 means already processed today, no change

    const statsUpdate = {
      completedCommitments: newCompletedCount,
      commitmentStreak: newCommitmentStreak,
      lastCommitmentActivityDate: newLastActivityDate,
    };

    await Storage.updateUserStats(statsUpdate);
    setStats(prev => ({ ...prev, ...statsUpdate }));
  };
  
  const failCommitment = async (id: string, reason?: string, tag?: string) => {
    const commitment = activeCommitments.find(c => c.id === id);
    if (!commitment) {
      console.warn('Commitment not found:', id);
      return;
    }
    
    if (commitment.timeOption === 'daily') {
      await Storage.resetDailyCommitmentStreak(id);
    } else {
      await Storage.failCommitment(id, reason, tag);
    }
    await refreshActiveCommitments();
    
    // Update commitment streak (failed commitment also counts as processed)
    const today = getToday();
    const streakResult = calculateNewStreak(stats.lastCommitmentActivityDate);
    let newCommitmentStreak = stats.commitmentStreak;
    let newLastActivityDate = stats.lastCommitmentActivityDate;

    if (streakResult === 1) {
      newCommitmentStreak = stats.commitmentStreak + 1;
      newLastActivityDate = today;
    } else if (streakResult === 0) {
      newCommitmentStreak = 1;
      newLastActivityDate = today;
    }

    if (streakResult !== -1) {
      const statsUpdate = {
        commitmentStreak: newCommitmentStreak,
        lastCommitmentActivityDate: newLastActivityDate,
      };
      
      await Storage.updateUserStats(statsUpdate);
      setStats(prev => ({ ...prev, ...statsUpdate }));
    }
  };
  
  const deleteCommitment = async (id: string) => {
    await Storage.deleteCommitment(id);
    setActiveCommitments(prev => prev.filter(c => c.id !== id));
  };
  
  // Check and update daily commitment count for new day
  const checkDailyCommitments = async () => {
    const today = getToday();
    
    // Check if already counted today
    if (stats.lastDailyCountDate === today) {
      return;
    }
    
    // Check if there are active daily commitments
    const hasDailyCommitments = activeCommitments.some(c => 
      c.timeOption === 'daily' && c.status === 'active'
    );
    
    if (hasDailyCommitments) {
      const newTotalCommitments = stats.totalCommitments + 1;
      const statsUpdate = {
        totalCommitments: newTotalCommitments,
        lastDailyCountDate: today,
      };
      
      await Storage.updateUserStats(statsUpdate);
      setStats(prev => ({ ...prev, ...statsUpdate }));
    }
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
        checkDailyCommitments,
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