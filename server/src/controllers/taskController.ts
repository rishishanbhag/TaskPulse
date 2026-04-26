import { enqueueDeadlineReminders, enqueueSendTaskNotifications, removeDeadlineReminders, rescheduleSendTaskNotifications } from '@/queue/producers.js';
import { listAssignmentsForTask } from '@/services/assignmentService.js';
import { approveTask, createTask, getTaskForUser, listTasksForUser, rescheduleTask } from '@/services/taskService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

export const taskController = {
  create: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const body = req.body as {
      title: string;
      description: string;
      assignedTo: string[];
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      deadline?: Date;
      scheduledAt?: Date;
    };

    const task = await createTask({
      title: body.title,
      description: body.description,
      assignedTo: body.assignedTo,
      priority: body.priority,
      deadline: body.deadline,
      scheduledAt: body.scheduledAt,
      createdBy: req.user.id,
    });

    res.status(201).json({ task });
  }),

  approve: asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const task = await approveTask(taskId);

    const delay =
      task.scheduledAt && task.scheduledAt.getTime() > Date.now()
        ? task.scheduledAt.getTime() - Date.now()
        : undefined;

    await enqueueSendTaskNotifications(String(task._id), { delay });
    if (task.deadline) await enqueueDeadlineReminders(String(task._id), task.deadline);
    res.json({ task });
  }),

  reschedule: asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const { scheduledAt } = req.body as { scheduledAt: Date };
    const task = await rescheduleTask(taskId, scheduledAt);

    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    await rescheduleSendTaskNotifications(String(task._id), { delay });

    await removeDeadlineReminders(String(task._id));
    if (task.deadline) await enqueueDeadlineReminders(String(task._id), task.deadline);

    res.json({ task });
  }),

  list: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const tasks = await listTasksForUser(req.user);
    res.json({ tasks });
  }),

  getById: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const task = await getTaskForUser(req.params.id, req.user);
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } });
    const assignments = await listAssignmentsForTask(String((task as any)._id));
    res.json({ task, assignments });
  }),
};

