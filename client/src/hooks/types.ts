export type UserRole = 'owner' | 'admin' | 'manager' | 'member';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orgId: string;
  role: UserRole;
};

export type TaskStatus = 'DRAFT' | 'APPROVED' | 'QUEUED' | 'SENT' | 'COMPLETED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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

export type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority?: TaskPriority;
  groupId?: string;
  createdBy: string;
  assignedTo: string[];
  deadline?: string;
  scheduledAt?: string;
  createdAt?: string;
  shortCode?: string;
  descriptionHtml?: string;
  /** Present for members on GET /tasks list when they have an assignment for the task. */
  myAssignment?: { _id: string; status: AssignmentStatus };
};

export type Group = {
  _id: string;
  name: string;
  orgId?: string;
  members?: string[];
  createdBy?: string;
  createdAt?: string;
};
