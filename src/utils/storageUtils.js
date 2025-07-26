/**
 * 统一存储工具
 * 提供localStorage和cookie的统一接口
 * 解决localStorage和cookie混用的问题
 */

import { CookieUtils } from '../main/Cookie.js';

/**
 * 存储策略配置
 * 定义哪些数据使用localStorage，哪些使用cookie
 */
const STORAGE_STRATEGY = {
  // 使用cookie存储的数据（适合小数据，需要服务器访问）
  cookie: [
    'authToken',
    'username',
    'sessionId'
  ],
  
  // 使用localStorage存储的数据（适合大数据，仅客户端访问）
  localStorage: [
    'userProfile',
    'dailyUsageData',
    'userAvatar',
    'theme',
    'selectedSubjects',
    'browsingHistory'
  ]
};

/**
 * 统一存储接口
 */
export class UnifiedStorage {
  /**
   * 设置数据
   * @param {string} key - 存储键
   * @param {any} value - 存储值
   * @param {Object} options - 选项
   * @returns {boolean} 是否成功
   */
  static set(key, value, options = {}) {
    try {
      if (STORAGE_STRATEGY.cookie.includes(key)) {
        // 使用cookie存储
        const cookieOptions = {
          expires: options.expires || 7, // 默认7天
          secure: options.secure || false,
          sameSite: options.sameSite || 'Lax'
        };
        return CookieUtils.setCookie(key, typeof value === 'string' ? value : JSON.stringify(value), cookieOptions.days || 7);
      } else {
        // 使用localStorage存储
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.warn(`Failed to save data (${key}):`, error);
      return false;
    }
  }
  
  /**
   * 获取数据
   * @param {string} key - 存储键
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值或默认值
   */
  static get(key, defaultValue = null) {
    try {
      if (STORAGE_STRATEGY.cookie.includes(key)) {
        // 从cookie获取
        const value = CookieUtils.getCookie(key);
        if (value === null) return defaultValue;
        
        // 尝试解析JSON
        try {
          return JSON.parse(value);
        } catch {
          return value; // 如果不是JSON，返回原始字符串
        }
      } else {
        // 从localStorage获取
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (error) {
      console.warn(`Failed to read data (${key}):`, error);
      return defaultValue;
    }
  }
  
  /**
   * 删除数据
   * @param {string} key - 存储键
   * @returns {boolean} 是否成功
   */
  static remove(key) {
    try {
      if (STORAGE_STRATEGY.cookie.includes(key)) {
        // 删除cookie
        return CookieUtils.deleteCookie(key);
      } else {
        // 删除localStorage
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to remove data (${key}):`, error);
      return false;
    }
  }
  
  /**
   * 检查数据是否存在
   * @param {string} key - 存储键
   * @returns {boolean} 是否存在
   */
  static has(key) {
    if (STORAGE_STRATEGY.cookie.includes(key)) {
      return CookieUtils.getCookie(key) !== null;
    } else {
      return localStorage.getItem(key) !== null;
    }
  }
  
  /**
   * 清空所有数据
   * @param {string} type - 清空类型 ('all', 'cookie', 'localStorage')
   */
  static clear(type = 'all') {
    try {
      if (type === 'all' || type === 'cookie') {
        STORAGE_STRATEGY.cookie.forEach(key => {
          CookieUtils.deleteCookie(key);
        });
      }
      
      if (type === 'all' || type === 'localStorage') {
        STORAGE_STRATEGY.localStorage.forEach(key => {
          localStorage.removeItem(key);
        });
      }
      
      return true;
    } catch (error) {
      console.warn('Failed to clear storage:', error);
      return false;
    }
  }
  
  /**
   * 迁移数据从localStorage到cookie或反之
   * @param {string} key - 存储键
   * @param {string} from - 源存储类型 ('localStorage' | 'cookie')
   * @param {string} to - 目标存储类型 ('localStorage' | 'cookie')
   */
  static migrate(key, from, to) {
    try {
      let value;
      
      // 获取源数据
      if (from === 'localStorage') {
        const item = localStorage.getItem(key);
        value = item ? JSON.parse(item) : null;
      } else {
        value = CookieUtils.getCookie(key);
        if (value) {
          try {
            value = JSON.parse(value);
          } catch {
            // 保持原始字符串
          }
        }
      }
      
      if (value !== null) {
        // 保存到目标存储
        if (to === 'localStorage') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          CookieUtils.setCookie(key, typeof value === 'string' ? value : JSON.stringify(value), 7);
        }
        
        // 删除源数据
        if (from === 'localStorage') {
          localStorage.removeItem(key);
        } else {
          CookieUtils.deleteCookie(key);
        }
        

        return true;
      }
      
      return false;
    } catch (error) {
      console.warn(`Failed to migrate ${key}:`, error);
      return false;
    }
  }
  
  /**
   * 获取存储统计信息
   * @returns {Object} 存储统计
   */
  static getStats() {
    const stats = {
      cookie: { count: 0, keys: [] },
      localStorage: { count: 0, keys: [] },
      total: 0
    };
    
    // 统计cookie
    STORAGE_STRATEGY.cookie.forEach(key => {
      if (CookieUtils.getCookie(key) !== null) {
        stats.cookie.count++;
        stats.cookie.keys.push(key);
      }
    });
    
    // 统计localStorage
    STORAGE_STRATEGY.localStorage.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        stats.localStorage.count++;
        stats.localStorage.keys.push(key);
      }
    });
    
    stats.total = stats.cookie.count + stats.localStorage.count;
    
    return stats;
  }
}

/**
 * 向后兼容的safeLocalStorage
 * 现在使用统一存储策略
 */
export const safeLocalStorage = {
  set: (key, value) => UnifiedStorage.set(key, value),
  get: (key, defaultValue = null) => UnifiedStorage.get(key, defaultValue),
  remove: (key) => UnifiedStorage.remove(key)
};

// 默认导出
export default UnifiedStorage;