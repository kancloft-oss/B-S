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

// 1. Analytics View
export default function AnalyticsView() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Mock analytics data
    setStats({
      revenue: 1245000,
      avgCheck: 4500,
      orderCount: 276,
      salesGrowth: 15.4,
      checkGrowth: 2.1,
      orderGrowth: 8.7,
      salesData: [
        { name: "Янв", revenue: 850000, orders: 180 },
        { name: "Фев", revenue: 920000, orders: 210 },
        { name: "Мар", revenue: 1100000, orders: 240 },
        { name: "Апр", revenue: 1245000, orders: 276 },
      ],
      categoryData: [
        { name: "Инструмент", value: 45 },
        { name: "Крепеж", value: 25 },
        { name: "Сад", value: 15 },
        { name: "Электрика", value: 15 },
      ]
    });
  }, [period]);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6'];

  if (!stats) return <div className="p-12 text-center">Загрузка аналитики...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Аналитика сайта</h2>
        <div className="flex gap-2">
          {['week', 'month', 'year', 'custom'].map(p => (
            <Button 
              key={p} 
              variant={period === p ? "default" : "outline"} 
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-orange-500" : ""}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : p === 'year' ? 'Год' : 'Период'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Сумма продаж</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toLocaleString()} ₽</div>
            <div className="flex items-center text-xs text-emerald-500 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.salesGrowth}% к прошлому периоду
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Средний чек</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCheck.toLocaleString()} ₽</div>
            <div className="flex items-center text-xs text-emerald-500 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.checkGrowth}% к прошлому периоду
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Количество чеков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orderCount}</div>
            <div className="flex items-center text-xs text-emerald-500 mt-1">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.orderGrowth}% к прошлому периоду
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Конверсия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.4%</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="w-3 h-3 mr-1" /> 0.5% к прошлому периоду
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Динамика выручки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.salesData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Продажи по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.categoryData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-zinc-600">{entry.name}</span>
                  </div>
                  <span className="font-bold">{entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}