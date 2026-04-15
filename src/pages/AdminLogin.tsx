import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Lock, ShieldAlert } from "lucide-react";

export function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "317220Az") {
      localStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } else {
      setError("Неверный логин или пароль");
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
            <Button type="submit" className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]">
              Авторизоваться
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
