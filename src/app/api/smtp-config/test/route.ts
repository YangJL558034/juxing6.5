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

// 测试发送邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;
    
    if (!to) {
      return NextResponse.json({ success: false, error: '请输入收件人邮箱' }, { status: 400 });
    }
    
    // 获取数据库中的SMTP配置
    const config = db.prepare('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1').get() as SmtpConfig | undefined;
    
    if (!config) {
      return NextResponse.json({ success: false, error: '请先保存SMTP配置' }, { status: 400 });
    }
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: Boolean(config.secure),
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
    
    // 发送测试邮件
    await transporter.sendMail({
      from: config.from_email,
      to,
      subject: '【聚星数据平台】SMTP配置测试',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #1890ff; margin-bottom: 20px;">SMTP配置测试成功</h2>
          <p style="color: #333; line-height: 1.6;">这是一封测试邮件，如果您收到此邮件，说明SMTP配置正确，系统可以正常发送通知邮件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">聚星数据平台 - 企业级CRM系统</p>
        </div>
      `
    });
    
    return NextResponse.json({ success: true, message: '测试邮件已发送' });
  } catch (error: any) {
    console.error('发送测试邮件失败:', error);
    return NextResponse.json({ success: false, error: error.message || '发送失败' }, { status: 500 });
  }
}
