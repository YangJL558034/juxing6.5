import { NextRequest, NextResponse } from 'next/server';
import { query, db } from '@/lib/database';

// 验证注册码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json({ error: '请输入注册码' }, { status: 400 });
    }
    
    const codeRecord = query.getRegistrationCode.get(code) as any;
    
    if (!codeRecord) {
      return NextResponse.json({ error: '注册码无效或已使用' }, { status: 400 });
    }
    
    // 获取部门和职位名称
    let department = '';
    let position = '';
    
    if (codeRecord.department_id) {
      const dept = db!.prepare('SELECT name FROM departments WHERE id = ?').get(codeRecord.department_id) as any;
      department = dept?.name || '';
    }
    
    if (codeRecord.position_id) {
      const pos = db!.prepare('SELECT name FROM positions WHERE id = ?').get(codeRecord.position_id) as any;
      position = pos?.name || '';
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '注册码有效',
      department,
      position
    });
  } catch (error) {
    console.error('验证注册码失败:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
