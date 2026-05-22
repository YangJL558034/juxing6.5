'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, DollarSign, Upload, Download, X, FileText } from 'lucide-react';

interface Contract {
  id: number;
  name: string;
  customer_id?: number;
  customer_name?: string;
  amount: number;
  start_date?: string;
  end_date?: string;
  status: string;
  type?: string;
  sign_date?: string;
  remark?: string;
  owner?: string;
  proof_file?: string;
  proof_file_name?: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    customer_id: '',
    customer_name: '',
    amount: '',
    start_date: '',
    end_date: '',
    status: '执行中',
    type: '',
    sign_date: '',
    remark: '',
    owner: '',
    proof_file: '',
    proof_file_name: '',
  });

  useEffect(() => {
    fetchContracts();
    fetchCustomers();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data.contracts || []);
    } catch (error) {
      console.error('获取合同失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingContract(null);
    setFormData({
      name: '',
      customer_id: '',
      customer_name: '',
      amount: '',
      start_date: '',
      end_date: '',
      status: '执行中',
      type: '',
      sign_date: '',
      remark: '',
      owner: '',
      proof_file: '',
      proof_file_name: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      customer_id: contract.customer_id?.toString() || '',
      customer_name: contract.customer_name || '',
      amount: contract.amount?.toString() || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      status: contract.status || '执行中',
      type: contract.type || '',
      sign_date: contract.sign_date || '',
      remark: contract.remark || '',
      owner: contract.owner || '',
      proof_file: contract.proof_file || '',
      proof_file_name: contract.proof_file_name || '',
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
      
      const res = await fetch('/api/contracts/upload', {
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
      const res = await fetch('/api/contracts/download', {
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
      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts';
      const method = editingContract ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
          customer_id: parseInt(formData.customer_id) || null,
        }),
      });
      
      if (res.ok) {
        setShowDialog(false);
        fetchContracts();
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此合同吗？')) return;
    
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchContracts();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '执行中': return 'text-green-600';
      case '已完成': return 'text-blue-600';
      case '已终止': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.name.includes(searchTerm) || 
    (c.customer_name && c.customer_name.includes(searchTerm))
  );

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>合同管理</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索合同..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              添加合同
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同名称</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>合同金额</TableHead>
                <TableHead>开始日期</TableHead>
                <TableHead>结束日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>证明文件</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    暂无合同数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.name}</TableCell>
                    <TableCell>{contract.customer_name || '-'}</TableCell>
                    <TableCell>{contract.owner || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {contract.amount?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell>{contract.start_date || '-'}</TableCell>
                    <TableCell>{contract.end_date || '-'}</TableCell>
                    <TableCell className={getStatusColor(contract.status)}>
                      {contract.status}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={contract.remark}>
                      {contract.remark || '-'}
                    </TableCell>
                    <TableCell>
                      {contract.proof_file ? (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(contract.proof_file!, contract.proof_file_name || '证明文件.pdf')}>
                          <Download className="h-4 w-4 mr-1" />下载
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(contract)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(contract.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContract ? '编辑合同' : '添加合同'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>合同名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入合同名称"
              />
            </div>
            <div className="grid gap-2">
              <Label>客户</Label>
              <Select
                value={formData.customer_id || 'custom'}
                onValueChange={(v) => {
                  if (v === 'custom') {
                    setFormData({ 
                      ...formData, 
                      customer_id: '',
                    });
                  } else {
                    const customer = customers.find(c => c.id.toString() === v);
                    setFormData({ 
                      ...formData, 
                      customer_id: v,
                      customer_name: customer?.name || ''
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem key="custom" value="custom">
                    自定义客户名称
                  </SelectItem>
                </SelectContent>
              </Select>
              {!formData.customer_id && (
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="请输入客户名称"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>合同金额</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="请输入金额"
              />
            </div>
            <div className="grid gap-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="执行中">执行中</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="已终止">已终止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>合同类型</Label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="请输入合同类型"
              />
            </div>
            <div className="grid gap-2">
              <Label>签订日期</Label>
              <Input
                type="date"
                value={formData.sign_date}
                onChange={(e) => setFormData({ ...formData, sign_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>负责人</Label>
              <Input
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="请输入负责人"
              />
            </div>
            <div className="grid gap-2">
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="请输入备注"
              />
            </div>
            
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

export default ContractsPage;
