import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      base_salary,
      normal_hours,
      weekday_overtime,
      weekend_overtime,
      normal_pay,
      weekday_overtime_pay,
      weekend_overtime_pay,
      living_subsidy,
      seniority_award,
      full_attendance_award,
      position_subsidy,
      social_security_subsidy,
      deduct_social_security,
      deduct_utilities,
      total_deduction,
      total_payable,
      actual_amount,
      bank_account,
      remark,
      // 办公室格式扣除项目
      housing_fund,
      social_insurance,
      social_pension_adj
    } = body;
    
    // 计算应扣合计
    let calculatedTotalDeduction = total_deduction;
    if (housing_fund !== undefined || social_insurance !== undefined) {
      // 办公室格式：公积金 + 社会保险 + 社保养老调
      calculatedTotalDeduction = (housing_fund || 0) + (social_insurance || 0) + (social_pension_adj || 0);
    } else if (deduct_social_security !== undefined || deduct_utilities !== undefined) {
      // 车间格式：扣社保 + 水电费
      calculatedTotalDeduction = (deduct_social_security || 0) + (deduct_utilities || 0);
    }
    
    const stmt = db.prepare(`
      UPDATE work_hours_monthly SET 
        base_salary = ?,
        normal_hours = ?,
        weekday_overtime = ?,
        weekend_overtime = ?,
        normal_pay = ?,
        weekday_overtime_pay = ?,
        weekend_overtime_pay = ?,
        living_subsidy = ?,
        seniority_award = ?,
        full_attendance_award = ?,
        position_subsidy = ?,
        social_security_subsidy = ?,
        deduct_social_security = ?,
        deduct_utilities = ?,
        total_deduction = ?,
        total_payable = ?,
        actual_amount = ?,
        bank_account = ?,
        remark = ?,
        housing_fund = ?,
        social_insurance = ?,
        social_pension_adj = ?
      WHERE id = ?
    `);
    
    stmt.run(
      base_salary || 0,
      normal_hours || 0,
      weekday_overtime || 0,
      weekend_overtime || 0,
      normal_pay || 0,
      weekday_overtime_pay || 0,
      weekend_overtime_pay || 0,
      living_subsidy || 0,
      seniority_award || 0,
      full_attendance_award || 0,
      position_subsidy || 0,
      social_security_subsidy || 0,
      deduct_social_security || 0,
      deduct_utilities || 0,
      calculatedTotalDeduction || 0,
      total_payable || 0,
      actual_amount || 0,
      bank_account || '',
      remark || '',
      housing_fund || 0,
      social_insurance || 0,
      social_pension_adj || 0,
      parseInt(id)
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新工资记录失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    db.prepare('DELETE FROM work_hours_monthly WHERE id = ?').run(parseInt(id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除工资记录失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
