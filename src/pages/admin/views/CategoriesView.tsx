import React, { useState, useEffect } from 'react';

export default function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Помилка при загрузке категорий');
      const data = await response.json();
      
      // Сортируем: сначала корневые, затем все остальные по алфавиту
      const sorted = data.sort((a: any, b: any) => {
          const aIsRoot = !a.parentId || String(a.parentId).trim() === 'null' || String(a.parentId).trim() === '';
          const bIsRoot = !b.parentId || String(b.parentId).trim() === 'null' || String(b.parentId).trim() === '';
          if (aIsRoot && !bIsRoot) return -1;
          if (!aIsRoot && bIsRoot) return 1;
          return (a.name || '').localeCompare(b.name || '');
      });
      setCategories(sorted);
    } catch (e) {
      console.error(e);
    }
  };

  const getParentName = (parentId: any) => {
      const pId = typeof parentId === 'string' ? parentId.trim() : parentId;
      if (!pId || pId === 'null' || pId === '') {
          return <span className="text-emerald-600 font-semibold text-[10px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Корневая группа</span>;
      }
      const parent = categories.find(c => c.id === pId);
      return parent ? <span className="text-zinc-600 text-[11px]">↳ Входит в: <strong>{parent.name}</strong></span> : <span className="text-red-500 text-[11px]">Неизвестная родительская группа</span>;
  };

  const uploadCategoryImage = async (id: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'categories');
        
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Ошибка загрузки файла');
        }
        const { url } = await res.json();
        
        const cat = categories.find(c => c.id === id);
        if (cat) {
            await fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...cat, image: url })
            });
            fetchCategories(); // Refresh list to get updated image
        }
    } catch(e) {
        console.error('Category image upload error:', e);
        const errorMsg = e instanceof Error ? e.message : 'Неизвестная ошибка';
        alert('Ошибка при загрузке изображения: ' + errorMsg);
    }
  };

  return (
    <div className="border border-zinc-400 bg-white shadow-sm w-full font-sans">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-[#e0e0e0] border-b border-zinc-400">
                    <th className="py-2 px-3 font-semibold text-[11px] text-zinc-800 w-1/2">Наименование</th>
                    <th className="py-2 px-3 font-semibold text-[11px] text-zinc-800">Расположение</th>
                    <th className="py-2 px-3 font-semibold text-[11px] text-zinc-800 text-right">Фото</th>
                </tr>
            </thead>
            <tbody>
                {categories.map(node => {
                    const isSelected = selectedId === node.id;
                    const isRoot = !node.parentId || String(node.parentId).trim() === 'null' || String(node.parentId).trim() === '';

                    return (
                        <tr 
                          key={node.id} 
                          className={`border-b border-zinc-200 hover:bg-zinc-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                          onClick={() => setSelectedId(node.id)}
                        >
                            <td className="py-2 px-3 border-r border-zinc-200">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs ${isRoot ? 'font-bold text-zinc-950' : 'text-zinc-700'}`}>
                                      {node.name}
                                    </span>
                                </div>
                            </td>
                            <td className="py-2 px-3 border-r border-zinc-200">
                                {getParentName(node.parentId)}
                            </td>
                            <td className="py-2 px-3">
                                <div className="flex items-center justify-end gap-3">
                                  {node.image && <img src={node.image} alt={node.name} className="w-9 h-9 object-cover rounded shadow-sm border border-zinc-200" />}
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      className="hidden" 
                                      id={`file-${node.id}`}
                                      onChange={(e) => e.target.files && uploadCategoryImage(node.id, e.target.files[0])}
                                  />
                                  <label htmlFor={`file-${node.id}`} className="text-[11px] font-medium bg-white border border-zinc-300 hover:bg-zinc-100 px-3 py-1.5 rounded cursor-pointer transition-colors shadow-sm text-zinc-700">
                                      {node.image ? 'Изменить' : 'Загрузить'}
                                  </label>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                {categories.length === 0 && (
                    <tr>
                        <td colSpan={3} className="py-8 text-center text-zinc-500 text-xs">
                            Категории не найдены.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );
}
