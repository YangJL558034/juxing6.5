import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const visits = (query.visits as any).getAll.all() as any[];
    return NextResponse.json({ visits });
  } catch (error) {
    console.error('获取回访失败:', error);
    return NextResponse.json({ error: '获取回访失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, customer_name, visit_date, type, result, next_date, visitor, content, remark } = body;
    
    (query.visits as any).create.run(
      customer_id || null, customer_name || null, visit_date || null, type || '电话回访',
      result || '完成', next_date || null, visitor || null, content || null, remark || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('创建回访失败:', error);
    return NextResponse.json({ error: '创建回访失败' }, { status: 500 });
  }
}
