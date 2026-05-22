import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// 获取SMTP配置
export async function GET() {
  try {
    const config = db.prepare('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1').get() as {
      host: string;
      port: number;
      secure: number;
      user: string;
      from_email: string;
    } | undefined;
    
    if (config) {
      return NextResponse.json({ 
        success: true, 
        data: {
          host: config.host,
          port: config.port,
          secure: Boolean(config.secure),
          user: config.user,
          from: config.from_email
          // 不返回密码
        }
      });
    }
    
    return NextResponse.json({ success: true, data: null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 保存SMTP配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { host, port, secure, user, pass, from } = body;
    
    if (!host || !user || !pass || !from) {
      return NextResponse.json({ success: false, error: '请填写完整配置信息' }, { status: 400 });
    }
    
    // 删除旧配置
    db.prepare('DELETE FROM smtp_config').run();
    
    // 插入新配置
    db.prepare(`
      INSERT INTO smtp_config (host, port, secure, user, pass, from_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(host, parseInt(port) || 587, secure ? 1 : 0, user, pass, from);
    
    return NextResponse.json({ success: true, message: '配置已保存' });
  } catch (error: any) {
    console.error('保存SMTP配置失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
