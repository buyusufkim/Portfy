export const maskPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    // Too short to format nicely, just obscure partially
    if (cleanPhone.length <= 3) return '***';
    return cleanPhone.substring(0, 2) + '***' + cleanPhone.substring(cleanPhone.length - 1);
  }

  // Common Turkish phone format: 05321234567 or 905321234567 or 5321234567
  let countryCode = '';
  let nationalNumber = cleanPhone;

  if (cleanPhone.startsWith('90')) {
    countryCode = '+90 ';
    nationalNumber = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('0')) {
    nationalNumber = cleanPhone.substring(1);
  }

  if (nationalNumber.length === 10) {
    const p1 = nationalNumber.substring(0, 3);
    const p2 = nationalNumber.substring(3, 6);
    const p3 = nationalNumber.substring(8);
    return `${countryCode}0${p1} *** ** ${p3}`;
  }

  // Fallback for other lengths
  const visibleStart = Math.floor(phone.length / 3);
  const visibleEnd = Math.floor(phone.length / 4);
  return phone.substring(0, visibleStart) + ' *** ' + phone.substring(phone.length - visibleEnd);
};

export const maskEmail = (email?: string | null): string => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';

  const [local, domain] = parts;
  if (local.length <= 2) {
    return `***@${domain}`;
  }

  const visibleCount = Math.min(2, Math.floor(local.length / 2));
  return `${local.substring(0, visibleCount)}***@${domain}`;
};

export const maskSensitiveText = (value?: string | null): string => {
  if (!value) return '';
  if (value.length <= 3) return '***';
  return value.substring(0, 2) + '***';
};
