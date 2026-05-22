'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText, User, Monitor, Globe } from 'lucide-react';

interface OperationLog {
  id: number;
  user_id: number | null;
  user_name: string;
  module: string;
  action: string;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const moduleLabels: Record<string, string> = {
  employee_query: '员工自助查询',
  salary: '工资管理',
  employee: '员工管理',
  asset: '资产管理',
  user: '用户管理',
  auth: '认证登录',
  system: '系统设置',
};

const actionColors: Record<string, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  view: 'bg-blue-100 text-blue-800',
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
  sign: 'bg-purple-100 text-purple-800',
  export: 'bg-cyan-100 text-cyan-800',
  import: 'bg-indigo-100 text-indigo-800',
};

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      if (moduleFilter && moduleFilter !== 'all') {
        params.append('module', moduleFilter);
      }

      const response = await fetch(`/api/operation-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('获取日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user_name.toLowerCase().includes(searchLower) ||
      log.module.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      (log.ip_address && log.ip_address.includes(searchTerm))
    );
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              操作日志
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              共 {pagination.total} 条记录
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件 */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户、模块、IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择模块" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模块</SelectItem>
                <SelectItem value="employee_query">员工自助查询</SelectItem>
                <SelectItem value="salary">工资管理</SelectItem>
                <SelectItem value="employee">员工管理</SelectItem>
                <SelectItem value="asset">资产管理</SelectItem>
                <SelectItem value="user">用户管理</SelectItem>
                <SelectItem value="auth">认证登录</SelectItem>
                <SelectItem value="system">系统设置</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 日志表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">时间</TableHead>
                  <TableHead className="w-[100px]">用户</TableHead>
                  <TableHead className="w-[120px]">模块</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                  <TableHead>详情</TableHead>
                  <TableHead className="w-[140px]">IP地址</TableHead>
                  <TableHead className="w-[200px]">设备信息</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无日志记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const details = parseDetails(log.details);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{log.user_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {moduleLabels[log.module] || log.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || ''}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {typeof details === 'object'
                              ? details.message || JSON.stringify(details)
                              : details}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {log.ip_address || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate max-w-[160px]" title={log.user_agent || ''}>
                              {log.user_agent
                                ? log.user_agent.split(')').pop()?.trim().split(' ')[0] || log.user_agent.substring(0, 30)
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
