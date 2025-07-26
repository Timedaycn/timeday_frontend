/**
 * 用户管理工具类 - dv020版本
 * 处理新ID系统下的用户数据结构和权限管理
 */

import IdUtils from './IdUtils.js';
import { CookieUtils } from '../main/Cookie.js';

class UserUtils {
  /**
   * 创建新用户数据结构
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Object} 用户数据对象
   */
  static createUser(username, email, isAdmin = false) {
    const userId = IdUtils.generateUserId(isAdmin);
    
    return {
      id: userId,
      username: username,
      email: email,
      isAdmin: isAdmin,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      preferences: {
        theme: 'default',
        language: 'zh-CN'
      },
      stats: {
        loginCount: 0,
        lastActiveAt: null
      }
    };
  }

  /**
   * 验证用户权限
   * @param {string} userId - 用户ID
   * @param {string} requiredPermission - 所需权限 ('admin' | 'user')
   * @returns {boolean} 是否有权限
   */
  static hasPermission(userId, requiredPermission) {
    if (!IdUtils.validateUserId(userId)) {
      return false;
    }
    
    const isAdmin = IdUtils.isAdminId(userId);
    
    switch (requiredPermission) {
      case 'admin':
        return isAdmin;
      case 'user':
        return true; // 所有有效用户都有基本权限
      default:
        return false;
    }
  }

  /**
   * 获取用户角色
   * @param {string} userId - 用户ID
   * @returns {string} 用户角色 ('admin' | 'user' | 'invalid')
   */
  static getUserRole(userId) {
    if (!IdUtils.validateUserId(userId)) {
      return 'invalid';
    }
    
    return IdUtils.isAdminId(userId) ? 'admin' : 'user';
  }

  /**
   * 更新用户登录信息
   * @param {Object} userData - 用户数据
   * @returns {Object} 更新后的用户数据
   */
  static updateLoginInfo(userData) {
    const now = new Date().toISOString();
    
    return {
      ...userData,
      lastLoginAt: now,
      stats: {
        ...userData.stats,
        loginCount: (userData.stats?.loginCount || 0) + 1,
        lastActiveAt: now
      }
    };
  }

  /**
   * 从旧版本用户数据迁移到新版本
   * @param {Object} oldUserData - 旧版本用户数据
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Object} 新版本用户数据
   */
  static migrateFromOldVersion(oldUserData, isAdmin = false) {
    // 生成新的ID
    const newUserId = IdUtils.generateUserId(isAdmin);
    
    return {
      id: newUserId,
      username: oldUserData.username || oldUserData.id?.split('-')[0] || 'unknown',
      email: oldUserData.email || '',
      isAdmin: isAdmin,
      createdAt: oldUserData.createdAt || new Date().toISOString(),
      lastLoginAt: oldUserData.lastLoginAt || null,
      preferences: {
        theme: oldUserData.preferences?.theme || 'default',
        language: oldUserData.preferences?.language || 'zh-CN',
        ...oldUserData.preferences
      },
      stats: {
        loginCount: oldUserData.stats?.loginCount || 0,
        lastActiveAt: oldUserData.stats?.lastActiveAt || null,
        ...oldUserData.stats
      },
      // 保留旧版本的其他数据
      _migrated: true,
      _oldId: oldUserData.id
    };
  }

  /**
   * 获取用户显示名称
   * @param {Object} userData - 用户数据
   * @returns {string} 显示名称
   */
  static getDisplayName(userData) {
    if (!userData) return 'Unknown User';
    
    const rolePrefix = userData.isAdmin ? '[Admin]' : '';
    return `${rolePrefix} ${userData.username || 'Unknown'}`;
  }

  /**
   * 检查用户数据是否需要迁移
   * @param {Object} userData - 用户数据
   * @returns {boolean} 是否需要迁移
   */
  static needsMigration(userData) {
    if (!userData || !userData.id) {
      return true;
    }
    
    // 检查ID格式是否为新版本
    return !IdUtils.validateUserId(userData.id);
  }

  /**
   * 获取所有存储的用户列表
   * @returns {Array} 用户列表
   */
  static getAllStoredUsers() {
    const users = [];
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name.startsWith('userData_')) {
        try {
          const userData = JSON.parse(decodeURIComponent(value));
          users.push(userData);
        } catch (error) {
          console.warn('Failed to parse user data from cookie:', name, error);
        }
      }
    }
    
    return users;
  }

  /**
   * 清理无效的用户数据
   */
  static cleanupInvalidUsers() {
    const users = this.getAllStoredUsers();
    
    for (const user of users) {
      if (this.needsMigration(user)) {
        // 删除旧版本的无效数据
        CookieUtils.deleteUserData(user.username || user.id);
        CookieUtils.deleteUserToken(user.username || user.id);
        CookieUtils.deleteUserAvatar(user.username || user.id);
      }
    }
  }

  /**
   * 验证用户数据完整性
   * @param {Object} userData - 用户数据
   * @returns {boolean} 数据是否完整
   */
  static validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return false;
    }
    
    // 检查必需字段
    const requiredFields = ['id', 'username', 'email'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return false;
      }
    }
    
    // 验证ID格式
    if (!IdUtils.validateUserId(userData.id)) {
      return false;
    }
    
    // 验证isAdmin字段与ID的一致性
    const isAdminFromId = IdUtils.isAdminId(userData.id);
    if (userData.isAdmin !== isAdminFromId) {
      return false;
    }
    
    return true;
  }
}

export default UserUtils;