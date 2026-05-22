import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.COZE_PROJECT_ENV === 'PROD' 
  ? '/tmp/crm.db'
  : path.join(process.cwd(), 'data', 'crm.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

interface ChangePasswordRequest {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: ChangePasswordRequest = await request.json();
    const { userId, oldPassword, newPassword } = body;

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 获取用户当前密码
    const user = db.prepare(`
      SELECT password FROM users WHERE id = ?
    `).get(userId) as { password: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 使用 bcrypt 验证旧密码
    const isValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '原密码错误' }, { status: 400 });
    }

    // 使用 bcrypt 哈希新密码
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE users SET password = ? WHERE id = ?
    `).run(newPasswordHash, userId);

    return NextResponse.json({ success: true, message: '密码已修改' });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}
