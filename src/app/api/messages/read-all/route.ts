import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

// 标记全部消息已读
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    query.messages.markAllRead.run(decoded.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记全部已读失败:', error);
    return NextResponse.json({ error: '标记全部已读失败' }, { status: 500 });
  }
}
