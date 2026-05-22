'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Mail, MailX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  content: string;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  is_read: number;
  read_at: string | null;
  created_at: string;
  type: string;
  email_sent: number;
  email_error: string | null;
}

interface NotificationBellProps {
  userId: number;
  userName: string;
}

export function NotificationBell({ userId, userName }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 获取通知
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications?receiverId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount((data.data || []).filter((n: Notification) => n.is_read === 0).length);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    // 每30秒刷新一次
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 标记单个通知已读
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记所有已读
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId, markAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
    setLoading(false);
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
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

  // 获取通知类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[480px] p-0 max-w-[95vw]">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">通知中心</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={loading}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              全部已读
            </Button>
          )}
        </div>
        <ScrollArea className="h-[500px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              暂无通知
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                    notification.is_read === 0 && 'bg-blue-50/50'
                  )}
                  onClick={() => {
                    if (notification.is_read === 0) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn('mt-1', getTypeColor(notification.type))}>
                      {notification.is_read === 0 ? (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      ) : (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          notification.is_read === 0 && 'text-foreground'
                        )}>
                          {notification.title}
                        </p>
                        {notification.email_sent === 1 && (
                          <span title="已发送邮件"><Mail className="h-3 w-3 text-green-500" /></span>
                        )}
                        {notification.email_error && (
                          <span title="邮件发送失败"><MailX className="h-3 w-3 text-red-500" /></span>
                        )}
                      </div>
                      {notification.content && (
                        <div className="mt-1">
                          <p className={cn(
                            'text-xs text-muted-foreground whitespace-pre-wrap break-all',
                            expandedIds.has(notification.id) ? '' : 'line-clamp-4'
                          )}
                          style={{ wordBreak: 'break-all', wordWrap: 'break-word', maxWidth: '100%' }}>
                            {notification.content}
                          </p>
                          {notification.content.length > 120 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(notification.id);
                              }}
                              className="text-xs text-blue-500 hover:text-blue-600 mt-2 inline-block"
                            >
                              {expandedIds.has(notification.id) ? '收起' : '展开全文'}
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          来自: {notification.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              共 {notifications.length} 条通知，{unreadCount} 条未读
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
