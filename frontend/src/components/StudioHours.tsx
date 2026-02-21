import { useState, useEffect } from 'react';
import { api } from '../service/api';
import { Clock, Calendar, Save } from 'lucide-react';

interface StudioConfig {
  openingTime: number;
  closingTime: number;
  closedDays: number[];
}

export function StudioHours() {
  const [config, setConfig] = useState<StudioConfig>({
    openingTime: 8,
    closingTime: 18,
    closedDays: [0] // Domingo por padrão
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' }
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await api.get('/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  function toggleDay(day: number) {
    setConfig(prev => {
      const isAlreadyClosed = prev.closedDays.includes(day);
      return {
        ...prev,
        closedDays: isAlreadyClosed
          ? prev.closedDays.filter(d => d !== day)
          : [...prev.closedDays, day].sort()
      };
    });
  }

  async function handleSave() {
    if (config.openingTime >= config.closingTime) {
      setMessage('Horário de abertura deve ser menor que o de fechamento');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);
    try {
      await api.put('/config', config);
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage('Erro ao salvar configurações');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center text-zinc-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Horário de Funcionamento</h2>
        <p className="text-sm text-zinc-500">Configure os horários e dias que o estúdio funciona</p>
      </div>

      {/* Horários */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 space-y-4">
        <div className="flex items-center gap-2 text-zinc-700 font-medium mb-4">
          <Clock size={20} />
          <span>Horário de Atendimento</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Abertura
            </label>
            <select
              value={config.openingTime}
              onChange={(e) => setConfig({ ...config, openingTime: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Fechamento
            </label>
            <select
              value={config.closingTime}
              onChange={(e) => setConfig({ ...config, closingTime: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              {hours.map(hour => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 space-y-4">
        <div className="flex items-center gap-2 text-zinc-700 font-medium mb-4">
          <Calendar size={20} />
          <span>Dias de Funcionamento</span>
        </div>

        <p className="text-sm text-zinc-500 mb-4">
          Selecione os dias em que o estúdio <strong>fica fechado</strong>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {daysOfWeek.map(day => {
            const isClosed = config.closedDays.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`p-4 rounded-xl border-2 transition-all font-medium ${
                  isClosed
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-green-300 bg-green-50 text-green-700'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">{day.label}</div>
                  <div className="text-xs mt-1">
                    {isClosed ? 'Fechado' : 'Aberto'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>

        {message && (
          <div className={`text-center text-sm py-2 px-4 rounded-xl ${
            message.includes('sucesso')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
