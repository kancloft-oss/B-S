import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder, File, ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function CategoryItem({ node, depth, onEdit, onDelete, toggleExpand, isExpanded }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: node.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16 + 4}px`,
  };

  const isFolder = node.children && node.children.length > 0;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5 py-1 px-1 border-b hover:bg-zinc-100 group text-[11px] font-mono whitespace-nowrap">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-300 opacity-0 group-hover:opacity-100">
        ⋮⋮
      </div>
      
      {isFolder ? (
        <button onClick={() => toggleExpand(node.id)} className="text-zinc-400 hover:text-zinc-600">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      ) : (
        <div className="w-[12px]" />
      )}

      {isFolder ? <Folder size={12} className="text-orange-400 shrink-0" /> : <File size={12} className="text-zinc-400 shrink-0" />}
      
      <span className="flex-1 truncate text-zinc-800">{node.name}</span>
      <span className="text-zinc-400 px-2 border-l border-r border-zinc-200 w-24 shrink-0 text-right">{node.id}</span>
      
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onEdit(node)}><Edit2 size={10}/></Button>
        <Button size="icon" variant="ghost" className="h-5 w-5 text-red-500" onClick={() => onDelete(node.id)}><Trash2 size={10}/></Button>
      </div>
    </div>
  );
}
