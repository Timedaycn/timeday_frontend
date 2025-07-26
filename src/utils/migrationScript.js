/**
 * 数据迁移脚本
 * 将现有的localStorage数据迁移到统一存储策略
 */

import UnifiedStorage from './storageUtils.js';
import { CookieUtils } from '../main/Cookie.js';

/**
 * 执行数据迁移
 */
export const runMigration = () => {
  const migrationResults = {
    success: [],
    failed: [],
    skipped: []
  };
  
  // 需要迁移到cookie的数据
  const toCookieKeys = ['authToken', 'username', 'sessionId'];
  
  // 需要保持在localStorage的数据
  const toLocalStorageKeys = [
    'userProfile', 
    'dailyUsageData', 
    'userAvatar', 
    'theme', 
    'selectedSubjects', 
    'browsingHistory'
  ];
  
  // 迁移到cookie
  toCookieKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        // 检查cookie中是否已存在
        if (CookieUtils.get(key) === null) {
          const success = CookieUtils.set(key, value, { expires: 7 });
          if (success) {
            localStorage.removeItem(key);
            migrationResults.success.push(`${key} -> cookie`);
          } else {
            migrationResults.failed.push(`${key} -> cookie (设置失败)`);
          }
        } else {
          localStorage.removeItem(key); // 清理重复数据
          migrationResults.skipped.push(`${key} (cookie中已存在)`);
        }
      }
    } catch (error) {
      migrationResults.failed.push(`${key} -> cookie (${error.message})`);
    }
  });
  
  // 验证localStorage数据格式
  toLocalStorageKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        // 尝试解析JSON，确保格式正确
        JSON.parse(value);
        migrationResults.success.push(`${key} (验证通过)`);
      }
    } catch (error) {
      migrationResults.failed.push(`${key} (格式错误: ${error.message})`);
      
      // 尝试修复或清理损坏的数据
      localStorage.removeItem(key);
    }
  });
  
  // 清理未知的localStorage数据
  const knownKeys = [...toCookieKeys, ...toLocalStorageKeys];
  const allLocalStorageKeys = Object.keys(localStorage);
  
  allLocalStorageKeys.forEach(key => {
    if (!knownKeys.includes(key)) {
      // 可选择性清理或保留未知数据
      // localStorage.removeItem(key);
    }
  });
  

  
  return migrationResults;
};

/**
 * 检查是否需要迁移
 */
export const checkMigrationNeeded = () => {
  const needsMigration = [
    'authToken',
    'username',
    'sessionId'
  ].some(key => localStorage.getItem(key) !== null);
  
  return needsMigration;
};

/**
 * 自动迁移（在应用启动时调用）
 */
export const autoMigrate = () => {
  if (checkMigrationNeeded()) {
    return runMigration();
  }
  return null;
};

/**
 * 重置所有存储数据（开发/测试用）
 */
export const resetAllStorage = () => {
  if (confirm('⚠️ 确定要重置所有存储数据吗？此操作不可撤销！')) {
    UnifiedStorage.clear('all');
    return true;
  }
  return false;
};

// 开发环境下暴露到全局
if (process.env.NODE_ENV === 'development') {
  window.migrationUtils = {
    runMigration,
    checkMigrationNeeded,
    autoMigrate,
    resetAllStorage,
    getStats: () => UnifiedStorage.getStats()
  };
}

export default {
  runMigration,
  checkMigrationNeeded,
  autoMigrate,
  resetAllStorage
};