import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { TaskStatus, Task } from '../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: { id: TaskStatus; label: string; color: string };
  tasks: Task[];
  onAddTask: () => void;
  onDeleteTask: (id: string) => void;
  instances?: { id: string; name: string; url: string }[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column, tasks, onAddTask, onDeleteTask, instances = [],
}) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="flex flex-col w-[300px] bg-background-primary/30 border border-border rounded-2xl overflow-hidden shrink-0">
      <div
        className={`p-4 border-b ${column.color} flex items-center justify-between bg-background-secondary/30`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[10px] font-black tracking-widest uppercase text-text-primary">
            {column.label}
          </h2>
          <span className="px-1.5 py-0.5 rounded-full bg-background-tertiary text-text-muted text-[8px] font-black">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddTask}
            className="p-1 hover:text-accent-green text-text-muted transition-colors"
          >
            <Plus size={14} />
          </button>
          <button className="p-1 hover:text-white text-text-muted transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-none min-h-[150px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={() => onDeleteTask(task.id)}
              instances={instances}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
            <div className="w-10 h-10 rounded-full border border-dashed border-text-muted mb-2 flex items-center justify-center">
              <Plus size={16} />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest">
              DRAG HERE
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
