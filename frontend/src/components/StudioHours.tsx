import { useState, useEffect } from 'react';
import { api } from '../service/api';
import { Clock, Calendar, Save, Mail } from 'lucide-react';
import { AxiosError } from 'axios';

interface StudioConfig {
  openingTime: number;
  closingTime: number;
  closedDays: number[];
  ownerWhatsApp: string;
  ownerEmail: string;
  allowPublicBookings: boolean;
}

export function StudioHours() {
  const [config, setConfig] = useState<StudioConfig>({
    openingTime: 8,
    closingTime: 18,
    closedDays: [0], // Domingo por padrão
    ownerWhatsApp: '',
    ownerEmail: '',
    allowPublicBookings: true
  });
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPublicBookings, setSavingPublicBookings] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [bookingToggleMessage, setBookingToggleMessage] = useState('');

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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 2) {
      return numbers;
    }
    if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await api.get('/config');
        const { openingTime, closingTime, closedDays, ownerWhatsApp, ownerEmail, allowPublicBookings } = response.data;
        setConfig({
          openingTime,
          closingTime,
          closedDays,
          ownerWhatsApp: ownerWhatsApp ? formatPhone(ownerWhatsApp) : '',
          ownerEmail: ownerEmail || '',
          allowPublicBookings: allowPublicBookings !== undefined ? allowPublicBookings : true
        });
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

  async function handleSaveHours() {
    if (config.openingTime >= config.closingTime) {
      setHoursMessage('Horário de abertura deve ser menor que o de fechamento');
      setTimeout(() => setHoursMessage(''), 3000);
      return;
    }

    setSavingHours(true);
    try {
      await api.put('/config', { 
        openingTime: config.openingTime,
        closingTime: config.closingTime,
        closedDays: config.closedDays
      });
      setHoursMessage('Horários salvos com sucesso!');
      setTimeout(() => setHoursMessage(''), 3000);
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const serverMessage = axiosError.response?.data?.error || axiosError.response?.data?.message;
      console.error('Erro ao salvar:', error);
      setHoursMessage(serverMessage || 'Erro ao salvar configurações');
      setTimeout(() => setHoursMessage(''), 3000);
    } finally {
      setSavingHours(false);
    }
  }

  async function handleSaveContact() {
    const normalizedOwnerWhatsApp = config.ownerWhatsApp.replace(/\D/g, '');
    if (!normalizedOwnerWhatsApp) {
      setContactMessage('Informe o WhatsApp para receber os agendamentos');
      setTimeout(() => setContactMessage(''), 3000);
      return;
    }
    if (normalizedOwnerWhatsApp.length !== 10 && normalizedOwnerWhatsApp.length !== 11) {
      setContactMessage('Informe DDD + número (10 ou 11 dígitos)');
      setTimeout(() => setContactMessage(''), 3000);
      return;
    }

    const email = config.ownerEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setContactMessage('Informe um email válido.');
      setTimeout(() => setContactMessage(''), 3000);
      return;
    }

    setSavingContact(true);
    try {
      await api.put('/config', { 
        ownerWhatsApp: normalizedOwnerWhatsApp,
        ownerEmail: email 
      });
      setContactMessage('Contatos salvos com sucesso!');
      setTimeout(() => setContactMessage(''), 3000);
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const serverMessage = axiosError.response?.data?.error || axiosError.response?.data?.message;
      console.error('Erro ao salvar contato:', error);
      setContactMessage(serverMessage || 'Erro ao salvar contatos');
      setTimeout(() => setContactMessage(''), 3000);
    } finally {
      setSavingContact(false);
    }
  }

  async function handleTogglePublicBookings() {
    const newValue = !config.allowPublicBookings;
    setSavingPublicBookings(true);
    try {
      await api.put('/config', { allowPublicBookings: newValue });
      setConfig(prev => ({ ...prev, allowPublicBookings: newValue }));
      setBookingToggleMessage(newValue ? 'Agendamentos online ativados!' : 'Agendamentos online desativados!');
      setTimeout(() => setBookingToggleMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar permissão de agendamentos:', error);
      alert('Erro ao alterar status do agendamento online.');
    } finally {
      setSavingPublicBookings(false);
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

      {/* Horários e Dias de Atendimento */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            <Clock size={20} />
            <span>Horário de Atendimento</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <hr className="border-zinc-100" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            <Calendar size={20} />
            <span>Dias de Funcionamento</span>
          </div>

          <p className="text-sm text-zinc-500">
            Selecione os dias em que o estúdio <strong>fica fechado</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {daysOfWeek.map(day => {
              const isClosed = config.closedDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`p-2.5 sm:p-4 rounded-xl border-2 transition-all font-medium ${
                    isClosed
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-green-300 bg-green-50 text-green-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold text-xs sm:text-sm md:text-base">{day.label}</div>
                    <div className="text-[10px] sm:text-xs mt-1">
                      {isClosed ? 'Fechado' : 'Aberto'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {hoursMessage && (
          <div className={`text-center text-sm py-2 px-4 rounded-xl ${
            hoursMessage.includes('sucesso')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {hoursMessage}
          </div>
        )}

        <button
          onClick={handleSaveHours}
          disabled={savingHours}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {savingHours ? 'Salvando...' : 'Salvar Horários e Dias'}
        </button>
      </div>

      {/* Configuração de Agendamentos Online */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">Agendamentos Online</h3>
            <p className="text-xs text-zinc-500">
              Ative ou desative o agendamento público feito pelas clientes no site.
            </p>
          </div>
          <button
            onClick={handleTogglePublicBookings}
            disabled={savingPublicBookings}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-all outline-none ${
              config.allowPublicBookings ? "bg-green-600 justify-end" : "bg-zinc-300 justify-start"
            }`}
          >
            <div className="bg-white w-6 h-6 rounded-full shadow-md transition-all" />
          </button>
        </div>
        {bookingToggleMessage && (
          <div className="text-center text-sm py-2 px-4 rounded-xl bg-green-50 text-green-700 animate-fade-in">
            {bookingToggleMessage}
          </div>
        )}
      </div>

      {/* Contato */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-100 space-y-4">
        <div className="flex items-center gap-2 text-zinc-700 font-medium mb-4">
          <span className="text-base">Contato da Dona</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            WhatsApp para receber os agendamentos
          </label>
          <input
            type="tel"
            value={config.ownerWhatsApp}
            onChange={(e) => setConfig({ ...config, ownerWhatsApp: formatPhone(e.target.value) })}
            placeholder="(11) 98765-4321"
            maxLength={15}
            className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Esse numero aparece no botao de mensagem apos o agendamento.
          </p>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
            <Mail size={15} className="text-zinc-500" />
            Email para receber notificações de agendamento
          </label>
          <input
            type="email"
            value={config.ownerEmail}
            onChange={(e) => setConfig({ ...config, ownerEmail: e.target.value })}
            placeholder="seuemail@gmail.com"
            className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Você receberá um email a cada novo agendamento realizado.
          </p>
        </div>

        {contactMessage && (
          <div className={`text-center text-sm py-2 px-4 rounded-xl ${
            contactMessage.includes('sucesso')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {contactMessage}
          </div>
        )}

        <button
          onClick={handleSaveContact}
          disabled={savingContact}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
        >
          <Save size={20} />
          {savingContact ? 'Salvando...' : 'Salvar Contatos'}
        </button>
      </div>
    </div>
  );
}
