import { NextRequest, NextResponse } from 'next/server';
import { query, getSubordinateUserIds } from '@/lib/database';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  return getTokenFromHeader(request.headers.get('cookie'));
}

// 获取职位列表
export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const positions = query.positions.getAll.all() as Array<{
      id: number;
      name: string;
      level: number;
      department_id: number | null;
      can_approve_purchase: number;
      can_approve_expense: number;
      approval_limit: number;
      remark: string | null;
      created_at: string;
    }>;

    return NextResponse.json({ success: true, positions });
  } catch (error) {
    console.error('获取职位列表失败:', error);
    return NextResponse.json({ error: '获取职位列表失败' }, { status: 500 });
  }
}

// 创建职位
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const { name, level, department_id, can_approve_purchase, can_approve_expense, approval_limit, remark } = body;

    if (!name) {
      return NextResponse.json({ error: '职位名称不能为空' }, { status: 400 });
    }

    const result = query.positions.create.run(
      name,
      level || 1,
      department_id || null,
      can_approve_purchase ? 1 : 0,
      can_approve_expense ? 1 : 0,
      approval_limit || 0,
      remark || null
    );

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: '职位创建成功' 
    });
  } catch (error) {
    console.error('创建职位失败:', error);
    return NextResponse.json({ error: '创建职位失败' }, { status: 500 });
  }
}
