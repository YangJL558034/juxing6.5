/**
 * 企业微信机器人状态管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { botRunning, getLogs } from '@/services/wxwork-bot/bot-state';

// 获取机器人状态
export async function GET() {
  // 从数据库获取配置状态
  const config = db!.prepare('SELECT * FROM wxwork_bot_config WHERE id = 1').get() as any;
  
  return NextResponse.json({
    success: true,
    running: botRunning,
    configured: !!(config && config.bot_id && config.bot_secret),
    logs: getLogs()
  });
}
