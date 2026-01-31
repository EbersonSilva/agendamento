// import { useEffect, useState } from 'react';
// import { api } from './service/api';
// import { Calendar, Clock, User, Phone, CheckCircle, ArrowLeft } from 'lucide-react';



// interface Service {
//   id: number;
//   name: string;
//   price: number;
//   durationMinutes: number;
// }

// function App() {
//   // Estados para o Fluxo
//   const [step, setStep] = useState(1);
//   const [services, setServices] = useState<Service[]>([]);
  
//   // Dados do Agendamento
//   const [selectedService, setSelectedService] = useState<Service | null>(null);
//   const [selectedDate, setSelectedDate] = useState('');
//   const [clientName, setClientName] = useState('');
//   const [phone, setPhone] = useState('');

//   useEffect(() => {
//     api.get('/services').then(response => setServices(response.data));
//   }, []);

//   const handleFinalSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       await api.post('/appointments', {
//         clientName,
//         phone,
//         serviceId: selectedService?.id,
//         startTime: new Date(selectedDate).toISOString(),
//       });
//       setStep(4); // Passo de Sucesso
//     } catch (err: any) {
//       alert(err.response?.data?.error || "Erro ao realizar agendamento");
//     }
//   };

//   return (
//     <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
//       {/* ETAPA 1: ESCOLHA DO SERVIÇO */}
//       {step === 1 && (
//         <section>
//           <h2>1. Escolha o Serviço</h2>
//           <div style={{ display: 'grid', gap: '15px' }}>
//             {services.map(s => (
//               <div key={s.id} onClick={() => { setSelectedService(s); setStep(2); }} 
//                 style={{ border: '2px solid #eee', padding: '15px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' }}>
//                 <h3 style={{ margin: 0 }}>{s.name}</h3>
//                 <p style={{ color: '#666', margin: '5px 0' }}>{s.durationMinutes} min • <strong>R$ {s.price}</strong></p>
//               </div>
//             ))}
//           </div>
//         </section>
//       )}

//       {/* ETAPA 2: ESCOLHA DO HORÁRIO */}
//       {step === 2 && (
//         <section>
//           <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
//             <ArrowLeft size={16}/> Voltar
//           </button>
//           <h2>2. Escolha o Horário</h2>
//           <p>Para: <strong>{selectedService?.name}</strong></p>
//           <input 
//             type="datetime-local" 
//             style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}
//             onChange={(e) => setSelectedDate(e.target.value)}
//           />
//           <button 
//             disabled={!selectedDate}
//             onClick={() => setStep(3)}
//             style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
//           >
//             Próximo Passo
//           </button>
//         </section>
//       )}

//       {/* ETAPA 3: DADOS PESSOAIS */}
//       {step === 3 && (
//         <section>
//           <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
//             <ArrowLeft size={16}/> Voltar
//           </button>
//           <h2>3. Seus Dados</h2>
//           <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//             <div>
//               <label style={{ display: 'block', marginBottom: '5px' }}>Nome Completo</label>
//               <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
//             </div>
//             <div>
//               <label style={{ display: 'block', marginBottom: '5px' }}>WhatsApp</label>
//               <input required type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
//             </div>
//             <div style={{ backgroundColor: '#f0f7ff', padding: '15px', borderRadius: '8px', fontSize: '14px' }}>
//               <strong>Resumo:</strong> {selectedService?.name} <br />
//               <strong>Data:</strong> {new Date(selectedDate).toLocaleString('pt-BR')}
//             </div>
//             <button type="submit" style={{ padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
//               Confirmar Agendamento
//             </button>
//           </form>
//         </section>
//       )}

//       {/* ETAPA 4: SUCESSO */}
//       {step === 4 && (
//         <section style={{ textAlign: 'center', padding: '40px 0' }}>
//           <CheckCircle size={64} color="#28a745" style={{ marginBottom: '20px' }} />
//           <h2>Agendado com Sucesso!</h2>
//           <p>Tudo pronto, <strong>{clientName}</strong>. Esperamos você!</p>
//           <button onClick={() => { setStep(1); setSelectedDate(''); }} style={{ marginTop: '20px', background: 'none', color: '#007bff', border: '1px solid #007bff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
//             Novo Agendamento
//           </button>
//         </section>
//       )}

//     </div>
//   );
// }

// export default App;


import { useEffect, useState } from 'react';
import { api } from './service/api';
import { CheckCircle, ArrowLeft, Clock, Calendar, User } from 'lucide-react';

function App() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Gera os próximos 7 dias a partir de hoje
const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    api.get('/services').then(response => setServices(response.data));
  }, []);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', {
        clientName,
        phone,
        serviceId: selectedService.id,
        startTime: new Date(selectedDate).toISOString(),
      });
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao agendar");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-zinc-900 p-8 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">Estúdio de Beleza</h1>
          <p className="text-zinc-400 text-sm mt-1">Sua melhor versão começa aqui</p>
        </div>

        <div className="p-8">
          {/* STEP 1: SERVIÇOS */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="bg-zinc-100 p-2 rounded-lg text-sm">01</span> Escolha o Serviço
              </h2>
              {services.map(s => (
                <button key={s.id} onClick={() => { setSelectedService(s); setStep(2); }}
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
      <ArrowLeft size={14}/> Voltar
    </button>
    
    <div className="flex justify-between items-center px-2">
      <h2 className="text-xl font-bold">{months[currentMonth]}</h2>
      <span className="text-sm text-gray-400">2026</span>
    </div>

    {/* Seletor de Dias Horizontal */}
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {days.map((date) => (
        <button
          key={date.toISOString()}
          onClick={() => setSelectedDay(date.getDate())}
          className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
            selectedDay === date.getDate() 
            ? 'bg-zinc-900 text-white shadow-lg' 
            : 'bg-zinc-50 text-gray-400 border border-gray-100'
          }`}
        >
          <span className="text-xs uppercase font-medium">
            {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
          </span>
          <span className="text-xl font-bold">{date.getDate()}</span>
        </button>
      ))}
    </div>

    {/* Grade de Horários (aquela da foto que você mandou) */}
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase ml-1">Horários Disponíveis</h3>
      <div className="grid grid-cols-3 gap-3">
        {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(time => (
          <button
            key={time}
            onClick={() => {
              const date = new Date(2026, currentMonth, selectedDay);
              const [h, m] = time.split(':');
              date.setHours(parseInt(h), parseInt(m));
              setSelectedDate(date.toISOString());
              setStep(3);
            }}
            className="py-3 text-center border-2 border-gray-50 border-zinc-100 rounded-xl hover:border-zinc-900 font-medium active:scale-95 transition-all bg-white shadow-sm"
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

          {/* STEP 3: IDENTIFICAÇÃO */}
          {step === 3 && (
            <div className="space-y-6">
              <button onClick={() => setStep(2)} className="flex items-center text-sm text-gray-500 hover:text-black">
                <ArrowLeft size={16} className="mr-1"/> Mudar horário
              </button>
              <h2 className="text-xl font-semibold tracking-tight">3. Quase lá! Quem é você?</h2>
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">Nome Completo</label>
                  <input required type="text" onChange={e => setClientName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">WhatsApp</label>
                  <input required type="tel" onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none" />
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-xs text-zinc-400 font-bold uppercase mb-1">Resumo do pedido</p>
                  <p className="text-sm"><strong>{selectedService?.name}</strong> em {new Date(selectedDate).toLocaleString()}</p>
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
              <h2 className="text-2xl font-bold text-gray-900">Pedido Enviado!</h2>
              <p className="text-gray-500">Olá {clientName}, seu agendamento está em **análise** pela dona do estúdio.</p>
              <button onClick={() => setStep(1)} className="text-zinc-900 font-bold hover:underline">Fazer novo agendamento</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;