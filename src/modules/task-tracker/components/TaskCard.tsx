import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Clock, Trash2, ExternalLink, Server } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onDelete?: () => void;
  instances?: { id: string; name: string; url: string }[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isOverlay, onDelete, instances = [] }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = { transition, transform: CSS.Transform.toString(transform) };

  const priorityColors: Record<string, string> = {
    low:    'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
    medium: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    high:   'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
    urgent: 'bg-accent-red/10 text-accent-red border-accent-red/20',
  };

  const linkedInstance = task.instance_id ? instances.find(i => i.id === task.instance_id) : null;

  const handleLaunchInstance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkedInstance?.url) {
      (window as any).electron?.shell?.openUrl(linkedInstance.url);
    }
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style}
        className="h-[120px] bg-background-tertiary/20 border-2 border-dashed border-border rounded-xl opacity-50" />
    );
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`group bg-background-secondary border border-border p-4 rounded-xl shadow-lg transition-all hover:border-border-hover relative ${isOverlay ? 'shadow-2xl scale-[1.02] border-accent-green/50 ring-2 ring-accent-green/10' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">
              {task.platform}
            </span>
          </div>
          <h3 className="text-sm font-bold text-text-primary leading-tight line-clamp-2">
            {task.title}
          </h3>
        </div>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-white transition-colors">
          <GripVertical size={14} />
        </div>
      </div>

      {/* Linked instance badge */}
      {linkedInstance && (
        <button
          onClick={handleLaunchInstance}
          className="w-full flex items-center gap-2 px-2 py-1.5 mb-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg text-[10px] font-bold text-accent-blue hover:bg-accent-blue/10 transition-colors group/inst"
          title={`Launch ${linkedInstance.name}`}
        >
          <Server size={10} className="shrink-0" />
          <span className="truncate flex-1 text-left">{linkedInstance.name}</span>
          <ExternalLink size={10} className="shrink-0 opacity-0 group-hover/inst:opacity-100 transition-opacity" />
        </button>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock size={10} />
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {new Date(Number(task.created_at)).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1 hover:text-accent-red text-text-muted transition-colors">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
