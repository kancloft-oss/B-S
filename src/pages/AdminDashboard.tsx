import React, { useState, useEffect, useMemo } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import {
  BarChart3, Package, RefreshCcw, Settings, TrendingUp, Users, CreditCard,
  CheckCircle2, Clock, Truck, AlertCircle, ChevronLeft, Plus, Minus, Trash2,
  Edit2, Save, X, Search, Image as ImageIcon, Tag, UserPlus, LogOut, 
  Activity, ShieldAlert, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight,
  UserCheck, UserMinus, Flame, Thermometer, Snowflake, Mail, Phone, MapPin,
  CheckSquare, ListTodo, FileText, Database, Zap, Monitor, Terminal, Star
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

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category?: string;
  salesCount?: number;
  lastOrdered?: string;
  sku?: string;
  code?: string;
  unit?: string;
  fullName?: string;
  description?: string;
}

interface OrderItem {
  productId: string;
  qty: number;
  price: number;
  product?: Product;
}

interface Order {
  id: string;
  date: string;
  customer: string;
  phone: string;
  status: string;
  total: number;
  items: OrderItem[];
  userId?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  status: 'active' | 'inactive' | 'new';
  totalSpent: number;
  orderCount: number;
  lastPurchaseDate: string;
  segment: 'hot' | 'warm' | 'medium' | 'cold' | 'dormant';
  rating: number;
}

interface Banner {
  id: string;
  image: string;
  title: string;
  action: string;
  active: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'manager' | 'editor' | 'support';
  lastActive: string;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
}

// --- Helper Functions ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const getStatusBadge = (status: string) => {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide";
  switch (status) {
    case 'new': return <div className={`${base} bg-blue-100 text-blue-700`}><Clock className="w-3.5 h-3.5"/> Новый</div>;
    case 'confirming': return <div className={`${base} bg-orange-100 text-orange-700`}><AlertCircle className="w-3.5 h-3.5"/> Проверка</div>;
    case 'awaiting_payment': return <div className={`${base} bg-red-100 text-red-700`}><CreditCard className="w-3.5 h-3.5"/> Ожидает оплаты</div>;
    case 'paid': return <div className={`${base} bg-emerald-100 text-emerald-700`}><CheckCircle2 className="w-3.5 h-3.5"/> Оплачен</div>;
    case 'assembling': return <div className={`${base} bg-purple-100 text-purple-700`}><Package className="w-3.5 h-3.5"/> Сборка</div>;
    case 'ready': return <div className={`${base} bg-emerald-100 text-emerald-700`}><CheckCircle2 className="w-3.5 h-3.5"/> Готов</div>;
    case 'shipped': return <div className={`${base} bg-orange-100 text-orange-700`}><Truck className="w-3.5 h-3.5"/> Отправлен</div>;
    default: return <div className={`${base} bg-zinc-100 text-zinc-700`}>{status}</div>;
  }
};

const getSegmentIcon = (segment: string) => {
  switch (segment) {
    case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
    case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
    case 'medium': return <Thermometer className="w-4 h-4 text-yellow-500" />;
    case 'cold': return <Snowflake className="w-4 h-4 text-blue-300" />;
    case 'dormant': return <Snowflake className="w-4 h-4 text-zinc-300" />;
    default: return null;
  }
};

// --- Sub-components ---

// 1. Analytics View
function AnalyticsView() {
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

// 2. Orders View (Enhanced)
function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if(res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/orders/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm("Удалить заказ?")) {
      try {
        await fetch('/api/orders/' + id, { method: 'DELETE' });
        fetchOrders();
        setSelectedOrder(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredOrders = orders.filter(o => filter === "all" || o.status === filter);

  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedOrder(null)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold">Заказ #{selectedOrder.id}</h2>
          {getStatusBadge(selectedOrder.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>Состав заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead className="text-right">Итого</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.productId}</TableCell>
                      <TableCell>{item.qty} шт.</TableCell>
                      <TableCell>{item.price} ₽</TableCell>
                      <TableCell className="text-right font-bold">{item.qty * item.price} ₽</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Итого:</TableCell>
                    <TableCell className="text-right font-black text-lg">{selectedOrder.total} ₽</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Информация о клиенте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Имя</div>
                  <div className="font-medium">{selectedOrder.customer}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Телефон</div>
                  <div className="font-medium">{selectedOrder.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase">Дата</div>
                  <div className="font-medium">{new Date(selectedOrder.date).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full bg-orange-500" onClick={() => updateStatus(selectedOrder.id, 'confirming')}>Подтвердить</Button>
                <Button className="w-full bg-emerald-500" onClick={() => updateStatus(selectedOrder.id, 'paid')}>Оплачен</Button>
                <Button className="w-full bg-purple-500" onClick={() => updateStatus(selectedOrder.id, 'shipped')}>Отправлен</Button>
                <Button variant="destructive" className="w-full" onClick={() => deleteOrder(selectedOrder.id)}>Удалить заказ</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Заказы</h2>
        <div className="flex gap-2">
          <select 
            className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="new">Новые</option>
            <option value="paid">Оплаченные</option>
            <option value="shipped">Отправленные</option>
          </select>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map(order => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-zinc-50" onClick={() => setSelectedOrder(order)}>
                <TableCell className="font-medium text-orange-600">#{order.id}</TableCell>
                <TableCell className="text-zinc-500">{new Date(order.date).toLocaleDateString()}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right font-bold">{order.total} ₽</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// 3. Marketing View
function MarketingView() {
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
            <img src={banner.image} alt="" className="w-full h-48 object-cover" />
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

// 4. CRM View
function CRMView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orders');
        const ordersData = res.ok ? await res.json() : [];
        setOrders(ordersData);

        // Group orders by phone or customer name to identify unique clients
        const clientMap = new Map<string, { name: string, phone: string, orders: Order[] }>();
        
        ordersData.forEach(order => {
          const key = order.phone || order.customer;
          if (!clientMap.has(key)) {
            clientMap.set(key, { name: order.customer, phone: order.phone, orders: [] });
          }
          clientMap.get(key)!.orders.push(order);
        });

        const calculatedClients: Client[] = Array.from(clientMap.entries()).map(([key, data], index) => {
          const clientOrders = data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const totalSpent = clientOrders.reduce((sum, o) => sum + o.total, 0);
          const lastPurchaseDate = clientOrders[0]?.date || "";
          const orderCount = clientOrders.length;
          
          // Segmentation Logic (RFM-ish)
          // Recency: days since last purchase
          const daysSinceLast = lastPurchaseDate ? Math.floor((new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
          // Frequency: orders per month (simplified)
          const frequency = orderCount;

          let segment: Client['segment'] = 'medium';
          if (daysSinceLast < 14 && frequency >= 3) segment = 'hot';
          else if (daysSinceLast < 30 && frequency >= 2) segment = 'warm';
          else if (daysSinceLast > 90) segment = 'dormant';
          else if (daysSinceLast > 60) segment = 'cold';

          // Rating calculation (1-5)
          const rating = Math.min(5, Math.max(1, (orderCount * 0.5) + (totalSpent / 10000)));

          return {
            id: String(index + 1),
            name: data.name,
            email: "", // Not always available in order
            phone: data.phone,
            points: Math.floor(totalSpent * 0.05),
            status: daysSinceLast < 60 ? 'active' : 'inactive',
            totalSpent,
            orderCount,
            lastPurchaseDate: lastPurchaseDate ? new Date(lastPurchaseDate).toLocaleDateString() : "N/A",
            segment,
            rating: Number(rating.toFixed(1))
          };
        });

        setClients(calculatedClients);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "crm_data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const clientOrders = selectedClient 
    ? orders.filter(o => (o.phone === selectedClient.phone || o.customer === selectedClient.name))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  if (loading) return <div className="p-12 text-center">Загрузка данных CRM...</div>;

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedClient(null)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
          <Badge className="bg-orange-500">{selectedClient.segment.toUpperCase()}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle>История покупок</CardTitle>
              <CardDescription>Все заказы клиента за все время</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientOrders.map(order => (
                  <div key={order.id} className="p-4 border border-zinc-100 rounded-2xl space-y-3 bg-zinc-50/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg border border-zinc-100 shadow-sm">
                          <Package className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <div className="font-bold text-sm">Заказ #{order.id}</div>
                          <div className="text-xs text-zinc-500">{new Date(order.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{order.total} ₽</div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Товары</div>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-zinc-600">{item.productId} x {item.qty}</span>
                            <span className="font-medium">{item.price * item.qty} ₽</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Профиль клиента</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-bold">
                    {selectedClient.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{selectedClient.name}</div>
                    <div className="text-sm text-zinc-500">{selectedClient.phone}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Всего потрачено</div>
                    <div className="text-lg font-bold">{selectedClient.totalSpent.toLocaleString()} ₽</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Заказов</div>
                    <div className="text-lg font-bold">{selectedClient.orderCount}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Баллы LTV</div>
                    <div className="text-lg font-bold text-orange-600">{selectedClient.points}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Рейтинг</div>
                    <div className="text-lg font-bold flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {selectedClient.rating}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Коммуникация</div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-3 rounded-xl h-11">
                      <Mail className="w-4 h-4 text-zinc-400" /> Написать Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3 rounded-xl h-11">
                      <Phone className="w-4 h-4 text-zinc-400" /> Позвонить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const segmentStats = {
    hot: clients.filter(c => c.segment === 'hot').length,
    warm: clients.filter(c => c.segment === 'warm').length,
    medium: clients.filter(c => c.segment === 'medium').length,
    cold: clients.filter(c => c.segment === 'cold').length,
    dormant: clients.filter(c => c.segment === 'dormant').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Клиенты (CRM)</h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Поиск клиента..." 
              className="pl-10 w-64 h-11 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="bg-orange-500 gap-2 h-11 rounded-xl px-6"><UserPlus className="w-4 h-4" /> Новый клиент</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Горячие', count: segmentStats.hot, icon: <Flame className="w-4 h-4 text-red-500" />, color: 'bg-red-50' },
          { label: 'Теплые', count: segmentStats.warm, icon: <Thermometer className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50' },
          { label: 'Средние', count: segmentStats.medium, icon: <Thermometer className="w-4 h-4 text-yellow-500" />, color: 'bg-yellow-50' },
          { label: 'Холодные', count: segmentStats.cold, icon: <Snowflake className="w-4 h-4 text-blue-500" />, color: 'bg-blue-50' },
          { label: 'Спящие', count: segmentStats.dormant, icon: <Snowflake className="w-4 h-4 text-zinc-400" />, color: 'bg-zinc-50' },
        ].map(seg => (
          <Card key={seg.label} className={`border-none ${seg.color} shadow-sm`}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="p-2 bg-white rounded-lg shadow-sm mb-2">{seg.icon}</div>
              <div className="text-xl font-bold">{seg.count}</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{seg.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50">
            <TableRow>
              <TableHead className="pl-6">Клиент</TableHead>
              <TableHead>Сегмент</TableHead>
              <TableHead>Заказы</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Баллы</TableHead>
              <TableHead>Последняя покупка</TableHead>
              <TableHead className="text-right pr-6">Рейтинг</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map(client => (
              <TableRow key={client.id} className="hover:bg-zinc-50 cursor-pointer transition-colors" onClick={() => setSelectedClient(client)}>
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold">
                      {client.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">{client.name}</div>
                      <div className="text-xs text-zinc-500">{client.phone}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSegmentIcon(client.segment)}
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">{client.segment}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{client.orderCount}</TableCell>
                <TableCell className="font-bold">{client.totalSpent.toLocaleString()} ₽</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50/50">{client.points} Б</Badge>
                </TableCell>
                <TableCell className="text-zinc-500 text-sm">{client.lastPurchaseDate}</TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1 font-bold text-zinc-900">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {client.rating}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// 5. Product Matrix View
function ProductMatrixView() {
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
      const res = await fetch(`/api/products?limit=${PAGE_SIZE}&offset=${currentOffset}`);
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
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
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
        <h2 className="text-2xl font-bold">Товарная матрица</h2>
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
              <div className="text-2xl font-bold text-red-700">12</div>
              <div className="text-xs text-red-600 font-medium">Товары на исходе</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">45</div>
              <div className="text-xs text-emerald-600 font-medium">Топ продаж</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl"><RefreshCcw className="w-6 h-6 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold text-blue-700">13 000+</div>
              <div className="text-xs text-blue-600 font-medium">Товаров в базе</div>
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
              <TableHead>Цена</TableHead>
              <TableHead>Остаток</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={product.image} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{product.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell>{product.category || 'Инструмент'}</TableCell>
                <TableCell className="font-bold">{product.price} ₽</TableCell>
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

// 6. Admin Users View
function AdminUsersView() {
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
        <h2 className="text-2xl font-bold">Пользователи и Задачи</h2>
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
                      <div className="text-xs text-zinc-500">{user.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">Активность</div>
                    <div className="text-xs font-medium">{user.lastActive}</div>
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
                    <h4 className="font-bold text-sm">{task.title}</h4>
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status === 'pending' ? 'Ожидает' : task.status === 'in-progress' ? 'В работе' : 'Готово'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
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

// 7. Import 1C View
function Import1CView() {
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
        
        if (!res.ok) throw new Error('Ошибка сети при загрузке чанка');
        
        processedCount += chunk.length;
        setProgress(Math.round((processedCount / jsonData.length) * 100));
        addLog(`Отправлено ${processedCount} из ${jsonData.length} товаров...`);
      }
      
      addLog("Обновление категорий...");
      const uniqueCats = new Set(jsonData.map((row: any) => row['Категория'] || 'Без категории'));
      for (const cat of uniqueCats) {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat })
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

// 8. System Logs View
function SystemLogsView() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'error', message: 'Ошибка при выгрузке 1С: API Timeout', time: '10:45:22', path: '/api/sync' },
    { id: 2, type: 'warning', message: 'Высокая нагрузка на БД', time: '10:42:15', path: 'Database' },
    { id: 3, type: 'info', message: 'Успешный вход: admin', time: '10:30:05', path: '/admin/login' },
  ]);

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
            <div className="text-3xl font-bold text-red-500">3</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Terminal className="w-5 h-5" /> Логи ошибок</CardTitle>
          <Button variant="outline" size="sm">Очистить логи</Button>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs text-zinc-300 space-y-2 overflow-x-auto">
            {logs.map(log => (
              <div key={log.id} className="flex gap-4 border-b border-zinc-800 pb-2 last:border-0">
                <span className="text-zinc-500">[{log.time}]</span>
                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}>
                  {log.type.toUpperCase()}
                </span>
                <span className="text-zinc-400">[{log.path}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Layout ---
export function AdminDashboard() {
  const { user: firebaseUser, signInWithGoogle, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isFirebaseAuthorized = firebaseUser?.email === "kancloft@gmail.com";

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    signOutUser();
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin", icon: BarChart3, label: "Аналитика" },
    { path: "/admin/orders", icon: Package, label: "Заказы" },
    { path: "/admin/marketing", icon: Zap, label: "Маркетинг" },
    { path: "/admin/crm", icon: Users, label: "Клиенты (CRM)" },
    { path: "/admin/products", icon: Database, label: "Товары" },
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

        <div className="p-6 border-t border-zinc-800/50">
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
