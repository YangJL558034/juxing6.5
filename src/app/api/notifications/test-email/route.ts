import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import * as nodemailer from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  secure: number;
  user: string;
  pass: string;
  from_email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;
    
    if (!to) {
      return NextResponse.json({ success: false, error: '请提供收件人邮箱' }, { status: 400 });
    }
    
    // 获取SMTP配置
    const config = db.prepare('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1').get() as SmtpConfig | undefined;
    
    if (!config) {
      return NextResponse.json({ success: false, error: 'SMTP配置未找到' });
    }
    
    console.log('[Test Email] SMTP配置:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user ? '***' : '空',
      from_email: config.from_email
    });
    
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: Boolean(config.secure),
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // 测试连接
      await transporter.verify();
      console.log('[Test Email] SMTP连接测试成功');
      
      // 发送测试邮件
      const result = await transporter.sendMail({
        from: config.from_email,
        to,
        subject: '【聚星数据平台】邮件测试',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">邮件测试成功！</h2>
            <p style="color: #666; line-height: 1.6;">您的邮件配置已正确设置，可以正常发送邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">此邮件由聚星数据平台自动发送，请勿回复。</p>
          </div>
        `
      });
      
      console.log('[Test Email] 发送成功:', { to, messageId: result.messageId });
      return NextResponse.json({ 
        success: true, 
        message: '邮件发送成功',
        messageId: result.messageId 
      });
      
    } catch (error: any) {
      console.error('[Test Email] 发送失败:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: `发送失败: ${error.message}` 
      });
    }
    
  } catch (error: any) {
    console.error('[Test Email] 处理请求失败:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
