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
  const [xmlImportFile, setXmlImportFile] = useState<File | null>(null);
  const [xmlOffersFile, setXmlOffersFile] = useState<File | null>(null);

  const handleManualXmlImport = async () => {
    if (!xmlImportFile) return;
    setLoading(true);
    setLogs([]);
    setProgress(0);
    addLog("Начало локальной синхронизации: отправка XML файлов на сервер...");

    const formData = new FormData();
    formData.append('importFile', xmlImportFile);
    if (xmlOffersFile) {
        formData.append('offersFile', xmlOffersFile);
    }

    try {
      const res = await fetch('/api/1c/upload-xml', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      addLog(data.message);
      
      // Start polling logs.json to update progress
      let interval = setInterval(async () => {
         try {
            const logsRes = await fetch('/api/logs');
            if (logsRes.ok) {
               const logsData = await logsRes.json();
               const syncLogs = logsData.filter((l: any) => l.path === '/api/1c/upload-xml').map((l: any) => `[${l.time}] ${l.message}`);
               if (syncLogs.length > 0) {
                 setLogs(syncLogs.map((s, idx) => ({id: `${s}-${idx}`, msg: s})));
                 // Check if done
                 if (syncLogs[0].includes("УСПЕШНО ЗАВЕРШЕНА") || syncLogs[0].includes("ОШИБКА ОБРАБОТКИ")) {
                    clearInterval(interval);
                    setLoading(false);
                    setProgress(100);
                    fetchStats();
                 } else {
                    const match = syncLogs[0].match(/Сохранено (\d+) товаров из (\d+)/);
                    if (match) {
                        const count = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        setProgress(Math.round((count / total) * 100));
                    } else if (syncLogs[0].includes("Чтение загруженного offers.xml")) {
                        setProgress(30);
                    } else if (syncLogs[0].includes("Сохранено")) {
                        setProgress(50);
                    } else if (syncLogs[0].includes("Чтение загруженного import.xml")) {
                        setProgress(10);
                    }
                 }
               }
            }
         } catch(e) {}
      }, 2000);
    } catch(e) {
      addLog(`Ошибка запуска: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{id: string, msg: string}[]>([]);
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
    setLogs(prev => [{id: Date.now().toString() + Math.random(), msg: `[${new Date().toLocaleTimeString()}] ${msg}`}, ...prev]);
  };

  const handleImportS3 = async () => {
    setLoading(true);
    setLogs([]);
    setProgress(0);
    addLog("Отправка команды на сервер: Инициирована синхронизация с S3 хранилищем...");
    
    try {
      const res = await fetch('/api/1c/sync-s3', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      addLog(data.message);
      
      // Start polling logs.json to update progress
      let interval = setInterval(async () => {
         try {
            const logsRes = await fetch('/api/logs');
            if (logsRes.ok) {
               const logsData = await logsRes.json();
               // Update UI logs with only sync S3 related logs
               const syncLogs = logsData.filter((l: any) => l.path === '/api/1c/sync-s3').map((l: any) => `[${l.time}] ${l.message}`);
               if (syncLogs.length > 0) {
                 setLogs(syncLogs.map((s, idx) => ({id: `${s}-${idx}`, msg: s})));
                 // Check if done
                 if (syncLogs[0].includes("УСПЕШНО ЗАВЕРШЕНА") || syncLogs[0].includes("ОШИБКА СИНХРОНИЗАЦИИ")) {
                    clearInterval(interval);
                    setLoading(false);
                    setProgress(100);
                    fetchStats();
                 } else {
                    // Try to guess progress from count if it says "Сохранено X товаров из Y"
                    const match = syncLogs[0].match(/Сохранено (\d+) товаров из (\d+)/);
                    if (match) {
                        const count = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        setProgress(Math.round((count / total) * 100));
                    } else if (syncLogs[0].includes("Скачивание offers.xml")) {
                        setProgress(30);
                    } else if (syncLogs[0].includes("Сохранено")) {
                        setProgress(50);
                    } else if (syncLogs[0].includes("Скачивание import.xml")) {
                        setProgress(10);
                    }
                 }
               }
            }
         } catch(e) {}
      }, 2000);
    } catch(e) {
      addLog(`Ошибка запуска: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
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
          category: String(row['Категория'] || 'Без категории'), // Categories strictly from file as requested!
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
      
      addLog("Обновление категорий согласно файлу...");
      const uniqueCats = new Set<string>();
      jsonData.forEach((row: any) => {
        const cat = row['Категория'];
        if (cat) uniqueCats.add(cat);
      });
      if (uniqueCats.size === 0) uniqueCats.add('Без категории');

      // Categories are flat mapped from Excel without grouping logic
      for (const cat of Array.from(uniqueCats)) {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat, parentId: null })
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
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
            S3 XML
          </Badge>
          <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">
            Excel / CSV
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-rose-500"></div>
            <CardHeader className="pt-8">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="w-6 h-6 text-orange-500" />
                Автоматическая синхронизация из S3 (XML)
              </CardTitle>
              <CardDescription>
                Запускает процесс глубокой синхронизации базы товаров из файлов import.xml и offers.xml, загруженных из 1С в облачное хранилище S3.
                Иерархия категорий и цены будут перенесены 1-в-1.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-sm font-bold text-zinc-900">Прогресс S3 синхронизации</p>
                     <p className="text-xs text-zinc-500">Логи транслируются в журнал событий в реальном времени</p>
                  </div>
                  <span className="text-3xl font-black text-orange-500">{progress}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-4 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-rose-500 h-full transition-all duration-700 ease-out relative" 
                    style={{ width: `${progress}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleImportS3} 
                disabled={loading} 
                className="w-full h-16 text-lg bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <RefreshCcw className="w-6 h-6 animate-spin" />
                    Идет обмен с S3...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-white" />
                    Синхронизировать базу с S3
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>


          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pt-6">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Ручная загрузка как шаблон (XML из 1C)
              </CardTitle>
              <CardDescription>
                Загрузите файлы import.xml и offers.xml напрямую, минуя S3. 
                Система проанализирует эти файлы так же, как при автоматической синхронизации.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-zinc-200 rounded-xl p-4 text-center space-y-3 hover:border-zinc-300 transition-all bg-zinc-50/50">
                    <p className="font-medium text-sm text-zinc-900">1. Каталог (Обязательно)</p>
                    <Input 
                      type="file" 
                      accept=".xml" 
                      onChange={(e) => e.target.files && setXmlImportFile(e.target.files[0])}
                      className="hidden" 
                      id="xml-import-upload"
                    />
                    <label htmlFor="xml-import-upload" className="cursor-pointer block">
                      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 h-9 px-4 shadow-sm w-full">
                        Выберите import.xml
                      </div>
                    </label>
                    {xmlImportFile && (
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 truncate px-2">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> <span className="truncate">{xmlImportFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="border border-zinc-200 rounded-xl p-4 text-center space-y-3 hover:border-zinc-300 transition-all bg-zinc-50/50">
                    <p className="font-medium text-sm text-zinc-900">2. Цены / Остатки</p>
                    <Input 
                      type="file" 
                      accept=".xml" 
                      onChange={(e) => e.target.files && setXmlOffersFile(e.target.files[0])}
                      className="hidden" 
                      id="xml-offers-upload"
                    />
                    <label htmlFor="xml-offers-upload" className="cursor-pointer block">
                      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 h-9 px-4 shadow-sm w-full">
                        Выберите offers.xml
                      </div>
                    </label>
                    {xmlOffersFile && (
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 truncate px-2">
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> <span className="truncate">{xmlOffersFile.name}</span>
                      </div>
                    )}
                  </div>
              </div>

              <Button 
                onClick={handleManualXmlImport} 
                disabled={loading || !xmlImportFile} 
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-md disabled:bg-zinc-300 disabled:text-zinc-500"
              >
                {loading ? 'Идет обработка...' : 'Загрузить XML файлы сервера'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-zinc-500" />
                Ручная загрузка (Excel / CSV)
              </CardTitle>
              <CardDescription>
                Резервный способ. Загрузите выгрузку вручную, если S3 недоступно.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center space-y-4 hover:border-zinc-300 transition-all bg-zinc-50/50 group">
                <Input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 h-10 px-6 rounded-lg shadow-sm">
                    Выбрать Excel файл
                  </div>
                </label>
                {file && (
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> {file.name}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleImportExcel} 
                disabled={!file || loading} 
                variant="outline"
                className="w-full h-12 font-bold rounded-xl active:scale-[0.98] disabled:opacity-50"
              >
                Загрузить из Excel
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
              <div className="bg-zinc-900 rounded-2xl p-6 font-mono text-[11px] text-zinc-400 h-96 overflow-y-auto space-y-2 custom-scrollbar">
                {logs.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                    <Terminal className="w-8 h-8 opacity-20" />
                    <p className="italic">Ожидание начала процесса...</p>
                  </div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 border-b border-zinc-800/50 pb-2 last:border-0 hover:bg-zinc-800/50 transition-colors">
                    <span className="text-zinc-600 shrink-0">{log.msg.includes(']') ? log.msg.split(']')[0] + ']' : ''}</span>
                    <span className={log.msg.includes('ОШИБКА') ? 'text-red-400' : log.msg.includes('УСПЕШНО') ? 'text-emerald-400' : 'text-zinc-300'}>
                        {log.msg.includes(']') ? log.msg.split(']')[1] : log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex gap-2 items-center"><Database className="w-5 h-5 text-orange-500"/> Инструкция S3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-400">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-zinc-300">1</div>
                <p>Выгрузите из 1С файлы <code className="text-orange-400">import.xml</code> и <code className="text-orange-400">offers.xml</code>, а также папку с картинками.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-zinc-300">2</div>
                <p>Загрузите их в ваше S3 хранилище (Timeweb) в корневую папку <code className="text-orange-400">/1C/</code>.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-zinc-300">3</div>
                <p>Нажмите большую оранжевую кнопку «Синхронизировать базу с S3». Система сама скачает файлы и произведет обновление.</p>
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