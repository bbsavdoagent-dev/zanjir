import { useState } from 'react';

const TOAST_DURATION_MS = 3000;

/** Qisqa vaqtli xabar (toast) uchun oddiy hook. */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  };

  return { toastMessage: message, showToast };
}
