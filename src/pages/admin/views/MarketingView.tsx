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

// 3. Marketing View
export default function MarketingView() {
  const [banners, setBanners] = useState<Banner[]>([
    { id: '1', image: 'https://picsum.photos/seed/banner1/1200/400', title: 'Весенняя распродажа', action: '/promos', active: true },
    { id: '2', image: 'https://picsum.photos/seed/banner2/1200/400', title: 'Новинки инструмента', action: '/category/Инструмент', active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Маркетинг и Баннеры</h2>
        <Button className="bg-orange-500 gap-2"><Plus className="w-4 h-4" /> Добавить баннер</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(banner => (
          <Card key={banner.id} className="border-none shadow-sm overflow-hidden">
            <img src={banner.image || undefined} alt="" className="w-full h-48 object-cover" />
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{banner.title}</h3>
                  <p className="text-sm text-zinc-500">Действие: {banner.action}</p>
                </div>
                <Badge variant={banner.active ? "default" : "secondary"}>{banner.active ? "Активен" : "Черновик"}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2"><Edit2 className="w-4 h-4" /> Изменить</Button>
                <Button variant="outline" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Акционные товары и блоки</CardTitle>
          <CardDescription>Управление списками товаров в блоках «Хиты», «Новинки», «Акции»</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Хиты продаж', 'Новинки', 'Скидки недели'].map(block => (
              <div key={block} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><Tag className="w-5 h-5 text-orange-500" /></div>
                  <div>
                    <div className="font-bold">{block}</div>
                    <div className="text-xs text-zinc-500">12 товаров в блоке</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-orange-600">Настроить список</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}