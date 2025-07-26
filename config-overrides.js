/**
 * Webpack配置覆盖
 * 用于解决CSP eval警告和优化开发体验
 */

const path = require('path');

module.exports = function override(config, env) {
  // 彻底禁用开发环境中的eval使用，解决CSP警告
  if (env === 'development') {
    // 使用cheap-module-source-map，更快且兼容CSP
    config.devtool = 'cheap-module-source-map';
    
    // 禁用HMR中的eval
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.forEach(oneOfRule => {
          if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
            oneOfRule.use.forEach(use => {
              if (use.loader && use.loader.includes('babel-loader')) {
                use.options = {
                  ...use.options,
                  plugins: [
                    ...(use.options.plugins || []),
                    // 禁用react-refresh中的eval
                    ['react-refresh/babel', { skipEnvCheck: true }]
                  ]
                };
              }
            });
          }
        });
      }
    });
    
    // 配置webpack-dev-server
    config.devServer = {
      ...config.devServer,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      },
      // 禁用热重载中的eval
      hot: true,
      liveReload: false
    };
  }
  
  // 生产环境优化
  if (env === 'production') {
    config.devtool = 'source-map';
    
    // 优化代码分割
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 10,
        maxAsyncRequests: 10,
        cacheGroups: {
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5
          }
        },
      },
    };
  }
  
  // 添加路径别名
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@components': path.resolve(__dirname, 'src/components'),
  };
  
  // 禁用所有可能使用eval的插件
  config.plugins = config.plugins.filter(plugin => {
    // 保留必要的插件，移除可能使用eval的插件
    return !plugin.constructor.name.includes('EvalSourceMapDevToolPlugin');
  });
  
  return config;
};