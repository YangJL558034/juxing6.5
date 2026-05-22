import { NextRequest, NextResponse } from 'next/server';
import { query, getApproverChain, db } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

// 获取单个请购单
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
    const purchaseRequest = query.purchaseRequests.getById.get(parseInt(id));

    if (!purchaseRequest) {
      return NextResponse.json({ error: '请购单不存在' }, { status: 404 });
    }

    // 获取审批记录
    const approvals = query.approvalRecords.getByDoc.all('purchase_request', parseInt(id));

    return NextResponse.json({ 
      request: purchaseRequest,
      approvals 
    });
  } catch (error) {
    console.error('获取请购单详情失败:', error);
    return NextResponse.json({ error: '获取请购单详情失败' }, { status: 500 });
  }
}

// 更新请购单
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
    const { title, items, total_amount, reason, urgency, proof_file, proof_file_name, department } = body;

    query.purchaseRequests.update.run(
      title,
      department,
      JSON.stringify(items),
      total_amount || 0,
      reason || '',
      urgency || '普通',
      proof_file || null,
      proof_file_name || null,
      parseInt(id)
    );

    return NextResponse.json({ success: true, message: '请购单更新成功' });
  } catch (error) {
    console.error('更新请购单失败:', error);
    return NextResponse.json({ error: '更新请购单失败' }, { status: 500 });
  }
}

// 删除请购单
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
    const purchaseRequest = query.purchaseRequests.getById.get(parseInt(id)) as { status: string } | undefined;
    if (purchaseRequest && purchaseRequest.status !== '待审批') {
      return NextResponse.json({ error: '只能删除待审批的请购单' }, { status: 400 });
    }

    // 删除审批记录
    db.prepare('DELETE FROM approval_records WHERE doc_type = ? AND doc_id = ?').run('purchase_request', parseInt(id));
    
    // 删除请购单
    query.purchaseRequests.delete.run(parseInt(id));

    return NextResponse.json({ success: true, message: '请购单删除成功' });
  } catch (error) {
    console.error('删除请购单失败:', error);
    return NextResponse.json({ error: '删除请购单失败' }, { status: 500 });
  }
}
