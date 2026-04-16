import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Lock, ShieldAlert, Chrome } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "317220Az") {
      localStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } else {
      setError("Неверный логин или пароль");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await signInWithGoogle();
      localStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Этот домен не разрешен в настройках Firebase. Добавьте его в Authorized Domains.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Всплывающее окно заблокировано браузером. Разрешите всплывающие окна.");
      } else {
        setError(`Ошибка входа: ${err.message || "Неизвестная ошибка"}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1e2d] px-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 rotate-3">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-zinc-900">BRUSHES ADMIN</CardTitle>
          <p className="text-zinc-500 text-sm font-medium">Авторизация в системе управления</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Логин доступа</label>
              <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Введите логин"
                className="h-12 bg-zinc-50 border-zinc-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Пароль</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="h-12 bg-zinc-50 border-zinc-200 focus:ring-orange-500 focus:border-orange-500 rounded-xl"
              />
            </div>
            {error && (
              <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]">
              Войти по паролю
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-white px-4 text-zinc-400">Или через Google</span>
              </div>
            </div>

            <Button 
              type="button" 
              onClick={handleGoogleLogin}
              variant="outline" 
              className="w-full h-12 border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <Chrome className="w-5 h-5 text-orange-500" />
              Войти как kancloft@gmail.com
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Brushes & Sisters © 2024</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
