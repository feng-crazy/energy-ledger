// 测试数据生成脚本 - 用于生成分页测试数据
// 在 Expo 开发服务器中运行此脚本

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('energy-ledger.db');

// 生成 50 条测试记录
const generateTestData = () => {
  const visions = ['vision-1', 'vision-2', 'vision-3'];
  const flowStates = ['flow-1', 'flow-2', 'flow-3', 'flow-4'];
  const drainStates = ['drain-1', 'drain-2', 'drain-3', 'drain-4', 'drain-5'];
  const types = ['flow', 'drain'];
  
  const records = [];
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const states = type === 'flow' ? flowStates : drainStates;
    const bodyStateId = states[Math.floor(Math.random() * states.length)];
    const score = type === 'flow' 
      ? Math.floor(Math.random() * 10) + 5 
      : -(Math.floor(Math.random() * 10) + 5);
    
    // 创建过去 50 天的记录
    const createdAt = now - (i * 24 * 60 * 60 * 1000) - (Math.random() * 24 * 60 * 60 * 1000);
    
    records.push({
      id: `test-${i}`,
      type,
      bodyStateId,
      score,
      visions: [visions[Math.floor(Math.random() * visions.length)]],
      log: `测试记录 ${i + 1}`,
      createdAt,
    });
  }
  
  return records;
};

// 插入测试数据
const insertTestData = async () => {
  const records = generateTestData();
  
  // 先清空现有记录（可选）
  await db.execAsync('DELETE FROM records;');
  
  // 插入新记录
  const insertSQL = 'INSERT INTO records (id, type, bodyStateId, score, visions, log, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?);';
  
  for (const record of records) {
    await db.runAsync(insertSQL, [
      record.id,
      record.type,
      record.bodyStateId,
      record.score,
      JSON.stringify(record.visions),
      record.log,
      record.createdAt,
    ]);
  }
  
  console.log(`✅ 已插入 ${records.length} 条测试记录`);
  return records.length;
};

// 运行测试
insertTestData()
  .then(count => console.log(`测试数据生成完成：${count} 条记录`))
  .catch(err => console.error('生成测试数据失败:', err));

export { insertTestData };
