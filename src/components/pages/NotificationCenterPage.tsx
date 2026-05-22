'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Mail, Search, Check, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
}

interface NotificationRecord {
  id: number;
  title: string;
  content?: string;
  receiver_name: string;
  created_at: string;
  is_read: boolean;
  email_sent: number;
  email_error?: string;
}

// 格式化相对时间
const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};

export default function NotificationCenterPage() {
  // 发送通知相关状态
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyContent, setNotifyContent] = useState('');
  const [notifyReceiverIds, setNotifyReceiverIds] = useState<number[]>([]);
  const [notifyAll, setNotifyAll] = useState(false);
  const [sending, setSending] = useState(false);
  
  // 通知记录
  const [notificationRecords, setNotificationRecords] = useState<NotificationRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContentIds, setExpandedContentIds] = useState<Set<number>>(new Set());
  
  // 用户列表（用于选择接收人）
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'send' | 'records'>('send');

  const toggleContentExpand = (id: number) => {
    setExpandedContentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchNotificationRecords();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const fetchNotificationRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await fetch('/api/notifications/list');
      const data = await res.json();
      if (data.success) {
        setNotificationRecords(data.data.notifications || []);
      }
    } catch (error) {
      console.error('获取通知记录失败:', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  // 打开发送通知对话框
  const handleOpenNotify = () => {
    setNotifyTitle('');
    setNotifyContent('');
    setNotifyReceiverIds([]);
    setNotifyAll(false);
    setNotifyDialogOpen(true);
  };

  // 发送通知
  const handleSendNotification = async () => {
    if (!notifyTitle.trim()) {
      alert('请输入通知标题');
      return;
    }
    if (!notifyAll && notifyReceiverIds.length === 0) {
      alert('请选择接收用户或选择全部用户');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifyTitle,
          content: notifyContent,
          receiverIds: notifyAll ? 'all' : notifyReceiverIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`通知发送成功！${data.emailCount > 0 ? `已发送${data.emailCount}封邮件` : ''}`);
        setNotifyDialogOpen(false);
        fetchNotificationRecords();
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      alert('发送失败');
    } finally {
      setSending(false);
    }
  };

  const filteredRecords = notificationRecords.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: notificationRecords.length,
    read: notificationRecords.filter(r => r.is_read).length,
    unread: notificationRecords.filter(r => !r.is_read).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">通知中心</h1>
          <p className="text-slate-500 mt-1">管理系统通知，发送消息给用户</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-slate-500">总通知数</p>
            </div>
            <Bell className="w-10 h-10 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.read}</p>
              <p className="text-sm text-slate-500">已读</p>
            </div>
            <Check className="w-10 h-10 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
              <p className="text-sm text-slate-500">未读</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      {/* 标签页切换 */}
      <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
        <Button
          variant={activeTab === 'send' ? 'default' : 'ghost'}
          size="sm"
          className={activeTab === 'send' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          onClick={() => setActiveTab('send')}
        >
          <Send className="w-4 h-4 mr-2" />
          发起通知
        </Button>
        <Button
          variant={activeTab === 'records' ? 'default' : 'ghost'}
          size="sm"
          className={activeTab === 'records' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          onClick={() => setActiveTab('records')}
        >
          <Mail className="w-4 h-4 mr-2" />
          通知记录
        </Button>
      </div>

      {/* 发起通知面板 */}
      {activeTab === 'send' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              发起通知
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>通知标题 *</Label>
                  <Input
                    placeholder="请输入通知标题"
                    className="h-12 text-lg"
                    onClick={handleOpenNotify}
                    readOnly
                    value="点击右侧按钮发起通知"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
                    onClick={handleOpenNotify}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    发起通知
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500">
                  <Bell className="w-4 h-4 mr-2 inline" />
                  通知将发送给指定用户，并通过邮件提醒接收人查看。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知记录面板 */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              通知记录
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索通知..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingRecords ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notificationRecords.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无通知记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">标题</TableHead>
                      <TableHead className="w-48">内容</TableHead>
                      <TableHead className="w-28">接收人</TableHead>
                      <TableHead className="w-36">发送时间</TableHead>
                      <TableHead className="w-20">阅读状态</TableHead>
                      <TableHead className="w-20">邮件状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="truncate max-w-32">
                          <div className="font-medium truncate" title={record.title}>
                            {record.title}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-48">
                          {record.content ? (
                            <div className="whitespace-pre-wrap break-all">
                              <p className={`text-xs text-muted-foreground ${expandedContentIds.has(record.id) ? '' : 'line-clamp-2'}`}
                                 style={{ wordBreak: 'break-all', wordWrap: 'break-word' }}
                                 title={record.content}>
                                {record.content}
                              </p>
                              {record.content.length > 80 && (
                                <button
                                  onClick={() => toggleContentExpand(record.id)}
                                  className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block"
                                >
                                  {expandedContentIds.has(record.id) ? '收起' : '展开全文'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="truncate max-w-28" title={record.receiver_name}>
                          {record.receiver_name}
                        </TableCell>
                        <TableCell className="truncate max-w-36">
                          <span title={new Date(record.created_at).toLocaleString('zh-CN')}>
                            {formatRelativeTime(record.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {record.is_read ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs">
                              <Check className="h-3 w-3" /> 已读
                            </span>
                          ) : (
                            <span className="text-orange-600 flex items-center gap-1 text-xs">
                              <span className="h-2 w-2 rounded-full bg-orange-500"></span> 未读
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.email_sent === 1 ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs">
                              <Check className="h-3 w-3" /> 已发送
                            </span>
                          ) : record.email_error ? (
                            <span className="text-red-600 text-xs" title={record.email_error}>
                              发送失败
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">未发送</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 发送通知对话框 */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              发送通知
            </DialogTitle>
            <DialogDescription>向用户发送系统通知，同时发送邮件提醒</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>通知标题 *</Label>
              <Input
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="请输入通知标题"
              />
            </div>
            <div className="space-y-2">
              <Label>通知内容</Label>
              <Textarea
                value={notifyContent}
                onChange={(e) => setNotifyContent(e.target.value)}
                placeholder="请输入通知内容"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notify-all"
                  checked={notifyAll}
                  onCheckedChange={(checked) => {
                    setNotifyAll(!!checked);
                    if (checked) setNotifyReceiverIds([]);
                  }}
                />
                <Label htmlFor="notify-all" className="cursor-pointer">
                  发送给全部用户 ({users.length}人)
                </Label>
              </div>
            </div>
            {!notifyAll && (
              <div className="space-y-2">
                <Label>选择接收用户 ({users.filter(u => u.id !== 1).length}人可选)</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {users.filter(u => u.id !== 1).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      暂无可选用户
                    </div>
                  ) : (
                    users.filter(u => u.id !== 1).map((user) => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={notifyReceiverIds.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNotifyReceiverIds([...notifyReceiverIds, user.id]);
                            } else {
                              setNotifyReceiverIds(notifyReceiverIds.filter((id) => id !== user.id));
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user.id}`} className="cursor-pointer text-sm">
                          {user.name} ({user.username}) {user.email ? `- ${user.email}` : ''}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSendNotification} disabled={sending}>
              {sending ? '发送中...' : '发送通知'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}