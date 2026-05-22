// 操作日志记录工具

export interface LogParams {
  module: string;
  action: string;
  details: any;
  userId?: number | null;
  userName?: string;
}

/**
 * 记录操作日志
 */
export async function logOperation(params: LogParams): Promise<void> {
  try {
    // 获取客户端信息
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    
    // 获取IP地址（需要从服务器端获取）
    let ipAddress = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch {
      // IP获取失败不影响日志记录
    }

    await fetch('/api/operation-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: params.userId,
        userName: params.userName,
        module: params.module,
        action: params.action,
        details: params.details,
        ipAddress,
        userAgent,
      }),
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

// 预定义的模块和操作
export const LogModules = {
  EMPLOYEE_QUERY: 'employee_query',
  SALARY: 'salary',
  EMPLOYEE: 'employee',
  ASSET: 'asset',
  USER: 'user',
  AUTH: 'auth',
  SYSTEM: 'system',
} as const;

export const LogActions = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SIGN: 'sign',
  EXPORT: 'export',
  IMPORT: 'import',
} as const;
