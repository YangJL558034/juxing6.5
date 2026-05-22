import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const finances = (query.finances as any).getAll.all() as any[];
    return NextResponse.json({ finances });
  } catch (error) {
    console.error('获取财务明细失败:', error);
    return NextResponse.json({ error: '获取财务明细失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, amount, date, related_id, related_type, remark, owner, department, proof_file, proof_file_name } = body;
    
    (query.finances as any).create.run(
      type || '收入', category || null, amount || 0, date || null,
      related_id || null, related_type || null, remark || null, owner || null, department || null,
      proof_file || null, proof_file_name || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('创建财务明细失败:', error);
    return NextResponse.json({ error: '创建财务明细失败' }, { status: 500 });
  }
}
