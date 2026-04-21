import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function CategoriesView() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(data);
  };

  const handleSave = async () => {
    if (editingId) {
      await updateDoc(doc(db, 'categories', editingId), { name, parentId });
    } else {
      await addDoc(collection(db, 'categories'), { name, parentId });
    }
    setName('');
    setParentId('');
    setEditingId(null);
    fetchCategories();
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parentId || '');
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
    fetchCategories();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление категориями</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Название категории" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="ID родительской категории" value={parentId} onChange={(e) => setParentId(e.target.value)} />
          <Button onClick={handleSave}>{editingId ? 'Обновить' : 'Создать'}</Button>
          {editingId && <Button variant="outline" onClick={() => setEditingId(null)}><X/></Button>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Parent ID</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.parentId}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(cat)}><Edit2 size={16}/></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(cat.id)}><Trash2 size={16}/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
