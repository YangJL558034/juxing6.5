'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, DollarSign, Upload, Download, X, FileText } from 'lucide-react';

interface Invoice {
  id: number;
  invoice_no: string;
  contract_id?: number;
  customer_name?: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  type: string;
  issue_date?: string;
  remark?: string;
  owner?: string;
  proof_file?: string;
  proof_file_name?: string;
  created_at: string;
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    invoice_no: '',
    customer_name: '',
    amount: '',
    tax: '',
    total: '',
    status: '待开票',
    type: '增值税专用发票',
    issue_date: '',
    remark: '',
    owner: '',
    proof_file: '',
    proof_file_name: '',
  });

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('获取发票失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingInvoice(null);
    setFormData({
      invoice_no: '', customer_name: '', amount: '', tax: '', total: '',
      status: '待开票', type: '增值税专用发票', issue_date: '', remark: '', owner: '',
      proof_file: '', proof_file_name: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_no: invoice.invoice_no,
      customer_name: invoice.customer_name || '',
      amount: invoice.amount?.toString() || '',
      tax: invoice.tax?.toString() || '',
      total: invoice.total?.toString() || '',
      status: invoice.status || '待开票',
      type: invoice.type || '增值税专用发票',
      issue_date: invoice.issue_date || '',
      remark: invoice.remark || '',
      owner: invoice.owner || '',
      proof_file: invoice.proof_file || '',
      proof_file_name: invoice.proof_file_name || '',
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
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const res = await fetch('/api/invoices/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          proof_file: data.fileKey,
          proof_file_name: data.fileName,
        }));
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      proof_file: '',
      proof_file_name: '',
    }));
  };

  const handleDownload = async (fileKey: string, fileName: string) => {
    try {
      const res = await fetch('/api/invoices/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey }),
      });
      const data = await res.json();
      if (data.downloadUrl) {
        // 使用fetch下载文件
        const response = await fetch(data.downloadUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert(data.error || '获取下载链接失败');
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败');
    }
  };

  const handleSave = async () => {
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : '/api/invoices';
      const method = editingInvoice ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
          tax: parseFloat(formData.tax) || 0,
          total: parseFloat(formData.total) || 0,
        }),
      });
      if (res.ok) { setShowDialog(false); fetchInvoices(); }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此发票吗？')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInvoices();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已开票': return 'text-green-600';
      case '待开票': return 'text-orange-600';
      case '已作废': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoice_no.includes(searchTerm) || (i.customer_name && i.customer_name.includes(searchTerm))
  );

  if (loading) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>发票管理</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索发票..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64" />
            </div>
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />添加发票</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>发票号码</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>税额</TableHead>
                <TableHead>价税合计</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开票日期</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>证明文件</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground">暂无发票数据</TableCell></TableRow>
              ) : filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                  <TableCell>{invoice.customer_name || '-'}</TableCell>
                  <TableCell>{invoice.owner || '-'}</TableCell>
                  <TableCell><DollarSign className="h-3 w-3 inline" />{invoice.amount?.toLocaleString()}</TableCell>
                  <TableCell>{invoice.tax?.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold">{invoice.total?.toLocaleString()}</TableCell>
                  <TableCell className={getStatusColor(invoice.status)}>{invoice.status}</TableCell>
                  <TableCell>{invoice.issue_date || '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={invoice.remark}>
                    {invoice.remark || '-'}
                  </TableCell>
                  <TableCell>
                    {invoice.proof_file ? (
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(invoice.proof_file!, invoice.proof_file_name || '证明文件.pdf')}>
                        <Download className="h-4 w-4 mr-1" />下载
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(invoice.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingInvoice ? '编辑发票' : '添加发票'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2"><Label>发票号码 *</Label><Input value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} /></div>
            <div className="grid gap-2"><Label>客户名称</Label><Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>金额</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div className="grid gap-2"><Label>税额</Label><Input type="number" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} /></div>
            <div className="grid gap-2"><Label>价税合计</Label><Input type="number" value={formData.total} onChange={(e) => setFormData({ ...formData, total: e.target.value })} /></div>
            <div className="grid gap-2"><Label>状态</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="待开票">待开票</SelectItem>
                  <SelectItem value="已开票">已开票</SelectItem>
                  <SelectItem value="已作废">已作废</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>发票类型</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="增值税专用发票">增值税专用发票</SelectItem>
                  <SelectItem value="增值税普通发票">增值税普通发票</SelectItem>
                  <SelectItem value="电子发票">电子发票</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>开票日期</Label><Input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} /></div>
            <div className="grid gap-2"><Label>负责人</Label><Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} /></div>
            <div className="grid gap-2"><Label>备注</Label><Input value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} /></div>
            
            {/* 证明文件上传 */}
            <div className="grid gap-2">
              <Label>证明文件 (PDF)</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {formData.proof_file_name ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span className="flex-1 text-sm truncate">{formData.proof_file_name}</span>
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
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? '上传中...' : '上传PDF文件'}
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

export default InvoicesPage;
