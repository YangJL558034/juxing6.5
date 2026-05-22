/**
 * 审批流程辅助函数
 * 
 * 角色层级：
 * - admin: 管理员（最高权限，可查看所有数据）
 * - manager: 部门经理（管理本部门，审批本部门员工的单据）
 * - user: 普通用户（只能查看自己的数据）
 */

import { db } from './database';

export type UserRole = 'admin' | 'manager' | 'user';

export interface ApprovalChain {
  approvers: Array<{
    userId: number;
    userName: string;
    role: UserRole;
    department?: string;
  }>;
}

/**
 * 获取用户的审批链
 * @param applicantId 申请人ID
 * @returns 审批链（按顺序排列的审批人列表）
 */
export function getApprovalChain(applicantId: number): ApprovalChain {
  const applicant = db!.prepare(`
    SELECT u.id, u.name, u.role, u.department, u.manager_id, u.position_id,
           p.name as position_name, p.level as position_level
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE u.id = ?
  `).get(applicantId) as any;

  if (!applicant) {
    return { approvers: [] };
  }

  const approvers: ApprovalChain['approvers'] = [];

  // 如果是管理员，不需要审批
  if (applicant.role === 'admin') {
    return { approvers: [] };
  }

  // 如果有直属上级（manager_id），先添加直属上级
  if (applicant.manager_id) {
    const manager = db!.prepare(`
      SELECT u.id, u.name, u.role, u.department
      FROM users u
      WHERE u.id = ?
    `).get(applicant.manager_id) as any;

    if (manager) {
      approvers.push({
        userId: manager.id,
        userName: manager.name,
        role: manager.role as UserRole,
        department: manager.department
      });
    }
  }

  // 如果是普通用户，还需要添加部门经理
  if (applicant.role === 'user' && applicant.department) {
    // 查找该部门的经理
    const departmentManager = db!.prepare(`
      SELECT u.id, u.name, u.role, u.department
      FROM users u
      WHERE u.role = 'manager' AND u.department = ?
    `).get(applicant.department) as any;

    if (departmentManager && !approvers.find(a => a.userId === departmentManager.id)) {
      approvers.push({
        userId: departmentManager.id,
        userName: departmentManager.name,
        role: 'manager',
        department: departmentManager.department
      });
    }
  }

  // 最后添加管理员作为最终审批人
  const admins = db!.prepare(`
    SELECT u.id, u.name, u.role, u.department
    FROM users u
    WHERE u.role = 'admin'
  `).all() as any[];

  for (const admin of admins) {
    if (!approvers.find(a => a.userId === admin.id)) {
      approvers.push({
        userId: admin.id,
        userName: admin.name,
        role: 'admin',
        department: admin.department
      });
    }
  }

  return { approvers };
}

/**
 * 获取下一个审批人
 * @param applicantId 申请人ID
 * @param currentApproverId 当前审批人ID（可选）
 * @returns 下一个审批人，如果没有则返回null
 */
export function getNextApprover(applicantId: number, currentApproverId?: number): ApprovalChain['approvers'][0] | null {
  const { approvers } = getApprovalChain(applicantId);

  if (approvers.length === 0) {
    return null;
  }

  // 如果没有当前审批人，返回第一个
  if (!currentApproverId) {
    return approvers[0];
  }

  // 找到当前审批人的位置，返回下一个
  const currentIndex = approvers.findIndex(a => a.userId === currentApproverId);
  if (currentIndex === -1 || currentIndex >= approvers.length - 1) {
    return null;
  }

  return approvers[currentIndex + 1];
}

/**
 * 检查用户是否有权限审批某个单据
 * @param approverId 审批人ID
 * @param applicantId 申请人ID
 * @returns 是否有权限
 */
export function canApprove(approverId: number, applicantId: number): boolean {
  const { approvers } = getApprovalChain(applicantId);
  return approvers.some(a => a.userId === approverId);
}

/**
 * 获取用户可以审批的所有单据（根据用户角色）
 * @param userId 用户ID
 * @param docType 单据类型 ('purchase_request' | 'expense_claim')
 * @returns 待审批的单据ID列表
 */
export function getApprovableDocs(userId: number, docType: 'purchase_request' | 'expense_claim'): number[] {
  const user = db!.prepare('SELECT id, role, department FROM users WHERE id = ?').get(userId) as any;
  if (!user) return [];

  // 管理员可以审批所有单据
  if (user.role === 'admin') {
    const table = docType === 'purchase_request' ? 'purchase_requests' : 'expense_claims';
    const docs = db!.prepare(`SELECT id FROM ${table} WHERE status = '待审批'`).all() as any[];
    return docs.map(d => d.id);
  }

  // 部门经理只能审批本部门员工的单据
  if (user.role === 'manager' && user.department) {
    const table = docType === 'purchase_request' ? 'purchase_requests' : 'expense_claims';
    const docs = db!.prepare(`
      SELECT pr.id 
      FROM ${table} pr
      JOIN users u ON pr.applicant_id = u.id
      WHERE pr.status = '待审批' 
        AND u.department = ?
        AND (pr.current_approver_id = ? OR pr.current_approver_id IS NULL)
    `).all(user.department, userId) as any[];
    return docs.map(d => d.id);
  }

  // 普通用户没有审批权限
  return [];
}

/**
 * 获取用户的所有下属
 * @param userId 用户ID
 * @returns 下属用户ID列表
 */
export function getSubordinates(userId: number): number[] {
  const user = db!.prepare('SELECT id, role, department FROM users WHERE id = ?').get(userId) as any;
  if (!user) return [];

  const subordinateIds: number[] = [];

  // 获取直属下属
  const directSubordinates = db!.prepare('SELECT id FROM users WHERE manager_id = ?').all(userId) as any[];
  subordinateIds.push(...directSubordinates.map(u => u.id));

  // 如果是部门经理，获取本部门所有员工
  if (user.role === 'manager' && user.department) {
    const deptMembers = db!.prepare('SELECT id FROM users WHERE department = ? AND id != ?').all(user.department, userId) as any[];
    for (const member of deptMembers) {
      if (!subordinateIds.includes(member.id)) {
        subordinateIds.push(member.id);
      }
    }
  }

  // 如果是管理员，获取所有用户
  if (user.role === 'admin') {
    const allUsers = db!.prepare('SELECT id FROM users').all() as any[];
    return allUsers.map(u => u.id);
  }

  return subordinateIds;
}

/**
 * 检查用户是否可以查看某个单据
 * @param userId 用户ID
 * @param docApplicantId 单据申请人ID
 * @returns 是否有权限查看
 */
export function canViewDoc(userId: number, docApplicantId: number): boolean {
  // 用户可以查看自己的单据
  if (userId === docApplicantId) return true;

  const user = db!.prepare('SELECT id, role FROM users WHERE id = ?').get(userId) as any;
  if (!user) return false;

  // 管理员可以查看所有单据
  if (user.role === 'admin') return true;

  // 部门经理可以查看本部门员工的单据
  if (user.role === 'manager') {
    const subordinates = getSubordinates(userId);
    return subordinates.includes(docApplicantId);
  }

  // 直属上级可以查看下属的单据
  const subordinates = getSubordinates(userId);
  return subordinates.includes(docApplicantId);
}
