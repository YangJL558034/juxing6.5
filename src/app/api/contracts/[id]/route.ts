import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { contract_no, customer_id, customer_name, name, amount, start_date, end_date, status, signatory, content, remark, owner, proof_file, proof_file_name } = body;
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: '缺少合同ID' }, { status: 400 });
    }
    
    (query.contracts as any).update.run(
      contract_no || null, customer_id || null, customer_name || null, name || null, 
      amount || 0, start_date || null, end_date || null, status || '草稿', 
      signatory || null, content || null, remark || null, owner || null,
      proof_file || null, proof_file_name || null,
      id
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新合同失败:', error);
    return NextResponse.json({ error: '更新合同失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    
    if (!id) {
      return NextResponse.json({ error: '缺少合同ID' }, { status: 400 });
    }
    
    (query.contracts as any).delete.run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除合同失败:', error);
    return NextResponse.json({ error: '删除合同失败' }, { status: 500 });
  }
}