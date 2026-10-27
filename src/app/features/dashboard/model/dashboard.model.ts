export interface DashboardMetric {
  label: string;
  value: number;
  trend: string;
  detail: string;
  accent: string;
  icon: 'pending' | 'process' | 'closed' | 'critical' | 'project' | 'category' | 'users';
  iconClass: string;
}

export interface StatusSummary {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface PrioritySummary {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export interface ProjectSummary {
  name: string;
  count: number;
  percent: number;
  width: number;
  active: number;
  description: string;
  color: string;
}

export interface RecentTicket {
  id: number;
  code: string;
  title: string;
  description: string;
  project: string;
  projectClass: string;
  category: string;
  priority: string;
  status: string;
  assignee: string;
  assigneeInitials: string;
  assigneeClass: string;
  date: string;
  sla: string;
  slaClass: string;
}
