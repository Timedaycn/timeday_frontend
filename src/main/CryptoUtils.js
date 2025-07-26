// ==================== 密码加密工具类 ====================

/**
 * 密码加密工具类
 * 提供密码哈希和验证功能，确保密码安全传输
 */
export const CryptoUtils = {
  /**
   * 使用SHA-256算法对密码进行哈希加密
   * @param {string} password - 原始密码
   * @param {string} salt - 盐值（可选，默认使用用户名作为盐值）
   * @returns {Promise<string>} 加密后的密码哈希
   */
  hashPassword: async (password, salt = '') => {
    try {
      // 将密码和盐值组合
      const passwordWithSalt = password + salt;
      
      // 将字符串转换为ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(passwordWithSalt);
      
      // 使用SHA-256进行哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // 将ArrayBuffer转换为十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return hashHex;
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('密码加密失败');
    }
  },

  /**
   * 生成随机盐值
   * @param {number} length - 盐值长度（默认16字符）
   * @returns {string} 随机盐值
   */
  generateSalt: (length = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < length; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  },

  /**
   * 验证密码是否匹配
   * @param {string} password - 原始密码
   * @param {string} hashedPassword - 已哈希的密码
   * @param {string} salt - 盐值
   * @returns {Promise<boolean>} 是否匹配
   */
  verifyPassword: async (password, hashedPassword, salt = '') => {
    try {
      const newHash = await CryptoUtils.hashPassword(password, salt);
      return newHash === hashedPassword;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  },

  /**
   * 为用户名生成一致的盐值
   * 使用用户名的哈希作为盐值，确保同一用户的盐值始终一致
   * @param {string} username - 用户名
   * @returns {Promise<string>} 基于用户名的盐值
   */
  generateUserSalt: async (username) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(username + 'SALT_SUFFIX_2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      // 取前16个字节作为盐值
      return hashArray.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Salt generation error:', error);
      return username; // 降级方案：直接使用用户名
    }
  }
};

/**
 * 密码强度验证工具
 */
export const PasswordValidator = {
  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {Object} 验证结果
   */
  validateStrength: (password) => {
    const result = {
      isValid: false,
      score: 0,
      issues: []
    };

    if (!password) {
      result.issues.push('密码不能为空');
      return result;
    }

    // 长度检查
    if (password.length < 6) {
      result.issues.push('密码长度至少6位');
    } else {
      result.score += 1;
    }

    // 包含数字
    if (/\d/.test(password)) {
      result.score += 1;
    } else {
      result.issues.push('密码应包含数字');
    }

    // 包含字母
    if (/[a-zA-Z]/.test(password)) {
      result.score += 1;
    } else {
      result.issues.push('密码应包含字母');
    }

    // 包含特殊字符（可选）
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.score += 1;
    }

    result.isValid = result.score >= 2 && password.length >= 6;
    return result;
  }
};