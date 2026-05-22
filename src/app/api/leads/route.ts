import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取线索列表
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const leads = query.getAllLeads.all();
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json({ success: false, error: '获取线索失败' }, { status: 500 });
  }
}

// 新增线索
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, industry, level, source, phone, address, remark, owner } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: '线索名称不能为空' }, { status: 400 });
    }

    const result = query.createLead.run(
      name,
      industry || null,
      level || '普通',
      source || null,
      phone || null,
      address || null,
      remark || null,
      user.name,
      user.department || null,
      owner || user.name
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid, ...data } 
    });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ success: false, error: '新增线索失败' }, { status: 500 });
  }
}

// 更新线索
export async function PUT(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, industry, level, source, phone, address, remark, owner } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: '线索ID不能为空' }, { status: 400 });
    }

    query.updateLead.run(name, industry, level, source, phone, address, remark, owner, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ success: false, error: '更新线索失败' }, { status: 500 });
  }
}

// 删除线索
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
      return NextResponse.json({ success: false, error: '线索ID不能为空' }, { status: 400 });
    }

    query.deleteLead.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ success: false, error: '删除线索失败' }, { status: 500 });
  }
}
