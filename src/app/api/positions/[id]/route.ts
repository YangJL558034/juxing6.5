import { NextRequest, NextResponse } from 'next/server';
import { query, db } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// 获取单个职位
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    const position = query.positions.getById.get(parseInt(id));

    if (!position) {
      return NextResponse.json({ error: '职位不存在' }, { status: 404 });
    }

    return NextResponse.json({ position });
  } catch (error) {
    console.error('获取职位详情失败:', error);
    return NextResponse.json({ error: '获取职位详情失败' }, { status: 500 });
  }
}

// 更新职位
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, level, department_id, can_approve_purchase, can_approve_expense, approval_limit, remark } = body;

    if (!name) {
      return NextResponse.json({ error: '职位名称不能为空' }, { status: 400 });
    }

    query.positions.update.run(
      name,
      level || 1,
      department_id || null,
      can_approve_purchase ? 1 : 0,
      can_approve_expense ? 1 : 0,
      approval_limit || 0,
      remark || null,
      parseInt(id)
    );

    return NextResponse.json({ success: true, message: '职位更新成功' });
  } catch (error) {
    console.error('更新职位失败:', error);
    return NextResponse.json({ error: '更新职位失败' }, { status: 500 });
  }
}

// 删除职位
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    
    // 检查是否有员工使用该职位
    const employees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE position_id = ?').get(parseInt(id)) as { count: number };
    if (employees.count > 0) {
      return NextResponse.json({ error: '该职位下还有员工，无法删除' }, { status: 400 });
    }

    query.positions.delete.run(parseInt(id));

    return NextResponse.json({ success: true, message: '职位删除成功' });
  } catch (error) {
    console.error('删除职位失败:', error);
    return NextResponse.json({ error: '删除职位失败' }, { status: 500 });
  }
}
