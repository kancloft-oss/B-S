import React, { useState, useEffect, useMemo } from "react";
import { Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../lib/auth-context";
import {
  BarChart3, Package, RefreshCcw, Settings, TrendingUp, Users, CreditCard,
  CheckCircle2, Clock, Truck, AlertCircle, ChevronLeft, Plus, Minus, Trash2,
  Edit2, Save, X, Search, Image as ImageIcon, Tag, UserPlus, LogOut, 
  Activity, ShieldAlert, Calendar, Download, Filter, ArrowUpRight, ArrowDownRight,
  UserCheck, UserMinus, Flame, Thermometer, Snowflake, Mail, Phone, MapPin,
  CheckSquare, ListTodo, FileText, Database, Zap, Monitor, Terminal, Star, ZoomIn
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

// 4. CRM View
export default function CRMView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<{src: string, alt: string} | null>(null);

  // Image Zoom Modal Component
  const ImageZoom = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
      <Button variant="ghost" className="absolute top-4 right-4 text-white hover:text-red-400" onClick={onClose}><X /></Button>
    </div>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orders');
        const ordersData = res.ok ? await res.json() : [];
        
        // Enrich orders with product details
        const enhancedOrders = await Promise.all(ordersData.map(async (order: any) => {
          const itemsWithProducts = await Promise.all((order.items || []).map(async (item: any) => {
            let productData;
            try {
              const pRes = await fetch(`/api/products/${item.productId}`);
              if (pRes.ok) {
                const contentType = pRes.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                  productData = await pRes.json();
                }
              }
            } catch (err) {}
            return { ...item, product: productData };
          }));
          return { ...order, items: itemsWithProducts } as Order;
        }));
        setOrders(enhancedOrders);

        // Fetch users
        let usersData: any[] = [];
        try {
          const uRes = await fetch('/api/users');
          if (uRes.ok) usersData = await uRes.json();
        } catch (err) {}

        // Group orders by phone or customer name to identify unique clients
        const clientMap = new Map<string, { user?: any, name: string, phone: string, orders: Order[] }>();
        
        enhancedOrders.forEach(order => {
          const key = order.phone || order.customer;
          const user = usersData.find(u => u.phone === order.phone || u.email === order.customer);
          
          if (!clientMap.has(key)) {
            clientMap.set(key, { user, name: order.customer, phone: order.phone, orders: [] });
          }
          clientMap.get(key)!.orders.push(order);
        });
        
        // ... (rest of the client calculation remains same)
        const calculatedClients: Client[] = Array.from(clientMap.entries()).map(([key, data], index) => {
          const clientOrders = data.orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const totalSpent = clientOrders.reduce((sum, o) => sum + o.total, 0);
          const lastPurchaseDate = clientOrders[0]?.date || "";
          const orderCount = clientOrders.length;
          
          // Segmentation Logic (RFM-ish)
          const daysSinceLast = lastPurchaseDate ? Math.floor((new Date().getTime() - new Date(lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
          const frequency = orderCount;

          let segment: Client['segment'] = 'medium';
          if (daysSinceLast < 14 && frequency >= 3) segment = 'hot';
          else if (daysSinceLast < 30 && frequency >= 2) segment = 'warm';
          else if (daysSinceLast > 90) segment = 'dormant';
          else if (daysSinceLast > 60) segment = 'cold';

          const rating = Math.min(5, Math.max(1, (orderCount * 0.5) + (totalSpent / 10000)));

          return {
            id: data.user?.id || String(index + 1),
            name: data.user?.fullName || data.name,
            email: data.user?.email || "",
            phone: data.user?.phone || data.phone,
            address: data.user?.address || "Не указан",
            avatar: data.user?.avatarUrl || "",
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

  const toggleBlockClient = async (client: Client) => {
    try {
      const isBlocked = !client.isBlocked;
      await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked })
      });
      setClients(clients.map(c => c.id === client.id ? { ...c, isBlocked } : c));
      setSelectedClient({ ...client, isBlocked });
    } catch (error) {
      console.error(error);
    }
  };

  const clientOrders = selectedClient 
    ? orders.filter(o => (o.phone === selectedClient.phone || o.customer === selectedClient.name))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  if (loading) return <div className="p-12 text-center">Загрузка данных CRM...</div>;

  if (selectedClient) {
    return (
      <div className="space-y-6">
        {zoomedImage && <ImageZoom src={zoomedImage.src} alt={zoomedImage.alt} onClose={() => setZoomedImage(null)} />}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setSelectedClient(null)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-bold">{selectedClient.name}</h2>
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
                          <div className="font-bold text-xs">Заказ #{order.id}</div>
                          <div className="text-[11px] text-zinc-500">{new Date(order.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{order.total} ₽</div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-100">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Товары</div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={`item-${order.id}-${item.productId}-${idx}`} className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="relative group w-8 h-8 shrink-0">
                                <img 
                                  src={item.product?.image || '/placeholder.png'} 
                                  alt={item.product?.name || 'Товар'} 
                                  className="w-full h-full object-cover rounded-md cursor-pointer"
                                  onClick={() => setZoomedImage({src: item.product?.image || '/placeholder.png', alt: item.product?.name || 'Товар'})}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md pointer-events-none">
                                  <ZoomIn className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <span className="text-zinc-600 font-medium">{item.product?.name || item.productId}</span>
                            </div>
                            <span className="font-medium whitespace-nowrap">{item.qty} шт. × {item.price} ₽</span>
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
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 text-lg font-bold overflow-hidden">
                      <img 
                        src={selectedClient.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedClient.name}`} 
                        alt={selectedClient.name} 
                        className="w-full h-full object-cover" 
                      />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedClient.name}</div>
                    <div className="text-xs text-zinc-500">{selectedClient.phone}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{selectedClient.address}</div>
                    <Badge variant={selectedClient.isBlocked ? "destructive" : "secondary"} className="mt-1">
                      {selectedClient.isBlocked ? "Заблокирован" : "Активен"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Всего потрачено</div>
                    <div className="text-sm font-bold">{selectedClient.totalSpent.toLocaleString()} ₽</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Заказов</div>
                    <div className="text-sm font-bold">{selectedClient.orderCount}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Баллы LTV</div>
                    <div className="text-sm font-bold text-orange-600">{selectedClient.points}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Рейтинг</div>
                    <div className="text-sm font-bold flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {selectedClient.rating}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Коммуникация и Безопасность</div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-3 rounded-xl h-11">
                      <Mail className="w-4 h-4 text-zinc-400" /> Написать Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-3 rounded-xl h-11">
                      <Phone className="w-4 h-4 text-zinc-400" /> Позвонить
                    </Button>
                    <Button 
                      variant={selectedClient.isBlocked ? "outline" : "destructive"} 
                      className="w-full justify-start gap-3 rounded-xl h-11"
                      onClick={() => toggleBlockClient(selectedClient)}
                    >
                      <ShieldAlert className="w-4 h-4" /> 
                      {selectedClient.isBlocked ? "Разблокировать" : "Заблокировать"}
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
        <h2 className="text-lg font-bold">Клиенты (CRM)</h2>
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
              <div className="text-base font-bold">{seg.count}</div>
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
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold overflow-hidden">
                      {client.avatar ? (
                         <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                      ) : (
                         client.name[0]
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900">{client.name}</div>
                      <div className="text-[11px] text-zinc-500">{client.phone}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSegmentIcon(client.segment)}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">{client.segment}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{client.orderCount}</TableCell>
                <TableCell className="font-bold">{client.totalSpent.toLocaleString()} ₽</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50/50">{client.points} Б</Badge>
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">{client.lastPurchaseDate}</TableCell>
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