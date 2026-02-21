import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
 onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-in-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <AlertTriangle size={32} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-zinc-900 text-center mb-2">{title}</h2>
        <p className="text-zinc-500 text-center mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-100 text-zinc-600 p-3 rounded-2xl font-semibold hover:bg-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white p-3 rounded-2xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
          >
            Inativar
          </button>
        </div>
      </div>
    </div>
  );
}