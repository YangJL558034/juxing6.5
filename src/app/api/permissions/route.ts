import { NextRequest, NextResponse } from 'next/server';
import { query, db } from '@/lib/database';

// 获取所有权限模块
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // 获取所有权限
    const permissions = query.getAllPermissions.all();
    
    if (userId) {
      // 获取指定用户的权限状态
      const permissionsWithStatus = permissions.map((p: any) => {
        const userPerm = query.checkPermission.get(parseInt(userId), p.id);
        return {
          ...p,
          granted: userPerm ? (userPerm as any).granted === 1 : false // 默认无权限，需要有权限记录才行
        };
      });
      return NextResponse.json({ success: true, permissions: permissionsWithStatus });
    }
    
    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error('获取权限列表失败:', error);
    return NextResponse.json({ success: false, error: '获取权限列表失败' }, { status: 500 });
  }
}

// 设置用户权限
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, permissionId, granted } = body;
    
    if (!userId || !permissionId) {
      return NextResponse.json({ success: false, error: '用户ID和权限ID不能为空' }, { status: 400 });
    }
    
    if (granted) {
      query.grantPermission.run(userId, permissionId);
    } else {
      query.revokePermission.run(userId, permissionId);
    }
    
    return NextResponse.json({ success: true, message: '权限设置成功' });
  } catch (error) {
    console.error('设置权限失败:', error);
    return NextResponse.json({ success: false, error: '设置权限失败' }, { status: 500 });
  }
}

// 批量设置用户权限
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, permissions } = body; // permissions: [{ permissionId, granted }, ...]
    
    if (!userId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: '参数不正确' }, { status: 400 });
    }
    
    for (const perm of permissions) {
      if (perm.granted) {
        query.grantPermission.run(userId, perm.permissionId);
      } else {
        query.revokePermission.run(userId, perm.permissionId);
      }
    }
    
    return NextResponse.json({ success: true, message: '权限批量设置成功' });
  } catch (error) {
    console.error('批量设置权限失败:', error);
    return NextResponse.json({ success: false, error: '批量设置权限失败' }, { status: 500 });
  }
}
