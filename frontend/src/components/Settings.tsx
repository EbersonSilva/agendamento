import { useState, useEffect } from 'react';
import { api } from '../service/api';
import { Plus, DollarSign, Clock, ToggleRight, ToggleLeft, Wrench, CalendarClock, CalendarX } from 'lucide-react';
import { ServiceModal } from '../components/ServiceModal';
import { ConfirmModal } from './ConfirmModal';
import { StudioHours } from './StudioHours';
import { ClosedDates } from './ClosedDates';

interface Service {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

type Tab = 'services' | 'hours' | 'closed';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const tabs = [
    { id: 'services' as Tab, label: 'Serviços', icon: <Wrench size={18} /> },
    { id: 'hours' as Tab, label: 'Horários', icon: <CalendarClock size={18} /> },
    { id: 'closed' as Tab, label: 'Fechamentos', icon: <CalendarX size={18} /> }
  ];

  function openDeleteConfirm(id: number) {
    setServiceToDelete(id);
    setIsConfirmOpen(true);
  }

  async function loadServices() {
    const response = await api.get('/services');
    setServices(response.data);
  }

  async function handleDisableService() {
    if (serviceToDelete) {
      try {
        await api.patch(`/services/${serviceToDelete}/disable`);
        await loadServices();
      } catch (error) {
        console.error("Erro ao inativar serviço:", error);
      } finally {
        setIsConfirmOpen(false);
        setServiceToDelete(null);
      }
    }
  }

  async function handleActivateService(id: number) {
    try {
      await api.patch(`/services/${id}/activate`);
      await loadServices();
    } catch (error) {
      console.error("Erro ao ativar serviço:", error);
    }
  }

  useEffect(() => {
    if (activeTab === 'services') {
      loadServices();
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-800">Configurações</h1>
        <p className="text-zinc-500 text-sm">Gerencie o estúdio</p>
      </header>

      {/* Abas */}
      <div className="flex gap-2 border-b border-zinc-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab.icon}
            <span className="text-sm md:text-base">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div>
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Serviços Oferecidos</h2>
                <p className="text-sm text-zinc-500">Gerencie o catálogo de serviços</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 text-white p-3 rounded-full shadow-lg hover:bg-zinc-800 transition-colors shrink-0"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`bg-white p-4 rounded-2xl border flex justify-between items-center transition-all ${
                    service.active
                      ? 'border-zinc-100'
                      : 'border-zinc-200 bg-zinc-50 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${service.active ? 'text-zinc-900' : 'text-zinc-500'}`}>
                        {service.name}
                      </p>
                      {!service.active && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1"><DollarSign size={12} />R$ {service.price}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{service.durationMinutes} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {service.active ? (
                      <button
                        onClick={() => openDeleteConfirm(service.id)}
                        className="text-green-600 p-2 hover:bg-red-50 rounded-xl transition-colors active:scale-90"
                        title="Inativar serviço">
                        <ToggleRight size={30} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateService(service.id)}
                        className="text-red-400 p-2 hover:bg-green-50 rounded-xl transition-colors active:scale-90 text-sm font-medium"
                        title="Reativar serviço">
                        <ToggleLeft size={30} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'hours' && <StudioHours />}
        {activeTab === 'closed' && <ClosedDates />}
      </div>

      {/* Modais */}
      {isModalOpen && (
        <ServiceModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadServices}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDisableService}
        title="Inativar Serviço"
        message="Tem certeza que deseja inativar este serviço?"
      />
    </div>
  );
}
