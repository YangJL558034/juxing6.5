'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Save, Send, Check, AlertCircle } from 'lucide-react';

export default function SmtpConfigPage() {
  const [config, setConfig] = useState({
    host: '',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch('/api/smtp-config');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig({
          host: data.data.host || '',
          port: String(data.data.port || '587'),
          secure: Boolean(data.data.secure),
          user: data.data.user || '',
          pass: '', // 密码不回显
          from: data.data.from || ''
        });
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/smtp-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'SMTP配置已保存' });
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '网络错误' });
    }
    setSaving(false);
  }

  async function handleTest() {
    if (!testEmail) {
      setMessage({ type: 'error', text: '请输入测试收件人邮箱' });
      return;
    }
    
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/smtp-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          to: testEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `测试邮件已发送到 ${testEmail}` });
      } else {
        setMessage({ type: 'error', text: data.error || '发送失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '网络错误' });
    }
    setTesting(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP邮件配置
          </CardTitle>
          <CardDescription>
            配置SMTP服务器用于发送通知邮件
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 服务器设置 */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">服务器设置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP服务器</Label>
                <Input
                  id="host"
                  placeholder="smtp.example.com"
                  value={config.host}
                  onChange={e => setConfig({ ...config, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口</Label>
                <Input
                  id="port"
                  placeholder="587"
                  value={config.port}
                  onChange={e => setConfig({ ...config, port: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="secure"
                checked={config.secure}
                onCheckedChange={checked => setConfig({ ...config, secure: checked })}
              />
              <Label htmlFor="secure">使用SSL/TLS加密连接</Label>
            </div>
          </div>

          {/* 认证设置 */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">认证设置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">用户名</Label>
                <Input
                  id="user"
                  placeholder="your@email.com"
                  value={config.user}
                  onChange={e => setConfig({ ...config, user: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass">密码/授权码</Label>
                <Input
                  id="pass"
                  type="password"
                  placeholder="••••••••"
                  value={config.pass}
                  onChange={e => setConfig({ ...config, pass: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">发件人地址</Label>
              <Input
                id="from"
                placeholder="notify@yourdomain.com"
                value={config.from}
                onChange={e => setConfig({ ...config, from: e.target.value })}
              />
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !config.host || !config.user}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? '保存中...' : '保存配置'}
            </Button>
          </div>

          {/* 测试设置 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-sm text-muted-foreground">测试连接</h3>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="testEmail">测试收件人</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={handleTest} 
                  disabled={testing || !testEmail || !config.host}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {testing ? '发送中...' : '发送测试邮件'}
                </Button>
              </div>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          {/* 说明 */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">常见SMTP配置示例：</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• QQ邮箱：smtp.qq.com:587，密码需使用授权码</li>
              <li>• 163邮箱：smtp.163.com:465(SSL)，密码需使用授权码</li>
              <li>• Gmail：smtp.gmail.com:587，需启用应用专用密码</li>
              <li>• 阿里企业邮箱：smtp.qiye.aliyun.com:465(SSL)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
