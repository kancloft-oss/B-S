import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, CheckCircle2, Star, ChevronRight, AlertCircle, Heart, ArrowUpDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { useCart, Product } from "@/src/lib/cart-context";

const CATEGORIES = ["Все", "Холсты", "Краски", "Кисти", "Мольберты", "Бумага", "Графика", "Аксессуары", "Инструменты", "Вспомогательные"];
const SORT_OPTIONS = [
  { value: "popular", label: "Сначала популярные" },
  { value: "price_asc", label: "Сначала дешевые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "newest", label: "Сначала новинки" },
];

export function Storefront({ view = "catalog" }: { view?: "catalog" | "cart" | "checkout" }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [sortBy, setSortBy] = useState("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { cart, favorites, addToCart, updateQuantity, removeFromCart, clearCart, toggleFavorite, cartTotal, cartCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== "Все") {
      filtered = products.filter(p => p.category === activeCategory);
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") return parseInt(b.id) - parseInt(a.id); // Mock sorting by ID for newest
      return 0; // popular (default)
    });
  }, [products, activeCategory, sortBy]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const orderData = {
      customer: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      total: cartTotal,
      items: cart.map(item => ({ productId: item.id, qty: item.quantity }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        clearCart();
        setOrderSuccess(true);
      }
    } catch (error) {
      console.error("Failed to submit order", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-zinc-500">Загрузка товаров...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white rounded-3xl shadow-sm mt-8">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-3">Заказ оформлен!</h2>
        <p className="text-zinc-500 mb-8 px-6">Ваш заказ успешно создан. Мы свяжемся с вами в ближайшее время для подтверждения доставки.</p>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 px-8 text-base" onClick={() => { setOrderSuccess(false); navigate("/"); }}>
          Продолжить покупки
        </Button>
      </div>
    );
  }

  if (view === "checkout") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-4 md:px-0 md:py-0">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Оформление заказа</h1>
        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Данные получателя</h2>
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700">ФИО</label>
                  <Input name="name" required placeholder="Иванов Иван Иванович" className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700">Телефон</label>
                  <Input name="phone" required type="tel" placeholder="+7 (999) 000-00-00" className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-zinc-700">Адрес доставки</label>
                  <Input name="address" required placeholder="г. Москва, ул. Пушкина, д. 1" className="h-12 rounded-xl bg-zinc-50 border-zinc-200" />
                </div>
              </form>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4">Оплата</h2>
              <div className="p-4 border border-orange-200 rounded-xl bg-orange-50 flex items-start gap-3 text-orange-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Оплата после подтверждения</p>
                  <p className="opacity-90">Менеджер проверит наличие товаров и подтвердит заказ. После этого в личном кабинете появится кнопка для оплаты картой.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm sticky top-24">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Ваш заказ</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-zinc-600">
                  <span>Товары ({cartCount})</span>
                  <span>{cartTotal} ₽</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Доставка</span>
                  <span className="text-green-600 font-medium">Бесплатно</span>
                </div>
              </div>
              <div className="border-t border-zinc-100 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg">Итого</span>
                  <span className="font-black text-3xl">{cartTotal} ₽</span>
                </div>
              </div>
              <Button type="submit" form="checkout-form" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-14 text-lg font-bold">
                Заказать
              </Button>
              <p className="text-[11px] text-zinc-400 text-center mt-4">
                Нажимая на кнопку, вы соглашаетесь с условиями обработки персональных данных
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <div className="max-w-5xl mx-auto pb-24 md:pb-0">
        <div className="px-4 py-3 md:py-0 md:mb-8 flex items-center gap-3 bg-white md:bg-transparent sticky top-0 z-30 md:static border-b md:border-none">
          <h1 className="text-xl md:text-3xl font-bold">Корзина</h1>
          {cartCount > 0 && <span className="text-zinc-400 font-medium">{cartCount} шт.</span>}
        </div>
        
        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm p-8 md:p-12 text-center m-4 md:m-0">
            <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-zinc-200 mx-auto mb-4 md:mb-6" />
            <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">В корзине пока пусто</h2>
            <p className="text-sm md:text-base text-zinc-500 mb-6 md:mb-8">Загляните на главную, чтобы выбрать товары</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 md:h-12 px-6 md:px-8 text-sm md:text-base" onClick={() => navigate("/")}>
              Перейти на главную
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white md:rounded-3xl shadow-sm overflow-hidden border-y md:border-none border-zinc-200">
                <div className="p-3 md:p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                  <span className="font-medium text-xs md:text-sm">Доставка продавцом</span>
                </div>
                <div className="p-0 md:p-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 md:gap-4 p-3 md:p-4 hover:bg-zinc-50 md:rounded-2xl transition-colors group border-b border-zinc-100 last:border-0">
                      <img src={item.image} alt={item.name} className="w-20 h-24 md:w-24 md:h-32 object-cover rounded-xl bg-zinc-100" />
                      <div className="flex-1 flex flex-col py-0.5 md:py-1">
                        <div className="flex justify-between gap-2 md:gap-4">
                          <div>
                            <h3 className="font-medium text-xs md:text-sm text-zinc-900 leading-tight mb-1 line-clamp-2">{item.name}</h3>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm md:text-xl">{item.price * item.quantity} ₽</div>
                            {item.quantity > 1 ? (
                              <div className="text-[10px] md:text-xs text-zinc-400">{item.price} ₽ / шт</div>
                            ) : (
                              <div className="text-[10px] md:text-sm text-zinc-400 line-through">{Math.floor(item.price * 1.3)} ₽</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg md:rounded-xl p-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-500" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <span className="w-6 md:w-8 text-center font-medium text-xs md:text-base">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-md md:rounded-lg hover:bg-white text-zinc-500" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                          <Button variant="ghost" className="text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl px-2 md:px-3 h-8 text-xs md:text-sm" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline">Удалить</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="fixed md:sticky bottom-14 md:bottom-24 left-0 right-0 bg-white p-4 md:p-6 border-t md:border-none shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-sm md:rounded-3xl z-40">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-12 md:h-14 text-base md:text-lg font-bold mb-0 md:mb-6 order-last md:order-first mt-3 md:mt-0" onClick={() => navigate("/checkout")}>
                  К оформлению
                </Button>
                <div className="space-y-2 md:space-y-4 text-xs md:text-sm hidden md:block">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Товары, {cartCount} шт.</span>
                    <span className="font-medium">{cartTotal} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Скидка</span>
                    <span className="text-red-500 font-medium">-{Math.floor(cartTotal * 0.3)} ₽</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-4 flex justify-between items-end">
                    <span className="font-bold text-lg">Итого</span>
                    <span className="font-black text-3xl">{cartTotal} ₽</span>
                  </div>
                </div>
                {/* Mobile summary */}
                <div className="md:hidden flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500">{cartCount} товаров</span>
                    <span className="font-black text-lg leading-none">{cartTotal} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-0">
      {/* Categories Scrollable Bar */}
      <div className="flex overflow-x-auto pb-3 md:pb-4 mb-4 md:mb-6 gap-2 scrollbar-hide px-3 md:px-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-1.5 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium transition-colors ${
              activeCategory === cat 
                ? "bg-zinc-900 text-white" 
                : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {activeCategory === "Все" && (
        <div className="mx-3 md:mx-0 mb-6 md:mb-8 relative rounded-2xl md:rounded-3xl overflow-hidden bg-orange-500 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-500/90 to-transparent z-10"></div>
          <img 
            src="https://picsum.photos/seed/artstudio/1200/400" 
            alt="Art Studio" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="relative z-20 p-5 md:p-12 max-w-2xl">
            <h1 className="text-2xl md:text-5xl font-black tracking-tight mb-2 md:mb-4 leading-tight">
              Скидки до 30%<br/>на краски
            </h1>
            <p className="text-xs md:text-lg text-orange-50 mb-4 md:mb-8 max-w-md line-clamp-2 md:line-clamp-none">
              Успейте купить акрил, масло и акварель по выгодным ценам до конца недели.
            </p>
            <Button className="bg-white text-orange-600 hover:bg-zinc-100 rounded-xl h-9 md:h-12 px-5 md:px-8 font-bold text-xs md:text-base">
              Смотреть
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6 px-3 md:px-0">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          {activeCategory === "Все" ? "Популярные товары" : activeCategory}
          <span className="text-zinc-400 text-sm md:text-lg font-medium ml-2 md:ml-3">{filteredProducts.length}</span>
        </h2>
        
        <div className="relative">
          <button 
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-white px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </button>
          {isSortOpen && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-zinc-100 p-1 z-20 w-48">
              {SORT_OPTIONS.map(option => (
                <button 
                  key={option.value}
                  onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg ${sortBy === option.value ? 'bg-orange-50 text-orange-600 font-medium' : 'hover:bg-zinc-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 px-2 md:px-0">
        {filteredProducts.map(product => {
          const inCart = cart.find(item => item.id === product.id);
          const isFavorite = favorites.includes(product.id);
          const oldPrice = Math.floor(product.price * 1.3);

          return (
            <div key={product.id} className="bg-white rounded-2xl md:rounded-3xl p-2 md:p-3 flex flex-col hover:shadow-xl hover:shadow-zinc-200/50 transition-all border border-zinc-100 group relative">
              <button 
                onClick={(e) => handleToggleFavorite(e, product.id)}
                className="absolute top-3 right-3 z-10 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </button>
              
              <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] mb-2 md:mb-3 rounded-xl md:rounded-2xl overflow-hidden bg-zinc-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-red-500 text-white px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg text-[9px] md:text-[11px] font-bold shadow-sm">
                  -23%
                </div>
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
    </div>
  );
}
