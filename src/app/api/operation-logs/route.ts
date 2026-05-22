import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// 获取操作日志列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const userId = searchParams.get('userId');
    const module = searchParams.get('module');

    const offset = (page - 1) * pageSize;

    let logs: any[];
    let total: number;

    if (userId) {
      logs = query.operationLogs.getByUserId.all(userId, pageSize, offset) as any[];
      total = (query.operationLogs.getAllCount.get() as { count: number }).count;
    } else if (module) {
      logs = query.operationLogs.getByModule.all(module) as any[];
      total = logs.length;
    } else {
      logs = query.operationLogs.getAll.all(pageSize, offset) as any[];
      total = (query.operationLogs.getAllCount.get() as { count: number }).count;
    }

    // 映射字段名：description -> details
    const mappedLogs = logs.map(log => ({
      ...log,
      details: log.details || log.description || '',
      user_name: log.user_name || log.username || '未知用户',
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: mappedLogs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    return NextResponse.json(
      { success: false, error: '获取操作日志失败' },
      { status: 500 }
    );
  }
}

// 记录操作日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, module, action, details, ipAddress, userAgent } = body;

    // 参数映射：details -> description
    const description = typeof details === 'string' ? details : JSON.stringify(details || '');

    query.operationLogs.create.run(
      userId || null,
      userName || '未知用户',
      module,
      action,
      description,
      ipAddress || null,
      userAgent || null
    );

    console.log('操作日志记录成功:', { userId, userName, module, action });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录操作日志失败:', error);
    return NextResponse.json(
      { success: false, error: '记录操作日志失败' },
      { status: 500 }
    );
  }
}
