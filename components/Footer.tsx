
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-3 px-6 mt-auto border-t border-slate-50">
      <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
        <span>© 2024 CTNB</span>
        <div className="flex gap-4">
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
