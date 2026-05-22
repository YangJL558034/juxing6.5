// CRM Data Types

export interface MetricCard {
  title: string;
  value: number;
  change: number;
  suffix?: string;
}

export interface SummaryCard {
  title: string;
  items: { label: string; value: string | number }[];
}

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  width?: string;
  render?: (value: unknown, record: T) => React.ReactNode;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface TodoItem {
  id: string;
  name: string;
  industry: string;
  level: string;
  source: string;
  phone: string;
  address: string;
  remark: string;
  lastFollowUp: string;
  creator: string;
  department: string;
  createTime: string;
  lastFollowUpTime: string;
  owner: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  level: string;
  source: string;
  submitTime: string;
  followDuration: string;
  tags: string[];
  status: string;
  phone: string;
  address: string;
  creator: string;
  department: string;
  owner: string;
}

export interface TaskItem {
  id: string;
  name: string;
  tags: string[];
  priority: string;
  deadline: string;
  status: string;
  owner: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  amount: number;
  target: number;
  progress: number;
}
