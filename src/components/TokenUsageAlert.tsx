import React from 'react';
import { useTokenUsage } from '../hooks/useTokenUsage';

export const TokenUsageAlert = () => {
  const { percentage, loading } = useTokenUsage();

  if (loading || percentage < 80) return null; // %80'in altındaysa hiçbir şey gösterme

  const isLimitReached = percentage >= 100;

  return (
    <div className={`p-4 mb-6 rounded-lg border-l-4 shadow-sm ${
      isLimitReached 
        ? 'bg-red-50 border-red-500 text-red-800' 
        : 'bg-yellow-50 border-yellow-500 text-yellow-800'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">
            {isLimitReached ? 'AI Limitiniz Doldu' : 'AI Limit Uyarısı'}
          </h3>
          <p className="text-sm mt-1">
            {isLimitReached 
              ? 'Kullanım limitiniz doldu. Portfy asistanını kullanmaya devam etmek için planınızı yükseltin.' 
              : 'Aylık kullanım limitinizin sonuna yaklaşıyorsunuz.'}
          </p>
        </div>
        
        {/* Call to Action Butonu */}
        <button className={`px-4 py-2 text-sm font-bold rounded-md text-white transition-colors ${
          isLimitReached ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
        }`}>
          Planı Yükselt
        </button>
      </div>

      {/* İlerleme Çubuğu (Progress Bar) */}
      <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
        <div 
          className={`h-2 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-yellow-500'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};