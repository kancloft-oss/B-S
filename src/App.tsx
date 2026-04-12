/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Storefront } from "./pages/Storefront";
import { ProductDetails } from "./pages/ProductDetails";
import { AdminDashboard } from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import { AdminRoute } from "./components/AdminRoute";
import { ShoppingCart, LayoutDashboard, Palette, Search, User, Menu, Settings } from "lucide-react";
import { CartProvider, useCart } from "./lib/cart-context";
import { useAuth } from "./lib/auth-context";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { SearchBar } from "./components/SearchBar";

function AppContent() {
  const { cartCount } = useCart();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const location = useLocation();
  const isMobileCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';
  const isAdmin = user?.email === 'kancloft@gmail.com';
  
  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans pb-14 md:pb-0">
      <header className="hidden md:block sticky top-0 z-50 w-full bg-white border-b border-zinc-200 shadow-sm">
        {/* Top bar */}
        <div className="bg-zinc-100 text-zinc-500 text-[11px] py-1.5 hidden sm:block">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex gap-4">
              <span className="hover:text-zinc-900 cursor-pointer">Москва</span>
              <span className="hover:text-zinc-900 cursor-pointer">Бесплатная доставка от 2000 ₽</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:text-zinc-900 cursor-pointer">Продавайте на ArtStore</span>
              <span className="hover:text-zinc-900 cursor-pointer">Помощь</span>
              {user ? (
                <button onClick={signOutUser} className="hover:text-zinc-900 cursor-pointer">Выйти</button>
              ) : (
                <button onClick={signInWithGoogle} className="hover:text-zinc-900 cursor-pointer">Войти</button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main header */}
        <div className="container mx-auto px-4 h-20 flex items-center gap-4 md:gap-8">
          <Link to="/" className="flex items-center gap-2 font-black text-xl md:text-2xl text-orange-500 tracking-tight shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            <span className="hidden sm:inline-block">БRАШЭС ЭНД СИСТЭRС</span>
          </Link>
          
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2 hidden md:flex shrink-0 rounded-xl h-12 px-6 font-semibold text-base">
            <Menu className="w-6 h-6" />
            Каталог
          </Button>

          <SearchBar className="max-w-6xl flex-[2]" />

          <nav className="flex items-center gap-2 sm:gap-6 shrink-0 ml-auto">
            {isAdmin && (
              <Link to="/admin" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-orange-500 transition-colors">
                <Settings className="w-6 h-6" />
                <span className="text-[11px] font-medium hidden sm:block">Админ</span>
              </Link>
            )}
            <button 
              onClick={() => user ? window.location.href = '/account' : signInWithGoogle()}
              className="flex flex-col items-center gap-1 text-zinc-500 hover:text-orange-500 transition-colors hidden sm:flex"
            >
              <User className="w-6 h-6" />
              <span className="text-[11px] font-medium">Кабинет</span>
            </button>
            <Link to="/cart" className="flex flex-col items-center gap-1 text-zinc-500 hover:text-orange-500 transition-colors relative">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white box-content">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium hidden sm:block">Корзина</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Header (Search only) */}
      {!isMobileCartOrCheckout && (
        <header className="md:hidden sticky top-0 z-40 w-full bg-white border-b border-zinc-200 px-3 py-2 flex gap-2 items-center shadow-sm">
          <SearchBar />
        </header>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto md:px-4 md:py-6">
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Storefront view="cart" />} />
          <Route path="/checkout" element={<Storefront view="checkout" />} />
          <Route path="/account/*" element={user ? <UserDashboard /> : <Navigate to="/" replace />} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-14 z-50 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/' ? 'text-orange-500' : 'text-zinc-500'}`}>
          <Palette className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Главная</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/cart' ? 'text-orange-500' : 'text-zinc-500'}`}>
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-0.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white box-content">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Корзина</span>
        </Link>
        <button 
          onClick={() => user ? window.location.href = '/account' : signInWithGoogle()}
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.startsWith('/account') ? 'text-orange-500' : 'text-zinc-500'}`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Кабинет</span>
        </button>
        {isAdmin && (
          <Link to="/admin" className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.startsWith('/admin') ? 'text-orange-500' : 'text-zinc-500'}`}>
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Админ</span>
          </Link>
        )}
      </nav>

      <footer className="hidden md:block bg-white py-8 mt-auto border-t border-zinc-200">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} ArtStore. Все права защищены.
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
