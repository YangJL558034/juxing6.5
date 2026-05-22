import { NextRequest, NextResponse } from 'next/server';
import { db, query } from '@/lib/database';

// 获取工时月份汇总
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const employeeId = searchParams.get('employeeId');
    
    let records;
    if (employeeId) {
      records = query.getWorkHoursMonthlyByEmployee.all(employeeId);
    } else if (year && month) {
      records = query.getWorkHoursMonthlyByYearMonth.all(parseInt(year), parseInt(month));
    } else if (month) {
      records = query.getWorkHoursMonthlyByMonth.all(month);
    } else {
      records = query.getWorkHoursMonthly.all();
    }
    
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Get work hours monthly error:', error);
    return NextResponse.json({ error: '获取工时数据失败' }, { status: 500 });
  }
}

// 导入工时数据或创建工资记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 检查是否是新的工资记录格式
    if (body.employee_name && body.year && body.month) {
      // 新格式：工资记录导入
      const { 
        employee_id, 
        employee_name, 
        year, 
        month, 
        normal_hours, 
        weekday_overtime, 
        weekend_overtime,
        base_salary,
        normal_pay,
        weekday_overtime_pay,
        weekend_overtime_pay,
        total_payable,
        deduction,
        actual_amount,
        location
      } = body;
      
      // 检查是否已存在该记录
      const existing = query.getWorkHoursMonthlyByYearMonth.all(year, month) as any[];
      const existingRecord = existing.find((r: any) => r.employee_id === employee_id);
      
      if (existingRecord) {
        // 更新现有记录
        db.prepare(`
          UPDATE work_hours_monthly SET 
            employee_name = ?, normal_hours = ?, weekday_overtime = ?, weekend_overtime = ?,
            base_salary = ?, normal_pay = ?, weekday_overtime_pay = ?, weekend_overtime_pay = ?,
            total_payable = ?, deduction = ?, actual_amount = ?,
            work_hours = ?, overtime_hours = ?, location = ?
          WHERE id = ?
        `).run(
          employee_name, normal_hours || 0, weekday_overtime || 0, weekend_overtime || 0,
          base_salary || 0, normal_pay || 0, weekday_overtime_pay || 0, weekend_overtime_pay || 0,
          total_payable || 0, deduction || 0, actual_amount || 0,
          (normal_hours || 0) + (weekday_overtime || 0), weekday_overtime || 0,
          location || '车间',
          existingRecord.id
        );
      } else {
        // 创建新记录
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        query.createWorkHoursMonthly.run(
          employee_id,
          monthStr,
          0, // total_days
          (normal_hours || 0) + (weekday_overtime || 0), // work_hours
          weekday_overtime || 0, // overtime_hours
          weekend_overtime || 0,
          '{}', // details
          employee_name,
          year,
          month,
          normal_hours || 0,
          weekday_overtime || 0,
          base_salary || 0,
          normal_pay || 0,
          weekday_overtime_pay || 0,
          weekend_overtime_pay || 0,
          total_payable || 0,
          deduction || 0,
          actual_amount || 0,
          location || '车间'
        );
      }
      
      return NextResponse.json({ success: true, message: '工资记录保存成功' });
    }
    
    // 旧格式：工时数据导入
    const { month, data } = body;
    
    if (!month || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }
    
    // 先删除该月份的旧数据
    query.deleteWorkHoursMonthlyByMonth.run(month);
    
    // 插入新数据
    for (const item of data) {
      const { employeeId, employeeName, totalDays, workHours, overtimeHours, weekendOvertime, details } = item;
      
      // 如果没有 employeeId，尝试通过姓名查找
      let empId = employeeId;
      if (!empId && employeeName) {
        const employee = query.getEmployeeByNameAndPhone.get(employeeName, '');
        if (employee) {
          empId = (employee as any).id;
        }
      }
      
      if (empId) {
        query.createWorkHoursMonthlySimple.run(
          empId,
          month,
          totalDays || 0,
          workHours || 0,
          overtimeHours || 0,
          weekendOvertime || 0,
          JSON.stringify(details || {})
        );
      }
    }
    
    return NextResponse.json({ success: true, message: '工时数据导入成功' });
  } catch (error) {
    console.error('Import work hours error:', error);
    return NextResponse.json({ error: '导入工时数据失败' }, { status: 500 });
  }
}
