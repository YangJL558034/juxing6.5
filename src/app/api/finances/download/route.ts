import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { fileKey } = await request.json();
    
    if (!fileKey) {
      return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
    }
    
    if (fileKey.includes('..') || !fileKey.startsWith('/uploads/')) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 });
    }
    
    return NextResponse.json({ downloadUrl: fileKey });
  } catch (error) {
    console.error('生成下载链接失败:', error);
    return NextResponse.json({ error: '生成下载链接失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
    }

    if (key.includes('..') || !key.startsWith('/uploads/')) {
      return NextResponse.json({ error: '无效的文件路径' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', key.replace('/uploads/', ''));
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = key.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    console.error('下载文件失败:', error);
    return NextResponse.json({ error: '下载文件失败' }, { status: 500 });
  }
}
