import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type } = await request.json();
    
    if (!email || !code || !type) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }
    
    // 验证验证码
    const record = query.getVerificationCode.get(email, code, type);
    
    if (!record) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: '验证码有效' });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
