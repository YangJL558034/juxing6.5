import { NextRequest, NextResponse } from 'next/server';
import { db, logOperationServer } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

type CellValue = string | number | boolean | Date | null | undefined;
type LocationKey = 'office' | 'workshop';
type SalaryFormat = LocationKey;
type SqlValue = string | number | null;

type EmployeeRow = {
  id: number;
  name: string;
  department?: string | null;
  status?: string | null;
  location?: string | null;
};

type MonthlyRecordRow = {
  id: number;
};

type OfficeSalaryRecord = {
  name: string;
  department: string;
  baseSalary: number;
  shouldAttendDays: number;
  saturdayDays: number;
  normalAttendanceDays: number;
  paidLeaveDays: number;
  weekdayOvertime: number;
  weekendOvertime: number;
  holidayOvertime: number;
  normalPay: number;
  holidayVacationPay: number;
  weekdayOvertimePay: number;
  weekendOvertimePay: number;
  holidayOvertimePay: number;
  performanceBonus: number;
  mealSubsidy: number;
  housingSubsidy: number;
  transportSubsidy: number;
  subsidy: number;
  fine: number;
  otherDeduct: number;
  utilities: number;
  totalPayable: number;
  housingFund: number;
  socialInsurance: number;
  socialSecurityAdjust: number;
  socialSecuritySubsidy: number;
  preTaxSalary: number;
  incomeTax: number;
  actualAmount: number;
  bankAccount: string;
  remark: string;
};

type WorkshopSalaryRecord = {
  name: string;
  isFullAttendance: string;
  idCard: string;
  bankAccount: string;
  bankName: string;
  baseSalary: number;
  performanceAllowance: number;
  otherSubsidy: number;
  requiredHours: number;
  normalFullAttendance: number;
  normalHours: number;
  weekdayOvertime: number;
  weekendOvertime: number;
  holidayOvertime: number;
  nightShift: number;
  absentDays: number;
  personalLeave: number;
  sickLeave: number;
  lateEarlyMinutes: number;
  lateEarlyCount: number;
  signCardCount: number;
  evalCoeff: number;
  normalPay: number;
  performancePay: number;
  weekdayOvertimePay: number;
  weekendOvertimePay: number;
  holidayOvertimePay: number;
  sickPay: number;
  livingSubsidy: number;
  otherPay: number;
  seniorityAward: number;
  fullAttendanceAward: number;
  positionSubsidy: number;
  workReward: number;
  springFestivalSubsidy: number;
  socialSecuritySubsidy: number;
  totalPayable: number;
  deductSocialSecurity: number;
  deductLoan: number;
  deductUrgent: number;
  deductOther: number;
  deductUtilities: number;
  totalDeduction: number;
  actualAmount: number;
};

type ParsedSalaryRecord = OfficeSalaryRecord | WorkshopSalaryRecord;

type SkippedEmployee = {
  name: string;
  reason: string;
  status?: string;
  location?: string;
};

type YearMonth = {
  year: number;
  month: number;
  source: 'file' | 'request';
  requestMismatch: boolean;
};

export async function POST(request: NextRequest) {
  try {
    console.log('[Salary Import] 收到导入请求');

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const body = await request.json();
    const { filePath } = body;

    if (!filePath || !existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 400 });
    }

    const fileName = path.basename(filePath);
    const fileBuffer = await readFile(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return NextResponse.json({ error: '未找到可导入的工作表' }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as CellValue[][];

    const salaryFormat = detectSalaryFormat(workbook, data);
    if (!salaryFormat) {
      return NextResponse.json({
        error: '未识别工资表格式，请确认上传的是办公室工资表或车间工资表模板',
        sheetName,
      }, { status: 400 });
    }

    const locationKey = salaryFormat;
    const importLocation = displayLocation(locationKey);
    const yearMonth = resolveYearMonth(body, fileName, sheetName, data);

    if (!yearMonth) {
      return NextResponse.json({
        error: '未识别工资月份，请检查文件名或工资表标题是否包含年份和月份',
      }, { status: 400 });
    }

    const parsedRecords = salaryFormat === 'office'
      ? parseOfficeSalaryRows(data)
      : parseWorkshopSalaryRows(data);

    if (parsedRecords.length === 0) {
      return NextResponse.json({
        error: `${importLocation}工资表未解析到员工工资记录，请检查模板格式`,
        data: {
          format: importLocation,
          year: yearMonth.year,
          month: yearMonth.month,
          location: importLocation,
          parsed: 0,
        },
      }, { status: 400 });
    }

    const result = salaryFormat === 'office'
      ? importOfficeSalaryRecords(parsedRecords as OfficeSalaryRecord[], yearMonth.year, yearMonth.month, locationKey)
      : importWorkshopSalaryRecords(parsedRecords as WorkshopSalaryRecord[], yearMonth.year, yearMonth.month, locationKey);

    if (result.records.length === 0) {
      return NextResponse.json({
        error: `未导入任何员工：员工管理中没有匹配的${importLocation}在职员工`,
        data: {
          format: importLocation,
          year: yearMonth.year,
          month: yearMonth.month,
          location: importLocation,
          parsed: parsedRecords.length,
          imported: 0,
          skippedCount: result.skippedEmployees.length,
          skippedEmployees: result.skippedEmployees,
          skipped: result.skipped,
        },
      }, { status: 400 });
    }

    logOperationServer({
      userId: decoded.id,
      userName: decoded.name || decoded.username,
      module: 'salary',
      action: 'import',
      details: {
        format: importLocation,
        year: yearMonth.year,
        month: yearMonth.month,
        monthSource: yearMonth.source,
        requestMismatch: yearMonth.requestMismatch,
        parsedCount: parsedRecords.length,
        recordCount: result.records.length,
        skippedEmployees: result.skippedEmployees.slice(0, 10),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      data: {
        format: importLocation,
        year: yearMonth.year,
        month: yearMonth.month,
        location: importLocation,
        records: result.records,
        insertedCount: result.insertedCount,
        updatedCount: result.updatedCount,
        skippedCount: result.skippedEmployees.length,
        skippedEmployees: result.skippedEmployees,
        skipped: result.skipped,
        total: result.records.length,
        parsed: parsedRecords.length,
        monthSource: yearMonth.source,
      },
    });
  } catch (error) {
    console.error('Salary import error:', error);
    return NextResponse.json({ error: '导入失败：' + (error as Error).message }, { status: 500 });
  }
}

function detectSalaryFormat(workbook: XLSX.WorkBook, data: CellValue[][]): SalaryFormat | null {
  const sheetNameText = normalizeText(workbook.SheetNames.join(' '));
  if (
    sheetNameText.includes('员工刷卡记录表') ||
    (sheetNameText.includes('排班信息') && sheetNameText.includes('考勤记录'))
  ) {
    return null;
  }

  const searchableText = normalizeText([
    workbook.SheetNames.join(' '),
    ...data.slice(0, 12).map((row) => row.map(cellText).join(' ')),
  ].join(' '));

  if (
    searchableText.includes('是否全勤') ||
    searchableText.includes('生产部') ||
    searchableText.includes('应出勤小时') ||
    searchableText.includes('正班满勤小时') ||
    searchableText.includes('月度出勤记录')
  ) {
    return 'workshop';
  }

  if (
    searchableText.includes('考勤记录（天') ||
    searchableText.includes('考勤记录(天') ||
    searchableText.includes('正班应出勤天数') ||
    searchableText.includes('基本工资') ||
    searchableText.includes('绩效奖金') ||
    searchableText.includes('应领工资')
  ) {
    return 'office';
  }

  return null;
}

function resolveYearMonth(body: Record<string, unknown>, fileName: string, sheetName: string, data: CellValue[][]): YearMonth | null {
  const inferred = extractYearMonth(fileName, sheetName, data);
  const requestYear = toValidYear(body.year);
  const requestMonth = toValidMonth(body.month);

  if (inferred) {
    return {
      ...inferred,
      source: 'file',
      requestMismatch: Boolean(
        requestYear &&
        requestMonth &&
        (requestYear !== inferred.year || requestMonth !== inferred.month),
      ),
    };
  }

  if (requestYear && requestMonth) {
    return {
      year: requestYear,
      month: requestMonth,
      source: 'request',
      requestMismatch: false,
    };
  }

  return null;
}

function extractYearMonth(fileName: string, sheetName: string, data: CellValue[][]) {
  const candidates = [
    fileName,
    sheetName,
    ...data.slice(0, 10).map((row) => row.map(cellText).join(' ')),
  ];

  for (const candidate of candidates) {
    const text = normalizeText(candidate);
    const chineseMatch = text.match(/(20\d{2})年?(\d{1,2})月/);
    if (chineseMatch) {
      const year = toValidYear(chineseMatch[1]);
      const month = toValidMonth(chineseMatch[2]);
      if (year && month) {
        return { year, month };
      }
    }

    const compactMatch = text.match(/(20\d{2})(0[1-9]|1[0-2])月?/);
    if (compactMatch) {
      const year = toValidYear(compactMatch[1]);
      const month = toValidMonth(compactMatch[2]);
      if (year && month) {
        return { year, month };
      }
    }

    const shortSheetMatch = text.match(/(?:^|[^\d])(\d{2})-(\d{1,2})(?:$|[^\d])/);
    if (shortSheetMatch) {
      const year = toValidYear(`20${shortSheetMatch[1]}`);
      const month = toValidMonth(shortSheetMatch[2]);
      if (year && month) {
        return { year, month };
      }
    }
  }

  return null;
}

function parseOfficeSalaryRows(data: CellValue[][]): OfficeSalaryRecord[] {
  const records: OfficeSalaryRecord[] = [];

  for (const row of data) {
    const name = cellText(row?.[1]);
    if (!name || name === '姓名' || name === '合计') {
      continue;
    }

    if (!isLikelySalaryDataRow(row)) {
      continue;
    }

    records.push({
      name,
      department: cellText(row[3]),
      baseSalary: parseNumber(row[4]),
      shouldAttendDays: parseNumber(row[5], 22),
      saturdayDays: parseNumber(row[6], 4),
      normalAttendanceDays: parseNumber(row[7]),
      paidLeaveDays: parseNumber(row[8]),
      weekdayOvertime: parseNumber(row[9]),
      weekendOvertime: parseNumber(row[10]),
      holidayOvertime: parseNumber(row[11]),
      normalPay: parseNumber(row[12]),
      holidayVacationPay: parseNumber(row[13]),
      weekdayOvertimePay: parseNumber(row[14]),
      weekendOvertimePay: parseNumber(row[15]),
      holidayOvertimePay: parseNumber(row[16]),
      performanceBonus: parseNumber(row[17]),
      mealSubsidy: parseNumber(row[18]),
      housingSubsidy: parseNumber(row[19]),
      transportSubsidy: parseNumber(row[20]),
      subsidy: parseNumber(row[21]),
      fine: parseNumber(row[22]),
      otherDeduct: parseNumber(row[23]),
      utilities: parseNumber(row[24]),
      totalPayable: parseNumber(row[25]),
      housingFund: parseNumber(row[26]),
      socialInsurance: parseNumber(row[27]),
      socialSecurityAdjust: parseNumber(row[28]),
      socialSecuritySubsidy: parseNumber(row[29]),
      preTaxSalary: parseNumber(row[30]),
      incomeTax: parseNumber(row[31]),
      actualAmount: parseNumber(row[32]),
      bankAccount: cellText(row[34]).split(/[（(]/)[0].trim(),
      remark: cellText(row[35]),
    });
  }

  return records;
}

function parseWorkshopSalaryRows(data: CellValue[][]): WorkshopSalaryRecord[] {
  const records: WorkshopSalaryRecord[] = [];

  for (const row of data) {
    const name = cellText(row?.[1]);
    if (!name || name === '姓名') {
      continue;
    }

    if (!isLikelySalaryDataRow(row)) {
      continue;
    }

    records.push({
      name,
      isFullAttendance: cellText(row[2]) === '是' ? '是' : '否',
      idCard: cellText(row[3]),
      bankAccount: cellText(row[4]),
      bankName: cellText(row[5]),
      baseSalary: parseNumber(row[6]),
      performanceAllowance: parseNumber(row[7]),
      otherSubsidy: parseNumber(row[8]),
      requiredHours: parseNumber(row[9], 176),
      normalFullAttendance: parseNumber(row[10], 176),
      normalHours: parseNumber(row[11]),
      weekdayOvertime: parseNumber(row[12]),
      weekendOvertime: parseNumber(row[13]),
      holidayOvertime: parseNumber(row[14]),
      nightShift: parseNumber(row[15]),
      absentDays: parseNumber(row[16]),
      personalLeave: parseNumber(row[17]),
      sickLeave: parseNumber(row[18]),
      lateEarlyMinutes: parseNumber(row[19]),
      lateEarlyCount: parseNumber(row[20]),
      signCardCount: parseNumber(row[21]),
      evalCoeff: parseNumber(row[22], 1),
      normalPay: parseNumber(row[23]),
      performancePay: parseNumber(row[24]),
      weekdayOvertimePay: parseNumber(row[25]),
      weekendOvertimePay: parseNumber(row[26]),
      holidayOvertimePay: parseNumber(row[27]),
      sickPay: parseNumber(row[28]),
      livingSubsidy: parseNumber(row[29]),
      otherPay: parseNumber(row[30]),
      seniorityAward: parseNumber(row[31]),
      fullAttendanceAward: parseNumber(row[32]),
      positionSubsidy: parseNumber(row[33]),
      workReward: parseNumber(row[34]),
      springFestivalSubsidy: parseNumber(row[35]),
      socialSecuritySubsidy: parseNumber(row[36]),
      totalPayable: parseNumber(row[37]),
      deductSocialSecurity: parseNumber(row[38]),
      deductLoan: parseNumber(row[39]),
      deductUrgent: parseNumber(row[40]),
      deductOther: parseNumber(row[41]),
      deductUtilities: parseNumber(row[42]),
      totalDeduction: parseNumber(row[43]),
      actualAmount: parseNumber(row[44]),
    });
  }

  return records;
}

function importOfficeSalaryRecords(records: OfficeSalaryRecord[], year: number, month: number, locationKey: LocationKey) {
  const importLocation = displayLocation(locationKey);
  const result = createImportResult<OfficeSalaryRecord>();

  for (const record of records) {
    const employee = getEligibleEmployee(record.name, locationKey);
    if (!employee) {
      collectSkippedEmployee(result, record.name, importLocation);
      continue;
    }

    const normalHours = record.normalAttendanceDays * 8;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const fields: Record<string, SqlValue> = {
      employee_id: employee.id,
      month: monthStr,
      total_days: record.normalAttendanceDays,
      work_hours: normalHours + record.weekdayOvertime,
      overtime_hours: record.weekdayOvertime,
      weekend_overtime: record.weekendOvertime,
      details: JSON.stringify({ remark: record.remark }),
      employee_name: record.name,
      year,
      month_num: month,
      normal_hours: normalHours,
      weekday_overtime: record.weekdayOvertime,
      base_salary: record.baseSalary,
      normal_pay: record.normalPay,
      weekday_overtime_pay: record.weekdayOvertimePay,
      weekend_overtime_pay: record.weekendOvertimePay,
      total_payable: record.totalPayable,
      deduction: record.socialInsurance + record.housingFund,
      actual_amount: record.actualAmount,
      location: importLocation,
      performance_allowance: record.performanceBonus,
      living_subsidy: record.mealSubsidy,
      other_pay: record.housingSubsidy + record.transportSubsidy,
      deduct_utilities: record.utilities,
      total_deduction: record.socialInsurance + record.housingFund,
      bank_account: record.bankAccount,
      performance_pay: record.performanceBonus,
      holiday_overtime_pay: record.holidayOvertimePay,
      department: record.department,
      should_attend_days: record.shouldAttendDays,
      saturday_days: record.saturdayDays,
      actual_attend_days: record.normalAttendanceDays,
      paid_leave_days: record.paidLeaveDays,
      holiday_overtime: record.holidayOvertime,
      holiday_pay: record.holidayVacationPay,
      performance_bonus: record.performanceBonus,
      meal_subsidy: record.mealSubsidy,
      housing_subsidy: record.housingSubsidy,
      transport_subsidy: record.transportSubsidy,
      other_subsidy: record.subsidy,
      fine: record.fine,
      other_deduction: record.otherDeduct,
      housing_fund: record.housingFund,
      social_insurance: record.socialInsurance,
      social_pension_adj: record.socialSecurityAdjust,
      social_security_subsidy: record.socialSecuritySubsidy,
      pre_tax_salary: record.preTaxSalary,
      income_tax: record.incomeTax,
      remark: record.remark,
    };

    const upsertResult = upsertMonthlyRecord(employee.id, year, month, fields);
    result.insertedCount += upsertResult.inserted ? 1 : 0;
    result.updatedCount += upsertResult.inserted ? 0 : 1;
    result.records.push(record);
  }

  return result;
}

function importWorkshopSalaryRecords(records: WorkshopSalaryRecord[], year: number, month: number, locationKey: LocationKey) {
  const importLocation = displayLocation(locationKey);
  const result = createImportResult<WorkshopSalaryRecord>();

  for (const record of records) {
    const employee = getEligibleEmployee(record.name, locationKey);
    if (!employee) {
      collectSkippedEmployee(result, record.name, importLocation);
      continue;
    }

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const fields: Record<string, SqlValue> = {
      employee_id: employee.id,
      month: monthStr,
      total_days: Math.ceil(record.normalHours / 8),
      work_hours: record.normalHours + record.weekdayOvertime,
      overtime_hours: record.weekdayOvertime,
      weekend_overtime: record.weekendOvertime,
      details: '{}',
      employee_name: record.name,
      year,
      month_num: month,
      normal_hours: record.normalHours,
      weekday_overtime: record.weekdayOvertime,
      base_salary: record.baseSalary,
      normal_pay: record.normalPay,
      weekday_overtime_pay: record.weekdayOvertimePay,
      weekend_overtime_pay: record.weekendOvertimePay,
      total_payable: record.totalPayable,
      deduction: record.totalDeduction,
      actual_amount: record.actualAmount,
      location: importLocation,
      is_full_attendance: record.isFullAttendance,
      id_card: record.idCard,
      bank_account: record.bankAccount,
      bank_name: record.bankName,
      performance_allowance: record.performanceAllowance,
      other_subsidy_base: record.otherSubsidy,
      required_hours: record.requiredHours,
      full_attendance_hours: record.normalFullAttendance,
      holiday_overtime_hours: record.holidayOvertime,
      night_shift_days: record.nightShift,
      absent_days: record.absentDays,
      personal_leave_hours: record.personalLeave,
      sick_leave_hours: record.sickLeave,
      late_early_minutes: record.lateEarlyMinutes,
      late_early_count: record.lateEarlyCount,
      sign_card_count: record.signCardCount,
      evaluation_coefficient: record.evalCoeff,
      performance_pay: record.performancePay,
      holiday_overtime_pay: record.holidayOvertimePay,
      sick_pay: record.sickPay,
      living_subsidy: record.livingSubsidy,
      other_pay: record.otherPay,
      seniority_award: record.seniorityAward,
      full_attendance_award: record.fullAttendanceAward,
      position_subsidy: record.positionSubsidy,
      work_reward: record.workReward,
      spring_festival_subsidy: record.springFestivalSubsidy,
      social_security_subsidy: record.socialSecuritySubsidy,
      deduct_social_security: record.deductSocialSecurity,
      deduct_loan: record.deductLoan,
      deduct_urgent: record.deductUrgent,
      deduct_other: record.deductOther,
      deduct_utilities: record.deductUtilities,
      total_deduction: record.totalDeduction,
    };

    const upsertResult = upsertMonthlyRecord(employee.id, year, month, fields);
    result.insertedCount += upsertResult.inserted ? 1 : 0;
    result.updatedCount += upsertResult.inserted ? 0 : 1;
    result.records.push(record);
  }

  return result;
}

function upsertMonthlyRecord(employeeId: number, year: number, month: number, fields: Record<string, SqlValue>) {
  const existing = db.prepare(`
    SELECT id FROM work_hours_monthly
    WHERE employee_id = ? AND year = ? AND month_num = ?
    LIMIT 1
  `).get(employeeId, year, month) as MonthlyRecordRow | undefined;

  if (existing) {
    const updateEntries = Object.entries(fields).filter(([key]) => (
      key !== 'employee_id' &&
      key !== 'details' &&
      key !== 'total_days'
    ));
    const setClause = updateEntries.map(([key]) => `${key} = ?`).join(', ');
    db.prepare(`UPDATE work_hours_monthly SET ${setClause} WHERE id = ?`)
      .run(...updateEntries.map(([, value]) => value), existing.id);
    return { inserted: false };
  }

  const insertEntries = Object.entries(fields);
  const columns = insertEntries.map(([key]) => key).join(', ');
  const placeholders = insertEntries.map(() => '?').join(', ');
  db.prepare(`INSERT INTO work_hours_monthly (${columns}) VALUES (${placeholders})`)
    .run(...insertEntries.map(([, value]) => value));

  return { inserted: true };
}

function getEligibleEmployee(name: string, locationKey: LocationKey) {
  const aliases = locationAliases(locationKey);
  return db.prepare(`
    SELECT * FROM employees
    WHERE name = ? AND status = '在职' AND location IN (?, ?)
    LIMIT 1
  `).get(name, aliases[0], aliases[1]) as EmployeeRow | undefined;
}

function collectSkippedEmployee<TRecord extends ParsedSalaryRecord>(
  result: ReturnType<typeof createImportResult<TRecord>>,
  name: string,
  importLocation: string,
) {
  const existingEmployee = db.prepare('SELECT * FROM employees WHERE name = ? LIMIT 1')
    .get(name) as EmployeeRow | undefined;

  result.skippedEmployees.push(name);

  if (existingEmployee) {
    result.skipped.push({
      name,
      reason: `员工不是${importLocation}在职员工`,
      status: existingEmployee.status ?? undefined,
      location: existingEmployee.location ?? undefined,
    });
    return;
  }

  result.skipped.push({
    name,
    reason: '员工管理中不存在该员工',
  });
}

function createImportResult<TRecord extends ParsedSalaryRecord>() {
  return {
    records: [] as TRecord[],
    insertedCount: 0,
    updatedCount: 0,
    skippedEmployees: [] as string[],
    skipped: [] as SkippedEmployee[],
  };
}

function isLikelySalaryDataRow(row: CellValue[] = []) {
  const serial = cellText(row[0]);
  return /^\d+$/.test(serial);
}

function parseNumber(value: CellValue, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = cellText(value)
    .replace(/,/g, '')
    .replace(/[¥￥]/g, '')
    .replace(/\s+/g, '');

  if (!text || text === '-' || text === '--' || text === '/') {
    return fallback;
  }

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return fallback;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cellText(value: CellValue) {
  return String(value ?? '').trim();
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').replace(/：/g, ':');
}

function toValidYear(value: unknown) {
  const year = parseInt(String(value ?? ''), 10);
  return year >= 2000 && year <= 2100 ? year : null;
}

function toValidMonth(value: unknown) {
  const month = parseInt(String(value ?? ''), 10);
  return month >= 1 && month <= 12 ? month : null;
}

function displayLocation(locationKey: LocationKey) {
  return locationKey === 'office' ? '办公室' : '车间';
}

function locationAliases(locationKey: LocationKey): [string, string] {
  return locationKey === 'office' ? ['office', '办公室'] : ['workshop', '车间'];
}
