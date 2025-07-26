/**
 * ID工具类 - dv020版本
 * 实现新的用户ID格式: xxyy-zzzz
 * xx: 区分位 (00=管理员, 01-99=普通用户)
 * yy: 验证位 (增强版校验算法)
 * zzzz: 4位随机数字
 */

class IdUtils {
  // 权重数组用于增强校验
  static WEIGHTS = [3, 7, 11, 13];
  
  // 管理员区分位
  static ADMIN_PREFIX = '00';
  
  // 普通用户区分位范围
  static USER_PREFIX_MIN = 1;
  static USER_PREFIX_MAX = 99;

  /**
   * 生成新的用户ID
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {string} 格式为 xxyy-zzzz 的ID
   */
  static generateUserId(isAdmin = false) {
    // 生成区分位
    const prefix = isAdmin ? 
      this.ADMIN_PREFIX : 
      String(Math.floor(Math.random() * (this.USER_PREFIX_MAX - this.USER_PREFIX_MIN + 1)) + this.USER_PREFIX_MIN).padStart(2, '0');
    
    // 生成4位随机数字
    const randomDigits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    
    // 计算验证位
    const checksum = this.calculateChecksum(prefix, randomDigits);
    
    return `${prefix}${checksum}-${randomDigits}`;
  }

  /**
   * 增强版校验算法
   * 结合Luhn算法、权重校验和异或校验
   * @param {string} prefix - 区分位
   * @param {string} randomDigits - 随机数字
   * @returns {string} 2位验证位
   */
  static calculateChecksum(prefix, randomDigits) {
    const allDigits = (prefix + randomDigits).split('').map(Number);
    
    // 1. Luhn算法校验
    let luhnSum = 0;
    for (let i = allDigits.length - 1; i >= 0; i--) {
      let digit = allDigits[i];
      if ((allDigits.length - i) % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      luhnSum += digit;
    }
    
    // 2. 权重校验
    let weightSum = 0;
    for (let i = 0; i < allDigits.length; i++) {
      weightSum += allDigits[i] * this.WEIGHTS[i % this.WEIGHTS.length];
    }
    
    // 3. 异或校验
    let xorResult = 0;
    for (const digit of allDigits) {
      xorResult ^= digit;
    }
    
    // 综合计算验证位
    const checksum = (luhnSum + weightSum + xorResult) % 100;
    return String(checksum).padStart(2, '0');
  }

  /**
   * 验证ID格式和校验位
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否有效
   */
  static validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return false;
    }
    
    // 检查格式: xxyy-zzzz
    const idPattern = /^(\d{2})(\d{2})-(\d{4})$/;
    const match = userId.match(idPattern);
    
    if (!match) {
      return false;
    }
    
    const [, prefix, providedChecksum, randomDigits] = match;
    
    // 重新计算验证位
    const calculatedChecksum = this.calculateChecksum(prefix, randomDigits);
    
    // 验证校验位是否匹配
    return providedChecksum === calculatedChecksum;
  }

  /**
   * 检查是否为管理员ID
   * @param {string} userId - 用户ID
   * @returns {boolean} 是否为管理员
   */
  static isAdminId(userId) {
    if (!this.validateUserId(userId)) {
      return false;
    }
    
    return userId.startsWith(this.ADMIN_PREFIX);
  }

  /**
   * 从ID中提取区分位
   * @param {string} userId - 用户ID
   * @returns {string|null} 区分位或null
   */
  static getPrefix(userId) {
    if (!this.validateUserId(userId)) {
      return null;
    }
    
    return userId.substring(0, 2);
  }

  /**
   * 从ID中提取随机数字部分
   * @param {string} userId - 用户ID
   * @returns {string|null} 随机数字或null
   */
  static getRandomDigits(userId) {
    if (!this.validateUserId(userId)) {
      return null;
    }
    
    return userId.substring(5, 9);
  }

  /**
   * 生成用于显示的ID格式
   * @param {string} userId - 用户ID
   * @returns {string} 格式化的显示ID
   */
  static formatForDisplay(userId) {
    if (!this.validateUserId(userId)) {
      return 'Invalid ID';
    }
    
    const isAdmin = this.isAdminId(userId);
    const prefix = isAdmin ? 'Admin' : 'User';
    
    return `${prefix}-${userId}`;
  }
}

export default IdUtils;