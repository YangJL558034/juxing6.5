import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const messages = query.messages.getByUser.all(decoded.id) as Array<Record<string, unknown>>;
    
    // 获取未读数
    const unreadCount = query.messages.getUnreadCount.get(decoded.id) as { count: number };
    
    return NextResponse.json({ messages, unreadCount: unreadCount.count });
  } catch (error) {
    console.error('获取消息失败:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}
