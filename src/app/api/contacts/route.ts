import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const contacts = (query.contacts as any).getAll.all() as any[];
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('获取联系人失败:', error);
    return NextResponse.json({ error: '获取联系人失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, customer_id, phone, email, position, is_primary, remark } = body;
    
    (query.contacts as any).create.run(
      name, customer_id || null, phone || null, email || null, position || null, is_primary ? 1 : 0, remark || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('创建联系人失败:', error);
    return NextResponse.json({ error: '创建联系人失败' }, { status: 500 });
  }
}
