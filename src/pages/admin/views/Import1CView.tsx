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

// 7. Import 1C View
export default function Import1CView() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    newProducts: 0,
    lastUpdate: 'Нет данных'
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalProducts: data.totalProducts,
          totalCategories: data.totalCategories,
          newProducts: data.newProducts7d,
          lastUpdate: data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('ru-RU') : 'Нет данных'
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setLogs([]);
    setProgress(0);
    addLog("Начало высокоскоростной локальной синхронизации через API...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      addLog(`Файл прочитан. Найдено строк: ${jsonData.length}`);
      
      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
        chunks.push(jsonData.slice(i, i + CHUNK_SIZE));
      }

      let processedCount = 0;
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        const payload = chunk.map((row: any) => ({
          name: String(row['Наименование'] || ''),
          price: Number(row['Розничная цена ₽']) || 0,
          stock: Number(row['Остаток']) || 0,
          sku: String(row['Артикул'] || row['Код'] || ''),
          category: String(row['Категория'] || 'Без категории'),
          description: String(row['Описание'] || '')
        }));
        
        const res = await fetch('/api/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: payload })
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка сети при загрузке чанка: ${text}`);
        }
        
        processedCount += chunk.length;
        setProgress(Math.round((processedCount / jsonData.length) * 100));
        addLog(`Отправлено ${processedCount} из ${jsonData.length} товаров...`);
      }
      
      addLog("Обновление категорий...");
      const uniqueCats = new Set<string>();
      jsonData.forEach((row: any) => {
        const cat = row['Категория'];
        if (cat) uniqueCats.add(cat);
      });
      if (uniqueCats.size === 0) uniqueCats.add('Без категории');

      const getParentCat = (catName: string) => {
        const c = catName.toLowerCase();
        if (c.includes('кист')) return 'Кисти';
        if (c.includes('холст') || c.includes('подрамник')) return 'Холсты и подрамники';
        if (c.includes('бумаг') || c.includes('картон') || c.includes('скетч') || c.includes('альбом') || c.includes('блокнот')) return 'Бумага и альбомы';
        if (c.includes('краск') || c.includes('акварел') || c.includes('гуаш') || c.includes('акрил') || c.includes('масло') || c.includes('пигмент')) return 'Краски';
        if (c.includes('карандаш')) return 'Карандаши';
        if (c.includes('маркер') || c.includes('линер') || c.includes('фломастер') || c.includes('ручк')) return 'Маркеры, линеры и ручки';
        if (c.includes('мольберт') || c.includes('этюдник') || c.includes('палитра')) return 'Мольберты и палитры';
        if (c.includes('лак') || c.includes('клей') || c.includes('разбавитель') || c.includes('грунт')) return 'Химия, грунты и лаки';
        return 'Прочие товары';
      };

      const parents = new Set<string>();
      for (const cat of Array.from(uniqueCats)) {
        const parent = getParentCat(cat);
        if (parent) parents.add(parent);
      }

      // 1. Сначала создаем родительские категории
      const parentIds: Record<string, string> = {};
      for (const parent of Array.from(parents)) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: parent })
        });
        const data = await res.json();
        parentIds[parent] = data.id;
      }

      // 2. Теперь создаем подкатегории с привязкой
      for (const cat of Array.from(uniqueCats)) {
        const parentName = getParentCat(cat);
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat, parentId: parentName ? parentIds[parentName] : null })
        });
      }

      setProgress(100);
      addLog("Синхронизация успешно завершена!");
      fetchStats();
    } catch (error) {
      addLog(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      console.error(error);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Синхронизация с 1С</h2>
        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
          Excel / CSV
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-2 bg-orange-500 w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-orange-500" />
                Загрузка данных
              </CardTitle>
              <CardDescription>
                Выберите файл Excel, экспортированный из 1С. Система автоматически сопоставит товары по Артикулу или Коду.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center space-y-4 hover:border-orange-300 transition-all bg-zinc-50/50 group">
                <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                  <Download className="w-10 h-10 text-orange-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-zinc-900">Перетащите файл выгрузки</p>
                  <p className="text-sm text-zinc-500 mt-1">Поддерживаются форматы .xlsx, .xls, .csv</p>
                </div>
                <Input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900 h-12 px-8 rounded-xl">
                    Выбрать файл на компьютере
                  </div>
                </label>
                {file && (
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 py-2 px-4 rounded-full w-fit mx-auto">
                    <CheckCircle2 className="w-4 h-4" />
                    {file.name}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-900">Прогресс обработки</p>
                    <p className="text-xs text-zinc-500">Не закрывайте вкладку до завершения</p>
                  </div>
                  <span className="text-2xl font-black text-orange-500">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!file || loading} 
                className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Идет синхронизация...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    Запустить обновление базы
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-zinc-400" />
                Журнал событий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-900 rounded-2xl p-6 font-mono text-[11px] text-zinc-400 h-80 overflow-y-auto space-y-2 custom-scrollbar">
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                    <Terminal className="w-8 h-8 opacity-20" />
                    <p className="italic">Ожидание начала процесса...</p>
                  </div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 border-b border-zinc-800/50 pb-2 last:border-0">
                    <span className="text-zinc-600 shrink-0">{log.split(']')[0]}]</span>
                    <span className="text-zinc-300">{log.split(']')[1]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-orange-500 text-white">
            <CardHeader>
              <CardTitle className="text-lg">Инструкция</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm opacity-90">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">1</div>
                <p>Выгрузите из 1С отчет в формате Excel.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">2</div>
                <p>Убедитесь, что колонки называются как в примере (Артикул, Наименование, Цена и т.д.).</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">3</div>
                <p>Загрузите файл здесь. Система сама обновит существующие товары и добавит новые.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Статистика базы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                <span className="text-xs text-zinc-500 font-medium">Всего товаров</span>
                <span className="font-bold text-zinc-900">{stats.totalProducts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                <span className="text-xs text-zinc-500 font-medium">Групп товаров</span>
                <span className="font-bold text-zinc-900">{stats.totalCategories}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                <span className="text-xs text-zinc-500 font-medium">Новинок (7дн)</span>
                <span className="font-bold text-emerald-600">+{stats.newProducts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl">
                <span className="text-xs text-zinc-500 font-medium">Последнее обновление</span>
                <span className="font-bold text-zinc-900 text-[10px]">{stats.lastUpdate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}