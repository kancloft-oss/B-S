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

// 2. Orders View (Enhanced)
export default function OrdersView() {
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