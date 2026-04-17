/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Storefront } from "./pages/Storefront";
import { ProductDetails } from "./pages/ProductDetails";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import UserDashboard from "./pages/UserDashboard";
import { AdminRoute } from "./components/AdminRoute";
import { ShoppingCart, LayoutDashboard, Palette, Search, User, Menu, Settings, ShoppingBag, Heart, MapPin, Package, Home, ChevronDown, Briefcase, Phone, BarChart2, Percent } from "lucide-react";
import { CartProvider, useCart } from "./lib/cart-context";
import { useAuth } from "./lib/auth-context";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { SearchBar } from "./components/SearchBar";
import { seedDatabase } from "./lib/seed-data";
import { useEffect, useState, useRef } from "react";
import logo from "./logo.png";

function AppContent() {
  const { cartCount } = useCart();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const location = useLocation();
  const isMobileCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';
  const isAdmin = user?.email === 'kancloft@gmail.com' || localStorage.getItem("admin_auth") === "true";
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsHeaderHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Populate the database via the API if it's currently empty
    seedDatabase();
  }, []);
  
  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans">
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-14 md:pb-0">
      {/* Desktop Header - Top Bar */}
      <div className="hidden md:block bg-white text-zinc-600 text-[13px] py-1.5 border-b border-brand-border h-[44px]">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-8">
          <div className="flex gap-5 items-center">
            <span className="hover:text-brand-red cursor-pointer transition-colors flex items-center gap-1 font-medium text-zinc-900">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Махачкала
            </span>
            <span className="hover:text-brand-red cursor-pointer transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> 1 магазин
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-1 hover:text-brand-red cursor-pointer transition-colors">
              Получение и оплата <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <span className="hover:text-brand-red cursor-pointer transition-colors">Сервис и поддержка</span>
            <div className="flex items-center gap-1 hover:text-brand-red cursor-pointer transition-colors">
              О нас <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <span className="hover:text-brand-red cursor-pointer transition-colors">Инвесторам</span>
            {isAdmin && (
              <Link to="/admin" className="text-orange-600 font-bold hover:text-orange-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" /> Админка
              </Link>
            )}
            <span className="text-zinc-900 font-bold hover:text-brand-red cursor-pointer transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-zinc-400" /> +7(938)204-70-05
            </span>
          </div>
        </div>
      </div>
      
      {/* Desktop Header - Main (Sticky) */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-[90px] flex items-center gap-6">
          <Link to="/" className="flex items-center shrink-0">
            <div className="flex items-center justify-center overflow-hidden">
              <img 
                src={logo || undefined} 
                alt="Brushes and Sisters" 
                className="h-20 w-auto object-contain"
              />
            </div>
          </Link>
          
          <Button className="bg-zinc-600 hover:bg-zinc-700 text-white gap-2 hidden md:flex shrink-0 rounded-md h-11 px-6 font-bold text-base transition-colors shadow-none" onClick={() => window.location.href = '/catalog'}>
            <Menu className="w-5 h-5" />
            Каталог
          </Button>

          <SearchBar className="max-w-6xl flex-[2]" />

          <nav className="flex items-center gap-6 shrink-0 ml-auto">
            <Link to="/account?tab=favorites" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-brand-red transition-colors relative hidden sm:flex">
              <Heart className="w-6 h-6" />
              <span className="text-[11px] font-medium">Избранное</span>
            </Link>
            <Link to="/compare" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-brand-red transition-colors relative hidden sm:flex">
              <BarChart2 className="w-6 h-6" />
              <span className="text-[11px] font-medium">Сравнение</span>
            </Link>
            <Link to="/account?tab=orders" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-brand-red transition-colors hidden sm:flex">
              <Package className="w-6 h-6" />
              <span className="text-[11px] font-medium">Заказы</span>
            </Link>
            <Link to="/cart" className="flex flex-col items-center gap-1 text-zinc-600 hover:text-brand-red transition-colors relative">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-yellow text-zinc-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium hidden sm:block">Корзина</span>
            </Link>
            <button 
              onClick={() => user ? window.location.href = '/account' : signInWithGoogle()}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-6 py-2.5 rounded-md font-bold text-sm transition-colors ml-2"
            >
              Войти
            </button>
          </nav>
        </div>
      </header>

      {/* Desktop Header - Sub-header (Categories) */}
      <div className="hidden md:block border-b border-brand-border bg-white">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12 text-[13px] font-medium">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <Link to="/promos" className="text-brand-red flex items-center gap-1 shrink-0"><Percent className="w-4 h-4" /> Акции</Link>
            <Link to="/category/Инструмент" className="hover:text-brand-red transition-colors shrink-0">Инструмент</Link>
            <Link to="/category/Крепеж" className="hover:text-brand-red transition-colors shrink-0">Крепеж</Link>
            <Link to="/category/Всё для сада" className="hover:text-brand-red transition-colors shrink-0">Всё для сада</Link>
            <Link to="/category/Электрика" className="hover:text-brand-red transition-colors shrink-0">Электрика</Link>
            <Link to="/category/Силовая техника" className="hover:text-brand-red transition-colors shrink-0">Силовая техника</Link>
            <Link to="/category/Станки" className="hover:text-brand-red transition-colors shrink-0">Станки</Link>
            <Link to="/category/Спецодежда и СИЗ" className="hover:text-brand-red transition-colors shrink-0">Спецодежда и СИЗ</Link>
            <Link to="/category/Сантехника" className="hover:text-brand-red transition-colors shrink-0">Сантехника</Link>
            <Link to="/category/Авто" className="hover:text-brand-red transition-colors shrink-0">Авто</Link>
          </div>
          <Button variant="outline" size="sm" className="h-8 px-3 bg-brand-gray border-none text-zinc-900 font-bold text-[12px] rounded-md flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Для юрлиц
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div 
        className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-brand-border shadow-sm transition-transform duration-300 ${
          isHeaderHidden ? '-translate-y-[52px]' : 'translate-y-0'
        }`}
      >
        {/* Top Row: h-[52px] */}
        <div className="w-full px-4 pt-3 pb-2 flex items-center justify-between gap-2 h-[52px]">
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/" className="flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src={logo || undefined} 
                alt="Logo" 
                className="h-10 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 cursor-pointer">
              Махачкала <ChevronDown className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-8 px-2.5 bg-brand-gray border-none text-zinc-900 font-medium text-[11px] rounded-md">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Для юрлиц
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-brand-gray border-none text-zinc-900 rounded-md shrink-0">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar: h-[56px] */}
        <div className="w-full px-4 pb-3 pt-1 h-[56px]">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Всё для творчества и хобби" 
              className="w-full bg-brand-gray border-none rounded-md pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-red outline-none"
            />
            <Search className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto pt-[108px] md:pt-0 md:px-4 md:py-6">
        <Routes>
          <Route path="/" element={<Storefront view="home" />} />
          <Route path="/catalog" element={<Storefront view="catalog_list" />} />
          <Route path="/category/:name" element={<Storefront view="category_products" />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Storefront view="cart" />} />
          <Route path="/checkout" element={<Storefront view="checkout" />} />
          <Route path="/account/*" element={user ? <UserDashboard /> : <Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border flex justify-between items-end h-[60px] z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] px-2">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/' ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className="flex flex-col items-center justify-center h-full pt-1">
            <Home className="w-6 h-6 mb-1" strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Главная</span>
          </div>
        </Link>
        <Link to="/catalog" className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/catalog' ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className="flex flex-col items-center justify-center h-full pt-1">
            <Search className="w-6 h-6 mb-1" strokeWidth={location.pathname === '/catalog' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Каталог</span>
          </div>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/cart' ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className="flex flex-col items-center justify-center h-full pt-1 relative">
            <ShoppingCart className="w-6 h-6 mb-1" strokeWidth={location.pathname === '/cart' ? 2.5 : 2} />
            {cartCount > 0 && (
              <span className={`absolute top-0 right-0 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white box-content bg-brand-red text-white`}>
                {cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Корзина</span>
          </div>
        </Link>
        <Link to="/account?tab=favorites" className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/account' && location.search.includes('favorites') ? 'text-zinc-900' : 'text-zinc-400'}`}>
          <div className="flex flex-col items-center justify-center h-full pt-1">
            <Heart className="w-6 h-6 mb-1" strokeWidth={location.pathname === '/account' && location.search.includes('favorites') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Избранное</span>
          </div>
        </Link>
        <button 
          onClick={() => user ? window.location.href = '/account' : signInWithGoogle()}
          className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname.startsWith('/account') && !location.search.includes('favorites') ? 'text-zinc-900' : 'text-zinc-400'}`}
        >
          <div className="flex flex-col items-center justify-center h-full pt-1">
            <User className="w-6 h-6 mb-1" strokeWidth={location.pathname.startsWith('/account') && !location.search.includes('favorites') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Профиль</span>
          </div>
        </button>
      </nav>

      <footer className="hidden md:block bg-zinc-900 text-white py-12 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-400">
          <div className="font-black text-2xl tracking-tighter text-white mb-4">АртИнструмент</div>
          &copy; {new Date().getFullYear()} АртИнструмент. Все права защищены.
        </div>
      </footer>
    </div>
  );
}

import { AuthProvider } from "./lib/auth-context";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
