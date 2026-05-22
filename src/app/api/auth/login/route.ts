import { NextRequest, NextResponse } from 'next/server';
import { login, generateToken, setAuthCookie } from '@/lib/auth';
import { logOperationServer } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const result = await login(username, password);

    if (!result.success) {
      // 记录登录失败日志
      logOperationServer({
        userName: username,
        module: 'auth',
        action: 'login',
        details: { success: false, error: result.error },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      });

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const token = await generateToken(result.user!);

    // 记录登录成功日志
    logOperationServer({
      userId: result.user!.id,
      userName: result.user!.name || result.user!.username,
      module: 'auth',
      action: 'login',
      details: { success: true },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    });
    
    const response = NextResponse.json({ 
      success: true, 
      user: result.user,
      token: token
    });
    
    response.headers.set('Set-Cookie', setAuthCookie(token));
    
    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
