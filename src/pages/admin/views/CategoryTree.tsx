import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';

// Helper to build tree
const buildTree = (cats: any[], parentId: string | null = null): any[] => {
  return cats
    .filter(cat => (cat.parentId || null) === (parentId || null))
    .map(cat => ({
      ...cat,
      children: buildTree(cats, cat.id)
    }));
};

const renderTree = (nodes: any[], onEdit: (c: any) => void, onDelete: (id: string) => void, depth = 0) => {
    return nodes.map((node) => (
        <React.Fragment key={node.id}>
            <div className="flex items-center justify-between p-2 border-b hover:bg-zinc-50" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
                <span className="font-medium">{node.name}</span>
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(node)}><Edit2 size={14}/></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(node.id)}><Trash2 size={14}/></Button>
                </div>
            </div>
            {node.children && node.children.length > 0 && renderTree(node.children, onEdit, onDelete, depth + 1)}
        </React.Fragment>
    ));
};

export default function CategoryTree({ categories, onEdit, onDelete }: { categories: any[], onEdit: any, onDelete: any }) {
    const tree = useMemo(() => buildTree(categories), [categories]);
    return (
        <div className="border rounded-md">
            {renderTree(tree, onEdit, onDelete)}
        </div>
    );
}
