import React, { useState, useEffect } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import {
  BarChart3, Package, RefreshCcw, Settings, TrendingUp, Users, CreditCard,
  CheckCircle2, Clock, Truck, AlertCircle, ChevronLeft, Plus, Minus, Trash2,
  Edit2, Save, X, Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
}

interface OrderItem {
  productId: string;
  qty: number;
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
}

// --- Helper Functions ---
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

// --- Sub-components ---
function AnalyticsView() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Выручка</CardTitle>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{stats.revenue.toLocaleString()} ₽</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">+12% за месяц</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Заказы</CardTitle>
            <Package className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{stats.orders}</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">+5% за месяц</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Клиенты</CardTitle>
            <Users className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{stats.customers}</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">+18% за месяц</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Конверсия</CardTitle>
            <BarChart3 className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{stats.conversionRate}%</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">Без изменений</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Продажи за неделю</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f97316', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchOrders();
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const startEditing = () => {
    if (!selectedOrder) return;
    setIsEditing(true);
    setEditedItems([...selectedOrder.items]);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedItems([]);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const updateEditQty = (productId: string, delta: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeEditItem = (productId: string) => {
    setEditedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const addEditItem = (productId: string) => {
    const existing = editedItems.find(i => i.productId === productId);
    if (existing) {
      updateEditQty(productId, 1);
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        setEditedItems(prev => [...prev, { productId, qty: 1, product }]);
      }
    }
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const saveOrderChanges = async () => {
    if (!selectedOrder) return;
    
    const newTotal = editedItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId) || item.product;
      return sum + (product?.price || 0) * item.qty;
    }, 0);

    await fetch(`/api/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: editedItems, total: newTotal })
    });
    
    setIsEditing(false);
    fetchOrders();
    setSelectedOrder({ ...selectedOrder, items: editedItems, total: newTotal });
  };

  if (selectedOrder) {
    const displayItems = isEditing ? editedItems : selectedOrder.items;
    const currentTotal = displayItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId) || item.product;
      return sum + (product?.price || 0) * item.qty;
    }, 0);
    const canEdit = selectedOrder.status === 'new' || selectedOrder.status === 'confirming';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedOrder(null); cancelEditing(); }}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                Заказ {selectedOrder.id}
                <span className="hidden sm:inline-block">{getStatusBadge(selectedOrder.status)}</span>
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {new Date(selectedOrder.date).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
          <div className="sm:hidden">{getStatusBadge(selectedOrder.status)}</div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column: Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg">Состав заказа</CardTitle>
                {canEdit && !isEditing && (
                  <button onClick={startEditing} className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" /> Изменить
                  </button>
                )}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEditing} className="text-zinc-500 hover:text-zinc-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
                      Отмена
                    </button>
                    <button onClick={saveOrderChanges} className="text-white bg-orange-600 hover:bg-orange-700 text-sm font-medium flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-colors shadow-sm">
                      <Save className="w-4 h-4" /> Сохранить
                    </button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {/* Items List (Mobile & Desktop Unified for Editing) */}
                <div className="divide-y divide-zinc-100">
                  {displayItems.map((item, idx) => {
                    const product = products.find(p => p.id === item.productId) || item.product;
                    return (
                      <div key={idx} className="py-3 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {product?.image ? (
                            <img src={product.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-zinc-100 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-zinc-400"/></div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-zinc-900 truncate">{product?.name || "Неизвестный товар"}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{product?.price || 0} ₽ / шт</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-[60px] sm:pl-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 shrink-0">
                              <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-zinc-600 shadow-sm" onClick={() => updateEditQty(item.productId, -1)}>
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                              <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white text-zinc-600 shadow-sm" onClick={() => updateEditQty(item.productId, 1)}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-zinc-600 bg-zinc-50 px-2 py-1 rounded-md shrink-0">{item.qty} шт.</div>
                          )}

                          <div className="font-bold text-sm md:text-base w-20 text-right shrink-0">{(product?.price || 0) * item.qty} ₽</div>

                          {isEditing && (
                            <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0" onClick={() => removeEditItem(item.productId)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Product Search (Edit Mode) */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <label className="text-xs font-medium text-zinc-500 mb-2 block uppercase tracking-wider">Добавить товар в заказ</label>
                    <div className="relative w-full">
                      <div className="flex items-center border border-zinc-200 bg-zinc-50 rounded-xl px-3 h-12 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                        <Search className="w-5 h-5 text-zinc-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Поиск по названию..."
                          className="flex-1 h-full outline-none text-sm bg-transparent"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchOpen(true);
                          }}
                          onFocus={() => setIsSearchOpen(true)}
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-zinc-600 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {isSearchOpen && searchQuery && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                          {products
                            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 20)
                            .map(p => (
                              <div
                                key={p.id}
                                className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm flex justify-between items-center border-b border-zinc-100 last:border-0 transition-colors"
                                onClick={() => addEditItem(p.id)}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {p.image ? (
                                    <img src={p.image} className="w-8 h-8 rounded-md object-cover shrink-0 border border-zinc-100" alt="" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-zinc-400"/></div>
                                  )}
                                  <span className="truncate font-medium text-zinc-900">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                  <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">Остаток: {p.stock}</span>
                                  <span className="font-bold text-orange-600 whitespace-nowrap">{p.price} ₽</span>
                                </div>
                              </div>
                            ))}
                          {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
                              <Search className="w-6 h-6 text-zinc-300" />
                              Товары не найдены
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Итого к оплате</span>
                  <span className="text-2xl font-black text-zinc-900">{currentTotal} ₽</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Column: Info & Actions */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg">Покупатель</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Имя</div>
                  <div className="font-medium">{selectedOrder.customer}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Телефон</div>
                  <div className="font-medium">{selectedOrder.phone}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-zinc-100 pb-4">
                <CardTitle className="text-lg">Управление</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {selectedOrder.status === 'new' && (
                  <button 
                    disabled={isEditing}
                    onClick={() => updateStatus(selectedOrder.id, 'confirming')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" /> Взять в работу
                  </button>
                )}
                {selectedOrder.status === 'confirming' && (
                  <button 
                    disabled={isEditing}
                    onClick={() => updateStatus(selectedOrder.id, 'awaiting_payment')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Подтвердить заказ
                  </button>
                )}
                {selectedOrder.status === 'paid' && (
                  <button 
                    disabled={isEditing}
                    onClick={() => updateStatus(selectedOrder.id, 'assembling')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" /> Передать в сборку
                  </button>
                )}
                {selectedOrder.status === 'assembling' && (
                  <button 
                    disabled={isEditing}
                    onClick={() => updateStatus(selectedOrder.id, 'ready')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Готов к выдаче
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button 
                    disabled={isEditing}
                    onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" /> Отправлен
                  </button>
                )}
                
                {selectedOrder.status === 'shipped' && (
                  <div className="text-center p-4 bg-zinc-50 rounded-xl text-sm text-zinc-500 font-medium border border-zinc-100">
                    Заказ завершен
                  </div>
                )}
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
        <h2 className="text-xl md:text-2xl font-bold">Все заказы</h2>
        <div className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm">
          Всего: {orders.length}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">ID Заказа</TableHead>
              <TableHead className="font-semibold">Дата</TableHead>
              <TableHead className="font-semibold">Покупатель</TableHead>
              <TableHead className="font-semibold">Статус</TableHead>
              <TableHead className="text-right font-semibold">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow 
                key={order.id} 
                className="cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <TableCell className="font-medium text-orange-600">{order.id}</TableCell>
                <TableCell className="text-zinc-500">{new Date(order.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                  <div className="font-medium">{order.customer}</div>
                  <div className="text-xs text-zinc-500">{order.phone}</div>
                </TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right font-bold">{order.total} ₽</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {orders.map(order => (
          <div 
            key={order.id} 
            onClick={() => setSelectedOrder(order)} 
            className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-orange-600 mb-0.5">Заказ {order.id}</div>
                <div className="text-xs text-zinc-500">{new Date(order.date).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <div className="font-medium text-sm">{order.customer}</div>
                <div className="text-xs text-zinc-500">{order.phone}</div>
              </div>
              <div className="font-bold text-lg">{order.total} ₽</div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-8 text-zinc-500 bg-white rounded-2xl border border-zinc-200">Нет активных заказов</div>
        )}
      </div>
    </div>
  );
}

// --- Main Layout ---
export function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Navigation Sidebar / Topbar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="md:sticky md:top-24">
            <h1 className="text-2xl font-bold mb-6 hidden md:block">Панель управления</h1>
            
            <nav className="flex overflow-x-auto md:flex-col gap-2 pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              <Link to="/admin" className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${currentPath === '/admin' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white md:bg-transparent text-zinc-600 hover:bg-zinc-100 border border-zinc-200 md:border-transparent'}`}>
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                <span>Аналитика</span>
              </Link>
              <Link to="/admin/orders" className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${currentPath === '/admin/orders' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white md:bg-transparent text-zinc-600 hover:bg-zinc-100 border border-zinc-200 md:border-transparent'}`}>
                <Package className="w-4 h-4 md:w-5 md:h-5" />
                <span>Заказы</span>
              </Link>
              <Link to="/admin/sync" className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${currentPath === '/admin/sync' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white md:bg-transparent text-zinc-600 hover:bg-zinc-100 border border-zinc-200 md:border-transparent'}`}>
                <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" />
                <span>Обмен с 1С</span>
              </Link>
              <Link to="/admin/settings" className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-4 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${currentPath === '/admin/settings' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-white md:bg-transparent text-zinc-600 hover:bg-zinc-100 border border-zinc-200 md:border-transparent'}`}>
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span>Настройки</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<AnalyticsView />} />
            <Route path="/orders" element={<OrdersView />} />
            <Route path="/sync" element={
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center">
                <RefreshCcw className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Синхронизация с 1С</h3>
                <p className="text-zinc-500 mb-6">Настройте параметры обмена данными с вашей учетной системой.</p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">Запустить обмен</button>
              </div>
            } />
            <Route path="/settings" element={
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 text-center">
                <Settings className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Настройки магазина</h3>
                <p className="text-zinc-500">Раздел находится в разработке.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}
