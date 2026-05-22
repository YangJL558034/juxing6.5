import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET() {
  try {
    const invoices = (query.invoices as any).getAll.all() as any[];
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('获取发票失败:', error);
    return NextResponse.json({ error: '获取发票失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_no, contract_id, customer_name, type, amount, tax_rate, tax_amount, issue_date, status, remark, owner, proof_file, proof_file_name } = body;
    
    (query.invoices as any).create.run(
      invoice_no || null, contract_id || null, customer_name || null, type || '增值税专用发票',
      amount || 0, tax_rate || 0, tax_amount || 0, issue_date || null, status || '待开', remark || null,
      owner || null, proof_file || null, proof_file_name || null
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('创建发票失败:', error);
    return NextResponse.json({ error: '创建发票失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_no, contract_id, customer_name, type, amount, tax_rate, tax_amount, issue_date, status, remark, owner, proof_file, proof_file_name } = body;
    
    const pathname = request.nextUrl.pathname;
    const match = pathname.match(/\/api\/invoices\/(\d+)/);
    const id = match ? parseInt(match[1]) : null;
    
    if (!id) {
      return NextResponse.json({ error: '缺少发票ID' }, { status: 400 });
    }
    
    (query.invoices as any).update.run(
      invoice_no || null, contract_id || null, customer_name || null, type || '增值税专用发票',
      amount || 0, tax_rate || 0, tax_amount || 0, issue_date || null, status || '待开', remark || null,
      owner || null, proof_file || null, proof_file_name || null,
      id
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新发票失败:', error);
    return NextResponse.json({ error: '更新发票失败' }, { status: 500 });
  }
}
