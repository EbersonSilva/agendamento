import { useEffect, useState } from 'react';
import { api } from '../service/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Clock, User, Calendar, Filter, CheckCircle, XCircle, Hourglass } from 'lucide-react';

interface Appointment {
  id: number;
  startTime: string;
  status: string;
  client: {
    name: string;
    phone: string;
  };
  service: {
    name: string;
  };
}

type FilterStatus = 'all' | 'confirmed' | 'pending' | 'canceled';

export function AllAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showPast, setShowPast] = useState(false);

  async function handleCancel(appointmentId: number, clientName: string) {
    const confirmCancel = window.confirm(
      `Tem certeza que deseja cancelar o agendamento de ${clientName}?\n\nO horário ficará disponível novamente.`
    );

    if (!confirmCancel) return;

    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      
      // Atualiza o status localmente
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId 
            ? { ...app, status: 'canceled' } 
            : app
        )
      );
      
      alert('Agendamento cancelado com sucesso!');
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert('Erro ao cancelar agendamento. Tente novamente.');
    }
  }

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        // Busca agendamentos com o filtro de status (por padrão, apenas próximos)
        const url = `/appointments?status=${filterStatus}&includePast=${showPast}`;
        const response = await api.get(url);
        setAppointments(response.data);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, [filterStatus, showPast]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmado', icon: <CheckCircle size={14} /> },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente', icon: <Hourglass size={14} /> },
      canceled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado', icon: <XCircle size={14} /> },
    };

    const config = statusMap[status.toLowerCase() as keyof typeof statusMap] || statusMap.pending;

    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando agendamentos...</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Header com título e contador */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Todos os Agendamentos</h1>
          <p className="text-zinc-500">Visualize e gerencie todos os agendamentos</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
          {appointments.length} {appointments.length === 1 ? 'Agendamento' : 'Agendamentos'}
        </div>
      </header>

      {/* Filtros de Status */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-700">Filtrar por status:</span>
        </div>
        <div className="mb-3">
          <button
            onClick={() => setShowPast(prev => !prev)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showPast
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {showPast ? 'Ocultar antigos' : 'Mostrar antigos'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'confirmed'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Confirmados
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilterStatus('canceled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'canceled'
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="space-y-3">
        {appointments.length > 0 ? (
          appointments.map((app) => (
            <div 
              key={app.id} 
              className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow"
            >
              {/* Header do Card - Data e Status */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Calendar size={16} className="text-zinc-400" />
                  <span className="text-sm font-medium capitalize">
                    {format(parseISO(app.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                {getStatusBadge(app.status)}
              </div>

              {/* Conteúdo do Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Horário em destaque */}
                <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-xl p-3 min-w-15 sm:min-w-17.5">
                  <Clock size={14} className="text-zinc-400 mb-1" />
                  <span className="font-bold text-zinc-900 text-base">
                    {format(parseISO(app.startTime), 'HH:mm')}
                  </span>
                </div>

                {/* Info da Cliente */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-800 flex items-center gap-2 text-base mb-1">
                    <User size={14} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{app.client.name}</span>
                  </h3>
                  <p className="text-sm text-zinc-500 truncate">{app.service.name}</p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                    <Phone size={12} />
                    {app.client.phone}
                  </p>
                </div>

                {/* Ações - mostrar apenas para agendamentos não cancelados */}
                {app.status.toLowerCase() !== 'canceled' && (
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                    {/* Botão de Cancelar */}
                    <button
                      onClick={() => handleCancel(app.id, app.client.name)}
                      className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white shadow-lg shadow-red-100 transition-colors"
                      title="Cancelar agendamento"
                    >
                      <XCircle size={18} />
                    </button>

                    {/* Botão do WhatsApp */}
                    <a 
                      href={`https://wa.me/${app.client.phone.replace(/\D/g, '')}`} 
                      target="_blank"
                      rel="noreferrer"
                      className="bg-green-500 hover:bg-green-600 p-3 rounded-full text-white shadow-lg shadow-green-100 transition-colors"
                      title="Chamar no WhatsApp"
                    >
                      <Phone size={18} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center">
            <Hourglass size={40} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500">
              {filterStatus === 'all' 
                ? 'Nenhum agendamento encontrado.' 
                : `Nenhum agendamento ${
                    filterStatus === 'confirmed' ? 'confirmado' : 
                    filterStatus === 'pending' ? 'pendente' : 
                    'cancelado'
                  } encontrado.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
