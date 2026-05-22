import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { host, port, secure, user, password, from_name, from_email } = await request.json();
    
    if (!host || !user || !from_email) {
      return NextResponse.json({ error: '请填写完整的邮箱配置' }, { status: 400 });
    }
    
    // 创建传输器
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(String(port)) || 465,
      secure: secure !== false,
      auth: password ? {
        user,
        pass: password,
      } : undefined,
    });
    
    // 发送测试邮件
    const info = await transporter.sendMail({
      from: `"${from_name}" <${from_email}>`,
      to: user, // 发送给自己
      subject: '聚星数据平台 - 邮箱配置测试',
      text: '恭喜！您的邮箱服务器配置成功，可以正常发送邮件了。',
      html: `
        <div style="padding: 20px; background: #f5f5f5; border-radius: 10px;">
          <h2 style="color: #333;">邮箱配置测试成功</h2>
          <p style="color: #666;">恭喜！您的邮箱服务器配置成功，可以正常发送邮件了。</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #999; font-size: 12px;">此邮件由聚星数据平台自动发送，请勿回复。</p>
        </div>
      `,
    });
    
    console.log('Test email sent:', info.messageId);
    
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : '发送失败';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
