import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

export function usePasswordReset(profile: UserProfile | null) {
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [passwordResetStatus, setPasswordResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [passwordResetMessage, setPasswordResetMessage] = useState("");

  const handlePasswordReset = async () => {
    if (!profile?.email) {
      setPasswordResetStatus("error");
      setPasswordResetMessage("E-posta adresi bulunamadı.");
      return;
    }
    
    if (isSendingPasswordReset) return;
    
    setIsSendingPasswordReset(true);
    setPasswordResetStatus("idle");
    setPasswordResetMessage("");
    
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo });
      
      if (error) throw error;
      
      setPasswordResetStatus("success");
      setPasswordResetMessage("Şifre sıfırlama bağlantısı e-posta adresine gönderildi.");
    } catch (error: unknown) {
      setPasswordResetStatus("error");
      const message = error instanceof Error 
        ? (error.message.includes('rate limit') ? 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.' : error.message)
        : "Şifre sıfırlama e-postası gönderilemedi.";
      setPasswordResetMessage(message);
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  return { isSendingPasswordReset, passwordResetStatus, passwordResetMessage, handlePasswordReset, setPasswordResetStatus };
}
