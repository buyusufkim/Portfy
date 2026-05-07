import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { MapPin as MapPinType } from '../../types';

export type BolgemPinActionType = 'call' | 'visit' | 'task' | 'note';

export interface BolgemPinActionModal {
  type: BolgemPinActionType;
  pin: MapPinType;
}

export function useBolgemActions(
  profileId: string | undefined, 
  setToast: ((toast: { message: string, type: 'success' | 'error' | 'info' } | null) => void) | undefined,
  setPinActionModal: (val: BolgemPinActionModal | null) => void,
  setActionNote: (val: string) => void,
  setActionDate: (val: string) => void,
  setSelectedPin: (val: MapPinType | null) => void
) {
  const queryClient = useQueryClient();

  const updatePinMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<MapPinType> }) => api.updateMapPin(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profileId] });
      setPinActionModal(null);
      setActionNote('');
      setActionDate('');
      if (setToast) setToast({ message: 'Aksiyon başarıyla kaydedildi!', type: 'success' });
      setSelectedPin(null);
    },
    onError: (error) => {
      if (setToast) setToast({ message: `Hata oluştu: ${(error as Error).message}`, type: 'error' });
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ pin, title, dueDate }: { pin: MapPinType, title: string, dueDate: string }) => api.addRegionTask(pin, title, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAP_PINS, profileId] });
      setPinActionModal(null);
      setActionNote('');
      setActionDate('');
      if (setToast) setToast({ message: 'Takip görevi oluşturuldu!', type: 'success' });
      setSelectedPin(null);
    },
    onError: (error) => {
      if (setToast) setToast({ message: `Hata oluştu: ${(error as Error).message}`, type: 'error' });
    }
  });

  const handlePinActionModalSubmit = (
    pinActionModal: { type: 'call' | 'visit' | 'task' | 'note', pin: MapPinType } | null,
    actionDate: string,
    actionNote: string,
    actionContactStatus: string
  ) => {
    if (!pinActionModal) return;
    const { type, pin } = pinActionModal;
    
    if (type === 'task') {
      if (!actionDate) {
        if (setToast) setToast({ message: 'Lütfen görev tarihini seçiniz.', type: 'error' });
        return;
      }
      addTaskMutation.mutate({ pin, title: `${pin.title} - ${actionNote || 'Bölge Takibi'}`, dueDate: actionDate });
    } else {
      let actionLabel = 'Not';
      if (type === 'call') actionLabel = 'Arandı';
      if (type === 'visit') actionLabel = 'Ziyaret';
      
      const noteAppend = `[${new Date().toLocaleDateString('tr-TR')} - ${actionLabel}] ${actionNote}`;
      const newNotes = pin.notes ? `${pin.notes}\n\n${noteAppend}` : noteAppend;
      
      const updates: Partial<MapPinType> = { notes: newNotes };
      if (type === 'call' || type === 'visit') {
        updates.last_contact_date = new Date().toISOString();
        if (actionContactStatus) updates.relationship_level = actionContactStatus as MapPinType['relationship_level'];
      }
      
      updatePinMutation.mutate({ id: pin.id, updates });
    }
  };

  return { updatePinMutation, addTaskMutation, handlePinActionModalSubmit };
}
