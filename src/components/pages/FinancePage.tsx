'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown, Upload, Download, FileText, X } from 'lucide-react';

interface Finance {
  id: number;
  type: string;
  category?: string;
  amount: number;
  date?: string;
  related_id?: number;
  related_type?: string;
  remark?: string;
  owner?: string;
  department?: string;
  proof_file?: string;
  proof_file_name?: string;
  created_at: string;
}

export function FinancePage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: '收入', category: '', amount: '', date: '', remark: '', owner: '', department: '',
    proof_file: '', proof_file_name: ''
  });

  useEffect(() => { fetchFinances(); }, []);

  const fetchFinances = async () => {
    try {
      const res = await fetch('/api/finances');
      const data = await res.json();
      setFinances(data.finances || []);
    } catch (error) {
      console.error('获取财务明细失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFinance(null);
    setFormData({ type: '收入', category: '', amount: '', date: '', remark: '', owner: '', department: '', proof_file: '', proof_file_name: '' });
    setShowDialog(true);
  };

  const handleEdit = (finance: Finance) => {
    setEditingFinance(finance);
    setFormData({
      type: finance.type || '收入',
      category: finance.category || '',
      amount: finance.amount?.toString() || '',
      date: finance.date || '',
      remark: finance.remark || '',
      owner: finance.owner || '',
      department: finance.department || '',
      proof_file: finance.proof_file || '',
      proof_file_name: finance.proof_file_name || '',
    });
    setShowDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('只支持PDF文件');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过10MB');
      return;
    }
    
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await fetch('/api/finances/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData({ ...formData, proof_file: data.fileKey, proof_file_name: data.fileName });
      } else {
        alert('上传失败: ' + data.error);
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, proof_file: '', proof_file_name: '' });
  };

  const handleDownload = async (finance: Finance) => {
    if (!finance.proof_file) return;
    
    try {
      const res = await fetch('/api/finances/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey: finance.proof_file }),
      });
      const data = await res.json();
      
      if (data.downloadUrl) {
        // 使用 fetch + blob 模式下载
        const response = await fetch(data.downloadUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = finance.proof_file_name || '证明文件.pdf';
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        alert('生成下载链接失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败');
    }
  };

  const handleSave = async () => {
    try {
      const url = editingFinance ? `/api/finances/${editingFinance.id}` : '/api/finances';
      const method = editingFinance ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
        }),
      });
      if (res.ok) { setShowDialog(false); fetchFinances(); }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此财务记录吗？')) return;
    try {
      const res = await fetch(`/api/finances/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinances();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const filteredFinances = finances.filter(f => {
    const matchSearch = (f.category && f.category.includes(searchTerm)) || 
      (f.remark && f.remark.includes(searchTerm)) ||
      (f.department && f.department.includes(searchTerm));
    const matchType = filterType === 'all' || f.type === filterType;
    return matchSearch && matchType;
  });

  const totalIncome = finances.filter(f => f.type === '收入').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalExpense = finances.filter(f => f.type === '支出').reduce((sum, f) => sum + (f.amount || 0), 0);

  if (loading) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总收入</p>
                <p className="text-2xl font-bold text-green-600">¥{totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总支出</p>
                <p className="text-2xl font-bold text-red-600">¥{totalExpense.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">净收益</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{(totalIncome - totalExpense).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>财务明细</CardTitle>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="收入">收入</SelectItem>
                <SelectItem value="支出">支出</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-48" />
            </div>
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />添加记录</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>证明文件</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinances.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">暂无财务数据</TableCell></TableRow>
              ) : filteredFinances.map((finance) => (
                <TableRow key={finance.id}>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${finance.type === '收入' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {finance.type}
                    </span>
                  </TableCell>
                  <TableCell>{finance.category || '-'}</TableCell>
                  <TableCell className={finance.type === '收入' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {finance.type === '收入' ? '+' : '-'}¥{finance.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>{finance.date || '-'}</TableCell>
                  <TableCell>{finance.department || '-'}</TableCell>
                  <TableCell>{finance.owner || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{finance.remark || '-'}</TableCell>
                  <TableCell>
                    {finance.proof_file ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(finance)} title="下载证明文件">
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">无</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(finance)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(finance.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingFinance ? '编辑财务记录' : '添加财务记录'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>类型 *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="收入">收入</SelectItem>
                  <SelectItem value="支出">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>分类</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="如：工资、租金、销售收入等" /></div>
            <div className="grid gap-2"><Label>金额 *</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div className="grid gap-2"><Label>日期</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
            <div className="grid gap-2"><Label>部门</Label><Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
            <div className="grid gap-2"><Label>负责人</Label><Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} /></div>
            <div className="grid gap-2"><Label>备注</Label><Input value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} /></div>
            <div className="grid gap-2">
              <Label>证明文件 (PDF)</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {formData.proof_file ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span className="text-sm flex-1 truncate">{formData.proof_file_name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? '上传中...' : '选择PDF文件'}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave} disabled={uploading}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FinancePage;
