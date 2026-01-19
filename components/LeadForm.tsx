
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { LeadData, FormErrors, FormStatus } from '../types';
import { LeadService } from '../services/leadService';
import LeadReview from './LeadReview';

interface LeadFormProps {
  onSuccess: (data: LeadData) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LeadData>({
    nome_completo: '',
    empresa: '',
    email: '',
    telefone: '',
    revendedor: '',
    documento: null,
    aceite_privacidade: false
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [shakeField, setShakeField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleanup da URL de preview para evitar vazamento de memória
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateField = useCallback((name: string, value: any) => {
    let error = '';
    switch (name) {
      case 'nome_completo':
        const nameValue = String(value).trim();
        const parts = nameValue.split(/\s+/);
        if (nameValue.length > 0) {
          if (nameValue.length < 5) error = 'Nome muito curto';
          else if (parts.length < 2 || parts[1].length < 2) error = 'Falta o sobrenome';
        } else error = 'Obrigatório';
        break;
      case 'email':
        if (!value.trim()) error = 'Obrigatório';
        else if (!LeadService.validateEmail(value)) error = 'E-mail inválido';
        break;
      case 'telefone':
        const cleanPhone = value.replace(/\D/g, '');
        if (!cleanPhone) error = 'Obrigatório';
        else if (cleanPhone.length < 10) error = 'Telefone incompleto';
        break;
      case 'documento':
        if (!value) error = 'Arquivo obrigatório';
        break;
      case 'revendedor':
        if (!value) error = 'Selecione um';
        break;
      case 'aceite_privacidade':
        if (!value) error = 'Aceite obrigatório';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  }, []);

  const applyPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let newValue: any = type === 'checkbox' ? checked : value;
    if (name === 'telefone') newValue = applyPhoneMask(value);
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (touched[name]) validateField(name, newValue);
    // Limpa erro global ao editar
    if (status === FormStatus.ERROR) {
      setStatus(FormStatus.IDLE);
      setErrorMessage(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const isFormValid = useMemo(() => {
    const nameParts = formData.nome_completo.trim().split(/\s+/);
    return (
      nameParts.length >= 2 && 
      formData.nome_completo.trim().length >= 5 &&
      LeadService.validateEmail(formData.email) &&
      formData.telefone.replace(/\D/g, '').length >= 10 &&
      formData.revendedor !== '' &&
      formData.documento !== null &&
      formData.aceite_privacidade
    );
  }, [formData]);

  const triggerShake = (fieldName: string) => {
    setShakeField(fieldName);
    setTimeout(() => setShakeField(null), 400);
  };

  const handleReviewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotRef.current?.value) return;

    const allFields = ['nome_completo', 'email', 'telefone', 'documento', 'revendedor', 'aceite_privacidade'];
    let firstError = '';
    
    allFields.forEach(f => {
      setTouched(prev => ({ ...prev, [f]: true }));
      const isValid = validateField(f, formData[f as keyof LeadData]);
      if (!isValid && !firstError) firstError = f;
    });

    if (isFormValid) {
      setStatus(FormStatus.REVIEW);
      setErrorMessage(null);
    } else if (firstError) {
      triggerShake(firstError);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // VALIDAÇÃO DE TAMANHO: Limite de 4MB para garantir envio seguro
      if (file.size > 4 * 1024 * 1024) {
        alert("O arquivo selecionado é muito grande (maior que 4MB). Por favor, selecione uma imagem ou PDF menor para garantir o envio.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData(p => ({ ...p, documento: file }));
      setTouched(prev => ({ ...prev, documento: true }));
      validateField('documento', file);
      if (status === FormStatus.ERROR) {
        setStatus(FormStatus.IDLE);
        setErrorMessage(null);
      }
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFormData(p => ({ ...p, documento: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    validateField('documento', null);
  };

  const inputClasses = (name: string) => `
    w-full px-4 py-3.5 rounded-2xl border-2 transition-all duration-300 outline-none text-sm font-semibold
    ${touched[name] && errors[name] 
      ? 'border-red-200 bg-red-50 text-red-900 focus:border-red-400' 
      : touched[name] && !errors[name] && formData[name as keyof LeadData]
        ? 'border-emerald-100 bg-emerald-50/20 focus:border-[#001b3a]'
        : 'border-slate-50 bg-slate-50 focus:border-[#001b3a] focus:bg-white text-slate-700'}
    ${shakeField === name ? 'animate-shake' : ''}
    disabled:opacity-50
  `;

  // Determina se o arquivo é um PDF para exibição
  const isPdf = formData.documento?.type === 'application/pdf';

  return (
    <>
      <form onSubmit={handleReviewRequest} className="space-y-4" noValidate>
        <input type="text" ref={honeypotRef} className="hidden" tabIndex={-1} autoComplete="off" />
        
        {status === FormStatus.ERROR && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            {errorMessage || "Houve um erro no envio. Verifique sua internet e tente novamente."}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
            Nome Completo
            {touched.nome_completo && errors.nome_completo && <span className="text-red-500 lowercase font-bold">{errors.nome_completo}</span>}
          </label>
          <input 
            name="nome_completo" 
            value={formData.nome_completo} 
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Nome e Sobrenome" 
            className={inputClasses('nome_completo')} 
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
              Telefone
              {touched.telefone && errors.telefone && <span className="text-red-500 lowercase font-bold">Obrigatório</span>}
            </label>
            <input 
              type="tel" 
              name="telefone" 
              value={formData.telefone} 
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="(00) 90000-0000" 
              className={inputClasses('telefone')} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
              E-mail
              {touched.email && errors.email && <span className="text-red-500 lowercase font-bold">Obrigatório</span>}
            </label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="seu@email.com" 
              className={inputClasses('email')} 
            />
          </div>
        </div>

        {/* CAMPO DE DOCUMENTO (IMAGEM OU PDF) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
            Documento (Foto ou PDF)
            {touched.documento && errors.documento && <span className="text-red-500 lowercase font-bold">{errors.documento}</span>}
          </label>
          <div 
            onClick={() => !formData.documento && fileInputRef.current?.click()}
            className={`
              relative w-full h-32 rounded-3xl border-2 border-dashed flex items-center justify-center transition-all overflow-hidden
              ${formData.documento ? 'border-emerald-400 bg-emerald-50' : touched.documento && errors.documento ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-[#001b3a]'}
              ${shakeField === 'documento' ? 'animate-shake border-red-400' : ''}
              ${!formData.documento ? 'cursor-pointer group' : ''}
            `}
          >
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-2">
                {isPdf ? (
                  <div className="flex flex-col items-center justify-center text-red-500 animate-in zoom-in">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 max-w-[150px] truncate">{formData.documento?.name}</span>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Preview Documento" className="h-full w-auto object-contain rounded-xl shadow-lg" />
                )}
                
                <button 
                  type="button"
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#001b3a]/80 backdrop-blur-md rounded-full">
                   <span className="text-[8px] font-black text-white uppercase tracking-widest">
                     {isPdf ? 'PDF Anexado' : 'Imagem Capturada'}
                   </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-[#001b3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Câmera ou PDF</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/*,application/pdf" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
            Revendedor
            {touched.revendedor && errors.revendedor && <span className="text-red-500 lowercase font-bold">{errors.revendedor}</span>}
          </label>
          <div className={`flex gap-2 p-1 rounded-2xl transition-colors ${touched.revendedor && errors.revendedor ? 'bg-red-50' : ''} ${shakeField === 'revendedor' ? 'animate-shake' : ''}`}>
            {['JF', 'Nogueira'].map((r) => (
              <button 
                key={r} type="button" 
                onClick={() => {
                  setFormData(p => ({...p, revendedor: r as any}));
                  setTouched(prev => ({...prev, revendedor: true}));
                  validateField('revendedor', r);
                }}
                className={`flex-1 py-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all
                  ${formData.revendedor === r 
                    ? 'bg-[#001b3a] border-[#001b3a] text-white shadow-lg' 
                    : touched.revendedor && errors.revendedor 
                      ? 'border-red-200 bg-white text-red-300' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'}
                `}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex items-start gap-3 p-4 rounded-2xl transition-all border ${touched.aceite_privacidade && errors.aceite_privacidade ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-slate-50 border-transparent'} ${shakeField === 'aceite_privacidade' ? 'animate-shake' : ''}`}>
          <input 
            type="checkbox" id="aceite" checked={formData.aceite_privacidade}
            onChange={(e) => {
              setFormData(p => ({...p, aceite_privacidade: e.target.checked}));
              setTouched(prev => ({...prev, aceite_privacidade: true}));
              validateField('aceite_privacidade', e.target.checked);
            }}
            className={`w-5 h-5 mt-0.5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500 ${touched.aceite_privacidade && errors.aceite_privacidade ? 'border-red-400' : ''}`}
          />
          <label htmlFor="aceite" className="text-[9px] leading-tight text-slate-500 font-medium cursor-pointer">
            Concordo com a LGPD e autorizo o envio seguro dos meus dados para as Indústrias NB. <span className="text-red-500 font-black">*Obrigatório</span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`
            w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.25em] transition-all
            ${!isFormValid 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-[#001b3a] text-white shadow-2xl shadow-blue-900/20 active:scale-95'}
          `}
        >
          Revisar e Enviar
        </button>
      </form>

      {(status === FormStatus.REVIEW || status === FormStatus.SUBMITTING) && (
        <LeadReview 
          data={formData} 
          onConfirm={() => {
            const handleFinalSubmit = async () => {
              if (status === FormStatus.SUBMITTING) return;
              setStatus(FormStatus.SUBMITTING);
              try {
                const response = await LeadService.submitLead(formData);
                if (response.success) {
                  onSuccess(formData);
                } else {
                  setStatus(FormStatus.ERROR);
                  setErrorMessage(response.message);
                }
              } catch (err: any) {
                setStatus(FormStatus.ERROR);
                setErrorMessage(err.message || "Falha de conexão.");
              }
            };
            handleFinalSubmit();
          }} 
          onEdit={() => setStatus(FormStatus.IDLE)} 
          isSubmitting={status === FormStatus.SUBMITTING}
        />
      )}
    </>
  );
};

export default LeadForm;
