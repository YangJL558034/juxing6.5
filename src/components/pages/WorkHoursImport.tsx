'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check, AlertCircle, Trash2, CheckCircle, FileX } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 工资条数据结构
interface SalaryRecord {
  name: string;                    // 姓名
  isFullAttendance: boolean;       // 是否全勤
  baseSalary: number;              // 基础底薪
  requiredHours: number;           // 应出勤小时
  normalFullAttendance: number;    // 正班满勤
  normalHours: number;             // 正班工时
  weekdayOvertime: number;         // 平时加班
  weekendOvertime: number;         // 周末加班
  normalPay: number;               // 实际正班
  weekdayOvertimePay: number;      // 平时加班费
  weekendOvertimePay: number;      // 周末加班费
  livingAllowance: number;         // 生活补贴
  seniority: number;               // 工龄
  fullAttendanceBonus: number;     // 全勤奖
  positionAllowance: number;       // 岗位补贴
  socialSecurity: number;          // 社保
  totalPayable: number;            // 应付工资合计
  deductSocialSecurity: number;    // 扣社保
  totalDeduction: number;          // 应扣款合计
  actualAmount: number;            // 实发金额
}

interface WorkHoursImportProps {
  onImportSalary: (data: { month: string; year: string; records: SalaryRecord[]; location: string }) => Promise<void>;
  onImportWorkHours: (data: { month: string; year: string; employees: any[] }) => Promise<void>;
  onImportComplete?: (data: { year: number; month: number; location: string; count: number }) => void;
}

export function WorkHoursImport({ onImportSalary, onImportWorkHours, onImportComplete }: WorkHoursImportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStep, setImportStep] = useState<'input' | 'preview' | 'success'>('input');
  const [rawData, setRawData] = useState('');
  const [importType, setImportType] = useState<'salary' | 'workhours' | 'attendance'>('attendance');
  const [importLocation, setImportLocation] = useState<'办公室' | '车间'>('车间');
  const [parsedSalaryData, setParsedSalaryData] = useState<{ month: string; year: string; records: SalaryRecord[] } | null>(null);
  const [parsedWorkHoursData, setParsedWorkHoursData] = useState<{ month: string; year: string; employees: any[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 年月选择
  const currentYear = new Date().getFullYear();
  const [importYear, setImportYear] = useState(currentYear.toString());
  const [importMonth, setImportMonth] = useState((new Date().getMonth() + 1).toString());
  
  // 生成年份选项（当前年份前后10年）
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // 解析工资条数据
  const parseSalaryData = (text: string) => {
    const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    let year = new Date().getFullYear().toString();
    let month = (new Date().getMonth() + 1).toString();
    
    // 查找月份信息
    const monthMatch = text.match(/(\d{1,2})月/);
    if (monthMatch) {
      month = monthMatch[1];
    }
    const yearMatch = text.match(/(\d{4})年/);
    if (yearMatch) {
      year = yearMatch[1];
    }
    
    const records: SalaryRecord[] = [];
    
    // 尝试解析每条工资记录
    // 支持格式：每行一个字段，多条记录用空行分隔
    let currentRecord: Partial<SalaryRecord> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检测姓名
      const nameMatch = line.match(/^姓名[：:]\s*(.+)$/);
      if (nameMatch) {
        if (currentRecord.name) {
          // 保存上一条记录
          records.push(currentRecord as SalaryRecord);
          currentRecord = {};
        }
        currentRecord.name = nameMatch[1].trim();
        continue;
      }
      
      // 检测其他字段
      if (currentRecord.name) {
        const fieldParsers: { [key: string]: RegExp } = {
          isFullAttendance: /^是否全勤[：:]\s*(是|否|Yes|No)$/i,
          baseSalary: /^基础底薪|底薪[：:]\s*([\d.]+)$/,
          requiredHours: /^应出勤小时[：:]\s*([\d.]+)$/,
          normalFullAttendance: /^正班满勤[：:]\s*([\d.]+)$/,
          normalHours: /^正班工时[：:]\s*([\d.]+)$/,
          weekdayOvertime: /^平时加班[：:]\s*([\d.]+)$/,
          weekendOvertime: /^周末加班[：:]\s*([\d.]+)$/,
          normalPay: /^实际正班[：:]\s*([\d.]+)$/,
          weekdayOvertimePay: /^平时加班费[：:]\s*([\d.]+)$/,
          weekendOvertimePay: /^周末加班费[：:]\s*([\d.]+)$/,
          livingAllowance: /^生活补贴[：:]\s*([\d.]+)$/,
          seniority: /^工龄[：:]\s*([\d.]+)$/,
          fullAttendanceBonus: /^全勤奖[：:]\s*([\d.]+)$/,
          positionAllowance: /^岗位补贴[：:]\s*([\d.]+)$/,
          socialSecurity: /^社保[：:]\s*([\d.]+)$/,
          totalPayable: /^应付工资合计[：:]\s*([\d.]+)$/,
          deductSocialSecurity: /^扣社保[：:]\s*([\d.]+)$/,
          totalDeduction: /^应扣款合计[：:]\s*([\d.]+)$/,
          actualAmount: /^实发金额[：:]\s*([\d.]+)$/,
        };
        
        for (const [key, regex] of Object.entries(fieldParsers)) {
          const match = line.match(regex);
          if (match) {
            if (key === 'isFullAttendance') {
              (currentRecord as any)[key] = match[1] === '是' || match[1] === 'Yes';
            } else {
              (currentRecord as any)[key] = parseFloat(match[1]) || 0;
            }
            break;
          }
        }
      }
    }
    
    // 保存最后一条记录
    if (currentRecord.name) {
      records.push(currentRecord as SalaryRecord);
    }
    
    // 如果按字段解析失败，尝试按表格格式解析
    if (records.length === 0) {
      // 尝试解析表格格式：姓名	底薪	正班工时	平时加班	周末加班	...
      for (const line of lines) {
        const parts = line.split(/\t|\s{2,}/);
        if (parts.length < 3) continue;
        
        // 查找姓名
        let nameIdx = -1;
        for (let i = 0; i < parts.length; i++) {
          if (/[\u4e00-\u9fa5]{2,4}/.test(parts[i])) {
            nameIdx = i;
            break;
          }
        }
        
        if (nameIdx >= 0) {
          const name = parts[nameIdx].trim();
          // 尝试解析数值字段
          const nums = parts.filter((p, i) => i !== nameIdx && /^[\d.]+$/.test(p)).map(Number);
          
          if (nums.length >= 3) {
            records.push({
              name,
              isFullAttendance: false,
              baseSalary: nums[0] || 0,
              requiredHours: nums[1] || 0,
              normalFullAttendance: nums[1] || 0,
              normalHours: nums[2] || 0,
              weekdayOvertime: nums[3] || 0,
              weekendOvertime: nums[4] || 0,
              normalPay: nums[5] || 0,
              weekdayOvertimePay: nums[6] || 0,
              weekendOvertimePay: nums[7] || 0,
              livingAllowance: 0,
              seniority: 0,
              fullAttendanceBonus: 0,
              positionAllowance: 0,
              socialSecurity: 0,
              totalPayable: nums[8] || 0,
              deductSocialSecurity: nums[9] || 0,
              totalDeduction: nums[9] || 0,
              actualAmount: nums[10] || 0,
            });
          }
        }
      }
    }
    
    return { year, month, records };
  };

  // 解析工时数据
  const parseWorkHoursData = (text: string) => {
    const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    let year = new Date().getFullYear().toString();
    let month = (new Date().getMonth() + 1).toString();
    
    const monthMatch = text.match(/(\d{4})年(\d{1,2})月/);
    if (monthMatch) {
      year = monthMatch[1];
      month = monthMatch[2];
    }
    
    const employees: any[] = [];
    
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 5) continue;
      
      let nameIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (/[\u4e00-\u9fa5]/.test(parts[i]) && parts[i].length >= 2 && parts[i].length <= 4) {
          nameIndex = i;
          break;
        }
      }
      
      if (nameIndex === -1) continue;
      
      const name = parts[nameIndex];
      const workHours: { [day: number]: string } = {};
      
      let day = 1;
      for (let i = nameIndex + 1; i < parts.length && day <= 31; i++) {
        const value = parts[i];
        if (value && value !== '-' && value !== '') {
          workHours[day] = value;
        }
        day++;
      }
      
      if (Object.keys(workHours).length > 0) {
        let totalAttendance = 0;
        let normalWork = 0;
        let weekdayOvertime = 0;
        
        for (const hours of Object.values(workHours)) {
          const hourNum = parseFloat(hours);
          if (!isNaN(hourNum)) {
            totalAttendance += hourNum;
            if (hourNum <= 8) {
              normalWork += hourNum;
            } else {
              normalWork += 8;
              weekdayOvertime += (hourNum - 8);
            }
          }
        }
        
        employees.push({
          name,
          workHours,
          totalAttendance,
          normalWork,
          weekdayOvertime,
          weekendOvertime: 0
        });
      }
    }
    
    return { year, month, employees };
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 如果是打卡记录导入且是 Excel 文件，使用后端 API 处理
    if (importType === 'attendance' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImporting(true);
      try {
        // 先上传文件到临时位置
        const formData = new FormData();
        formData.append('file', file);
        
        // 调用上传 API
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error('文件上传失败');
        }
        
        const uploadData = await uploadRes.json();
        
        // 调用打卡记录导入 API（传递文件路径）
        const importRes = await fetch('/api/attendance-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fileUrl: uploadData.url,
            filePath: uploadData.filePath,
            location: importLocation
          })
        });
        
        if (!importRes.ok) {
          const errData = await importRes.json();
          throw new Error(errData.error || '导入失败');
        }
        
        const result = await importRes.json();
        setImportStep('success');
        // 存储结果用于显示，使用API返回的年月
        setParsedWorkHoursData({
          year: result.data?.year?.toString() || new Date().getFullYear().toString(),
          month: result.data?.month?.toString() || (new Date().getMonth() + 1).toString(),
          employees: result.data?.records || []
        });
        // 通知父组件导入完成
        if (onImportComplete && result.data) {
          onImportComplete({
            year: result.data.year || new Date().getFullYear(),
            month: result.data.month || (new Date().getMonth() + 1),
            location: result.data.location || importLocation,
            count: result.data.imported || result.data.records?.length || 0
          });
        }
      } catch (error) {
        alert((error as Error).message || '导入失败，请重试');
      } finally {
        setImporting(false);
      }
      return;
    }
    
    // 如果是工资条导入且是 Excel 文件，使用后端 API 处理
    if (importType === 'salary' && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImporting(true);
      try {
        // 先上传文件到临时位置
        const formData = new FormData();
        formData.append('file', file);
        
        // 调用上传 API
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error('文件上传失败');
        }
        
        const uploadData = await uploadRes.json();
        
        // 调用工资条导入 API
        const importRes = await fetch('/api/salary-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            filePath: uploadData.filePath,
            location: importLocation,
            year: parseInt(importYear),
            month: parseInt(importMonth)
          })
        });
        
        if (!importRes.ok) {
          const errData = await importRes.json();
          throw new Error(errData.error || '导入失败');
        }
        
        const result = await importRes.json();
        setImportStep('success');
        // 存储结果用于显示
        setParsedSalaryData({
          year: result.data.year?.toString() || new Date().getFullYear().toString(),
          month: result.data.month?.toString() || (new Date().getMonth() + 1).toString(),
          records: result.data?.records || []
        });
        // 通知父组件导入完成，切换到正确的年月
        if (onImportComplete && result.data) {
          onImportComplete({
            year: result.data.year,
            month: result.data.month,
            location: result.data.location,
            count: result.data.total || result.data.records?.length || 0
          });
        }
      } catch (error) {
        alert((error as Error).message || '导入失败，请重试');
      } finally {
        setImporting(false);
      }
      return;
    }
    
    // 文本文件处理
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawData(text);
    };
    reader.readAsText(file);
  };

  // 预览解析结果
  const handlePreview = () => {
    try {
      if (importType === 'salary') {
        const data = parseSalaryData(rawData);
        setParsedSalaryData(data);
      } else {
        const data = parseWorkHoursData(rawData);
        setParsedWorkHoursData(data);
      }
      setImportStep('preview');
    } catch (error) {
      alert('解析数据失败，请检查格式');
    }
  };

  // 执行导入
  const handleImport = async () => {
    setImporting(true);
    try {
      if (importType === 'salary' && parsedSalaryData) {
        await onImportSalary({ ...parsedSalaryData, location: importLocation });
      } else if (parsedWorkHoursData) {
        await onImportWorkHours(parsedWorkHoursData);
      }
      setImportStep('success');
    } catch (error) {
      alert('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 重置
  const handleReset = () => {
    setShowImportDialog(false);
    setImportStep('input');
    setRawData('');
    setParsedSalaryData(null);
    setParsedWorkHoursData(null);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setShowImportDialog(true)}>
        <Upload className="h-4 w-4 mr-2" />
        导入工资/工时
      </Button>

      <Dialog open={showImportDialog} onOpenChange={handleReset}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              工资/工时导入
            </DialogTitle>
            <DialogDescription>
              支持导入工资条或考勤表数据
            </DialogDescription>
          </DialogHeader>

          {importStep === 'input' && (
            <div className="space-y-4">
              {/* 导入类型选择 */}
              <Tabs value={importType} onValueChange={(v) => setImportType(v as 'salary' | 'workhours' | 'attendance')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="attendance">打卡记录导入</TabsTrigger>
                  <TabsTrigger value="salary">工资条导入</TabsTrigger>
                  <TabsTrigger value="workhours">工时考勤导入</TabsTrigger>
                </TabsList>
                
                {/* 位置选择 - 所有导入类型都显示 */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">选择位置</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant={importLocation === '办公室' ? 'default' : 'outline'}
                          onClick={() => setImportLocation('办公室')}
                        >
                          办公室
                        </Button>
                        <Button 
                          variant={importLocation === '车间' ? 'default' : 'outline'}
                          onClick={() => setImportLocation('车间')}
                        >
                          车间
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">选择年月</Label>
                      <div className="flex gap-2">
                        <Select value={importYear} onValueChange={setImportYear}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="年份" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}年</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={importMonth} onValueChange={setImportMonth}>
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="月份" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString()}>{month}月</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <TabsContent value="attendance" className="mt-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">打卡记录导入说明</h4>
                    <p className="text-sm text-purple-700 mb-2">
                      支持 Excel 文件 (.xlsx/.xls) 或文本格式：
                    </p>
                    <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                      <li>文件名或内容中包含年月信息（如：202604月）</li>
                      <li>表格包含：序号、工号、姓名、日期列（1-31日）</li>
                      <li>打卡格式：时间范围（09:00-18:00）或工时数字（8）</li>
                      <li>自动创建新员工，自动计算工时统计</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="salary" className="mt-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">工资条格式说明</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      支持的字段（每行一个字段）：
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                      <li>月份（如：4月）</li>
                      <li>姓名、是否全勤、基础底薪、应出勤小时</li>
                      <li>正班满勤、正班工时、平时加班、周末加班</li>
                      <li>实际正班、平时加班费、周末加班费</li>
                      <li>生活补贴、工龄、全勤奖、岗位补贴、社保</li>
                      <li>应付工资合计、扣社保、应扣款合计、实发金额</li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="workhours" className="mt-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">工时考勤格式说明</h4>
                    <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                      <li>第一行包含月份信息，如"2028年4月"</li>
                      <li>每行一个员工，格式：序号 工号 姓名 1日 2日 3日 ...</li>
                      <li>工时数据：数字表示工作时长，"休"表示休息，"日"表示周日</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 文件上传 */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.csv,.xlsx,.xls"
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  点击选择文件或直接粘贴数据
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {importType === 'attendance' 
                    ? '支持 Excel 文件 (.xlsx/.xls)'
                    : '支持文本文件 (.txt/.csv)'}
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  选择文件
                </Button>
              </div>

              {/* 文本输入 */}
              <div>
                <Label>或直接粘贴数据</Label>
                <Textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder={importType === 'salary' 
                    ? `示例格式：
4月
姓名：聚星
是否全勤：否
基础底薪：2200
应出勤小时：176
正班满勤：176
正班工时：172
平时加班：44
周末加班：24
实际正班：2150
平时加班费：792
周末加班费：576
应付工资合计：3518
扣社保：415.41
实发金额：3102.59`
                    : `示例格式：
2028年4月
序号 工号 姓名 1 2 3 4 5 6 7 8 9 10 ...
1  聚星  日 5 8 8 8 8 8 8 8 8 ...`}
                  className="mt-2 font-mono text-sm"
                  rows={10}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePreview} disabled={!rawData.trim()}>
                  解析预览
                </Button>
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="space-y-4">
              {importType === 'salary' && parsedSalaryData && (
                <>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Badge variant="outline">{parsedSalaryData.year}年{parsedSalaryData.month}月</Badge>
                    <span>共 {parsedSalaryData.records.length} 位员工工资</span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead className="text-right">底薪</TableHead>
                        <TableHead className="text-right">正班工时</TableHead>
                        <TableHead className="text-right">平时加班</TableHead>
                        <TableHead className="text-right">周末加班</TableHead>
                        <TableHead className="text-right">应付合计</TableHead>
                        <TableHead className="text-right">实发金额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedSalaryData.records.map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{record.name}</TableCell>
                          <TableCell className="text-right">¥{record.baseSalary}</TableCell>
                          <TableCell className="text-right">{record.normalHours}h</TableCell>
                          <TableCell className="text-right">{record.weekdayOvertime}h</TableCell>
                          <TableCell className="text-right">{record.weekendOvertime}h</TableCell>
                          <TableCell className="text-right">¥{record.totalPayable}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">¥{record.actualAmount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {parsedSalaryData.records.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>未能解析到工资数据，请检查格式</p>
                    </div>
                  )}
                </>
              )}

              {importType === 'workhours' && parsedWorkHoursData && (
                <>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    <Badge variant="outline">{parsedWorkHoursData.year}年{parsedWorkHoursData.month}月</Badge>
                    <span>共 {parsedWorkHoursData.employees.length} 位员工工时</span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead className="text-right">总出勤</TableHead>
                        <TableHead className="text-right">正班</TableHead>
                        <TableHead className="text-right">平时加班</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedWorkHoursData.employees.map((emp, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="text-right">{emp.totalAttendance}小时</TableCell>
                          <TableCell className="text-right">{emp.normalWork}小时</TableCell>
                          <TableCell className="text-right">{emp.weekdayOvertime}小时</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setImportStep('input')}>
                  返回修改
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                >
                  {importing ? '导入中...' : '确认导入'}
                </Button>
              </div>
            </div>
          )}

          {importStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium mb-2">导入成功</h3>
              <p className="text-muted-foreground mb-4">
                已成功导入 {importType === 'salary' 
                  ? `${parsedSalaryData?.records.length || 0} 位员工的工资数据`
                  : `${parsedWorkHoursData?.employees.length || 0} 位员工的工时数据`}
              </p>
              <Button onClick={handleReset}>
                完成
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
