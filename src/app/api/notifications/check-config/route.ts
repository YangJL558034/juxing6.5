import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // 检查SMTP配置
    const smtpConfig = db.prepare('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1').get();
    
    // 检查用户邮箱
    const usersWithEmail = db.prepare('SELECT id, name, email FROM users WHERE email IS NOT NULL AND email != ""').all();
    const allUsers = db.prepare('SELECT id, name, email FROM users').all();
    
    // 检查管理员
    const admins = db.prepare('SELECT id, name, email FROM users WHERE role = ?').all('admin');
    
    return NextResponse.json({
      success: true,
      smtpConfig: smtpConfig || null,
      hasSmtpConfig: !!smtpConfig,
      usersWithEmail: usersWithEmail.length,
      totalUsers: allUsers.length,
      admins: admins,
      allUsers: allUsers
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
