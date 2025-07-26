/**
 * 性能优化工具集
 * 提供各种性能优化相关的工具函数
 */

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// safeLocalStorage已移至storageUtils.js统一管理

/**
 * 高效的时间格式化函数
 * @param {number} milliseconds - 毫秒数
 * @returns {string} 格式化的时间字符串
 */
export const formatDuration = (milliseconds) => {
  if (milliseconds < 1000) return '0m';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * 内存友好的数组分页
 * @param {Array} array - 原数组
 * @param {number} pageSize - 每页大小
 * @param {number} pageNumber - 页码（从1开始）
 * @returns {Array} 分页后的数组
 */
export const paginateArray = (array, pageSize, pageNumber) => {
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
};

/**
 * 优化的事件监听器管理
 */
export class EventListenerManager {
  constructor() {
    this.listeners = new Map();
  }
  
  /**
   * 添加事件监听器
   * @param {EventTarget} target - 事件目标
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   * @param {Object} options - 事件选项
   */
  add(target, event, handler, options = {}) {
    const key = `${target.constructor.name}-${event}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    const listenerInfo = { target, event, handler, options };
    this.listeners.get(key).push(listenerInfo);
    
    target.addEventListener(event, handler, options);
  }
  
  /**
   * 移除特定的事件监听器
   * @param {EventTarget} target - 事件目标
   * @param {string} event - 事件类型
   * @param {Function} handler - 事件处理函数
   */
  remove(target, event, handler) {
    const key = `${target.constructor.name}-${event}`;
    const listeners = this.listeners.get(key);
    
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index !== -1) {
        listeners.splice(index, 1);
        target.removeEventListener(event, handler);
      }
    }
  }
  
  /**
   * 清理所有事件监听器
   */
  cleanup() {
    for (const [key, listeners] of this.listeners) {
      listeners.forEach(({ target, event, handler }) => {
        target.removeEventListener(event, handler);
      });
    }
    this.listeners.clear();
  }
}

/**
 * 现代化的页面可见性检测
 * 替代deprecated的beforeunload事件
 */
export class VisibilityManager {
  constructor() {
    this.callbacks = {
      hidden: [],
      visible: [],
      blur: [],
      focus: []
    };
    this.init();
  }
  
  init() {
    // 使用Page Visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.callbacks.hidden.forEach(callback => callback());
      } else if (document.visibilityState === 'visible') {
        this.callbacks.visible.forEach(callback => callback());
      }
    });
    
    // 窗口焦点事件
    window.addEventListener('blur', () => {
      this.callbacks.blur.forEach(callback => callback());
    });
    
    window.addEventListener('focus', () => {
      this.callbacks.focus.forEach(callback => callback());
    });
  }
  
  /**
   * 添加回调函数
   * @param {string} event - 事件类型 ('hidden', 'visible', 'blur', 'focus')
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }
  
  /**
   * 移除回调函数
   * @param {string} event - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }
}

/**
 * 高效的动画帧管理
 * 替代setInterval进行UI更新
 */
export class AnimationFrameManager {
  constructor() {
    this.callbacks = new Set();
    this.isRunning = false;
    this.animationId = null;
  }
  
  /**
   * 添加动画回调
   * @param {Function} callback - 动画回调函数
   */
  add(callback) {
    this.callbacks.add(callback);
    this.start();
  }
  
  /**
   * 移除动画回调
   * @param {Function} callback - 动画回调函数
   */
  remove(callback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }
  
  /**
   * 开始动画循环
   */
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }
  }
  
  /**
   * 停止动画循环
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * 动画循环
   */
  loop() {
    if (this.isRunning) {
      this.callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Animation callback error:', error);
        }
      });
      
      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }
}

// 创建全局实例
export const globalVisibilityManager = new VisibilityManager();
export const globalAnimationManager = new AnimationFrameManager();

export default {
  debounce,
  throttle,
  formatDuration,
  paginateArray,
  EventListenerManager,
  VisibilityManager,
  AnimationFrameManager,
  globalVisibilityManager,
  globalAnimationManager
};