import { NextRequest, NextResponse } from 'next/server';
import { query, getApproverChain, db } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// 获取单个费用报销单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    const claim = query.expenseClaims.getById.get(parseInt(id));

    if (!claim) {
      return NextResponse.json({ error: '费用报销单不存在' }, { status: 404 });
    }

    // 获取审批记录
    const approvals = query.approvalRecords.getByDoc.all('expense_claim', parseInt(id));

    return NextResponse.json({ 
      claim,
      approvals 
    });
  } catch (error) {
    console.error('获取费用报销单详情失败:', error);
    return NextResponse.json({ error: '获取费用报销单详情失败' }, { status: 500 });
  }
}

// 更新费用报销单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, expense_type, expense_date, items, total_amount, description, proof_file, proof_file_name, department } = body;

    query.expenseClaims.update.run(
      title,
      department,
      expense_type,
      expense_date || null,
      JSON.stringify(items),
      total_amount || 0,
      description || '',
      proof_file || null,
      proof_file_name || null,
      parseInt(id)
    );

    return NextResponse.json({ success: true, message: '费用报销单更新成功' });
  } catch (error) {
    console.error('更新费用报销单失败:', error);
    return NextResponse.json({ error: '更新费用报销单失败' }, { status: 500 });
  }
}

// 删除费用报销单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { id } = await params;
    
    // 只能删除待审批的单据
    const claim = query.expenseClaims.getById.get(parseInt(id)) as { status: string } | undefined;
    if (claim && claim.status !== '待审批') {
      return NextResponse.json({ error: '只能删除待审批的费用报销单' }, { status: 400 });
    }

    // 删除审批记录
    db.prepare('DELETE FROM approval_records WHERE doc_type = ? AND doc_id = ?').run('expense_claim', parseInt(id));
    
    // 删除费用报销单
    query.expenseClaims.delete.run(parseInt(id));

    return NextResponse.json({ success: true, message: '费用报销单删除成功' });
  } catch (error) {
    console.error('删除费用报销单失败:', error);
    return NextResponse.json({ error: '删除费用报销单失败' }, { status: 500 });
  }
}
