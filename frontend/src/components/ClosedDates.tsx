import { useState, useEffect } from 'react';
import { api } from '../service/api';
import { CalendarX, Plus, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClosedDate {
  id: number;
  date: string;
  reason?: string;
}

export function ClosedDates() {
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClosedDates();
  }, []);

  async function loadClosedDates() {
    try {
      const response = await api.get('/closed-dates');
      setClosedDates(response.data);
    } catch (error) {
      console.error('Erro ao carregar fechamentos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newDate) {
      setError('Selecione uma data');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/closed-dates', {
        date: newDate,
        reason: newReason || null
      });

      setNewDate('');
      setNewReason('');
      setIsModalOpen(false);
      await loadClosedDates();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Erro ao adicionar fechamento');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja remover este fechamento?')) {
      return;
    }

    try {
      await api.delete(`/closed-dates/${id}`);
      await loadClosedDates();
    } catch (error) {
      console.error('Erro ao remover fechamento:', error);
    }
  }

  // Filtra datas futuras e ordena
  const futureDates = closedDates
    .filter(cd => new Date(cd.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (loading) {
    return <div className="text-center text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Fechamentos Excepcionais</h2>
          <p className="text-sm text-zinc-500">Defina datas específicas em que o estúdio estará fechado</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white p-3 rounded-full shadow-lg hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Lista de Fechamentos */}
      <div className="space-y-3">
        {futureDates.length > 0 ? (
          futureDates.map(closedDate => (
            <div
              key={closedDate.id}
              className="bg-white p-4 rounded-2xl border border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-red-50 p-3 rounded-xl shrink-0">
                  <CalendarX size={20} className="text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-900 wrap-break-word">
                    {format(parseISO(closedDate.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  {closedDate.reason && (
                    <p className="text-sm text-zinc-500 wrap-break-word">{closedDate.reason}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(closedDate.id)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0 self-end sm:self-auto"
                title="Remover fechamento"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-10 text-center">
            <CalendarX size={40} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-zinc-500">Nenhum fechamento programado</p>
            <p className="text-sm text-zinc-400 mt-1">Adicione datas de férias, feriados ou eventos</p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-900">Adicionar Fechamento</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                  setNewDate('');
                  setNewReason('');
                }}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X size={24} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Motivo (Opcional)
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Ex: Férias, Feriado, Evento..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setError('');
                  setNewDate('');
                  setNewReason('');
                }}
                className="flex-1 py-3 border border-zinc-300 rounded-xl font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
