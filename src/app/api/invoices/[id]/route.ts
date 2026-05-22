import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { invoice_no, contract_id, customer_name, type, amount, tax_rate, tax_amount, issue_date, status, remark, owner, proof_file, proof_file_name } = body;
    
    const { id } = await params;
    
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    if (!id) {
      return NextResponse.json({ error: '缺少发票ID' }, { status: 400 });
    }
    
    (query.invoices as any).delete.run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除发票失败:', error);
    return NextResponse.json({ error: '删除发票失败' }, { status: 500 });
  }
}