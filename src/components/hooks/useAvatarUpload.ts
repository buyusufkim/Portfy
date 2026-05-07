import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile, MutationResult } from '../../types';

export function useAvatarUpload(profile: UserProfile | null, updateProfileMutation: MutationResult<void, { id: string; data: Partial<UserProfile> }>) {
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setLocalAvatar(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Fotoğraf seçilmedi.');
      }

      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece görsel dosyaları yüklenebilir.');
      }
      
      if (file.size > 5 * 1024 * 1024) {
         throw new Error('Dosya boyutu 5MB altında olmalıdır.');
      }
      
      if (!profile?.id) throw new Error('Kullanıcı bulunamadı.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      setLocalAvatar(newAvatarUrl);
      
      updateProfileMutation.mutate({ id: profile.id, data: { avatar_url: newAvatarUrl } });

    } catch (error: unknown) {
      console.error("Avatar yükleme hatası:", error);
      const message = error instanceof Error 
        ? (error.message.includes('bucket') ? 'Profil fotoğrafı yüklenemedi. Storage avatars bucket kurulmamış olabilir.' : error.message)
        : "Fotoğraf yüklenirken bir hata oluştu.";
      alert(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return { uploading, localAvatar, fileInputRef, handleAvatarUpload };
}
