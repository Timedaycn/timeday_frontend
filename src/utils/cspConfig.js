/**
 * CSP (Content Security Policy) 配置管理
 * 用于处理开发环境和生产环境的不同CSP需求
 */

/**
 * 获取当前环境的CSP配置
 * @returns {string} CSP策略字符串
 */
export const getCSPConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const cspMode = process.env.REACT_APP_CSP_MODE || 'production';
  
  if (isDevelopment || cspMode === 'development') {
    // 开发环境：宽松的CSP策略，允许开发工具正常工作
    return {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-eval' 'unsafe-inline' data: blob:",
      'style-src': "'self' 'unsafe-inline' data:",
      'img-src': "'self' data: blob: https:",
      'font-src': "'self' data:",
      'connect-src': "'self' ws: wss: https:",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
      'frame-ancestors': "'none'"
    };
  } else {
    // 生产环境：严格的CSP策略
    return {
      'default-src': "'self'",
      'script-src': "'self'",
      'style-src': "'self' 'unsafe-inline'", // 允许内联样式，但不允许eval
      'img-src': "'self' data: https:",
      'font-src': "'self' data:",
      'connect-src': "'self' https:",
      'object-src': "'none'",
      'base-uri': "'self'",
      'form-action': "'self'",
      'frame-ancestors': "'none'",
      'upgrade-insecure-requests': ''
    };
  }
};

/**
 * 将CSP配置对象转换为CSP字符串
 * @param {Object} cspConfig - CSP配置对象
 * @returns {string} CSP策略字符串
 */
export const formatCSPString = (cspConfig) => {
  return Object.entries(cspConfig)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ');
};

/**
 * 动态设置CSP meta标签
 * 用于在运行时更新CSP策略
 */
export const updateCSPMeta = () => {
  const cspConfig = getCSPConfig();
  const cspString = formatCSPString(cspConfig);
  
  // 查找现有的CSP meta标签
  let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (cspMeta) {
    // 更新现有标签
    cspMeta.setAttribute('content', cspString);
  } else {
    // 创建新的CSP meta标签
    cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    cspMeta.setAttribute('content', cspString);
    document.head.appendChild(cspMeta);
  }
  

};

/**
 * CSP违规报告处理
 * 监听CSP违规事件并记录
 */
export const setupCSPReporting = () => {
  // 监听CSP违规事件
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber
    };
    
    // 生产环境中记录CSP违规
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送到错误监控服务
    }
  });
};

/**
 * 初始化CSP配置
 * 在应用启动时调用
 */
export const initializeCSP = () => {
  // 设置CSP违规报告
  setupCSPReporting();
  

};

export default {
  getCSPConfig,
  formatCSPString,
  updateCSPMeta,
  setupCSPReporting,
  initializeCSP
};