
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { LeadData, FormErrors, FormStatus } from '../types';
import { LeadService } from '../services/leadService';
import LeadReview from './LeadReview';

interface LeadFormProps {
  onSuccess: (data: LeadData) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSuccess }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<LeadData>({
    nome_completo: '',
    empresa: '',
    email: '',
    telefone: '',
    revendedor: '',
    documento: [],
    aceite_privacidade: false
  });

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [shakeField, setShakeField] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sendWithoutPhoto, setSendWithoutPhoto] = useState<boolean>(false);

  // Cleanup da URL de preview para evitar vazamento de memória
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
        if (!sendWithoutPhoto && (!value || value.length === 0)) error = 'Arquivo obrigatório';
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
  }, [sendWithoutPhoto]);

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
      (formData.documento.length > 0 || sendWithoutPhoto) &&
      formData.aceite_privacidade
    );
  }, [formData, sendWithoutPhoto]);

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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (formData.documento.length + files.length > 2) {
        alert("Você pode enviar no máximo 2 fotos.");
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        return;
      }

      for (const file of files) {
        if (file.size > 4 * 1024 * 1024) {
          alert("Um dos arquivos é muito grande (maior que 4MB). Por favor, selecione fotos menores.");
          if (cameraInputRef.current) cameraInputRef.current.value = '';
          if (galleryInputRef.current) galleryInputRef.current.value = '';
          return;
        }
      }

      const newUrls = files.map(f => URL.createObjectURL(f));
      const newFiles = [...formData.documento, ...files];

      setPreviewUrls(prev => [...prev, ...newUrls]);
      setFormData(p => ({ ...p, documento: newFiles }));
      setTouched(prev => ({ ...prev, documento: true }));
      validateField('documento', newFiles);
      if (status === FormStatus.ERROR) {
        setStatus(FormStatus.IDLE);
        setErrorMessage(null);
      }
    }
  };

  const clearFile = (index: number) => {
    const newFiles = formData.documento.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(previewUrls[index]);
    
    setPreviewUrls(newUrls);
    setFormData(p => ({ ...p, documento: newFiles }));
    
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    validateField('documento', newFiles);
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

        {/* CAMPO DE DOCUMENTO (IMAGEM) */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
            Documento (Foto)
            {touched.documento && errors.documento && <span className="text-red-500 lowercase font-bold">{errors.documento}</span>}
          </label>
          <div className={`
              relative w-full min-h-32 p-3 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden
              ${(formData.documento.length > 0 || sendWithoutPhoto) ? 'border-emerald-400 bg-emerald-50' : touched.documento && errors.documento ? 'border-red-400 bg-red-50' : 'border-slate-100 bg-slate-50'}
              ${shakeField === 'documento' ? 'animate-shake border-red-400' : ''}
            `}
          >
            {formData.documento.length > 0 ? (
              <div className="w-full flex items-center justify-center gap-3 flex-wrap">
                {previewUrls.map((url, idx) => (
                  <div key={url} className="relative w-24 h-24">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-xl shadow-lg" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(idx); }}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="absolute bottom-1 w-full text-center">
                       <span className="px-2 py-0.5 bg-[#001b3a]/80 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                         Foto {idx + 1}
                       </span>
                    </div>
                  </div>
                ))}
                {formData.documento.length < 2 && !sendWithoutPhoto && (
                  <div className="flex flex-col gap-1 w-24 h-24 border-2 border-dashed border-emerald-400 rounded-xl overflow-hidden shadow-sm">
                    <button type="button" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="w-full flex-1 flex items-center justify-center bg-white text-[9px] font-black text-[#001b3a] uppercase hover:bg-slate-50 transition-colors">Câmera</button>
                    <div className="w-full h-px bg-emerald-100"></div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }} className="w-full flex-1 flex items-center justify-center bg-[#001b3a] text-white text-[9px] font-black uppercase hover:bg-[#001b3a]/90 transition-colors">Galeria</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 ${sendWithoutPhoto ? 'bg-emerald-500' : 'bg-white border hover:scale-105 border-slate-200'} rounded-full flex items-center justify-center shadow-sm mb-3 transition-transform z-10 relative`}>
                  {sendWithoutPhoto ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-[#001b3a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  )}
                </div>
                
                {sendWithoutPhoto ? (
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">
                    Envio sem foto
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} 
                      className="px-4 py-2 bg-white border-2 border-[#001b3a] text-[#001b3a] rounded-xl text-[10px] items-center justify-center font-black uppercase tracking-wider shadow-sm flex hover:bg-slate-50 transition-colors cursor-pointer z-10 relative"
                    >
                      Câmera
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); galleryInputRef.current?.click(); }} 
                      className="px-4 py-2 bg-[#001b3a] border-2 border-[#001b3a] text-white rounded-xl text-[10px] items-center justify-center font-black uppercase tracking-wider shadow-sm flex hover:bg-[#001b3a]/90 transition-colors cursor-pointer z-10 relative"
                    >
                      Galeria
                    </button>
                  </div>
                )}
              </div>
            )}
            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden" 
            />
            <input 
              type="file" 
              ref={galleryInputRef} 
              onChange={handleFileChange}
              accept="image/*" 
              className="hidden" 
            />
          </div>
          
          <div className="flex items-center gap-2 mt-3 ml-1 mb-1">
            <input 
              type="checkbox" 
              id="sem_foto"
              checked={sendWithoutPhoto}
              onChange={(e) => {
                const checked = e.target.checked;
                setSendWithoutPhoto(checked);
                if (checked) {
                  setErrors(prev => ({ ...prev, documento: '' }));
                } else if (formData.documento.length === 0 && touched.documento) {
                  setErrors(prev => ({ ...prev, documento: 'Arquivo obrigatório' }));
                }
              }}
              className="w-4 h-4 rounded-md border-slate-200 text-[#001b3a] focus:ring-[#001b3a]" 
            />
            <label htmlFor="sem_foto" className="text-[10px] font-bold text-slate-500 cursor-pointer uppercase tracking-wider">
              Enviar sem foto
            </label>
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

        <div className={`flex items-start gap-3 p-4 rounded-2xl transition-all border ${formData.aceite_privacidade ? 'bg-emerald-50 border-emerald-400 shadow-inner' : touched.aceite_privacidade && errors.aceite_privacidade ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-slate-50 border-transparent'} ${shakeField === 'aceite_privacidade' ? 'animate-shake' : ''}`}>
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
