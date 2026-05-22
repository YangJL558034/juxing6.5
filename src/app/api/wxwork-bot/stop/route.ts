/**
 * 企业微信机器人停止接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  botRunning, 
  botProcess, 
  setBotRunning, 
  setBotProcess, 
  addLog 
} from '@/services/wxwork-bot/bot-state';

// 停止机器人
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    
    if (!botRunning) {
      return NextResponse.json({ 
        success: false, 
        error: '机器人未在运行' 
      });
    }
    
    // 停止子进程
    if (botProcess) {
      addLog('info', '正在停止机器人...');
      botProcess.kill('SIGTERM');
      // 等待进程结束
      await new Promise(resolve => setTimeout(resolve, 500));
      setBotProcess(null);
    }
    
    setBotRunning(false);
    addLog('success', '机器人已停止');
    
    return NextResponse.json({ 
      success: true, 
      message: '机器人已停止' 
    });
  } catch (error) {
    console.error('[WxWork Bot] 停止失败:', error);
    addLog('error', `停止失败: ${(error as Error).message}`);
    return NextResponse.json({ 
      success: false, 
      error: '停止失败: ' + (error as Error).message 
    }, { status: 500 });
  }
}
