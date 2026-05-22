import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 获取邮箱配置
export async function GET() {
  try {
    const config = query.getEmailConfig.get() as any;
    
    if (!config) {
      return NextResponse.json({
        host: '',
        port: 465,
        secure: true,
        user: '',
        password: '',
        from_email: '',
        from_name: '聚星数据平台'
      });
    }

    return NextResponse.json({
      host: config.host,
      port: config.port,
      secure: config.secure === 1,
      user: config.user,
      password: config.password,
      from_email: config.from_email,
      from_name: config.from_name
    });
  } catch (error) {
    console.error('获取邮箱配置失败:', error);
    return NextResponse.json({ error: '获取邮箱配置失败' }, { status: 500 });
  }
}

// 保存邮箱配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, secure, user, password, from_email, from_name } = body;

    if (!host || !port || !user || !password || !from_email) {
      return NextResponse.json({ error: '请填写完整的邮箱配置信息' }, { status: 400 });
    }

    // 检查是否已存在配置
    const existing = query.getEmailConfig.get();
    
    if (existing) {
      // 更新
      query.updateEmailConfig.run(
        host,
        port,
        secure ? 1 : 0,
        user,
        password,
        from_name || '聚星数据平台',
        from_email,
        (existing as any).id
      );
    } else {
      // 新增
      query.createEmailConfig.run(
        host,
        port,
        secure ? 1 : 0,
        user,
        password,
        from_name || '聚星数据平台',
        from_email
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: '邮箱配置保存成功' 
    });
  } catch (error) {
    console.error('保存邮箱配置失败:', error);
    return NextResponse.json({ error: '保存邮箱配置失败' }, { status: 500 });
  }
}
