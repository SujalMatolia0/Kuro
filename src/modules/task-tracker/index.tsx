import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '../../store';
import { taskQueries } from '../../db/queries';
import KanbanColumn from './components/KanbanColumn';
import TaskCard from './components/TaskCard';
import { Plus, Filter, Search } from 'lucide-react';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  platform: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  created_at: number;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'Backlog', color: 'border-white/10' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-accent-blue/30' },
  { id: 'BLOCKED', label: 'Blocked', color: 'border-accent-red/30' },
  { id: 'DONE', label: 'Done', color: 'border-accent-green/30' },
];

const TaskTracker = () => {
  const { activeWorkspace } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (activeWorkspace) {
      loadTasks();
    }
  }, [activeWorkspace]);

  const loadTasks = async () => {
    if (!activeWorkspace) return;
    const list = await taskQueries.getByWorkspace(activeWorkspace.id);
    setTasks(list);
  };

  const handleCreateTask = async (status: TaskStatus = 'TODO') => {
    if (!activeWorkspace) return;
    const newTask = {
      workspaceId: activeWorkspace.id,
      title: 'New Task',
      platform: 'general',
      status,
      priority: 'medium',
      position: tasks.filter(t => t.status === status).length
    };
    await taskQueries.create(newTask);
    loadTasks();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
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

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Update status in DB
    await taskQueries.update(activeTask.id, { 
      status: activeTask.status,
      position: tasks.filter(t => t.status === activeTask.status).indexOf(activeTask)
    });
    
    loadTasks(); // Final sync with DB
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tighter text-accent-green uppercase">Task Tracker</h1>
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
            onClick={() => handleCreateTask()}
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
                tasks={tasks.filter(t => t.status === col.id && (t.title.toLowerCase().includes(searchQuery.toLowerCase())))}
                onAddTask={() => handleCreateTask(col.id)}
                onDeleteTask={async (id) => {
                  await taskQueries.delete(id);
                  loadTasks();
                }}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeTask ? (
              <TaskCard task={activeTask} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TaskTracker;
