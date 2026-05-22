/**
 * AI 配置测试 API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deepSeekApiKey, doubaoApiKey, doubaoSecret, defaultProvider } = body;
    
    if (!deepSeekApiKey && !doubaoApiKey) {
      return NextResponse.json({ success: false, error: '请至少配置一个 AI 服务' });
    }
    
    if (defaultProvider === 'doubao' && doubaoApiKey && doubaoSecret) {
      // 测试豆包
      try {
        const tokenResponse = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=client_credentials&client_id=${encodeURIComponent(doubaoApiKey)}&client_secret=${encodeURIComponent(doubaoSecret)}`
        });
        
        if (!tokenResponse.ok) {
          return NextResponse.json({ success: false, error: '豆包 API Key 或 Secret 不正确' });
        }
        
        const tokenResult = await tokenResponse.json();
        if (!tokenResult.access_token) {
          return NextResponse.json({ success: false, error: '获取豆包 Access Token 失败' });
        }
        
        return NextResponse.json({ success: true, message: '豆包 AI 连接测试成功！' });
      } catch (error) {
        return NextResponse.json({ success: false, error: '豆包连接失败: ' + (error as Error).message });
      }
    } else if (defaultProvider === 'deepseek' && deepSeekApiKey) {
      // 测试 DeepSeek
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepSeekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          })
        });
        
        if (!response.ok) {
          return NextResponse.json({ success: false, error: 'DeepSeek API Key 不正确' });
        }
        
        return NextResponse.json({ success: true, message: 'DeepSeek AI 连接测试成功！' });
      } catch (error) {
        return NextResponse.json({ success: false, error: 'DeepSeek 连接失败: ' + (error as Error).message });
      }
    } else {
      return NextResponse.json({ success: false, error: '所选 AI 提供商的配置不完整' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: '测试失败: ' + (error as Error).message });
  }
}
