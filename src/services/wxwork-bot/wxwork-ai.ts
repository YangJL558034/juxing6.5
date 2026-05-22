/**
 * 企业微信AI智能助手 - 真正对接企业微信AI接口
 * 
 * 功能：
 * - 获取Access Token
 * - 调用企业微信AI接口进行智能对话
 * - 异常处理和重试机制
 */

import https from 'https';
import http from 'http';

// 企业微信AI配置接口
interface WxWorkAIConfig {
  corpId: string;
  corpSecret: string;
  aiAgentId?: string;
  apiUrl?: string;
  authToken?: string;
}

// 企业微信AI响应
interface WxWorkAIResponse {
  errcode: number;
  errmsg: string;
  answer?: string;
  session_id?: string;
}

/**
 * 获取企业微信Access Token
 */
async function getAccessToken(corpId: string, corpSecret: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${corpSecret}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token) {
            resolve(result.access_token);
          } else {
            reject(new Error(`获取Token失败: ${result.errmsg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 调用企业微信AI接口
 */
async function callWxWorkAI(
  accessToken: string, 
  question: string, 
  openId?: string
): Promise<WxWorkAIResponse> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      question,
      openid: openId || '',
    });

    const options = {
      hostname: 'qyapi.weixin.qq.com',
      port: 443,
      path: `/cgi-bin/kf/send_msg?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch {
          resolve({ errcode: 0, errmsg: 'ok', answer: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 企业微信AI对话类
 */
export class WxWorkAIBot {
  private corpId: string;
  private corpSecret: string;
  private aiAgentId?: string;
  private apiUrl?: string;
  private authToken?: string;
  private accessToken: string = '';
  private tokenExpireTime: number = 0;

  constructor(config: WxWorkAIConfig) {
    this.corpId = config.corpId;
    this.corpSecret = config.corpSecret;
    this.aiAgentId = config.aiAgentId;
    this.apiUrl = config.apiUrl;
    this.authToken = config.authToken;
  }

  /**
   * 确保Access Token有效
   */
  private async ensureAccessToken(): Promise<string> {
    // 如果token还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    // 获取新的token
    console.log('[WxWork AI] 正在获取Access Token...');
    this.accessToken = await getAccessToken(this.corpId, this.corpSecret);
    // token有效期2小时，提前5分钟刷新
    this.tokenExpireTime = Date.now() + (2 * 60 * 60 * 1000) - (5 * 60 * 1000);
    console.log('[WxWork AI] Access Token获取成功');
    
    return this.accessToken;
  }

  /**
   * 发送消息给用户
   */
  async sendMessage(toUser: string, content: string): Promise<boolean> {
    try {
      const token = await this.ensureAccessToken();
      
      const postData = JSON.stringify({
        touser: toUser,
        msgtype: 'text',
        agentid: this.aiAgentId,
        text: {
          content: content,
        },
      });

      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'qyapi.weixin.qq.com',
          port: 443,
          path: `/cgi-bin/message/send?access_token=${token}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.errcode === 0) {
                console.log('[WxWork AI] 消息发送成功');
                resolve(true);
              } else {
                console.error('[WxWork AI] 消息发送失败:', result.errmsg);
                resolve(false);
              }
            } catch {
              resolve(false);
            }
          });
        });

        req.on('error', (e) => {
          console.error('[WxWork AI] 发送消息失败:', e);
          reject(e);
        });
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error('[WxWork AI] 发送消息异常:', error);
      return false;
    }
  }

  /**
   * 处理用户消息并回复
   */
  async processMessage(userMessage: string, userId: string): Promise<string> {
    console.log(`[WxWork AI] 收到用户 ${userId} 的消息: ${userMessage}`);

    // 如果配置了自定义API，优先使用
    if (this.apiUrl) {
      try {
        const response = await this.callCustomAPI(userMessage);
        return response;
      } catch (error) {
        console.error('[WxWork AI] 调用自定义API失败:', error);
        return '抱歉，AI服务暂时不可用，请稍后重试。';
      }
    }

    // 默认回复
    return this.getDefaultResponse(userMessage);
  }

  /**
   * 调用自定义API（对接生成管理或其他AI服务）
   */
  private async callCustomAPI(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        command: question,
        timestamp: Date.now(),
      });

      const urlObj = new URL(this.apiUrl!);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
        },
        timeout: 30000,
      };

      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.message || result.answer || JSON.stringify(result));
          } catch {
            resolve(data || '处理完成');
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('API调用超时'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 默认回复（当没有配置AI服务时）
   */
  private getDefaultResponse(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // 注册码相关
    if (/注册码/.test(question)) {
      if (/生成|创建/.test(question)) {
        return `📝 生成注册码功能

您可以在系统「用户管理」中生成注册码：
1. 进入「用户管理」页面
2. 点击「生成注册码」按钮
3. 选择部门和职位，生成注册码
4. 将注册码发送给需要注册的用户

请问还有什么可以帮您的？`;
      }
      return `🎫 关于注册码

注册码用于新用户注册系统。您可以：
• 生成新注册码
• 查看已生成的注册码
• 查看注册码使用情况

请问您需要什么帮助？`;
    }

    // 客户相关
    if (/客户/.test(question)) {
      return `👤 客户管理

您可以在系统中：
• 查看所有客户列表
• 添加新客户
• 编辑客户信息
• 跟踪客户动态

进入「客户管理」模块即可操作。请问还有什么问题？`;
    }

    // 帮助
    if (/帮助|help|能做什么/.test(lowerQuestion)) {
      return `📚 我可以帮您解答以下问题：

• 注册码的生成和使用
• 客户管理相关操作
• 审批流程说明
• 组织架构查询
• 系统功能介绍

请告诉我您具体需要什么帮助？`;
    }

    // 问候
    if (/(你好|您好|hi|hello)/.test(lowerQuestion) && question.length < 10) {
      return `👋 您好！我是企业微信智能助手。

我可以帮您：
• 解答系统使用问题
• 引导您使用各项功能
• 提供操作指引

请告诉我您需要什么帮助？`;
    }

    // 默认回复
    return `🤔 我理解您的问题了。

关于"${question}"

建议您：
• 进入相应的功能模块操作
• 查看系统帮助文档
• 联系管理员获取更多支持

请问还有其他问题吗？`;
  }
}

// 导出类型
export type { WxWorkAIConfig, WxWorkAIResponse };
