'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function GeneratePage() {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    content: '',
    template: '',
  });

  const handleGenerate = () => {
    // TODO: 实现生成逻辑
    alert('生成功能开发中...');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">生成管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 生成配置 */}
        <Card>
          <CardHeader>
            <CardTitle>生成配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>生成类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择生成类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">文章</SelectItem>
                  <SelectItem value="report">报告</SelectItem>
                  <SelectItem value="contract">合同</SelectItem>
                  <SelectItem value="email">邮件</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                placeholder="请输入标题"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>模板选择</Label>
              <Select
                value={formData.template}
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择模板" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认模板</SelectItem>
                  <SelectItem value="business">商务模板</SelectItem>
                  <SelectItem value="simple">简洁模板</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>内容描述</Label>
              <Textarea
                placeholder="请输入需要生成的内容描述..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>

            <Button onClick={handleGenerate} className="w-full">
              开始生成
            </Button>
          </CardContent>
        </Card>

        {/* 生成历史 */}
        <Card>
          <CardHeader>
            <CardTitle>生成历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-10">
              暂无生成记录
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
