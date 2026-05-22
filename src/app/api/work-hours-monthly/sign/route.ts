import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 更新工时记录签字
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, signature } = body;
    
    if (!recordId || !signature) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }
    
    query.updateWorkHoursMonthlySignature.run(signature, recordId);
    
    return NextResponse.json({ success: true, message: '签字成功' });
  } catch (error) {
    console.error('Sign work hours error:', error);
    return NextResponse.json({ error: '签字失败' }, { status: 500 });
  }
}
