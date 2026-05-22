import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取任务列表
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const tasks = query.getAllTasks.all();
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ success: false, error: '获取任务失败' }, { status: 500 });
  }
}

// 新增任务
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, type, priority, status, end_date, owner, remark } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: '任务名称不能为空' }, { status: 400 });
    }

    const result = query.createTask.run(
      name,
      type || null,
      priority || '中',
      status || '进行中',
      end_date || null,
      owner || user.name,
      user.department || null,
      remark || null
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid, ...data } 
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ success: false, error: '新增任务失败' }, { status: 500 });
  }
}

// 更新任务
export async function PUT(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, type, priority, status, end_date, owner, remark } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: '任务ID不能为空' }, { status: 400 });
    }

    query.updateTask.run(name, type, priority, status, end_date, owner, remark, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: '更新任务失败' }, { status: 500 });
  }
}

// 删除任务
export async function DELETE(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '任务ID不能为空' }, { status: 400 });
    }

    query.deleteTask.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, error: '删除任务失败' }, { status: 500 });
  }
}
