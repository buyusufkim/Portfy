import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => (
  <button 
    id="quick-add-fab"
    onClick={onClick}
    className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-slate-900 rounded-full shadow-2xl shadow-slate-900/40 items-center justify-center text-white active:scale-90 transition-all hover:bg-orange-600 z-50"
  >
    <Plus size={32} />
  </button>
);
