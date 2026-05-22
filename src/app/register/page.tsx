'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Lock, Mail, Building2, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 输入注册码, 2: 验证邮箱, 3: 填写信息, 4: 完成
  const [registrationCode, setRegistrationCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [assignedPosition, setAssignedPosition] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleVerifyCode = async () => {
    if (!registrationCode) {
      setError('请输入注册码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/registration-codes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: registrationCode }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 获取注册码分配的部门和职位
        setAssignedDepartment(data.department || '');
        setAssignedPosition(data.position || '');
        setStep(2);
      } else {
        setError(data.error || '注册码无效');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCode = async () => {
    if (!email) {
      setError('请输入邮箱');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        alert('验证码已发送到您的邮箱');
      } else {
        setError(data.error || '发送验证码失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 验证邮箱验证码
  const handleVerifyEmailCode = async () => {
    if (!emailCode) {
      setError('请输入验证码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: emailCode, type: 'register' }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStep(3);
      } else {
        setError(data.error || '验证码错误');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !name) {
      setError('请填写完整信息');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          name,
          email,
          registrationCode,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStep(4);
      } else {
        setError(data.error || '注册失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -bottom-1/4 w-1/2 h-1/2 rounded-full opacity-30"
          style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
        />
        <div className="absolute -right-1/4 -top-1/4 w-1/2 h-1/2 rounded-full opacity-20"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        />
      </div>
      
      <Card className="w-full max-w-md mx-4 relative z-10 bg-white/95 backdrop-blur shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative w-20 h-20">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-contain rounded-xl"
              sizes="80px"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">用户注册</CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            使用注册码创建您的账号
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 步骤指示器 */}
          <div className="flex justify-center gap-2 text-sm text-gray-500">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>①验证注册码</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>②验证邮箱</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>③填写信息</span>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                请输入管理员提供的注册码
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">注册码</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                    className="pl-10 font-mono tracking-wider"
                    maxLength={19}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleVerifyCode}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {loading ? '验证中...' : '验证注册码'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回登录
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                请输入邮箱并验证，用于找回密码
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">邮箱 *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emailCode">验证码 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="emailCode"
                    type="text"
                    placeholder="请输入验证码"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button
                    variant="outline"
                    onClick={handleSendEmailCode}
                    disabled={loading || countdown > 0}
                    className="whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button
                  onClick={handleVerifyEmailCode}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {loading ? '验证中...' : '验证邮箱'}
                </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                邮箱验证通过，请填写注册信息
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="至少6位密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">分配信息</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">部门：</span>
                    <span className="text-gray-800">{assignedDepartment || '未分配'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">职位：</span>
                    <span className="text-gray-800">{assignedPosition || '未分配'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {loading ? '注册中...' : '注册'}
                </Button>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-gray-700 font-medium">注册成功！</p>
              <p className="text-sm text-gray-500">您可以使用新账号登录系统</p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                前往登录
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
