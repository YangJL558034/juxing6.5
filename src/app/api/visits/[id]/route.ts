import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { customer_id, customer_name, visit_date, type, result, next_date, visitor, content, remark } = body;
    
    (query.visits as any).update.run(
      parseInt(id), customer_id || null, customer_name || null, visit_date || null, type || '电话回访',
      result || '完成', next_date || null, visitor || null, content || null, remark || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新回访失败:', error);
    return NextResponse.json({ error: '更新回访失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    (query.visits as any).delete.run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除回访失败:', error);
    return NextResponse.json({ error: '删除回访失败' }, { status: 500 });
  }
}
