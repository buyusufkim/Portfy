import React from 'react';
import { Home } from 'lucide-react';
import { Property } from '../../types';
import { PropertyCard, PipelineColumn } from '../PropertyComponents';
import { Skeleton } from '../UI';

interface PropertyGridProps {
  viewMode: 'list' | 'pipeline';
  propertiesLoading: boolean;
  filteredProperties: Property[];
  setSelectedProperty: (p: Property) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  viewMode,
  propertiesLoading,
  filteredProperties,
  setSelectedProperty
}) => {
  const statuses = ['Yeni', 'Hazırlanıyor', 'Yayında', 'İlgi Var', 'Pazarlık', 'Satıldı'];

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      {viewMode === 'list' ? (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propertiesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-[32px] border border-slate-100 p-4 space-y-4">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))
          ) : filteredProperties.length === 0 ? (
            <div className="text-center p-20 space-y-4 col-span-full">
              <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto text-slate-300">
                <Home size={40} />
              </div>
              <p className="text-slate-500 text-sm">Bu bölgede henüz portföy yok.</p>
            </div>
          ) : filteredProperties.map(p => (
            <PropertyCard key={p.id} property={p} onClick={() => setSelectedProperty(p)} />
          ))}
        </div>
      ) : (
        <div className="p-6 flex gap-6 overflow-x-auto h-full items-start">
          {propertiesLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`col-skeleton-${i}`} className="w-80 shrink-0 space-y-4">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <div className="space-y-3">
                  {[1, 2].map(j => (
                    <div key={`card-skeleton-${j}`} className="bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-slate-100">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-6 w-12 rounded-lg" />
                        <Skeleton className="h-6 w-12 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : statuses.map(status => (
            <PipelineColumn 
              key={status} 
              title={status} 
              status={status}
              properties={filteredProperties.filter(p => p.status === status)} 
              onPropertyClick={(p) => setSelectedProperty(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
