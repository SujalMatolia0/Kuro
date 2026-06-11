import { useState, useEffect } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '../../store';
import { taskQueries, instanceQueries } from '../../db/queries';
import KanbanColumn from './components/KanbanColumn';
import { Plus, Filter, Search, Server } from 'lucide-react';
import TaskCard from './components/TaskCard';
import Modal from '../../components/Modal';
import type { TaskStatus, Task } from './types';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'Backlog', color: 'border-white/10' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-accent-blue/30' },
  { id: 'BLOCKED', label: 'Blocked', color: 'border-accent-red/30' },
  { id: 'DONE', label: 'Done', color: 'border-accent-green/30' },
];

const TaskTracker = () => {
  const { activeWorkspace } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [instances, setInstances] = useState<{ id: string; name: string; url: string }[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New task modal state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('TODO');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPlatform, setNewTaskPlatform] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskInstanceId, setNewTaskInstanceId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (activeWorkspace) {
      loadTasks();
      loadInstances();
    }
  }, [activeWorkspace]);

  const loadTasks = async () => {
    if (!activeWorkspace) return;
    const list = await taskQueries.getByWorkspace(activeWorkspace.id);
    setTasks(list);
  };

  const loadInstances = async () => {
    if (!activeWorkspace) return;
    const list = await instanceQueries.getByWorkspace(activeWorkspace.id);
    setInstances(list.map((i: any) => ({ id: i.id, name: i.name, url: i.url })));
  };

  const handleOpenTaskModal = (status: TaskStatus = 'IN_PROGRESS') => {
    setNewTaskStatus(status);
    setNewTaskTitle('');
    setNewTaskPlatform('General');
    setNewTaskPriority('medium');
    setNewTaskInstanceId('');
    setIsNewTaskModalOpen(true);
  };

  const handleSaveNewTask = async () => {
    if (!activeWorkspace || !newTaskTitle.trim()) return;
    const newTask = {
      workspaceId: activeWorkspace.id,
      title: newTaskTitle.trim(),
      platform: newTaskPlatform.trim() || 'General',
      status: newTaskStatus,
      priority: newTaskPriority,
      position: tasks.filter(t => t.status === newTaskStatus).length,
      instance_id: newTaskInstanceId || null,
    };
    await taskQueries.create(newTask);
    setIsNewTaskModalOpen(false);
    loadTasks();
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === 'Column';

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        tasks[activeIndex].status = overId as TaskStatus;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Update status in DB
    await taskQueries.update(activeTask.id, {
      status: activeTask.status,
      position: tasks
        .filter((t) => t.status === activeTask.status)
        .indexOf(activeTask),
    });

    loadTasks(); // Final sync with DB
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tighter text-accent-green uppercase">
            Task Tracker
          </h1>
          <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-full px-3 py-1">
            <Search size={12} className="text-text-muted" />
            <input
              placeholder="Search tasks..."
              className="bg-transparent border-none text-[10px] font-bold focus:outline-none w-32 placeholder:uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-background-tertiary border border-border rounded-standard text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <button
            onClick={() => handleOpenTaskModal()}
            className="btn-primary py-2 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full min-w-max pr-6">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks.filter(
                  (t) =>
                    t.status === col.id &&
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
                )}
                onAddTask={() => handleOpenTaskModal(col.id)}
                onDeleteTask={async (id) => {
                  await taskQueries.delete(id);
                  loadTasks();
                }}
                instances={instances}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}
          >
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="CREATE NEW TASK"
        accent="copper"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Task Title</label>
            <input
              autoFocus
              className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none transition-colors"
              placeholder="e.g. Debug SSO integration"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNewTask()}
            />
          </div>
          
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Platform</label>
              <input
                className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none transition-colors"
                placeholder="e.g. Fusion, OIC, Web"
                value={newTaskPlatform}
                onChange={(e) => setNewTaskPlatform(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNewTask()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Priority</label>
              <select
                className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none transition-colors"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {instances.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Server size={11} /> Link to Instance (optional)
              </label>
              <select
                className="w-full bg-background-primary border border-border rounded-standard p-3 text-sm focus:border-accent-blue focus:outline-none transition-colors"
                value={newTaskInstanceId}
                onChange={e => setNewTaskInstanceId(e.target.value)}
              >
                <option value="">— No instance —</option>
                {instances.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSaveNewTask}
            disabled={!newTaskTitle.trim()}
            className="w-full btn-primary py-3 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CREATE TASK
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TaskTracker;
