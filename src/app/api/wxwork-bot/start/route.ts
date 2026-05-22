/**
 * 企业微信机器人启动接口 - 简化版本
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { spawn, type ChildProcess } from 'child_process';
import { 
  botRunning, 
  botProcess, 
  setBotRunning, 
  setBotProcess, 
  addLog, 
  clearLogs,
  getLogs 
} from '@/services/wxwork-bot/bot-state';

export async function GET() {
  return NextResponse.json({
    success: true,
    running: botRunning,
    logs: getLogs()
  });
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }
    
    const config = db!.prepare('SELECT * FROM wxwork_bot_config WHERE id = 1').get() as any;
    
    if (!config || !config.bot_id || !config.bot_secret) {
      return NextResponse.json({ 
        success: false, 
        error: '请先配置机器人的企业ID和Secret' 
      });
    }
    
    if (botRunning) {
      return NextResponse.json({ 
        success: false, 
        error: '机器人已经在运行中' 
      });
    }
    
    clearLogs();
    addLog('info', '正在启动企业微信机器人...');
    
    // 构建启动脚本
    const envVars = [
      `WXWORK_BOT_ID=${config.bot_id}`,
      `WXWORK_BOT_SECRET=${config.bot_secret}`,
      `WXWORK_API_URL=${config.api_url || 'http://localhost:5000/api/generate'}`,
    ];
    
    addLog('info', `Bot ID: ${config.bot_id}`);
    addLog('info', `API地址: ${config.api_url || 'http://localhost:5000/api/generate'}`);
    
    // 使用 PowerShell 直接运行
    const cwd = process.cwd().replace(/\\/g, '/');
    const psScript = `
$env:WXWORK_BOT_ID='${config.bot_id}'
$env:WXWORK_BOT_SECRET='${config.bot_secret}'
$env:WXWORK_API_URL='${config.api_url || 'http://localhost:5000/api/generate'}'
cd '${cwd}'
pnpm exec ts-node src/services/wxwork-bot/wxwork-bot-service.ts
    `;
    
    addLog('info', '正在启动子进程...');
    
    const botChildProcess = spawn('powershell.exe', [
      '-Command',
      psScript.trim()
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    }) as ChildProcess;
    
    botChildProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        addLog('info', output);
      }
    });
    
    botChildProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        addLog('error', output);
      }
    });
    
    botChildProcess.on('close', (code) => {
      addLog('warn', `机器人进程退出，退出码: ${code}`);
      setBotRunning(false);
      setBotProcess(null);
    });
    
    botChildProcess.on('error', (error) => {
      addLog('error', `进程启动失败: ${error.message}`);
      setBotRunning(false);
      setBotProcess(null);
    });
    
    setBotProcess(botChildProcess);
    
    // 等待3秒检查是否启动成功
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (botChildProcess && botChildProcess.exitCode === null) {
      setBotRunning(true);
      addLog('success', '机器人启动成功！');
      
      return NextResponse.json({ 
        success: true, 
        message: '机器人启动成功',
        config: {
          botId: config.bot_id,
          apiUrl: config.api_url || ''
        }
      });
    } else {
      setBotProcess(null);
      const logs = getLogs();
      return NextResponse.json({ 
        success: false, 
        error: '机器人启动失败，请查看日志',
        logs: logs 
      });
    }
    
  } catch (error) {
    console.error('[WxWork Bot] 启动失败:', error);
    addLog('error', `启动失败: ${(error as Error).message}`);
    return NextResponse.json({ 
      success: false, 
      error: '启动失败: ' + (error as Error).message,
      logs: getLogs()
    }, { status: 500 });
  }
}
