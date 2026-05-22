import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, customer_id, phone, email, position, is_primary, remark } = body;
    
    (query.contacts as any).update.run(
      parseInt(id), name, customer_id || null, phone || null, email || null, position || null, is_primary ? 1 : 0, remark || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新联系人失败:', error);
    return NextResponse.json({ error: '更新联系人失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    (query.contacts as any).delete.run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除联系人失败:', error);
    return NextResponse.json({ error: '删除联系人失败' }, { status: 500 });
  }
}
