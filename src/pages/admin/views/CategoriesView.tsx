import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(data);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
  };

  const buildTree = (cats: any[], pId: string | null = null): any[] => {
      return cats.filter(c => (c.parentId || null) === pId).map(c => ({...c, children: buildTree(cats, c.id)}));
  };

  const renderTree = (nodes: any[], depth = 0) => {
      return nodes.flatMap(node => {
          const isFolder = node.children && node.children.length > 0;
          const isExpanded = expanded.has(node.id);
          const isSelected = selectedId === node.id;
          
          return [
              <tr 
                key={node.id} 
                className={`border-b border-zinc-200 cursor-pointer ${isSelected ? 'bg-[#fff9c4]' : 'hover:bg-zinc-100'}`}
                onClick={() => setSelectedId(node.id)}
              >
                  <td className="py-0.5 px-1 border-r border-zinc-300" style={{ paddingLeft: `${depth * 20 + 4}px` }}>
                      <div className="flex items-center gap-1.5 text-[13px] text-zinc-900 font-sans tabular-nums">
                          {/* Marker (+/- or placeholder) */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); isFolder && toggleExpand(node.id) }} 
                            className="w-3 text-zinc-500 hover:text-zinc-800 flex items-center justify-center font-bold"
                          >
                            {isFolder ? (isExpanded ? '−' : '+') : ''}
                          </button>
                          
                          {/* Folder/File Icon */}
                          <span className={`w-4 h-4 mr-1 ${isFolder ? 'text-amber-500' : 'text-blue-500'}`}>
                            {isFolder ? '📁' : '▬'}
                          </span>
                          
                          {/* Name Label */}
                          <span className={`${isSelected ? 'border border-amber-400 px-0.5' : ''}`}>
                            {node.name}
                          </span>
                      </div>
                  </td>
              </tr>,
              ...(isExpanded && node.children ? renderTree(node.children, depth + 1) : [])
          ];
      });
  };

  return (
    <div className="border border-zinc-400 bg-white shadow-sm w-full font-sans">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-[#e0e0e0] border-b border-zinc-400">
                    <th className="py-1 px-2 font-normal text-[13px] text-zinc-800">Наименование</th>
                </tr>
            </thead>
            <tbody>
                {renderTree(buildTree(categories))}
            </tbody>
        </table>
    </div>
  );
}
