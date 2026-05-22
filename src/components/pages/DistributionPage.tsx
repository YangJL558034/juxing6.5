'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Distributor {
  id: number;
  name: string;
  phone: string;
  level: string;
  sales: number;
  commission: number;
  status: string;
  created_at: string;
}

const levelOptions = [
  { value: '金牌', label: '金牌', color: 'text-yellow-500' },
  { value: '银牌', label: '银牌', color: 'text-gray-400' },
  { value: '铜牌', label: '铜牌', color: 'text-orange-400' },
];

export default function DistributionPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDistributor, setNewDistributor] = useState({
    name: '',
    phone: '',
    level: '铜牌',
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      const response = await fetch('/api/distributors');
      const data = await response.json();
      if (data.success) {
        setDistributors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDistributor.name) return;

    try {
      const response = await fetch('/api/distributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDistributor),
      });

      const data = await response.json();
      if (data.success) {
        await fetchDistributors();
        setIsDialogOpen(false);
        setNewDistributor({ name: '', phone: '', level: '铜牌' });
      }
    } catch (error) {
      console.error('Failed to add distributor:', error);
    }
  };

  const getLevelVariant = (level: string) => {
    switch (level) {
      case '金牌':
        return 'default';
      case '银牌':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const totalSales = distributors.reduce((sum, d) => sum + (d.sales || 0), 0);
  const totalCommission = distributors.reduce((sum, d) => sum + (d.commission || 0), 0);
  const activeCount = distributors.filter(d => d.status === '活跃').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">分销达人</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 h-9">+ 新增分销商</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>新增分销商</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">姓名 *</Label>
                <Input
                  value={newDistributor.name}
                  onChange={(e) => setNewDistributor({ ...newDistributor, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">手机</Label>
                <Input
                  value={newDistributor.phone}
                  onChange={(e) => setNewDistributor({ ...newDistributor, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">等级</Label>
                <Select
                  value={newDistributor.level}
                  onValueChange={(v) => setNewDistributor({ ...newDistributor, level: v })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleAdd}>确定</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">总人数</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{distributors.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">活跃数</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">总销售额</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">¥{totalSales.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">总佣金</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">¥{totalCommission.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>分销商列表</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>销售额</TableHead>
                <TableHead>佣金</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distributors.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getLevelVariant(d.level)}>{d.level}</Badge>
                  </TableCell>
                  <TableCell>¥{(d.sales || 0).toLocaleString()}</TableCell>
                  <TableCell>¥{(d.commission || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === '活跃' ? 'default' : 'secondary'}>{d.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
