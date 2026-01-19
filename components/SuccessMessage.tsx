
import React, { useEffect, useState } from 'react';

interface SuccessMessageProps {
  leadName: string;
  resellerName: string;
  onReset: () => void;
}

declare var confetti: any;

const SuccessMessage: React.FC<SuccessMessageProps> = ({ leadName, resellerName, onReset }) => {
  const [progress, setProgress] = useState(100);
  const RESET_TIME = 8000; // Tempo aumentado ligeiramente para leitura

  useEffect(() => {
    if (typeof confetti !== 'undefined') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }

    const resetTimer = setTimeout(onReset, RESET_TIME);
    const intervalTime = 50;
    const step = (intervalTime / RESET_TIME) * 100;
    const progressInterval = setInterval(() => setProgress((prev) => Math.max(0, prev - step)), intervalTime);

    return () => {
      clearTimeout(resetTimer);
      clearInterval(progressInterval);
    };
  }, [onReset]);

  return (
    <div className="text-center py-8 animate-in fade-in zoom-in duration-700">
      <div className="w-24 h-24 bg-[#001b3a] text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-900/30">
        <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      
      <h2 className="text-3xl font-[900] text-[#001b3a] mb-10 tracking-tighter uppercase">
        Envio Confirmado!
      </h2>
      
      <div className="space-y-4 px-6 mb-10">
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm text-left">
          <p className="text-slate-600 text-sm leading-relaxed font-medium mb-4">
            Prezado(a) <strong className="text-[#001b3a]">{leadName}</strong>,
          </p>
          <p className="text-slate-500 text-sm leading-relaxed">
            Seus documentos e dados foram validados e transmitidos com segurança para a central da <strong className="text-[#001b3a]">{resellerName}</strong>.
          </p>
          
          <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-200/50">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
               <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Status da Operação</p>
              <p className="text-xs font-black text-emerald-600">RECEBIDO COM SUCESSO</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="pt-4 px-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Retornando ao início</span>
            <span className="text-[8px] font-black text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#001b3a] transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
