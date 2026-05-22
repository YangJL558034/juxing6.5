'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, Phone, Video, Users } from 'lucide-react';

interface Visit {
  id: number;
  customer_id?: number;
  customer_name?: string;
  contact_name?: string;
  visit_date?: string;
  visit_type: string;
  content?: string;
  next_plan?: string;
  satisfaction: string;
  owner?: string;
  created_at: string;
}

export function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '', contact_name: '', visit_date: '', visit_type: '电话回访',
    content: '', next_plan: '', satisfaction: '满意', owner: '',
  });

  useEffect(() => { fetchVisits(); }, []);

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/visits');
      const data = await res.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error('获取回访失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingVisit(null);
    setFormData({
      customer_name: '', contact_name: '', visit_date: '', visit_type: '电话回访',
      content: '', next_plan: '', satisfaction: '满意', owner: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setFormData({
      customer_name: visit.customer_name || '',
      contact_name: visit.contact_name || '',
      visit_date: visit.visit_date || '',
      visit_type: visit.visit_type || '电话回访',
      content: visit.content || '',
      next_plan: visit.next_plan || '',
      satisfaction: visit.satisfaction || '满意',
      owner: visit.owner || '',
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const url = editingVisit ? `/api/visits/${editingVisit.id}` : '/api/visits';
      const method = editingVisit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setShowDialog(false); fetchVisits(); }
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此回访记录吗？')) return;
    try {
      const res = await fetch(`/api/visits/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVisits();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const getVisitTypeIcon = (type: string) => {
    switch (type) {
      case '电话回访': return <Phone className="h-3 w-3" />;
      case '视频回访': return <Video className="h-3 w-3" />;
      case '上门回访': return <Users className="h-3 w-3" />;
      default: return <Phone className="h-3 w-3" />;
    }
  };

  const getSatisfactionColor = (satisfaction: string) => {
    switch (satisfaction) {
      case '非常满意': return 'text-green-600';
      case '满意': return 'text-blue-600';
      case '一般': return 'text-orange-600';
      case '不满意': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredVisits = visits.filter(v => 
    (v.customer_name && v.customer_name.includes(searchTerm)) || 
    (v.contact_name && v.contact_name.includes(searchTerm))
  );

  if (loading) return <div className="p-6">加载中...</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>回访管理</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索回访..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-64" />
            </div>
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" />添加回访</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户名称</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>回访日期</TableHead>
                <TableHead>回访方式</TableHead>
                <TableHead>回访内容</TableHead>
                <TableHead>满意度</TableHead>
                <TableHead>下次计划</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">暂无回访数据</TableCell></TableRow>
              ) : filteredVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.customer_name || '-'}</TableCell>
                  <TableCell>{visit.contact_name || '-'}</TableCell>
                  <TableCell>{visit.visit_date || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getVisitTypeIcon(visit.visit_type)}
                      {visit.visit_type}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{visit.content || '-'}</TableCell>
                  <TableCell className={getSatisfactionColor(visit.satisfaction)}>{visit.satisfaction}</TableCell>
                  <TableCell className="max-w-xs truncate">{visit.next_plan || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(visit)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(visit.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingVisit ? '编辑回访' : '添加回访'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>客户名称</Label><Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>联系人</Label><Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>回访日期</Label><Input type="date" value={formData.visit_date} onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })} /></div>
            <div className="grid gap-2"><Label>回访方式</Label>
              <Select value={formData.visit_type} onValueChange={(v) => setFormData({ ...formData, visit_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="电话回访">电话回访</SelectItem>
                  <SelectItem value="视频回访">视频回访</SelectItem>
                  <SelectItem value="上门回访">上门回访</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>回访内容</Label><Input value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} /></div>
            <div className="grid gap-2"><Label>满意度</Label>
              <Select value={formData.satisfaction} onValueChange={(v) => setFormData({ ...formData, satisfaction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="非常满意">非常满意</SelectItem>
                  <SelectItem value="满意">满意</SelectItem>
                  <SelectItem value="一般">一般</SelectItem>
                  <SelectItem value="不满意">不满意</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>下次计划</Label><Input value={formData.next_plan} onChange={(e) => setFormData({ ...formData, next_plan: e.target.value })} /></div>
            <div className="grid gap-2"><Label>负责人</Label><Input value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VisitsPage;
