import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../service/api';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AxiosError } from 'axios';

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}
// O componente Booking é usado tanto para o cliente (modo "public") quanto para o admin criar agendamento manualmente (modo "admin")
interface BookingProps {
  mode?: 'public' | 'admin';
}

export function Booking({ mode = 'public' }: BookingProps) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date()); // O dia vindo do carrossel
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [hasToken] = useState(!!localStorage.getItem('@Estudio:token'));
  const [ownerWhatsApp, setOwnerWhatsApp] = useState('');
  const isAdmin = mode === 'admin';

  // Função para formatar telefone brasileiro
  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara conforme o tamanho
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

// Carrega serviços e dias fechados do backend ao iniciar
  useEffect(() => {
    api.get('/services').then(response => {
      // Filtra apenas serviços ativos para agendamento
      const activeServices = response.data.filter((service: Service) => service.active);
      setServices(activeServices);
    });
    api.get('/config').then(response => {
      setClosedDays(response.data.closedDays || []);
      setOwnerWhatsApp(response.data.ownerWhatsApp || '');
    });
    api.get('/closed-dates').then(response => {
      // Extrai apenas as datas (formato YYYY-MM-DD) e armazena
      const dates = response.data.map((item: { date: string }) => 
        format(new Date(item.date), 'yyyy-MM-dd')
      );
      setClosedDates(dates);
    });
  }, []);

  // Gera uma lista de dias para os próximos 14 dias
  const daysRange = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  // Verifica se uma data está fechada (por dia da semana OU por data específica)
  const isDateClosed = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    return closedDays.includes(dayOfWeek) || closedDates.includes(dateStr);
  };

  // Busca horários do backend sempre que mudar a data selecionada
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const serviceParam = selectedService ? `&serviceId=${selectedService.id}` : '';
    api.get(`/appointments/available?date=${dateStr}${serviceParam}`)
      .then(res => setAvailableTimes(res.data));
  }, [selectedDate, selectedService]);

  // Converte data local para ISO sem mudar o horário por fuso horário
  const dateToISOLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const buildOwnerMessage = () => {
    const selectedDateTime = appointmentDate ?? selectedDate;
    const serviceName = selectedService?.name ?? 'Servico nao informado';
    const dateText = selectedDateTime.toLocaleDateString('pt-BR');
    const timeText = selectedDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `Ola! Acabei de realizar um agendamento online: *Servico:* ${serviceName} *Data:* ${dateText} *Horario:* ${timeText} *Nome:* ${clientName} *WhatsApp:* ${phone}`;
  };

  // Formata os dias para exibição no seletor horizontal
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedService) {
        return;
      }
      const normalizedPhone = phone.replace(/\D/g, '');
      if (!normalizedPhone || (normalizedPhone.length !== 10 && normalizedPhone.length !== 11)) {
        setPhoneError('Informe DDD + número (10 ou 11 dígitos).');
        return;
      }
      await api.post('/appointments', {
        clientName,
        phone: normalizedPhone,
        serviceId: selectedService.id,
        startTime: dateToISOLocal(appointmentDate ?? selectedDate),
      });
      
      // Dispara evento para atualizar badge de pendentes no admin
      window.dispatchEvent(new CustomEvent('pendingCountChanged'));
      
      setStep(4);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      console.error("Erro ao agendar:", error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* HEADER */}
        <div className="bg-zinc-900 p-6 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isAdmin ? 'Novo agendamento' : 'Melissa Beaulty'}
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {isAdmin ? 'Agende um cliente manualmente' : 'Sua melhor versão começa aqui'}
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* STEP 1: SERVIÇOS */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">1. Escolha o Serviço</h2>
              {services.map(s => (
                <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }}// Função fictícia para armazenar o serviço selecionado
                  className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 hover:border-zinc-900 transition-all group active:scale-95">
                  <div className="flex justify-between items-center">
                    <span className="font-medium group-hover:text-zinc-900">{s.name}</span>
                    <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold uppercase text-zinc-600">R$ {s.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{s.durationMinutes} minutos de cuidado</p>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: HORÁRIO */}
          {step === 2 && (
            <div className="space-y-6">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 flex items-center gap-1">
                <ArrowLeft size={14} /> Voltar para trocar o serviço
              </button>
              <h2 className="text-xl font-semibold tracking-tight">2. Escolha a Data e Horário</h2>
              
              <h2 className="text-xl font-bold">{format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}</h2>


              {/* Seletor de Dias Horizontal Real */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {daysRange
                  .filter(date => !isDateClosed(date))
                  .map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                        ? 'bg-zinc-900 text-white shadow-lg'
                        : 'bg-zinc-50 text-gray-400 border border-gray-100'
                        }`}
                    >
                      <span className="text-xs uppercase font-medium">{format(date, 'EEE', { locale: ptBR })}</span>
                      <span className="text-xl font-bold">{format(date, 'dd')}</span>
                    </button>
                  ))}
              </div>

              {/* Grade de Horários Dinâmica */}
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.length > 0 ? (
                  availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        const [h, m] = time.split(':');
                        const finalDate = new Date(selectedDate);
                        finalDate.setHours(Number(h), Number(m), 0, 0); // Ajusta horas e minutos sem segundos
                        setAppointmentDate(finalDate); // Armazena a data e hora selecionadas
                        setStep(3);
                      }}
                      className="py-3 text-center border-2 border-gray-100 rounded-xl hover:border-zinc-900 font-medium bg-white"
                    >
                      {time}
                    </button>
                  ))
                ) : (
                  <p className="col-span-3 text-center text-gray-500 py-4">Nenhum horário disponível para este dia.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: IDENTIFICAÇÃO */}
          {step === 3 && (
            <div className="space-y-6">
              <button onClick={() => setStep(2)} className="flex items-center text-sm text-gray-500 hover:text-black">
                <ArrowLeft size={16} className="mr-1" /> Mudar horário
              </button>
              <h2 className="text-xl font-semibold tracking-tight">3. Quase lá! Quem é você?</h2>
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">Nome Completo</label>
                  <input 
                    required 
                    type="text" 
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Maria Silva Santos"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const formatted = formatPhone(e.target.value);
                      setPhone(formatted);
                      if (phoneError) {
                        setPhoneError('');
                      }
                    }}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                  {phoneError && (
                    <p className="text-xs text-red-500">{phoneError}</p>
                  )}
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Resumo do pedido</p>
                  <p className="text-sm"><strong>{selectedService?.name}</strong> em {(appointmentDate ?? selectedDate).toLocaleString()}</p>
                </div>
                <button type="submit"
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                  Confirmar Agendamento
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCESSO */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isAdmin ? 'Agendamento criado!' : 'Pedido Enviado!'}
              </h2>
              <p className="text-gray-500">
                {isAdmin
                  ? 'Agendamento registrado como pendente. Você pode aprovar na lista de pendentes.'
                  : `Olá ${clientName}, seu agendamento está em **análise** pela dona do estúdio.`}
              </p>
              {!isAdmin && ownerWhatsApp ? (
                <a
                  href={`https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(buildOwnerMessage())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                >
                  Enviar mensagem para a dona no WhatsApp
                </a>
              ) : !isAdmin ? (
                <p className="text-xs text-zinc-400">WhatsApp da dona nao configurado.</p>
              ) : null}
              {isAdmin ? (
                <Link to="/admin/pendentes" className="text-zinc-900 font-bold hover:underline">
                  Ver pendentes
                </Link>
              ) : (
                <button onClick={() => setStep(1)} className="text-zinc-900 font-bold hover:underline">
                  Fazer novo agendamento
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer com link discreto */}
        {!isAdmin && (
          <div className="p-4 text-center border-t border-zinc-100">
            <Link
              to={hasToken ? "/admin" : "/login"}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Área administrativa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
