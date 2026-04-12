import React, { useState, useEffect } from "react";
import { Package, CreditCard, Clock, CheckCircle2, Truck, AlertCircle, ChevronRight, LogOut, MapPin, Heart, Plus, Minus } from "lucide-react";
import { useCart, Product } from "@/src/lib/cart-context";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { io } from "socket.io-client";

const socket = io();

interface OrderItem {
  productId: string;
  qty: number;
  product?: {
    name: string;
    price: number;
    image: string;
  };
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: "Новый", icon: <Clock className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-100" },
  confirming: { label: "На подтверждении", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-orange-600 bg-orange-100" },
  awaiting_payment: { label: "Ожидает оплаты", icon: <CreditCard className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-100" },
  paid: { label: "Оплачен", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-600 bg-emerald-100" },
  assembling: { label: "Сборка", icon: <Package className="w-3.5 h-3.5" />, color: "text-purple-600 bg-purple-100" },
  ready: { label: "Готов к выдаче", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-600 bg-emerald-100" },
  shipped: { label: "В пути", icon: <Truck className="w-3.5 h-3.5" />, color: "text-indigo-600 bg-indigo-100" },
};

export default function UserDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingOrder, setPayingOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const { favorites, cart, addToCart, updateQuantity, toggleFavorite } = useCart();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchOrders();

    socket.on("orderStatusUpdated", (data: { orderId: string, status: string }) => {
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === data.orderId ? { ...order, status: data.status } : order
      ));
    });

    return () => {
      socket.off("orderStatusUpdated");
    };
  }, []);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetch("/api/products")
        .then(res => res.json())
        .then(data => {
          setFavoriteProducts(data.filter((p: Product) => favorites.includes(p.id)));
        });
    }
  }, [activeTab, favorites]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/my-orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId: string) => {
    setPayingOrder(orderId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      if (res.ok) fetchOrders();
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setPayingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 overflow-x-hidden md:overflow-visible">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Личный кабинет</h1>
        <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Выйти</span>
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 md:gap-8">
        {/* Sidebar / Mobile Top Section */}
        <div className="md:col-span-1 space-y-4">
          {/* Profile Card */}
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm flex items-center md:flex-col md:text-center gap-4 md:gap-0 border border-zinc-100">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold text-xl md:text-2xl md:mb-4 shrink-0">
              ИИ
            </div>
            <div className="flex-1 md:w-full min-w-0">
              <h2 className="font-bold text-lg leading-tight md:mb-1 truncate">Иван Иванов</h2>
              <p className="text-zinc-500 text-sm mb-1 md:mb-4 truncate">+7 (999) 123-45-67</p>
              <button className="text-orange-600 text-xs md:text-sm font-medium bg-orange-50 hover:bg-orange-100 px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-colors md:w-full truncate">
                Редактировать
              </button>
            </div>
            <button className="md:hidden p-2.5 text-zinc-400 hover:text-zinc-900 bg-zinc-50 rounded-xl shrink-0">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Desktop Menu */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden hidden md:block border border-zinc-100">
            <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center justify-between p-4 font-medium transition-colors ${activeTab === "orders" ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500" : "text-zinc-600 hover:bg-zinc-50"}`}>
              <div className="flex items-center gap-3"><Package className="w-5 h-5" /> Мои заказы</div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab("favorites")} className={`w-full flex items-center justify-between p-4 font-medium transition-colors ${activeTab === "favorites" ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500" : "text-zinc-600 hover:bg-zinc-50"}`}>
              <div className="flex items-center gap-3"><Heart className="w-5 h-5" /> Избранное</div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab("addresses")} className={`w-full flex items-center justify-between p-4 font-medium transition-colors ${activeTab === "addresses" ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500" : "text-zinc-600 hover:bg-zinc-50"}`}>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5" /> Адреса доставки</div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu (Segmented Control) */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl md:hidden mb-4">
            <button onClick={() => setActiveTab("orders")} className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-medium transition-all min-w-0 ${activeTab === "orders" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              <Package className="w-5 h-5 mb-1 shrink-0" /> <span className="truncate w-full px-1 text-center">Заказы</span>
            </button>
            <button onClick={() => setActiveTab("favorites")} className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-medium transition-all min-w-0 ${activeTab === "favorites" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              <Heart className="w-5 h-5 mb-1 shrink-0" /> <span className="truncate w-full px-1 text-center">Избранное</span>
            </button>
            <button onClick={() => setActiveTab("addresses")} className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-medium transition-all min-w-0 ${activeTab === "addresses" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
              <MapPin className="w-5 h-5 mb-1 shrink-0" /> <span className="truncate w-full px-1 text-center">Адреса</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3">
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white p-8 md:p-12 rounded-2xl md:rounded-3xl shadow-sm border border-zinc-100 text-center">
                  <Package className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">У вас пока нет заказов</h3>
                  <p className="text-zinc-500 mb-6 text-sm md:text-base">Сделайте свой первый заказ прямо сейчас</p>
                </div>
              ) : (
                orders.map(order => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.new;
                  
                  return (
                    <div key={order.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-zinc-100">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                        <div>
                          <h3 className="font-bold text-base md:text-lg leading-none mb-1.5 break-all">Заказ {order.id}</h3>
                          <span className="text-xs md:text-sm text-zinc-500">
                            от {new Date(order.date).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide w-fit max-w-full ${status.color}`}>
                          <span className="shrink-0">{status.icon}</span>
                          <span className="truncate">{status.label}</span>
                        </div>
                      </div>

                      {/* Order Items (Compact Gray Box) */}
                      <div className="space-y-2 mb-4 bg-zinc-50/80 p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-100/50">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 md:gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg overflow-hidden shrink-0 border border-zinc-100 flex items-center justify-center">
                              {item.product?.image ? (
                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover mix-blend-multiply" />
                              ) : (
                                <Package className="w-5 h-5 text-zinc-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs md:text-sm font-medium text-zinc-900 truncate">
                                {item.product?.name || "Товар удален"}
                              </h4>
                              <p className="text-[10px] md:text-xs text-zinc-500 mt-0.5">
                                {item.qty} шт. × {item.product?.price || 0} ₽
                              </p>
                            </div>
                            <div className="font-bold text-xs md:text-sm shrink-0">
                              {(item.product?.price || 0) * item.qty} ₽
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-wider font-medium mb-0.5">Итого</span>
                          <span className="font-black text-lg md:text-xl leading-none">{order.total} ₽</span>
                        </div>
                        
                        {order.status === "awaiting_payment" && (
                          <button 
                            onClick={() => handlePayment(order.id)}
                            disabled={payingOrder === order.id}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 md:py-3 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm shadow-orange-500/20"
                          >
                            {payingOrder === order.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>Оплатить</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="space-y-4">
              {favoriteProducts.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl md:rounded-3xl shadow-sm border border-zinc-100 text-center">
                  <Heart className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">В избранном пока пусто</h3>
                  <p className="text-zinc-500 text-sm">Добавляйте товары в избранное, чтобы не потерять</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
                  {favoriteProducts.map(product => {
                    const inCart = cart.find(item => item.id === product.id);
                    const oldPrice = Math.floor(product.price * 1.3);

                    return (
                      <div key={product.id} className="bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col hover:shadow-xl hover:shadow-zinc-200/50 transition-all border border-zinc-100 group relative">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); }}
                          className="absolute top-3 right-3 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-4 h-4 md:w-5 md:h-5 fill-red-500 text-red-500" />
                        </button>
                        
                        <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] mb-2 md:mb-3 rounded-xl md:rounded-2xl overflow-hidden bg-zinc-100">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                          />
                        </Link>
                        
                        <div className="flex-1 flex flex-col">
                          <Link to={`/product/${product.id}`} className="block">
                            <div className="flex items-baseline gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                              <span className="text-base md:text-xl font-black text-zinc-900 tracking-tight">{product.price} ₽</span>
                              <span className="text-[10px] md:text-xs text-zinc-400 line-through font-medium">{oldPrice} ₽</span>
                            </div>
                            
                            <h3 className="text-[10px] md:text-xs text-zinc-900 font-medium line-clamp-2 mb-2 md:mb-3 flex-1 leading-tight md:leading-relaxed hover:text-orange-500 transition-colors">
                              {product.name}
                            </h3>
                          </Link>

                          {inCart ? (
                            <div className="flex items-center justify-between bg-zinc-100 rounded-lg md:rounded-xl p-1 mt-auto">
                              <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-600" onClick={() => updateQuantity(product.id, -1)}>
                                <Minus className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                              <span className="text-xs md:text-sm font-bold w-6 md:w-8 text-center">{inCart.quantity}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-600" onClick={() => updateQuantity(product.id, 1)}>
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg md:rounded-xl h-8 md:h-10 mt-auto font-semibold text-xs md:text-sm shadow-sm shadow-orange-200"
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                            >
                              {product.stock === 0 ? "Нет в наличии" : "В корзину"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="bg-white p-8 rounded-2xl md:rounded-3xl shadow-sm border border-zinc-100 text-center">
              <MapPin className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Нет сохраненных адресов</h3>
              <p className="text-zinc-500 text-sm">Адреса доставки появятся здесь после первого заказа</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
