export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'member';
};

export type TaskStatus = 'DRAFT' | 'APPROVED' | 'QUEUED' | 'SENT' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  createdBy: string;
  assignedTo: string[];
  deadline?: string;
  scheduledAt?: string;
  createdAt?: string;
};

export type AssignmentStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'COMPLETED' | 'FAILED';

export type AssignmentReplyType = 'DONE' | 'HELP' | 'DELAY' | 'UNKNOWN';

export type Assignment = {
  _id: string;
  taskId: string;
  userId: string;
  status: AssignmentStatus;
  lastMessageId?: string;
  updatedAt?: string;
  lastReplyType?: AssignmentReplyType;
  lastReplyAt?: string;
  lastReplyBody?: string;
  helpRequestedAt?: string;
  delayRequestedUntil?: string;
};

