import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.COZE_PROJECT_ENV === 'PROD' 
  ? '/tmp/crm.db'
  : path.join(process.cwd(), 'data', 'crm.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

interface UpdateProfileRequest {
  userId: number;
  username: string;
  name: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateProfileRequest = await request.json();
    const { userId, username, name } = body;

    if (!userId || !username) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 检查用户名是否已被其他用户使用
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE username = ? AND id != ?
    `).get(username, userId);

    if (existingUser) {
      return NextResponse.json({ error: '用户名已被使用' }, { status: 400 });
    }

    // 更新用户信息
    db.prepare(`
      UPDATE users SET username = ?, name = ? WHERE id = ?
    `).run(username, name, userId);

    return NextResponse.json({ success: true, message: '个人设置已更新' });
  } catch (error) {
    console.error('更新个人设置失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}
