import React from 'react';
import { CheckCircle2, Clock, Truck, AlertCircle, Package, Flame, Thermometer, Snowflake, CreditCard } from 'lucide-react';
import { OperationType } from './types';

// --- Helper Functions ---


export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getStatusBadge = (status: string) => {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide";
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

export const getSegmentIcon = (segment: string) => {
  switch (segment) {
    case 'hot': return <Flame className="w-4 h-4 text-red-500" />;
    case 'warm': return <Thermometer className="w-4 h-4 text-orange-500" />;
    case 'medium': return <Thermometer className="w-4 h-4 text-yellow-500" />;
    case 'cold': return <Snowflake className="w-4 h-4 text-blue-300" />;
    case 'dormant': return <Snowflake className="w-4 h-4 text-zinc-300" />;
    default: return null;
  }
};