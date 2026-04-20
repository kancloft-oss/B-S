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

// 8. System Logs View
export default function SystemLogsView() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Системный мониторинг</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Пользователей онлайн</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              42
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Нагрузка на сервер</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18%</div>
            <div className="w-full bg-zinc-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[18%]"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Ошибок за 24ч</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{logs.filter((l: any) => l.type === 'error').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Terminal className="w-5 h-5" /> Логи ошибок</CardTitle>
          <Button variant="outline" size="sm">Очистить логи</Button>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto min-h-[300px]">
            {logs.length === 0 ? (
              <div className="text-zinc-500 italic">Логи пока пусты...</div>
            ) : logs.map((log: any) => (
              <div key={log.id} className="flex gap-4 border-b border-zinc-800 pb-2 last:border-0">
                <span className="text-zinc-500">[{log.time}]</span>
                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-zinc-400">[{log.path}]</span>
                <span className="break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}