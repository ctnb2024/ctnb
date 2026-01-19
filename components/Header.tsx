
import React from 'react';

const Header: React.FC = () => {
  // CONFIGURAÇÃO DA LOGO:
  // Usamos o endpoint 'thumbnail' com parâmetro de tamanho (sz=w1000) para garantir alta resolução
  // e contornar bloqueios comuns do Google Drive em sites externos.
  const LOGO_URL = "https://drive.google.com/thumbnail?id=1UXcFZiFBJyiP2fjXQIu9vQ_Y8iacHwud&sz=w1000"; 

  return (
    <header className="w-full py-3 px-6 bg-white sticky top-0 z-50 flex justify-center border-b border-slate-50 shadow-sm/50 backdrop-blur-md bg-white/90">
      <div className="flex items-center gap-3">
        
        {/* ÁREA DA LOGO */}
        {/* Adicionamos referrerPolicy="no-referrer" para ajudar na permissão de exibição da imagem externa */}
        <div className="flex items-center justify-center">
            <img 
              src={LOGO_URL} 
              alt="Portal de Dados" 
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain rounded-md hover:opacity-90 transition-opacity"
            />
        </div>

        {/* Separador Vertical Sutil */}
        <div className="h-8 w-px bg-slate-200 mx-1"></div>

        {/* Texto do Portal */}
        <div className="flex items-center">
          <span className="font-[800] text-[#001b3a] text-sm uppercase tracking-widest leading-none">Portal de Dados</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
