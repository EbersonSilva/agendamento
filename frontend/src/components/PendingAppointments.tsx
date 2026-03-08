import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../service/api';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

interface Appointment {
  id: number;
  client: { name: string; };
  service: { name: string; };
  startTime: string;
  status: 'pending' | 'confirmed' | 'canceled';
}

export function PendingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/appointments?status=pending');

      if (Array.isArray(res.data)) {
        setAppointments(res.data);
      } else {
        setError('Formato de dados inválido recebido do servidor');
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const errorMessage = axiosError.response?.data?.error || 'Erro ao buscar agendamentos';
      setError(errorMessage);
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: number, status: 'confirmed' | 'canceled') => {
    try {
      await api.put(`/appointments/${id}`, { newStatus: status });
      setAppointments(prev => prev.filter(app => app.id !== id));
      window.dispatchEvent(new CustomEvent('pendingCountChanged'));
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      const errorMessage = axiosError.response?.data?.error || 'Erro ao atualizar status';
      setError(errorMessage);
      console.error('Erro ao atualizar status:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando solicitações...</div>;

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <p className="font-semibold">Erro ao carregar solicitações</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchAppointments}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-800">Solicitações Pendentes</h1>
        <p className="text-zinc-500 text-sm">Aprove ou recuse novos agendamentos abaixo.</p>
      </header>

      <div className="grid gap-4">
        {appointments.length > 0 ? (
          appointments.map(app => (
            <div key={app.id} className="p-5 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg text-yellow-700">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="font-bold text-zinc-900">
                    {app.client.name} 
                    <span className="font-normal text-zinc-400 mx-2">|</span>
                    <span className="text-zinc-600 font-medium">{app.service.name}</span>
                  </p>
                  <p className="text-sm text-zinc-500">
                    {new Date(app.startTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(app.id, 'confirmed')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <Check size={18} />
                  Confirmar
                </button>
                <button
                  onClick={() => handleStatusChange(app.id, 'canceled')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <X size={18} />
                  Recusar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
            <AlertCircle size={40} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500">Tudo em dia! Nenhuma solicitação pendente.</p>
          </div>
        )}
      </div>
    </div>
  );
}