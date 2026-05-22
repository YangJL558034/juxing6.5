import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  return getTokenFromHeader(request.headers.get('cookie'));
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
    }

    // 安全检查：防止路径遍历攻击
    if (key.includes('..') || key.startsWith('/')) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 });
    }

    // 返回本地文件的直接访问URL
    return NextResponse.json({ url: key });
  } catch (error) {
    console.error('获取下载链接失败:', error);
    return NextResponse.json({ error: '获取下载链接失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
    }

    if (key.includes('..')) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 });
    }

    if (!key.startsWith('/uploads/')) {
      return NextResponse.json({ error: '无效的文件路径格式' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', key.substring(1));
    
    console.log('下载文件路径:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath);
      return NextResponse.json({ error: '文件不存在', filePath }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = key.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
    
    console.log('文件大小:', fileBuffer.length, 'bytes');
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(filePath))}"`,
      },
    });
  } catch (error) {
    console.error('下载文件失败:', error);
    return NextResponse.json({ error: '下载文件失败', details: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
