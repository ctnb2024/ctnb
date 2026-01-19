
import React, { useState, useEffect } from 'react';
import { LeadData } from '../types';

interface LeadReviewProps {
  data: LeadData;
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

const LeadReview: React.FC<LeadReviewProps> = ({ data, onConfirm, onEdit, isSubmitting }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data.documento) {
      const url = URL.createObjectURL(data.documento);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [data.documento]);

  const isPdf = data.documento?.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-[#001b3a]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Email Header Mockup */}
        <div className="bg-slate-50 p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prévia do Encaminhamento</span>
            <button onClick={onEdit} disabled={isSubmitting} className="text-emerald-600 font-black text-[10px] uppercase hover:underline">Editar Dados</button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-slate-400">PARA:</span>
              <span className="text-[10px] font-black text-[#001b3a]">INDUSTRIA NB @ CENTRAL</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-slate-400">ASSUNTO:</span>
              <span className="text-[10px] font-black text-[#001b3a]">CADASTRO DE LEAD: {data.nome_completo.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-1">Cliente</label>
                <p className="text-sm font-bold text-slate-800 truncate">{data.nome_completo}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-1">Revendedor</label>
                <p className="text-sm font-bold text-emerald-600">{data.revendedor}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-1">Telefone</label>
                <p className="text-sm font-bold text-slate-800">{data.telefone}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-300 uppercase tracking-wider block mb-1">E-mail</label>
                <p className="text-sm font-bold text-slate-800 truncate">{data.email}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-4 border border-slate-100">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-200 shrink-0">
                {thumbUrl && !isPdf ? (
                  <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase">Documento Seguro</p>
                <p className="text-xs font-bold text-slate-600 truncate">{data.documento?.name || 'documento'}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase">
                  {isPdf ? 'PDF OK' : 'IMG OK'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="w-full py-5 bg-[#001b3a] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-3xl shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Selando Dados...
                </>
              ) : 'Confirmar e Assinar'}
            </button>
            <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">Processamento Criptografado ponta-a-ponta</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadReview;
