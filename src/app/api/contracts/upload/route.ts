import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }
    
    // 检查文件类型
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: '只支持PDF文件' }, { status: 400 });
    }
    
    // 检查文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 生成文件名
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contracts');
    
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // 保存文件到本地
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    // 返回相对路径供前端使用
    const fileKey = `/uploads/contracts/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      fileKey,
      fileName: file.name 
    });
  } catch (error) {
    console.error('上传合同证明文件失败:', error);
    return NextResponse.json({ error: '上传失败', details: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
