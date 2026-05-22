import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { sendEmail } from '@/lib/email';

interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, receiverIds, senderId, senderName, sendEmailOnly, specificEmail } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '通知标题不能为空' }, { status: 400 });
    }

    // 如果是仅发送邮件给特定邮箱
    if (sendEmailOnly && specificEmail) {
      console.log(`[Notification API] 收到邮件发送请求: to=${specificEmail}, title=${title}`);
      const emailResult = await sendEmail(
        specificEmail,
        `【聚星数据平台】${title}`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${title}</h2>
          <p style="color: #666; line-height: 1.6;">${content || '您有一条新通知，请登录系统查看。'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">此邮件由聚星数据平台自动发送，请勿回复。</p>
        </div>`
      );
      
      console.log(`[Notification API] 邮件发送结果: success=${emailResult.success}, error=${emailResult.error}`);
      
      return NextResponse.json({
        success: emailResult.success,
        message: emailResult.success ? '邮件发送成功' : '邮件发送失败',
        emailError: emailResult.error,
      });
    }

    // 获取所有用户
    const allUsers = db.prepare('SELECT id, name, username, email FROM users').all() as User[];

    // 获取接收者列表
    let receivers: User[] = [];
    
    if (receiverIds === 'all') {
      // 发送给所有非管理员用户
      receivers = allUsers.filter(u => u.username !== 'admin');
    } else if (Array.isArray(receiverIds) && receiverIds.length > 0) {
      // 发送给指定用户
      receivers = receiverIds.map((id: number) => {
        return allUsers.find(u => u.id === id);
      }).filter(Boolean) as User[];
    } else {
      return NextResponse.json({ error: '请选择接收用户' }, { status: 400 });
    }

    if (receivers.length === 0) {
      return NextResponse.json({ error: '没有可接收的用户' }, { status: 400 });
    }

    // 发送通知并尝试发送邮件
    let emailCount = 0;
    const results: { userId: number; notificationId: number; emailSent: boolean; emailError?: string }[] = [];

    for (const receiver of receivers) {
      // 获取当前本地时间
      const now = new Date();
      const localTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      // 插入通知记录
      const result = db.prepare(`
        INSERT INTO notifications (title, content, sender_id, sender_name, receiver_id, receiver_name, type, email_sent, email_error, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        title,
        content || '',
        senderId || null,
        senderName || '系统',
        receiver.id,
        receiver.name,
        'info',
        0,  // email_sent
        null,  // email_error
        localTime
      );
      const notificationId = result.lastInsertRowid as number;

      // 尝试发送邮件
      let emailSent = false;
      let emailError: string | undefined;
      
      if (receiver.email) {
        const emailResult = await sendEmail(
          receiver.email,
          `【聚星数据平台】${title}`,
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${title}</h2>
            <p style="color: #666; line-height: 1.6;">${content || '您有一条新通知，请登录系统查看。'}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">此邮件由聚星数据平台自动发送，请勿回复。</p>
          </div>`
        );
        emailSent = emailResult.success;
        emailError = emailResult.error;
        
        // 更新邮件发送状态
        if (emailSent) {
          db.prepare('UPDATE notifications SET email_sent = 1 WHERE id = ?').run(notificationId);
          emailCount++;
        } else if (emailError) {
          db.prepare('UPDATE notifications SET email_error = ? WHERE id = ?').run(emailError, notificationId);
        }
      }

      results.push({
        userId: receiver.id,
        notificationId,
        emailSent,
        emailError,
      });
    }

    return NextResponse.json({
      success: true,
      message: `通知已发送给 ${receivers.length} 位用户`,
      emailCount,
      results,
    });
  } catch (error: any) {
    console.error('发送通知失败:', error);
    return NextResponse.json({ error: error.message || '发送失败' }, { status: 500 });
  }
}
