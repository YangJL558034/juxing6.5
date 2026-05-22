import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { sendVerificationCode, generateCode, saveVerificationCode } from '@/lib/email';

// 发送验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱地址' }, { status: 400 });
    }

    // type: 'register' 注册场景，'reset' 找回密码场景
    if (type === 'register') {
      // 注册场景：检查邮箱是否已被使用
      const existingUser = query.getUserByEmail.get(email) as any;
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已被其他用户使用' }, { status: 400 });
      }
    } else {
      // 找回密码场景：检查用户是否存在
      const user = query.getUserByEmail.get(email) as any;
      if (!user) {
        return NextResponse.json({ error: '该邮箱未绑定任何用户' }, { status: 400 });
      }
    }

    // 生成验证码
    const code = generateCode();
    
    // 保存验证码
    await saveVerificationCode(email, code, type === 'register' ? 'register' : 'reset_password');
    
    // 发送邮件
    const emailType = type === 'register' ? 'register' : 'reset_password';
    const result = await sendVerificationCode(email, code, emailType);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '验证码已发送，请查收邮件'
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
  }
}
