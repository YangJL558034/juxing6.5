import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取账户列表
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const accounts = query.getAllAccounts.all();
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ success: false, error: '获取账户失败' }, { status: 500 });
  }
}

// 新增账户
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, type, balance, status, remark } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: '账户名称不能为空' }, { status: 400 });
    }

    const result = query.createAccount.run(
      name,
      type || null,
      balance || 0,
      status || '正常',
      remark || null
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid, ...data } 
    });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ success: false, error: '新增账户失败' }, { status: 500 });
  }
}

// 更新账户
export async function PUT(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, type, balance, status, remark } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: '账户ID不能为空' }, { status: 400 });
    }

    query.updateAccount.run(name, type, balance, status, remark, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ success: false, error: '更新账户失败' }, { status: 500 });
  }
}

// 删除账户
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
      return NextResponse.json({ success: false, error: '账户ID不能为空' }, { status: 400 });
    }

    query.deleteAccount.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ success: false, error: '删除账户失败' }, { status: 500 });
  }
}
