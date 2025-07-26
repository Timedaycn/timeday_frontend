#!/usr/bin/env node
/**
 * 代码质量检查脚本
 * 用于检测代码冗余、逻辑错误和性能问题
 */

const fs = require('fs');
const path = require('path');

class CodeQualityChecker {
  constructor() {
    this.issues = [];
    this.srcDir = path.join(__dirname, '../src');
  }

  // 检查文件中的常见问题
  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);

    this.checkForEvalUsage(content, fileName);
    this.checkForDeprecatedAPIs(content, fileName);
    this.checkForPerformanceIssues(content, fileName);
    this.checkForCodeDuplication(content, fileName);
    this.checkForUnusedImports(content, fileName);
    this.checkForConsoleStatements(content, fileName);
    this.checkForTodoComments(content, fileName);
  }

  // 检查eval使用
  checkForEvalUsage(content, fileName) {
    const evalPatterns = [
      /\beval\s*\(/g,
      /new\s+Function\s*\(/g,
      /setTimeout\s*\(\s*['"`]/g,
      /setInterval\s*\(\s*['"`]/g
    ];

    evalPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const types = ['eval()', 'new Function()', 'setTimeout with string', 'setInterval with string'];
        this.issues.push({
          type: 'CSP_VIOLATION',
          severity: 'HIGH',
          file: fileName,
          message: `发现可能触发CSP警告的代码: ${types[index]}`,
          count: matches.length
        });
      }
    });
  }

  // 检查弃用的API
  checkForDeprecatedAPIs(content, fileName) {
    const deprecatedPatterns = [
      { pattern: /addEventListener\s*\(\s*['"`]beforeunload['"`]/g, api: 'beforeunload事件' },
      { pattern: /addEventListener\s*\(\s*['"`]unload['"`]/g, api: 'unload事件' },
      { pattern: /document\.write\s*\(/g, api: 'document.write' },
      { pattern: /escape\s*\(/g, api: 'escape函数' },
      { pattern: /unescape\s*\(/g, api: 'unescape函数' }
    ];

    deprecatedPatterns.forEach(({ pattern, api }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          type: 'DEPRECATED_API',
          severity: 'MEDIUM',
          file: fileName,
          message: `使用了弃用的API: ${api}`,
          count: matches.length
        });
      }
    });
  }

  // 检查性能问题
  checkForPerformanceIssues(content, fileName) {
    const performanceIssues = [
      { pattern: /setInterval\s*\([^,]+,\s*[1-9]\d{0,2}\s*\)/g, issue: '高频定时器 (<1000ms)' },
      { pattern: /document\.getElementById\s*\([^)]+\).*document\.getElementById/g, issue: '重复的DOM查询' },
      { pattern: /localStorage\.getItem\s*\([^)]+\).*localStorage\.getItem/g, issue: '重复的localStorage读取' },
      { pattern: /JSON\.parse\s*\(.*JSON\.stringify/g, issue: '不必要的JSON序列化/反序列化' }
    ];

    performanceIssues.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        this.issues.push({
          type: 'PERFORMANCE',
          severity: 'MEDIUM',
          file: fileName,
          message: `性能问题: ${issue}`,
          count: matches.length
        });
      }
    });
  }

  // 检查代码重复
  checkForCodeDuplication(content, fileName) {
    const lines = content.split('\n').filter(line => line.trim().length > 10);
    const lineCount = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
      }
    });

    Object.entries(lineCount).forEach(([line, count]) => {
      if (count > 2) {
        this.issues.push({
          type: 'CODE_DUPLICATION',
          severity: 'LOW',
          file: fileName,
          message: `代码重复: "${line.substring(0, 50)}..." 出现 ${count} 次`,
          count: count
        });
      }
    });
  }

  // 检查未使用的导入
  checkForUnusedImports(content, fileName) {
    const importMatches = content.match(/import\s+{([^}]+)}\s+from/g);
    if (!importMatches) return;

    importMatches.forEach(importStatement => {
      const imports = importStatement.match(/{([^}]+)}/)[1]
        .split(',')
        .map(imp => imp.trim());
      
      imports.forEach(imp => {
        const regex = new RegExp(`\\b${imp}\\b`, 'g');
        const usage = content.match(regex);
        if (!usage || usage.length <= 1) { // 只在import中出现
          this.issues.push({
            type: 'UNUSED_IMPORT',
            severity: 'LOW',
            file: fileName,
            message: `可能未使用的导入: ${imp}`,
            count: 1
          });
        }
      });
    });
  }

  // 检查console语句
  checkForConsoleStatements(content, fileName) {
    const consoleMatches = content.match(/console\.(log|warn|error|info|debug)\s*\(/g);
    if (consoleMatches && consoleMatches.length > 5) {
      this.issues.push({
        type: 'CONSOLE_STATEMENTS',
        severity: 'LOW',
        file: fileName,
        message: `过多的console语句 (${consoleMatches.length}个)`,
        count: consoleMatches.length
      });
    }
  }

  // 检查TODO注释
  checkForTodoComments(content, fileName) {
    const todoMatches = content.match(/\/\/(.*?)(TODO|FIXME|HACK|XXX)(.*?)$/gmi);
    if (todoMatches) {
      this.issues.push({
        type: 'TODO_COMMENTS',
        severity: 'INFO',
        file: fileName,
        message: `发现 ${todoMatches.length} 个待办事项注释`,
        count: todoMatches.length
      });
    }
  }

  // 递归检查目录
  checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        this.checkDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        this.checkFile(filePath);
      }
    });
  }

  // 生成报告
  generateReport() {
    console.log('\n🔍 代码质量检查报告\n');
    console.log('=' .repeat(50));
    
    if (this.issues.length === 0) {
      console.log('✅ 未发现明显的代码质量问题！');
      return;
    }

    // 按严重程度分组
    const groupedIssues = this.issues.reduce((acc, issue) => {
      acc[issue.severity] = acc[issue.severity] || [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    const severityOrder = ['HIGH', 'MEDIUM', 'LOW', 'INFO'];
    const severityEmojis = {
      HIGH: '🚨',
      MEDIUM: '⚠️',
      LOW: '💡',
      INFO: 'ℹ️'
    };

    severityOrder.forEach(severity => {
      if (groupedIssues[severity]) {
        console.log(`\n${severityEmojis[severity]} ${severity} 级别问题 (${groupedIssues[severity].length}个):`);
        console.log('-'.repeat(30));
        
        groupedIssues[severity].forEach(issue => {
          console.log(`📁 ${issue.file}`);
          console.log(`   ${issue.message}`);
          console.log('');
        });
      }
    });

    // 统计信息
    console.log('\n📊 统计信息:');
    console.log('-'.repeat(20));
    console.log(`总问题数: ${this.issues.length}`);
    severityOrder.forEach(severity => {
      if (groupedIssues[severity]) {
        console.log(`${severity}: ${groupedIssues[severity].length}`);
      }
    });
  }

  // 运行检查
  run() {
    console.log('🚀 开始代码质量检查...');
    this.checkDirectory(this.srcDir);
    this.generateReport();
  }
}

// 运行检查
if (require.main === module) {
  const checker = new CodeQualityChecker();
  checker.run();
}

module.exports = CodeQualityChecker;