// Storage Layer using SQLite (native) and AsyncStorage (web fallback)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Vision, EnergyRecord, Commitment, UserStats, AiConfig } from '@/types';

const DB_NAME = 'energy_ledger.db';

// Check if we're on web platform
const isWeb = Platform.OS === 'web';

// SQLite import (only used on native)
let SQLite: typeof import('expo-sqlite') | null = null;
if (!isWeb) {
  SQLite = require('expo-sqlite');
}

let db: any = null;

// Initialize database
export async function initDatabase(): Promise<void> {
  if (isWeb) {
    // Web: use AsyncStorage, no initialization needed
    return;
  }
  
  // Native: use SQLite
  db = await SQLite!.openDatabaseAsync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS visions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      emoji TEXT NOT NULL,
      label TEXT NOT NULL,
      desc TEXT NOT NULL,
      detail TEXT,
      energyScore INTEGER NOT NULL DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      bodyStateId TEXT NOT NULL,
      customBodyState TEXT,
      visions TEXT NOT NULL,
      journal TEXT NOT NULL,
      score INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      hasAiReport INTEGER NOT NULL DEFAULT 0,
      aiReport TEXT
    );
    
    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      visionId TEXT NOT NULL,
      timeOption TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      failReason TEXT,
      failTag TEXT,
      lastCompletedDate TEXT,
      streakCount INTEGER DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_records_createdAt ON records(createdAt);
    CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
  `);
  
  try {
    await db.runAsync(`
      UPDATE visions SET title = emoji || ' - ' || label WHERE title IS NULL OR title = '';
    `);
  } catch (error) {
    console.warn('Vision title migration failed:', error);
  }
  
  // Migrate existing visions: initialize energyScore from records
  try {
    await migrateVisionEnergyScore();
  } catch (error) {
    console.warn('Vision energyScore migration failed:', error);
  }

  try {
    await db.runAsync(`ALTER TABLE commitments ADD COLUMN lastCompletedDate TEXT`);
  } catch { /* ignore */ }
  
  try {
    await db.runAsync(`ALTER TABLE commitments ADD COLUMN streakCount INTEGER DEFAULT 0`);
  } catch { /* ignore */ }

  // Migrate existing stats with new fields
  try {
    await migrateUserStatsFields();
  } catch (error) {
    console.warn('UserStats fields migration failed:', error);
  }
}

// Migrate existing visions to have energyScore
async function migrateVisionEnergyScore(): Promise<void> {
  const visions = await getVisions();
  const records = await getRecords();
  
  for (const vision of visions) {
    const visionRecords = records.filter(r => r.visions.includes(vision.id));
    const totalScore = visionRecords.reduce((sum, r) => sum + r.score, 0);
    
    await db.runAsync(
      'UPDATE visions SET energyScore = ? WHERE id = ?',
      [totalScore, vision.id]
    );
  }
}

// Migrate existing UserStats with new fields
async function migrateUserStatsFields(): Promise<void> {
  const statsStr = await AsyncStorage.getItem('user_stats');
  if (!statsStr) return;
  
  const stats = JSON.parse(statsStr);
  
  // Add new fields if missing
  if (stats.totalCommitments === undefined) {
    stats.totalCommitments = 0;
  }
  if (stats.commitmentStreak === undefined) {
    stats.commitmentStreak = 0;
  }
  if (stats.lastCommitmentActivityDate === undefined) {
    stats.lastCommitmentActivityDate = '';
  }
  if (stats.lastDailyCountDate === undefined) {
    stats.lastDailyCountDate = '';
  }
  
  await AsyncStorage.setItem('user_stats', JSON.stringify(stats));
}

// ==================== Utility Functions ====================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== Vision CRUD ====================

export async function getVisions(): Promise<Vision[]> {
  if (isWeb) {
    const data = await AsyncStorage.getItem('visions');
    return data ? JSON.parse(data) : [];
  }
  
  if (!db) await initDatabase();
  const result = await db.getAllAsync<Vision>('SELECT * FROM visions ORDER BY createdAt DESC');
  return result;
}

export async function addVision(vision: Omit<Vision, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vision> {
  const now = Date.now();
  const newVision: Vision = {
    ...vision,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    energyScore: 0,
  };
  
  if (isWeb) {
    const visions = await getVisions();
    visions.unshift(newVision);
    await AsyncStorage.setItem('visions', JSON.stringify(visions));
    return newVision;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    'INSERT INTO visions (id, title, emoji, label, desc, detail, energyScore, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newVision.id, newVision.title, newVision.emoji, newVision.label, newVision.desc, newVision.detail || null, newVision.energyScore, newVision.createdAt, newVision.updatedAt]
  );
  
  return newVision;
}

export async function updateVision(id: string, updates: Partial<Vision>): Promise<void> {
  if (isWeb) {
    const visions = await getVisions();
    const index = visions.findIndex(v => v.id === id);
    if (index !== -1) {
      visions[index] = { ...visions[index], ...updates, updatedAt: Date.now() };
      await AsyncStorage.setItem('visions', JSON.stringify(visions));
    }
    return;
  }
  
  if (!db) await initDatabase();
  const now = Date.now();
  
  if (updates.detail !== undefined) {
    await db.runAsync(
      'UPDATE visions SET detail = ?, updatedAt = ? WHERE id = ?',
      [updates.detail, now, id]
    );
  }
}

export async function deleteVision(id: string): Promise<void> {
  if (isWeb) {
    const visions = await getVisions();
    const filtered = visions.filter(v => v.id !== id);
    await AsyncStorage.setItem('visions', JSON.stringify(filtered));
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM visions WHERE id = ?', [id]);
}

export async function updateVisionEnergyScore(id: string, delta: number): Promise<void> {
  if (isWeb) {
    const visions = await getVisions();
    const index = visions.findIndex(v => v.id === id);
    if (index !== -1) {
      visions[index].energyScore += delta;
      visions[index].updatedAt = Date.now();
      await AsyncStorage.setItem('visions', JSON.stringify(visions));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    'UPDATE visions SET energyScore = energyScore + ?, updatedAt = ? WHERE id = ?',
    [delta, Date.now(), id]
  );
}

// ==================== Energy Record CRUD ====================

export async function getRecords(limit?: number): Promise<EnergyRecord[]> {
  if (isWeb) {
    const data = await AsyncStorage.getItem('records');
    let records: EnergyRecord[] = data ? JSON.parse(data) : [];
    if (limit) records = records.slice(0, limit);
    return records;
  }
  
  if (!db) await initDatabase();
  const sql = limit 
    ? 'SELECT * FROM records ORDER BY createdAt DESC LIMIT ?'
    : 'SELECT * FROM records ORDER BY createdAt DESC';
  const result = await db.getAllAsync<EnergyRecord & { visions: string; aiReport: string | null }>(sql, limit ? [limit] : []);
  
  return result.map((r: any) => ({
    ...r,
    visions: JSON.parse(r.visions),
    aiReport: r.aiReport ? JSON.parse(r.aiReport) : undefined,
    hasAiReport: !!r.hasAiReport,
  }));
}

export async function getRecordsByDate(date: string): Promise<EnergyRecord[]> {
  const startOfDay = new Date(date).setHours(0, 0, 0, 0);
  const endOfDay = new Date(date).setHours(23, 59, 59, 999);
  
  if (isWeb) {
    const records = await getRecords();
    return records.filter(r => r.createdAt >= startOfDay && r.createdAt <= endOfDay);
  }
  
  if (!db) await initDatabase();
  
  const result = await db.getAllAsync<EnergyRecord & { visions: string; aiReport: string | null }>(
    'SELECT * FROM records WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC',
    [startOfDay, endOfDay]
  );
  
  return result.map((r: any) => ({
    ...r,
    visions: JSON.parse(r.visions),
    aiReport: r.aiReport ? JSON.parse(r.aiReport) : undefined,
    hasAiReport: !!r.hasAiReport,
  }));
}

export async function addRecord(record: Omit<EnergyRecord, 'id' | 'createdAt'>): Promise<EnergyRecord> {
  const now = Date.now();
  const newRecord: EnergyRecord = {
    ...record,
    id: generateId(),
    createdAt: now,
  };
  
  if (isWeb) {
    const records = await getRecords();
    records.unshift(newRecord);
    await AsyncStorage.setItem('records', JSON.stringify(records));
    return newRecord;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    'INSERT INTO records (id, type, bodyStateId, customBodyState, visions, journal, score, createdAt, hasAiReport, aiReport) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newRecord.id,
      newRecord.type,
      newRecord.bodyStateId,
      newRecord.customBodyState || null,
      JSON.stringify(newRecord.visions),
      newRecord.journal,
      newRecord.score,
      newRecord.createdAt,
      newRecord.hasAiReport ? 1 : 0,
      newRecord.aiReport ? JSON.stringify(newRecord.aiReport) : null,
    ]
  );
  
  return newRecord;
}

export async function updateRecordAiReport(id: string, report: EnergyRecord['aiReport']): Promise<void> {
  if (isWeb) {
    const records = await getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index].hasAiReport = true;
      records[index].aiReport = report;
      await AsyncStorage.setItem('records', JSON.stringify(records));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    'UPDATE records SET hasAiReport = 1, aiReport = ? WHERE id = ?',
    [JSON.stringify(report), id]
  );
}

export async function deleteRecord(id: string): Promise<void> {
  if (isWeb) {
    const records = await getRecords();
    const filtered = records.filter(r => r.id !== id);
    await AsyncStorage.setItem('records', JSON.stringify(filtered));
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM records WHERE id = ?', [id]);
}

// ==================== Commitment CRUD ====================

export async function getActiveCommitments(): Promise<Commitment[]> {
  if (isWeb) {
    const commitments = await getCommitments();
    return commitments.filter(c => c.status === 'active').slice(0, 3);
  }
  
  if (!db) await initDatabase();
  const result = await db.getAllAsync<Commitment>(
    "SELECT * FROM commitments WHERE status = 'active' ORDER BY createdAt ASC LIMIT 3"
  );
  return result || [];
}

export async function getCommitments(limit?: number): Promise<Commitment[]> {
  if (isWeb) {
    const data = await AsyncStorage.getItem('commitments');
    let commitments: Commitment[] = data ? JSON.parse(data) : [];
    if (limit) commitments = commitments.slice(0, limit);
    return commitments;
  }
  
  if (!db) await initDatabase();
  const sql = limit
    ? 'SELECT * FROM commitments ORDER BY createdAt DESC LIMIT ?'
    : 'SELECT * FROM commitments ORDER BY createdAt DESC';
  const result = await db.getAllAsync<Commitment>(sql, limit ? [limit] : []);
  return result;
}

export async function addCommitment(commitment: Omit<Commitment, 'id' | 'createdAt' | 'status'>): Promise<Commitment> {
  const now = Date.now();
  const newCommitment: Commitment = {
    ...commitment,
    id: generateId(),
    createdAt: now,
    status: 'active',
  };
  
  if (isWeb) {
    const commitments = await getCommitments();
    commitments.unshift(newCommitment);
    await AsyncStorage.setItem('commitments', JSON.stringify(commitments));
    return newCommitment;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    'INSERT INTO commitments (id, content, visionId, timeOption, deadline, createdAt, status, failReason, failTag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      newCommitment.id,
      newCommitment.content,
      newCommitment.visionId,
      newCommitment.timeOption,
      newCommitment.deadline,
      newCommitment.createdAt,
      newCommitment.status,
      newCommitment.failReason || null,
      newCommitment.failTag || null,
    ]
  );
  
  return newCommitment;
}

export async function completeCommitment(id: string): Promise<void> {
  if (isWeb) {
    const commitments = await getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index !== -1) {
      commitments[index].status = 'completed';
      await AsyncStorage.setItem('commitments', JSON.stringify(commitments));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync("UPDATE commitments SET status = 'completed' WHERE id = ?", [id]);
}

export async function completeDailyCommitment(id: string, lastCompletedDate: string, streakCount: number): Promise<void> {
  if (isWeb) {
    const commitments = await getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index !== -1) {
      commitments[index].lastCompletedDate = lastCompletedDate;
      commitments[index].streakCount = streakCount;
      await AsyncStorage.setItem('commitments', JSON.stringify(commitments));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    "UPDATE commitments SET lastCompletedDate = ?, streakCount = ? WHERE id = ?",
    [lastCompletedDate, streakCount, id]
  );
}

export async function failCommitment(id: string, reason?: string, tag?: string): Promise<void> {
  if (isWeb) {
    const commitments = await getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index !== -1) {
      commitments[index].status = 'failed';
      commitments[index].failReason = reason;
      commitments[index].failTag = tag;
      await AsyncStorage.setItem('commitments', JSON.stringify(commitments));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    "UPDATE commitments SET status = 'failed', failReason = ?, failTag = ? WHERE id = ?",
    [reason || null, tag || null, id]
  );
}

export async function resetDailyCommitmentStreak(id: string): Promise<void> {
  if (isWeb) {
    const commitments = await getCommitments();
    const index = commitments.findIndex(c => c.id === id);
    if (index !== -1) {
      commitments[index].streakCount = 0;
      await AsyncStorage.setItem('commitments', JSON.stringify(commitments));
    }
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync(
    "UPDATE commitments SET streakCount = 0 WHERE id = ?",
    [id]
  );
}

export async function deleteCommitment(id: string): Promise<void> {
  if (isWeb) {
    const commitments = await getCommitments();
    const filtered = commitments.filter(c => c.id !== id);
    await AsyncStorage.setItem('commitments', JSON.stringify(filtered));
    return;
  }
  
  if (!db) await initDatabase();
  await db.runAsync('DELETE FROM commitments WHERE id = ?', [id]);
}

// ==================== Statistics ====================

export async function getUserStats(): Promise<UserStats> {
  const statsStr = await AsyncStorage.getItem('user_stats');
  if (statsStr) {
    return JSON.parse(statsStr);
  }
  
  return {
    totalEnergy: 0,
    streak: 0,
    maxStreak: 0,
    lastRecordDate: '',
    completedCommitments: 0,
    totalCommitments: 0,
    commitmentStreak: 0,
    lastCommitmentActivityDate: '',
    lastDailyCountDate: '',
  };
}

export async function updateUserStats(updates: Partial<UserStats>): Promise<void> {
  const current = await getUserStats();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem('user_stats', JSON.stringify(updated));
}

// ==================== App State ====================

export async function getHasOnboarded(): Promise<boolean> {
  const value = await AsyncStorage.getItem('has_onboarded');
  return value === 'true';
}

export async function setHasOnboarded(value: boolean): Promise<void> {
  await AsyncStorage.setItem('has_onboarded', value.toString());
}

export async function getAiConfig(): Promise<AiConfig | null> {
  const data = await AsyncStorage.getItem('ai_config');
  return data ? JSON.parse(data) : null;
}

export async function setAiConfig(config: AiConfig): Promise<void> {
  await AsyncStorage.setItem('ai_config', JSON.stringify(config));
}

export async function deleteAiConfig(): Promise<void> {
  await AsyncStorage.removeItem('ai_config');
}