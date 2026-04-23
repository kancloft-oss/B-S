import React, { useState, useEffect, useMemo } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/auth-context";
import {
  BarChart3, Package, RefreshCcw, Settings, TrendingUp, Users, CreditCard,
  CheckCircle2, Clock, Truck, AlertCircle, ChevronLeft, Plus, Minus, Trash2,
  Edit2, Save, X, Search, Image as ImageIcon, Tag, UserPlus, LogOut, 
  Activity, ShieldAlert, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight,
  UserCheck, UserMinus, Flame, Thermometer, Snowflake, Mail, Phone, MapPin,
  CheckSquare, ListTodo, FileText, Database, Zap, Monitor, Terminal, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { db } from "../../../firebase";
import * as XLSX from 'xlsx';
import { Product, OrderItem, Order, Client, Banner, AdminUser, Task, OperationType } from '../types';
import { handleFirestoreError, getStatusBadge, getSegmentIcon } from '../utils';

// 5. Product Matrix View
export default function ProductMatrixView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const fetchProducts = async (isInitial = false) => {
    setLoading(true);
    try {
      const currentOffset = isInitial ? 0 : products.length;
      const res = await fetch(`/api/products?limit=${PAGE_SIZE}&offset=${currentOffset}&admin=true`);
      const newProducts = await res.json();
      
      if (isInitial) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchProducts(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=10&admin=true`);
      const data = await res.json();
      setProducts(data);
      setHasMore(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = products.map(p => ({
      'ID': p.id,
      'Название': p.name,
      'Артикул': p.sku,
      'Цена': p.price,
      'Остаток': p.stock,
      'Категория': p.category || 'Без категории'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "product_matrix.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Товарная матрица</h2>
        <div className="flex gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Поиск по артикулу..." 
              className="pl-10 w-64 h-11 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          <Button variant="outline" className="gap-2 h-11 rounded-xl" onClick={exportToExcel}><Download className="w-4 h-4" /> Экспорт (Excel)</Button>
          <Button className="bg-orange-500 gap-2 h-11 rounded-xl"><Plus className="w-4 h-4" /> Добавить товар</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            <div>
              <div className="text-lg font-bold text-red-700">12</div>
              <div className="text-[11px] text-red-600 font-medium">Товары на исходе</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <div className="text-lg font-bold text-emerald-700">45</div>
              <div className="text-[11px] text-emerald-600 font-medium">Топ продаж</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl"><RefreshCcw className="w-6 h-6 text-blue-600" /></div>
            <div>
              <div className="text-lg font-bold text-blue-700">13 000+</div>
              <div className="text-[11px] text-blue-600 font-medium">Товаров в базе</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead>Артикул</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена (Розн)</TableHead>
              <TableHead>Цена (Закуп)</TableHead>
              <TableHead>Прибыль</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={product.image || undefined} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{product.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[11px]">{product.sku}</TableCell>
                <TableCell>{product.category || 'Инструмент'}</TableCell>
                <TableCell className="font-bold text-zinc-900">{product.price} ₽</TableCell>
                <TableCell className="text-zinc-500">{product.purchasePrice || 0} ₽</TableCell>
                <TableCell className="font-bold text-emerald-600">+{(product.price - (product.purchasePrice || 0)).toFixed(2)} ₽</TableCell>
                <TableCell>
                  <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                    {product.stock} шт.
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {hasMore && (
          <div className="p-6 border-t border-zinc-100 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => fetchProducts(false)} 
              disabled={loading}
              className="rounded-xl px-8"
            >
              {loading ? "Загрузка..." : "Загрузить еще"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}