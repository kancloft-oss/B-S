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

// 6. Admin Users View
export default function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([
    { id: '1', name: 'Администратор', email: 'admin@brushes.ru', role: 'superadmin', lastActive: 'Сейчас' },
    { id: '2', name: 'Менеджер Иван', email: 'ivan@brushes.ru', role: 'manager', lastActive: '2 часа назад' },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Обновить баннеры к празднику', assignedTo: 'Менеджер Иван', deadline: '2024-04-20', status: 'in-progress' },
    { id: '2', title: 'Проверить остатки на складе', assignedTo: 'Администратор', deadline: '2024-04-18', status: 'pending' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Пользователи и Задачи</h2>
        <Button className="bg-orange-500 gap-2"><Plus className="w-4 h-4" /> Назначить задачу</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Команда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="font-bold">{user.name}</div>
                      <div className="text-[11px] text-zinc-500">{user.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-400">Активность</div>
                    <div className="text-[11px] font-medium">{user.lastActive}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Текущие задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-4 border border-zinc-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs">{task.title}</h4>
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status === 'pending' ? 'Ожидает' : task.status === 'in-progress' ? 'В работе' : 'Готово'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {task.assignedTo}</div>
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> до {task.deadline}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}