import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/database';

// 获取分销商列表
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const distributors = query.getAllDistributors.all();
    return NextResponse.json({ success: true, data: distributors });
  } catch (error) {
    console.error('Get distributors error:', error);
    return NextResponse.json({ success: false, error: '获取分销商失败' }, { status: 500 });
  }
}

// 新增分销商
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, phone, level, sales, commission, status } = data;

    if (!name) {
      return NextResponse.json({ success: false, error: '分销商名称不能为空' }, { status: 400 });
    }

    const result = query.createDistributor.run(
      name,
      phone || null,
      level || '铜牌',
      sales || 0,
      commission || 0,
      status || '活跃'
    );

    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid, ...data } 
    });
  } catch (error) {
    console.error('Create distributor error:', error);
    return NextResponse.json({ success: false, error: '新增分销商失败' }, { status: 500 });
  }
}

// 更新分销商
export async function PUT(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const user = await getCurrentUser(cookieHeader);

  if (!user) {
    return NextResponse.json({ success: false, error: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id, name, phone, level, sales, commission, status } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: '分销商ID不能为空' }, { status: 400 });
    }

    query.updateDistributor.run(name, phone, level, sales, commission, status, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update distributor error:', error);
    return NextResponse.json({ success: false, error: '更新分销商失败' }, { status: 500 });
  }
}

// 删除分销商
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
      return NextResponse.json({ success: false, error: '分销商ID不能为空' }, { status: 400 });
    }

    query.deleteDistributor.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete distributor error:', error);
    return NextResponse.json({ success: false, error: '删除分销商失败' }, { status: 500 });
  }
}
