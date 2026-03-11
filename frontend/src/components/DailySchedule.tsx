

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api, resolvedBaseUrl } from '../service/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface Appointment {
  id: number;
  startTime: string;
  client: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
  };
}

export function DailySchedule() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  async function handleCancel(appointmentId: number, clientName: string) {
    const confirmCancel = window.confirm(
      `Tem certeza que deseja cancelar o agendamento de ${clientName}?\n\nO horário ficará disponível novamente.`
    );

    if (!confirmCancel) return;

    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      
      // Remove o agendamento da lista
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      
      alert('Agendamento cancelado com sucesso!');
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert('Erro ao cancelar agendamento. Tente novamente.');
    }
  }

  useEffect(() => {
    async function loadAppointments() {
      try {
        setError(null);
        // Buscamos apenas os confirmados do dia atual
        const response = await api.get(`/appointments?date=${today}&status=confirmed`);
        setAppointments(response.data);
      } catch (err) {
        const axiosError = err as AxiosError<{ error?: string }>;
        const errorMessage = axiosError.response?.data?.error || 'Nao foi possivel carregar a agenda do dia. Verifique a API configurada em producao.';
        setAppointments([]);
        setError(errorMessage);
        console.error("Erro ao carregar agenda:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [today]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando agenda...</div>;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="text-xl font-bold">Erro ao carregar agenda</h1>
        <p className="mt-2 text-sm">{error}</p>
        <p className="mt-3 text-xs text-red-500">
          URL da API em uso: <code className="bg-red-100 px-1 rounded">{resolvedBaseUrl}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Agenda de Hoje</h1>
          <p className="text-zinc-500 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
          {appointments.length} Clientes
        </div>
      </header>

      <div className="space-y-3">
        {appointments.length > 0 ? (
          appointments.map((app) => (
            <div 
              key={app.id} 
              className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-3 sm:gap-4 active:scale-[0.98] transition-transform"
            >
              {/* Horário em destaque */}
              <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-xl p-2 sm:p-3 min-w-15 sm:min-w-17.5">
                <Clock size={14} className="text-zinc-400 mb-1 sm:w-4 sm:h-4" />
                <span className="font-bold text-zinc-900 text-sm sm:text-base">
                  {format(new Date(app.startTime), 'HH:mm')}
                </span>
              </div>

              {/* Info da Cliente */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-800 flex items-center gap-2 text-sm sm:text-base truncate">
                  <User size={12} className="text-zinc-400 shrink-0 sm:w-3.5 sm:h-3.5" />
                  <span className="truncate">{app.client.name}</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 truncate">{app.service.name}</p>
              </div>

              {/* Ações */}
              <div className="flex gap-2 shrink-0">
                {/* Botão de Cancelar */}
                <button
                  onClick={() => handleCancel(app.id, app.client.name)}
                  className="bg-red-500 hover:bg-red-600 p-2 sm:p-3 rounded-full text-white shadow-lg shadow-red-100 transition-colors"
                  title="Cancelar agendamento"
                >
                  <XCircle size={18} className="sm:w-5 sm:h-5" />
                </button>

                {/* Botão do WhatsApp */}
                <a 
                  href={`https://wa.me/${app.client.phone.replace(/\D/g, '')}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-500 hover:bg-green-600 p-2 sm:p-3 rounded-full text-white shadow-lg shadow-green-100 transition-colors"
                  title="Chamar no WhatsApp"
                >
                  <Phone size={18} className="sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center">
            <CheckCircle size={40} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500">Nenhum atendimento confirmado para hoje.</p>
          </div>
        )}
      </div>
    </div>
  );
}