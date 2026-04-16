import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Search, ShoppingCart, Heart, Plus, Minus, Trash2, ArrowRight, CheckCircle2, Star, ChevronRight, AlertCircle, ArrowUpDown, Menu, Wrench, Zap, Hammer, Droplet, Leaf, Truck, Car, PenTool, PaintBucket, Home as HomeIcon, Package, Factory, Wind, Shield, Palette, BarChart2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useCart, Product } from "@/src/lib/cart-context";
import { auth } from "@/src/firebase";

const CATEGORIES_DATA = [
  { name: "Холсты", icon: Package, image: "https://picsum.photos/seed/canvas/100/100" },
  { name: "Краски", icon: Palette, image: "https://picsum.photos/seed/paints/100/100" },
  { name: "Кисти", icon: PenTool, image: "https://picsum.photos/seed/brushes/100/100" },
  { name: "Мольберты", icon: Factory, image: "https://picsum.photos/seed/easels/100/100" },
  { name: "Бумага", icon: Leaf, image: "https://picsum.photos/seed/paper/100/100" },
  { name: "Графика", icon: PenTool, image: "https://picsum.photos/seed/graphics/100/100" },
  { name: "Аксессуары", icon: Wrench, image: "https://picsum.photos/seed/accessories/100/100" },
  { name: "Инструменты", icon: Hammer, image: "https://picsum.photos/seed/tools/100/100" },
  { name: "Вспомогательные", icon: Droplet, image: "https://picsum.photos/seed/auxiliary/100/100" },
  { name: "Мулине и нитки", icon: Palette, image: "https://picsum.photos/seed/threads/100/100" },
  { name: "Товары для хобби", icon: Heart, image: "https://picsum.photos/seed/hobby/100/100" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Сначала популярные" },
  { value: "price_asc", label: "Сначала дешевые" },
  { value: "price_desc", label: "Сначала дорогие" },
  { value: "newest", label: "Сначала новинки" },
];

export function Storefront({ view = "home" }: { view?: "home" | "catalog_list" | "category_products" | "cart" | "checkout" }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{name: string, icon: any, image: string}[]>([]);
  const { name: categoryParam } = useParams<{ name: string }>();
  const [sortBy, setSortBy] = useState("popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { cart, favorites, addToCart, updateQuantity, removeFromCart, clearCart, toggleFavorite, cartTotal, cartCount } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch Products with limit and category filter
        let productsUrl = '/api/products?limit=48';
        if (categoryParam) {
          productsUrl = `/api/products?category=${encodeURIComponent(categoryParam)}&limit=100`;
        }

        const productsRes = await fetch(productsUrl);
        if (!productsRes.ok) throw new Error('Fetch products failed');
        const productsData = await productsRes.json();
        setProducts(productsData);

        // 2. Fetch Categories (usually fewer than products)
        const categoriesRes = await fetch('/api/categories');
        const categoriesRaw = categoriesRes.ok ? await categoriesRes.json() : [];
        const categoriesData = categoriesRaw.map((data: any) => {
          // Try to match with hardcoded icons if possible
          const matched = CATEGORIES_DATA.find(c => c.name === data.name);
          return {
            name: data.name,
            icon: matched?.icon || Package,
            image: matched?.image || `https://picsum.photos/seed/${data.name}/100/100`
          };
        });
        
        setCategories(categoriesData.length > 0 ? categoriesData : CATEGORIES_DATA);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.message?.includes("Quota exceeded") || error.code === "resource-exhausted") {
          setError("Превышен лимит запросов к базе данных (Quota Exceeded). Лимиты обновятся через некоторое время. Пожалуйста, попробуйте позже.");
        } else {
          setError("Ошибка при загрузке данных. Пожалуйста, проверьте соединение.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (categoryParam) {
      filtered = products.filter(p => p.category === categoryParam);
    }
    
    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") return b.id.localeCompare(a.id); // Mock sorting by ID for newest
      return 0; // popular (default)
    });
  }, [products, categoryParam, sortBy]);

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      alert("Пожалуйста, войдите в систему для оформления заказа.");
      return;
    }

    const orderData = {
      userId,
      customer: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      total: cartTotal,
      status: "new",
      date: new Date().toISOString(),
      items: cart.map(item => ({ productId: item.id, qty: item.quantity, price: item.price }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Failed to create order');
      clearCart();
      setOrderSuccess(true);
    } catch (error) {
      console.error("Failed to submit order", error);
      alert("Ошибка при оформлении заказа.");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-zinc-500">Загрузка товаров...</div>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Упс! Что-то пошло не так</h2>
          <p className="text-red-700 max-w-md mx-auto">{error}</p>
          <Button 
            variant="outline" 
            className="mt-6 border-red-200 text-red-700 hover:bg-red-100"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
        <div className="max-w-md mx-auto text-center py-16 bg-white rounded-md shadow-sm mt-8 border border-brand-border">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-3">Заказ оформлен!</h2>
        <p className="text-zinc-500 mb-8 px-6">Ваш заказ успешно создан. Мы свяжемся с вами в ближайшее время для подтверждения доставки.</p>
        <Button className="bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-12 px-8 text-base font-bold" onClick={() => { setOrderSuccess(false); navigate("/"); }}>
          Продолжить покупки
        </Button>
      </div>
    );
  }

  if (view === "home") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Top Category Grid */}
        <div className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto snap-x no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid-rows-none md:grid-cols-4 lg:grid-cols-8 md:grid-flow-row mb-8 md:mb-10">
          {categories.slice(0, 8).map((cat) => (
            <Link 
              key={cat.name}
              to={`/category/${cat.name}`}
              className="bg-brand-gray rounded-xl p-3 md:p-4 flex flex-col relative overflow-hidden group h-24 md:h-36 min-w-[140px] w-[140px] md:min-w-0 md:w-auto snap-start"
            >
              <span className="text-sm md:text-base font-medium text-zinc-900 leading-tight z-10 w-2/3">{cat.name}</span>
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="absolute -bottom-2 -right-2 w-14 h-14 md:w-20 md:h-20 object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
              />
            </Link>
          ))}
        </div>

        {/* Benefits Block */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-4 md:mb-6">Онлайн-гипермаркет для профессионалов и бизнеса</h2>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex overflow-x-auto snap-x no-scrollbar gap-3 md:gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:pb-0">
              <div className="bg-white border border-brand-border rounded-xl p-4 md:p-6 flex flex-col min-w-[220px] md:min-w-0 snap-start">
                <Shield className="w-5 h-5 md:w-8 md:h-8 text-zinc-900 mb-2 md:mb-4" />
                <h3 className="font-medium md:font-bold text-zinc-900 mb-1 md:mb-2 text-sm md:text-base">Оригинальные товары с гарантией</h3>
                <p className="text-xs md:text-sm text-zinc-500 hidden md:block">Гарантия качества от официальных производителей</p>
              </div>
              <div className="bg-white border border-brand-border rounded-xl p-4 md:p-6 flex flex-col min-w-[220px] md:min-w-0 snap-start">
                <Truck className="w-5 h-5 md:w-8 md:h-8 text-zinc-900 mb-2 md:mb-4" />
                <h3 className="font-medium md:font-bold text-zinc-900 mb-1 md:mb-2 text-sm md:text-base">99% заказов доставляем в срок</h3>
                <p className="text-xs md:text-sm text-zinc-500 hidden md:block">Собственная логистика и надежные склады</p>
              </div>
              <div className="bg-white border border-brand-border rounded-xl p-4 md:p-6 flex flex-col min-w-[220px] md:min-w-0 snap-start">
                <HomeIcon className="w-5 h-5 md:w-8 md:h-8 text-zinc-900 mb-2 md:mb-4" />
                <h3 className="font-medium md:font-bold text-zinc-900 mb-1 md:mb-2 text-sm md:text-base">1000+ пунктов выдачи</h3>
                <p className="text-xs md:text-sm text-zinc-500 hidden md:block">Удобная доставка по всей России и СНГ</p>
              </div>
            </div>
            <div className="lg:w-[320px] bg-zinc-600 rounded-xl p-5 md:p-6 text-white flex flex-col relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-5">Покупайте как юрлицо</h3>
                <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
                  <li className="flex items-center gap-2 text-xs md:text-sm text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    Оптовая система скидок
                  </li>
                  <li className="flex items-center gap-2 text-xs md:text-sm text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    Отсрочка платежа
                  </li>
                  <li className="flex items-center gap-2 text-xs md:text-sm text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    Возврат НДС
                  </li>
                  <li className="flex items-center gap-2 text-xs md:text-sm text-zinc-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    Персональный менеджер
                  </li>
                </ul>
              </div>
              <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
              <Shield className="absolute -bottom-2 -right-2 w-24 h-24 text-white/20" />
            </div>
          </div>
        </div>

        {/* Dark Banner Slider */}
        <div className="mb-8 md:mb-10">
          <div className="bg-zinc-900 rounded-xl overflow-hidden relative flex flex-col md:flex-row items-stretch min-h-[200px] md:min-h-[280px]">
            <div className="absolute inset-0 md:relative md:w-1/2 h-full md:h-auto">
              <img src="https://picsum.photos/seed/fire_sparks/800/600" alt="Promo" className="absolute inset-0 w-full h-full object-cover opacity-50 md:opacity-70 mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent md:bg-gradient-to-r md:from-zinc-900 md:to-transparent"></div>
            </div>
            <div className="p-5 md:p-12 w-full md:w-1/2 relative z-10 flex flex-col justify-center min-h-[200px]">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <div className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">АИ</div>
                <span className="text-xs text-zinc-300">Закалены временем</span>
              </div>
              <h2 className="text-xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight w-4/5 md:w-full">У нас день рождения —<br/>вам скидки!</h2>
              <p className="text-[10px] md:text-sm text-zinc-500 mt-auto md:mt-0 mb-4 md:mb-0">2 марта — 19 апреля 2026</p>
              <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-11 md:hidden">
                Смотреть все
              </Button>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3 md:hidden">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
          </div>
        </div>

        {/* Promo Banners Grid */}
        <div className="mb-10 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-4 md:mb-6">Подборка наших выгодных предложений</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { title: "Скидки до 50%", desc: "На холсты и подрамники", seed: "canvas_promo" },
              { title: "Ликвидация", desc: "Остатки красок прошлых серий", seed: "paint_promo" },
              { title: "Новинки", desc: "Профессиональные маркеры", seed: "markers_promo" },
              { title: "Подарки", desc: "При покупке от 5000 ₽", seed: "gift_promo" },
              { title: "Товары месяца", desc: "По суперценам", seed: "month_promo" },
              { title: "Лови момент", desc: "Успейте заказать", seed: "moment_promo" }
            ].map((promo, i) => (
              <div key={i} className="bg-brand-gray rounded-xl overflow-hidden group cursor-pointer flex flex-col">
                <div className="h-28 md:h-36 relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${promo.seed}/400/200`} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 md:p-5">
                  <h3 className="font-bold text-zinc-900 mb-1 text-sm md:text-base leading-tight">{promo.title}</h3>
                  <p className="text-[11px] md:text-sm text-zinc-500 leading-tight">{promo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bestsellers (Product Grid) */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900">Хиты продаж</h2>
            <Link to="/catalog" className="text-sm font-medium text-zinc-500 hover:text-brand-red flex items-center gap-1">Все <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex overflow-x-auto snap-x no-scrollbar gap-3 md:gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:pb-0">
            {products.slice(0, 8).map((product) => {
              const isFavorite = favorites.includes(product.id);
              const inCart = cart.find(item => item.id === product.id);
              const oldPrice = Math.floor(product.price * 1.3);
              
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="group bg-white border border-brand-border rounded-xl p-3 md:p-4 flex flex-col hover:shadow-lg transition-all relative min-w-[140px] w-[140px] md:min-w-0 md:w-auto snap-start">
                  <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 hidden md:flex flex-col gap-1 md:gap-2">
                    <button 
                      onClick={(e) => handleToggleFavorite(e, product.id)}
                      className={`p-1 md:p-1.5 rounded-full transition-colors ${isFavorite ? 'text-brand-red' : 'text-zinc-400 hover:text-brand-red'}`}
                    >
                      <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="p-1 md:p-1.5 rounded-full transition-colors text-zinc-400 hover:text-brand-red"
                    >
                      <BarChart2 className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                  
                  <div className="aspect-square mb-3 md:mb-4 overflow-hidden rounded-lg relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden md:flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                    </div>
                    <div className="absolute top-0 left-0 md:top-2 md:left-2 bg-emerald-500 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">
                      -23%
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-2 mb-1">
                    <div className="text-base md:text-xl font-bold text-zinc-900">{product.price} ₽</div>
                    <div className="text-[10px] md:text-xs text-zinc-400 line-through">{oldPrice} ₽</div>
                  </div>
                  
                  <h3 className="text-[11px] md:text-sm text-zinc-800 group-hover:text-brand-red transition-colors line-clamp-3 mb-2 flex-1 leading-tight">{product.name}</h3>
                  
                  <div className="hidden md:flex items-center gap-1 mb-3 text-brand-red">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold text-zinc-900">4.5</span>
                    <span className="text-xs text-zinc-400 ml-1">(88)</span>
                  </div>

                  <div className="hidden md:block text-xs text-zinc-500 mb-3">
                    &gt; 100 шт. есть на складе
                  </div>
                  
                  <div className="mt-auto hidden md:block">
                    {inCart ? (
                      <div className="flex items-center justify-between bg-brand-gray rounded-md p-1 border border-brand-border" onClick={(e) => e.preventDefault()}>
                        <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, inCart.quantity - 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-sm">{inCart.quantity} шт</span>
                        <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, inCart.quantity + 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red" disabled={inCart.quantity >= product.stock}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button 
                        onClick={(e) => { e.preventDefault(); addToCart(product); }}
                        className="w-full bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-10 font-bold transition-colors"
                      >
                        В корзину
                      </Button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Brands Carousel */}
        <div className="mb-10 md:mb-16 mt-10 md:mt-16">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-900">Более 15 000 проверенных брендов</h2>
            <Link to="/brands" className="text-sm font-medium text-zinc-500 hover:text-brand-red flex items-center gap-1">Все <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="flex overflow-x-auto snap-x no-scrollbar gap-4 md:gap-8 pb-4 -mx-4 px-4 md:mx-0 md:px-0 items-center">
            {[
              "GIGANT", "INFORCE", "AEG", "Makita", "BOSCH", "DeWALT"
            ].map((brand, i) => (
              <div key={i} className="min-w-[100px] md:min-w-[140px] h-12 md:h-16 flex items-center justify-center snap-start grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-pointer">
                <span className="font-black text-xl md:text-2xl tracking-tighter">{brand}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Block (Mobile) */}
        <div className="md:hidden bg-zinc-100 -mx-4 px-4 py-8 mb-8 mt-8">
          <h3 className="font-bold text-zinc-900 text-lg mb-1">Подпишитесь на рассылку и будьте в курсе!</h3>
          <p className="text-zinc-900 font-bold mb-4">Акции, скидки, распродажи ждут!</p>
          <input type="email" placeholder="Введите email" className="w-full bg-white border border-brand-border rounded-md px-4 py-3 mb-3 outline-none focus:border-brand-red" />
          <Button className="w-full bg-brand-red hover:bg-brand-red-hover text-white font-bold h-12 text-base">Подписаться</Button>
        </div>

        {/* App Promo Block (Mobile) */}
        <div className="md:hidden px-4 mb-8 text-center">
          <p className="font-bold text-zinc-900 mb-1">Оригинальные товары с гарантией!</p>
          <p className="text-sm text-zinc-900 mb-4">Сканируйте и скачивайте<br/>наше приложение</p>
          <p className="text-xs text-zinc-500 mb-4">Установите мобильное приложение, чтобы<br/>информация по заказам всегда была под<br/>рукой</p>
          <div className="flex justify-center">
            <button className="bg-zinc-900 text-white flex items-center gap-2 px-4 py-2 rounded-xl">
              <div className="text-left">
                <div className="text-[10px] leading-none text-zinc-300">Download on the</div>
                <div className="text-sm font-bold leading-none mt-0.5">App Store</div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Footer Links */}
        <div className="md:hidden flex flex-col items-center gap-4 text-sm text-zinc-800 mb-8">
          <Link to="/catalog">Каталог</Link>
          <Link to="/">Адреса магазинов</Link>
          <Link to="/">Способы получения</Link>
          <Link to="/">Способы оплаты</Link>
          <Link to="/">Что улучшить?</Link>
          <Link to="/">Контакты</Link>
          <Link to="/">О Компании</Link>
        </div>

        {/* Mobile Socials */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <p className="text-sm text-zinc-500 mb-3">Наши соцсети</p>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">VK</div>
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">YT</div>
            <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">TG</div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "catalog_list") {
    return (
      <div className="max-w-3xl mx-auto px-0 md:px-4 py-0 md:py-6 pb-24 bg-white min-h-screen">
        <div className="hidden md:flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">Каталог</h1>
        </div>
        
        <div className="flex flex-col">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link 
                key={cat.name}
                to={`/category/${cat.name}`}
                className="flex items-center justify-between p-4 border-b border-brand-border hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-6 h-6 text-brand-red" />
                  <span className="font-medium text-zinc-900">{cat.name}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "category_products") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link to="/" className="hover:text-brand-red transition-colors">Главная</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/catalog" className="hover:text-brand-red transition-colors">Каталог</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-900">{categoryParam}</span>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">{categoryParam} <span className="text-sm font-normal text-zinc-500 ml-2">{filteredProducts.length} товаров</span></h1>
          
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-brand-red transition-colors bg-brand-gray px-4 py-2 rounded-md"
            >
              <ArrowUpDown className="w-4 h-4" />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
            </button>
            
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-brand-border z-20 py-1">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-gray transition-colors ${sortBy === option.value ? 'text-brand-red font-medium' : 'text-zinc-700'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredProducts.map((product) => {
            const isFavorite = favorites.includes(product.id);
            const inCart = cart.find(item => item.id === product.id);
            const oldPrice = Math.floor(product.price * 1.3);
            
            return (
              <Link key={product.id} to={`/product/${product.id}`} className="group bg-white border border-brand-border rounded-xl p-3 md:p-4 flex flex-col hover:shadow-lg transition-all relative">
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                  <button 
                    onClick={(e) => handleToggleFavorite(e, product.id)}
                    className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-brand-red' : 'text-zinc-400 hover:text-brand-red'}`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="aspect-square mb-4 overflow-hidden rounded-lg relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                  </div>
                  <div className="absolute top-2 left-2 bg-emerald-500 text-white px-1.5 py-0.5 text-[10px] font-bold rounded">
                    -23%
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <div className="text-xl font-bold text-zinc-900">{product.price} ₽</div>
                  <div className="text-xs text-zinc-400 line-through">{oldPrice} ₽</div>
                </div>
                
                <h3 className="text-sm text-zinc-800 group-hover:text-brand-red transition-colors line-clamp-3 mb-2 flex-1 leading-tight">{product.name}</h3>
                
                <div className="flex items-center gap-1 mb-3 text-brand-red">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold text-zinc-900">4.5</span>
                  <span className="text-xs text-zinc-400 ml-1">(88)</span>
                </div>

                <div className="text-xs text-zinc-500 mb-3">
                  &gt; 100 шт. есть на складе
                </div>
                
                <div className="mt-auto">
                  {inCart ? (
                    <div className="flex items-center justify-between bg-brand-gray rounded-md p-1 border border-brand-border" onClick={(e) => e.preventDefault()}>
                      <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, inCart.quantity - 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium text-sm">{inCart.quantity} шт</span>
                      <button onClick={(e) => { e.preventDefault(); updateQuantity(product.id, inCart.quantity + 1); }} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-brand-red" disabled={inCart.quantity >= product.stock}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button 
                      onClick={(e) => { e.preventDefault(); addToCart(product); }}
                      className="w-full bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-10 font-bold transition-colors"
                    >
                      В корзину
                    </Button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-md border border-brand-border">
            <Search className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Товары не найдены</h3>
            <p className="text-zinc-500">Попробуйте выбрать другую категорию</p>
          </div>
        )}
      </div>
    );
  }

  if (view === "checkout") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/cart" className="text-zinc-500 hover:text-brand-red transition-colors"><ChevronRight className="w-6 h-6 rotate-180" /></Link>
          <h1 className="text-2xl md:text-3xl font-bold">Оформление заказа</h1>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 md:p-8 rounded-md border border-brand-border">
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold border-b border-brand-border pb-2">1. Данные получателя</h2>
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">ФИО <span className="text-brand-red">*</span></label>
                      <Input name="name" required placeholder="Иванов Иван Иванович" className="rounded-md border-brand-border focus-visible:ring-brand-red h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Телефон <span className="text-brand-red">*</span></label>
                      <Input name="phone" required placeholder="+7 (999) 000-00-00" className="rounded-md border-brand-border focus-visible:ring-brand-red h-12" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-xl font-bold border-b border-brand-border pb-2">2. Доставка</h2>
                  <div className="pt-2 space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-start gap-3 cursor-pointer p-4 border border-brand-red bg-brand-gray rounded-md w-full">
                        <input type="radio" name="delivery" defaultChecked className="mt-1 text-brand-red focus:ring-brand-red" />
                        <div>
                          <div className="font-bold text-zinc-900 mb-1">Курьером</div>
                          <div className="text-sm text-zinc-500">Доставка до двери</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer p-4 border border-brand-border hover:border-brand-red rounded-md w-full transition-colors">
                        <input type="radio" name="delivery" className="mt-1 text-brand-red focus:ring-brand-red" />
                        <div>
                          <div className="font-bold text-zinc-900 mb-1">Самовывоз</div>
                          <div className="text-sm text-zinc-500">Из магазина или ПВЗ</div>
                        </div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Адрес доставки <span className="text-brand-red">*</span></label>
                      <Input name="address" required placeholder="г. Москва, ул. Пушкина, д. 1, кв. 1" className="rounded-md border-brand-border focus-visible:ring-brand-red h-12" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold border-b border-brand-border pb-2">3. Оплата</h2>
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer p-4 border border-brand-red bg-brand-gray rounded-md w-full">
                      <input type="radio" name="payment" defaultChecked className="mt-1 text-brand-red focus:ring-brand-red" />
                      <div>
                        <div className="font-bold text-zinc-900 mb-1">Картой онлайн</div>
                        <div className="text-sm text-zinc-500">Visa, Mastercard, МИР</div>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div>
            <div className="sticky top-24 bg-brand-gray p-6 border border-brand-border rounded-md">
              <h3 className="font-bold text-lg mb-4 pb-4 border-b border-brand-border">Ваш заказ</h3>
              
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border border-brand-border bg-white" />
                    <div className="flex-1">
                      <div className="line-clamp-2 text-zinc-800 mb-1">{item.name}</div>
                      <div className="flex justify-between text-zinc-500">
                        <span>{item.quantity} шт.</span>
                        <span className="font-medium text-zinc-900">{item.price * item.quantity} ₽</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm border-t border-brand-border pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Товары ({cartCount})</span>
                  <span className="font-medium">{cartTotal} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Скидка</span>
                  <span className="text-brand-red font-medium">-{Math.floor(cartTotal * 0.3)} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600">Доставка</span>
                  <span className="font-medium">Бесплатно</span>
                </div>
                <div className="border-t border-brand-border pt-4 flex justify-between items-end mt-4">
                  <span className="font-bold text-lg">К оплате</span>
                  <span className="font-bold text-2xl">{cartTotal} ₽</span>
                </div>
              </div>

              <Button type="submit" form="checkout-form" className="w-full bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-12 text-base font-bold mt-6">
                Подтвердить заказ
              </Button>
              <p className="text-xs text-zinc-500 text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с <a href="#" className="text-brand-blue hover:underline">условиями обработки персональных данных</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <div className="max-w-5xl mx-auto pb-24 md:pb-8 px-4 mt-6">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Корзина</h1>
          {cartCount > 0 && <span className="text-zinc-500 text-sm font-medium">{cartCount} товаров</span>}
        </div>
        
        {cart.length === 0 ? (
          <div className="bg-white rounded-md border border-brand-border p-8 md:p-16 text-center">
            <ShoppingCart className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
            <h2 className="text-xl md:text-2xl font-bold mb-3">В корзине пока пусто</h2>
            <p className="text-zinc-500 mb-8">Загляните в каталог, чтобы выбрать товары</p>
            <Button className="bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-12 px-8 text-base font-bold" onClick={() => navigate("/")}>
              Перейти в каталог
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-md border border-brand-border overflow-hidden">
                <div className="p-4 border-b border-brand-border bg-brand-gray flex justify-between items-center">
                  <span className="font-bold text-sm text-zinc-800">Товары от АртИнструмент</span>
                </div>
                <div className="p-0">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 hover:bg-brand-gray transition-colors group border-b border-brand-border last:border-0">
                      <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-md border border-brand-border bg-white" />
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-medium text-sm text-brand-blue hover:text-brand-red cursor-pointer leading-tight mb-1 line-clamp-2">{item.name}</h3>
                            <div className="text-xs text-zinc-500">Код: {item.id.padStart(6, '0')}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-lg">{item.price * item.quantity} ₽</div>
                            {item.quantity > 1 ? (
                              <div className="text-xs text-zinc-500">{item.price} ₽ / шт</div>
                            ) : (
                              <div className="text-xs text-zinc-400 line-through">{Math.floor(item.price * 1.3)} ₽</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-white border border-brand-border rounded-md p-1 h-10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-brand-red" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-brand-red" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button variant="ghost" className="text-zinc-500 hover:text-brand-red hover:bg-transparent px-2 h-8 text-sm" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            <span>Удалить</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="sticky top-24 bg-brand-gray p-6 border border-brand-border rounded-md">
                <Button className="w-full bg-brand-red hover:bg-brand-red-hover text-white rounded-md h-12 text-base font-bold mb-6" onClick={() => navigate("/checkout")}>
                  Перейти к оформлению
                </Button>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Товары ({cartCount})</span>
                    <span className="font-medium">{cartTotal} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Скидка</span>
                    <span className="text-brand-red font-medium">-{Math.floor(cartTotal * 0.3)} ₽</span>
                  </div>
                  <div className="border-t border-brand-border pt-4 flex justify-between items-end mt-4">
                    <span className="font-bold text-lg">Итого</span>
                    <span className="font-bold text-2xl">{cartTotal} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
