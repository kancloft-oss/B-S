import React, { useState } from 'react';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep('code');
      } else {
        setError(data.error || 'Ошибка отправки кода');
      }
    } catch (err) {
      setError('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        onClose();
        // Reset state for next time
        setTimeout(() => {
            setStep('email');
            setEmail('');
            setCode('');
        }, 300);
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-2">Вход на сайт</h2>
          <p className="text-zinc-500 mb-6 text-xs">
            {step === 'email' 
              ? 'Введите ваш email, и мы отправим вам код для входа' 
              : `Код отправлен на ${email}`}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-xs border border-red-100">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-brand-red hover:bg-[#B30000] text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Получить код'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Код из письма</label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all text-center tracking-widest font-mono text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-brand-red hover:bg-[#B30000] text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Войти'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-zinc-500 hover:text-zinc-900 text-xs mt-2 font-medium"
              >
                Изменить email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
