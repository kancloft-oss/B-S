import React, { useState, useEffect, useMemo } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import {
  BarChart3, Package, RefreshCcw, Settings, TrendingUp, Users, CreditCard,
  CheckCircle2, Clock, Truck, AlertCircle, ChevronLeft, Plus, Minus, Trash2,
  Edit2, Save, X, Search, Image as ImageIcon, Tag, UserPlus, LogOut, 
  Activity, ShieldAlert, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight,
  UserCheck, UserMinus, Flame, Thermometer, Snowflake, Mail, Phone, MapPin,
  CheckSquare, ListTodo, FileText, Database, Zap, Monitor, Terminal, Star, Home
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { db } from "../firebase";
import * as XLSX from 'xlsx';
import AnalyticsView from './admin/views/AnalyticsView';
import OrdersView from './admin/views/OrdersView';
import MarketingView from './admin/views/MarketingView';
import CRMView from './admin/views/CRMView';
import ProductMatrixView from './admin/views/ProductMatrixView';
import AdminUsersView from './admin/views/AdminUsersView';
import Import1CView from './admin/views/Import1CView';
import CategoriesView from './admin/views/CategoriesView';
import SystemLogsView from './admin/views/SystemLogsView';

// --- Main Layout ---
export function AdminDashboard() {
  const { user: customUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    logout();
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin", icon: BarChart3, label: "Аналитика" },
    { path: "/admin/orders", icon: Package, label: "Заказы" },
    { path: "/admin/marketing", icon: Zap, label: "Маркетинг" },
    { path: "/admin/crm", icon: Users, label: "Клиенты (CRM)" },
    { path: "/admin/products", icon: Database, label: "Товары" },
    { path: "/admin/categories", icon: Tag, label: "Категории" },
    { path: "/admin/import", icon: RefreshCcw, label: "Импорт 1С" },
    { path: "/admin/users", icon: UserCheck, label: "Команда" },
    { path: "/admin/system", icon: Monitor, label: "Система" },
    { path: "/admin/settings", icon: Settings, label: "Настройки" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e1e2d] text-zinc-400 flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800/50">
          <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">BRUSHES ADMIN</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Control Center</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Меню управления</p>
          {navItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                currentPath === item.path 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${currentPath === item.path ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-800/50 space-y-2">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800/50 hover:text-white w-full transition-all group"
          >
            <Home className="w-5 h-5" />
            <span>На сайт</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-500 w-full transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Выйти из системы</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-72 flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-zinc-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-[1px] bg-zinc-200 mx-2"></div>
            <div className="text-sm font-medium text-zinc-500">
              {navItems.find(i => i.path === currentPath)?.label || "Панель управления"}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">System Online</span>
            </div>
            
            <div className="h-10 w-[1px] bg-zinc-200"></div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-zinc-900">Администратор</div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Super Admin</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<AnalyticsView />} />
              <Route path="/orders" element={<OrdersView />} />
              <Route path="/marketing" element={<MarketingView />} />
              <Route path="/crm" element={<CRMView />} />
              <Route path="/products" element={<ProductMatrixView />} />
              <Route path="/categories" element={<CategoriesView />} />
              <Route path="/import" element={<Import1CView />} />
              <Route path="/users" element={<AdminUsersView />} />
              <Route path="/system" element={<SystemLogsView />} />
              <Route path="/settings" element={
                <div className="bg-white p-20 rounded-3xl border border-zinc-200 text-center shadow-sm">
                  <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Настройки магазина</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">Этот раздел находится в разработке. Здесь вы сможете настроить параметры оплаты, доставки и уведомлений.</p>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}