
import React, { useState } from 'react';
import LeadForm from './components/LeadForm';
import SuccessMessage from './components/SuccessMessage';
import Header from './components/Header';
import Footer from './components/Footer';
import { FormStatus, LeadData } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [tempInfo, setTempInfo] = useState<{ name: string; reseller: string }>({ name: '', reseller: '' });

  const handleSuccess = (data: LeadData) => {
    // Armazena apenas informações mínimas para a tela de sucesso (nome e revendedor)
    // O arquivo (documento) não é passado adiante, sendo elegível para garbage collection
    // assim que o componente LeadForm for desmontado abaixo.
    setTempInfo({
      name: data.nome_completo.split(' ')[0],
      reseller: data.revendedor
    });
    setStatus(FormStatus.SUCCESS);
  };

  const handleReset = () => {
    setStatus(FormStatus.IDLE);
    setTempInfo({ name: '', reseller: '' }); // Limpeza definitiva do estado global
  };

  return (
    // ALTERAÇÃO AQUI: Trocado 'h-screen' por 'min-h-screen' e removido 'overflow-hidden'
    // Isso permite que o conteúdo cresça e a barra de rolagem apareça em celulares pequenos
    <div className="min-h-screen flex flex-col bg-white selection:bg-emerald-100">
      <Header />
      
      <main className="flex-grow w-full max-w-md mx-auto px-6 flex flex-col justify-center py-8">
        {status !== FormStatus.SUCCESS ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-[800] text-[#001b3a] tracking-tight leading-tight uppercase">
                Portal de Encaminhamento <span className="text-emerald-600">Oficial</span> de dados
              </h2>
              <p className="text-slate-400 mt-1 text-sm font-medium">
                Conectando você às Indústrias NB.
              </p>
            </div>
            
            <LeadForm onSuccess={handleSuccess} />
          </div>
        ) : (
          <SuccessMessage 
            onReset={handleReset} 
            leadName={tempInfo.name} 
            resellerName={tempInfo.reseller} 
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
