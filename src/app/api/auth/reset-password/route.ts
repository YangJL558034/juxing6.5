import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyCode } from '@/lib/email';
import bcrypt from 'bcryptjs';

// 重置密码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    // 验证验证码
    const isValid = verifyCode(email, code);
    if (!isValid) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // 获取用户
    const user = query.getUserByEmail.get(email) as any;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    query.updateUserPassword.run(hashedPassword, user.id);

    return NextResponse.json({ 
      success: true, 
      message: '密码重置成功，请使用新密码登录' 
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json({ error: '重置密码失败' }, { status: 500 });
  }
}
