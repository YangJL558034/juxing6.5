/**
 * 企业微信机器人配置文件
 * 
 * 说明：
 * - 所有配置参数统一在此文件中管理
 * - 生产环境建议使用环境变量或配置中心
 * - 请勿将敏感信息提交到版本控制系统
 */

// 企业微信机器人配置
export const wxWorkBotConfig = {
  // 企业微信机器人 Bot ID（在企业微信管理后台获取）
  botId: process.env.WXWORK_BOT_ID || '',
  
  // 机器人 Secret（在企业微信管理后台获取）
  botSecret: process.env.WXWORK_BOT_SECRET || '',
  
  // 生成管理模块 API 地址
  apiUrl: process.env.WXWORK_API_URL || 'http://localhost:5000/api/generate',
  
  // API 鉴权 Token（预留）
  authToken: process.env.WXWORK_AUTH_TOKEN || '',
};

// API 调用配置
export const apiConfig = {
  // API 请求超时时间（毫秒）
  timeout: 30000,
  
  // 重试次数
  retries: 3,
  
  // 重试间隔（毫秒）
  retryDelay: 1000,
};

// 日志配置
export const logConfig = {
  // 日志级别: debug, info, warn, error
  level: process.env.LOG_LEVEL || 'info',
  
  // 是否打印到控制台
  console: true,
  
  // 日志文件路径（可选）
  file: process.env.LOG_FILE || '',
};

// 长连接配置
export const wsConfig = {
  // 心跳间隔（毫秒）
  heartbeatInterval: 30000,
  
  // 重连间隔（毫秒）
  reconnectInterval: 5000,
  
  // 最大重连次数
  maxReconnectAttempts: 10,
};

// 消息处理配置
export const messageConfig = {
  // 消息队列大小
  queueSize: 100,
  
  // 消息处理并发数
  concurrency: 5,
  
  // 消息处理超时（毫秒）
  processTimeout: 60000,
};
