// ==================== API服务 ====================
import axios from 'axios';
import { subjectsData } from './mockData.js';
import { CryptoUtils } from './CryptoUtils.js';
import { safeLocalStorage } from '../utils/storageUtils.js';
import IdUtils from '../utils/IdUtils.js';
import UserUtils from '../utils/UserUtils.js';

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://117.72.57.227',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加认证头
apiClient.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.get('authToken') || document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {

    
    // 处理认证错误
    if (error.response?.status === 401) {
      safeLocalStorage.remove('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// 所有API调用都使用真实后端接口


/**
 * API服务类 - 与后端接口对接的核心模块
 * 后端开发人员需要实现以下所有API接口
 * 所有接口都应该返回统一的响应格式：{ success: boolean, data?: any, message?: string }
 */
export const ApiService = {
  /**
   * 用户登录接口 - dv020版本
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<Object>} 登录响应
   * 
   * 后端API接口：POST /api/auth/login
   * 请求体：{ username: string, passwordHash: string }
   * 响应格式：{
   *   success: boolean,
   *   data?: {
   *     id: string,        // 新的8位用户ID格式 xxyy-zzzz
   *     username: string,
   *     email: string,
   *     isAdmin: boolean,  // 替代userType，基于ID前缀判断
   *     token: string      // JWT token或session token
   *   },
   *   message?: string
   * }
   */
  login: async (username, password) => {
    try {
      // 生成用户专用盐值并加密密码
      const salt = await CryptoUtils.generateUserSalt(username);
      const passwordHash = await CryptoUtils.hashPassword(password, salt);
      
      const response = await apiClient.post('/api/auth/login', {
        username,
        passwordHash  // 发送加密后的密码哈希
      });
      
      // 处理登录响应并验证用户数据
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        
        // 验证返回的用户ID格式
        if (!IdUtils.validateUserId(userData.id)) {
          console.error('Invalid user ID format received from server:', userData.id);
          return {
            success: false,
            message: '服务器返回的用户ID格式无效'
          };
        }
        
        // 验证isAdmin字段与ID的一致性
        const isAdminFromId = IdUtils.isAdminId(userData.id);
        if (userData.isAdmin !== isAdminFromId) {
          console.error('User admin status inconsistent with ID:', userData);
          return {
            success: false,
            message: '用户权限信息不一致'
          };
        }
        
        // 更新登录信息
        const updatedUserData = UserUtils.updateLoginInfo(userData);
        
        // 保存token到localStorage和cookie
        if (userData.token) {
          safeLocalStorage.set('authToken', userData.token);
          document.cookie = `authToken=${userData.token}; path=/; max-age=86400`; // 24小时
        }
        
        return {
          success: true,
          data: updatedUserData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查网络连接'
      };
    }
  },
  
  /**
   * 用户注册接口 - dv020版本
   * @param {string} username - 用户名
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @param {boolean} isAdmin - 是否创建管理员账户（默认false）
   * @returns {Promise<Object>} 注册响应
   * 
   * 后端API接口：POST /api/auth/register
   * 请求体：{ username: string, email: string, passwordHash: string, isAdmin?: boolean }
   * 响应格式：{
   *   success: boolean,
   *   data?: {
   *     id: string,        // 新的8位用户ID格式 xxyy-zzzz
   *     username: string,
   *     email: string,
   *     isAdmin: boolean,  // 替代userType
   *     token: string
   *   },
   *   message?: string
   * }
   */
  register: async (username, email, password, isAdmin = false) => {
    try {
      // 生成用户专用盐值并加密密码
      const salt = await CryptoUtils.generateUserSalt(username);
      const passwordHash = await CryptoUtils.hashPassword(password, salt);
      
      const requestData = {
        username,
        email,
        password,
        passwordHash,
        isAdmin  // 添加管理员标识
      };
      
      const response = await apiClient.post('/api/auth/register', requestData);
      

      
      // 处理注册响应并验证用户数据
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        
        // 验证返回的用户ID格式
        if (!IdUtils.validateUserId(userData.id)) {
          console.error('Invalid user ID format received from server:', userData.id);
          return {
            success: false,
            message: '服务器返回的用户ID格式无效'
          };
        }
        
        // 验证isAdmin字段与ID的一致性
        const isAdminFromId = IdUtils.isAdminId(userData.id);
        if (userData.isAdmin !== isAdminFromId) {
          console.error('User admin status inconsistent with ID:', userData);
          return {
            success: false,
            message: '用户权限信息不一致'
          };
        }
        
        // 创建完整的用户数据结构
        const completeUserData = {
          ...userData,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          preferences: {
            theme: 'default',
            language: 'zh-CN'
          },
          stats: {
            loginCount: 1,
            lastActiveAt: new Date().toISOString()
          }
        };
        
        // 保存token到localStorage和cookie（注册即登录）
        if (userData.token) {
          safeLocalStorage.set('authToken', userData.token);
          document.cookie = `authToken=${userData.token}; path=/; max-age=86400`; // 24小时
        }
        
        return {
          success: true,
          data: completeUserData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Register API Error:', error);
      

      
      return {
        success: false,
        message: error.response?.data?.message || '注册失败，请检查网络连接'
      };
    }
  },
  
  /**
   * 会话验证接口
   * @param {string} token - 用户token
   * @returns {Promise<Object>} 验证响应
   * 
   * 后端API接口：POST /api/auth/validate
   * 请求头：Authorization: Bearer {token}
   * 响应格式：{ success: boolean }
   */
  validateSession: async (token) => {
    try {
      const response = await apiClient.post('/api/auth/validate', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Validate Session API Error:', error);
      return {
        success: false,
        message: '会话验证失败'
      };
    }
  },

  /**
   * 切换账号接口
   * 仅清除当前会话，不删除账号数据
   * @returns {Promise<Object>} 切换响应
   * 
   * 后端API接口：POST /api/auth/logout
   * 请求头：Authorization: Bearer {token}
   * 响应格式：{ success: boolean, message?: string }
   */
  switchAccount: async () => {
    try {
      const response = await apiClient.post('/api/auth/logout');
      
      // 仅清除当前会话token，保留用户数据
      safeLocalStorage.remove('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      return response.data;
    } catch (error) {
      console.error('Switch Account API Error:', error);
      // 即使API调用失败，也要清除当前会话
      safeLocalStorage.remove('authToken');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      return {
        success: false,
        message: error.response?.data?.message || '切换账号失败，请检查网络连接'
      };
    }
  },


  
  /**
   * 获取学科数据接口
   * @returns {Promise<Object>} 学科数据响应
   * 
   * 后端API接口：GET /api/subjects
   * 响应格式：{
   *   success: boolean,
   *   data: {
   *     [subjectKey]: {
   *       name: string,
   *       icon: string,
   *       topics: Array<{
   *         id: string,
   *         name: string,
   *         papers: number,
   *         lastUpdated: string
   *       }>
   *     }
   *   }
   * }
   */
  getSubjects: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      data: subjectsData  // 后端需要从数据库获取真实的学科数据
    };
  },
  
  /**
   * 搜索试卷接口
   * @param {string} query - 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   * 
   * 后端API接口：GET /api/papers/search?q={query}
   * 响应格式：{
   *   success: boolean,
   *   data: Array<{
   *     id: string,
   *     title: string,
   *     subject: string,
   *     year: string,
   *     session: string,
   *     paperNumber: number
   *   }>
   * }
   */
  searchPapers: async (query) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      success: true,
      data: []  // 后端需要实现真实的搜索逻辑
    };
  },

  // ==================== 第三方登录接口预留 ====================

};