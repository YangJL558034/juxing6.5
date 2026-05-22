import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取客户列表
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const customers = query.getAllCustomers.all();
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json({ success: false, error: '获取客户失败' }, { status: 500 });
  }
}

// 新增客户
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, level, source, phone, address, status, qualifications, owner } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: '客户名称不能为空' }, { status: 400 });
    }

    const result = query.createCustomer.run(
      name,
      level || '普通',
      source || null,
      phone || null,
      address || null,
      status || '未成交',
      qualifications || null,
      user.name,
      user.department || null,
      owner || user.name
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid, ...data } 
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ success: false, error: '新增客户失败' }, { status: 500 });
  }
}

// 更新客户
export async function PUT(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, level, source, phone, address, status, qualifications, owner } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: '客户ID不能为空' }, { status: 400 });
    }

    query.updateCustomer.run(name, level, source, phone, address, status, qualifications, owner, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ success: false, error: '更新客户失败' }, { status: 500 });
  }
}

// 删除客户
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
      return NextResponse.json({ success: false, error: '客户ID不能为空' }, { status: 400 });
    }

    query.deleteCustomer.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ success: false, error: '删除客户失败' }, { status: 500 });
  }
}
