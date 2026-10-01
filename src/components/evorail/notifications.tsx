import {Toaster, toast} from 'sonner';

export function EvoToaster() {
  return <Toaster position="bottom-right" closeButton richColors toastOptions={{className: 'evo-toast'}} />;
}

export const evoToast = {
  success: (message: string) => toast.success(message),
  info: (message: string) => toast.info(message),
  error: (message: string) => toast.error(message),
};
