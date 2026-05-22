import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// 清空所有数据（GET请求方便直接访问）
export async function GET(request: NextRequest) {
  try {
    // 清空所有数据表（保留用户表）
    db.exec('DELETE FROM work_hours_monthly');
    db.exec('DELETE FROM employee_salary_records');
    db.exec('DELETE FROM employee_work_records');
    db.exec('DELETE FROM employees');
    db.exec('DELETE FROM purchase_requests');
    db.exec('DELETE FROM expense_claims');
    db.exec('DELETE FROM approval_records');
    db.exec('DELETE FROM finances');
    db.exec('DELETE FROM invoices');
    db.exec('DELETE FROM contracts');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM messages');

    return NextResponse.json({ 
      success: true, 
      message: '所有数据已清空' 
    });
  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json({ error: '清空数据失败' }, { status: 500 });
  }
}

// POST请求也支持
export async function POST(request: NextRequest) {
  return GET(request);
}
