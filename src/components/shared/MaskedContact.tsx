import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { maskPhone, maskEmail, maskSensitiveText } from '../../utils/masking';

interface MaskedContactProps {
  value?: string | null;
  type: 'phone' | 'email' | 'text';
  canReveal?: boolean;
  revealLabel?: string;
  onReveal?: () => void;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const MaskedContact: React.FC<MaskedContactProps> = ({
  value,
  type,
  canReveal = true,
  revealLabel = 'Göster',
  onReveal,
  actionSlot,
  className = ''
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!value) return <span className="text-slate-400">-</span>;

  let maskedValue = value;
  if (type === 'phone') maskedValue = maskPhone(value);
  else if (type === 'email') maskedValue = maskEmail(value);
  else maskedValue = maskSensitiveText(value);

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRevealed(!isRevealed);
    if (!isRevealed && onReveal) {
      onReveal();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono tabular-nums">
        {isRevealed ? value : maskedValue}
      </span>
      {canReveal && (
        <button
          onClick={handleReveal}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-slate-100 flex items-center gap-1"
          title={isRevealed ? 'Gizle' : revealLabel}
          type="button"
        >
          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
      {actionSlot && <div className="ml-1">{actionSlot}</div>}
    </div>
  );
};
