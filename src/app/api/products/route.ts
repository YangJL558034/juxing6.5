import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const products = (query.products as any).getAll.all() as any[];
    return NextResponse.json({ products });
  } catch (error) {
    console.error('获取产品失败:', error);
    return NextResponse.json({ error: '获取产品失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, unit, stock, status, remark } = body;
    
    (query.products as any).create.run(
      name, category || null, price || 0, unit || '件', stock || 0, status || '在售', remark || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('创建产品失败:', error);
    return NextResponse.json({ error: '创建产品失败' }, { status: 500 });
  }
}
