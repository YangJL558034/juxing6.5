import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 部门经理默认拥有的权限
const managerPermissions = [
  'dashboard',
  'organization',
  'users',
  'approvals',
  'expense_claims',
  'purchase_requests',
];

// 检查用户权限
export async function POST(request: NextRequest) {
  try {
    const { userId, permission } = await request.json();
    
    if (!userId || !permission) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }
    
    // 获取用户信息检查是否是管理员
    const user = query.findUserById.get(userId) as { id: number; role: string } | undefined;
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在' 
      }, { status: 404 });
    }
    
    // 管理员拥有所有权限
    if (user.role === 'admin' || user.role === 'super_admin') {
      return NextResponse.json({ 
        success: true, 
        hasPermission: true,
        isAdmin: true
      });
    }
    
    // 部门经理拥有默认权限
    if (user.role === 'manager') {
      if (managerPermissions.includes(permission)) {
        return NextResponse.json({ 
          success: true, 
          hasPermission: true,
          isAdmin: false
        });
      }
    }
    
    // 检查用户权限
    const permissions = query.getUserPermissions.all(userId) as Array<{ code: string; granted: number }>;
    const perm = permissions.find((p) => p.code === permission);
    
    const hasPermission = perm?.granted === 1;
    
    return NextResponse.json({ 
      success: true, 
      hasPermission,
      isAdmin: false
    });
  } catch (error) {
    console.error('检查权限失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '检查权限失败' 
    }, { status: 500 });
  }
}

// 获取用户所有权限
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少用户ID' 
      }, { status: 400 });
    }
    
    // 获取用户信息
    const user = query.findUserById.get(parseInt(userId)) as { id: number; role: string } | undefined;
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在' 
      }, { status: 404 });
    }
    
    // 管理员拥有所有权限
    if (user.role === 'admin' || user.role === 'super_admin') {
      const allPermissions = query.getAllPermissions.all() as Array<{ id: number; code: string; name: string }>;
      return NextResponse.json({ 
        success: true, 
        permissions: allPermissions.map(p => p.code),
        isAdmin: true
      });
    }
    
    // 部门经理拥有默认权限
    if (user.role === 'manager') {
      return NextResponse.json({ 
        success: true, 
        permissions: managerPermissions,
        isAdmin: false
      });
    }
    
    // 获取用户权限
    const permissions = query.getUserPermissions.all(parseInt(userId)) as Array<{ code: string; granted: number }>;
    const grantedPermissions = permissions.filter(p => p.granted === 1).map(p => p.code);
    
    return NextResponse.json({ 
      success: true, 
      permissions: grantedPermissions,
      isAdmin: false
    });
  } catch (error) {
    console.error('获取权限失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取权限失败' 
    }, { status: 500 });
  }
}
