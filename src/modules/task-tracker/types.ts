export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  platform: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  instance_id?: string | null;   // linked instance
  created_at: number;
}
