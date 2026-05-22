import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, category, amount, date, related_id, related_type, remark, owner, department, proof_file, proof_file_name } = body;
    
    (query.finances as any).update.run(
      type || '收入', category || null, amount || 0, date || null,
      related_id || null, related_type || null, remark || null, owner || null, department || null,
      proof_file || null, proof_file_name || null, parseInt(id)
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新财务明细失败:', error);
    return NextResponse.json({ error: '更新财务明细失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    (query.finances as any).delete.run(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除财务明细失败:', error);
    return NextResponse.json({ error: '删除财务明细失败' }, { status: 500 });
  }
}
