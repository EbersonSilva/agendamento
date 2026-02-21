import { useEffect, useState } from 'react';
import { api } from '../service/api';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BarChart3,
  Award,
  Activity
} from 'lucide-react';

interface MetricsData {
  summary: {
    total: number;
    confirmed: number;
    canceled: number;
    pending: number;
    thisMonth: number;
    thisWeek: number;
    uniqueClients: number;
    cancellationRate: number;
  };
  popularServices: Array<{
    serviceName: string;
    count: number;
  }>;
  popularHours: Array<{
    hour: number;
    count: number;
  }>;
}

export function Metrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await api.get('/metrics');
        setMetrics(response.data);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Carregando métricas...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar métricas</div>;
  }

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    bgColor, 
    textColor,
    subtitle 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string | number; 
    bgColor: string; 
    textColor: string;
    subtitle?: string;
  }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`${bgColor} ${textColor} p-3 rounded-xl`}>
          <Icon size={24} />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-zinc-900 mb-1">{value}</h3>
      <p className="text-sm text-zinc-500 font-medium">{label}</p>
      {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-zinc-700" />
            Dashboard de Métricas
          </h1>
          <p className="text-zinc-500">Visão geral do seu negócio</p>
        </div>
      </header>

      {/* Cards de Resumo Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total de Agendamentos"
          value={metrics.summary.total}
          bgColor="bg-blue-100"
          textColor="text-blue-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Confirmados"
          value={metrics.summary.confirmed}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard
          icon={Clock}
          label="Pendentes"
          value={metrics.summary.pending}
          bgColor="bg-yellow-100"
          textColor="text-yellow-600"
        />
        <StatCard
          icon={Users}
          label="Clientes Únicos"
          value={metrics.summary.uniqueClients}
          bgColor="bg-purple-100"
          textColor="text-purple-600"
        />
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Este Mês"
          value={metrics.summary.thisMonth}
          bgColor="bg-indigo-100"
          textColor="text-indigo-600"
          subtitle="Agendamentos no mês atual"
        />
        <StatCard
          icon={Activity}
          label="Esta Semana"
          value={metrics.summary.thisWeek}
          bgColor="bg-cyan-100"
          textColor="text-cyan-600"
          subtitle="Agendamentos nos últimos 7 dias"
        />
        <StatCard
          icon={XCircle}
          label="Cancelados"
          value={metrics.summary.canceled}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
        <StatCard
          icon={Award}
          label="Taxa de Cancelamento"
          value={`${metrics.summary.cancellationRate}%`}
          bgColor="bg-orange-100"
          textColor="text-orange-600"
          subtitle={metrics.summary.cancellationRate < 15 ? '✓ Ótimo índice!' : 'Pode melhorar'}
        />
      </div>

      {/* Seção de Serviços Populares e Horários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços Mais Populares */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            Serviços Mais Procurados
          </h2>
          <div className="space-y-3">
            {metrics.popularServices.length > 0 ? (
              metrics.popularServices.map((service, index) => {
                const maxCount = metrics.popularServices[0]?.count || 1;
                const percentage = (service.count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-700 truncate">
                        {index + 1}. {service.serviceName}
                      </span>
                      <span className="text-sm font-bold text-zinc-900">{service.count}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div
                        className="bg-linear-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-zinc-400 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Horários Mais Populares */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Horários Mais Procurados
          </h2>
          <div className="space-y-3">
            {metrics.popularHours.length > 0 ? (
              metrics.popularHours.map((item, index) => {
                const maxCount = metrics.popularHours[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-zinc-700">
                        {index + 1}. {item.hour}:00 - {item.hour + 1}:00
                      </span>
                      <span className="text-sm font-bold text-zinc-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div
                        className="bg-linear-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-zinc-400 text-center py-8">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Insights e Dicas */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <h3 className="text-lg font-bold text-zinc-900 mb-3 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Insights Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <p>
              <strong>Taxa de confirmação:</strong>{' '}
              {metrics.summary.total > 0 
                ? ((metrics.summary.confirmed / metrics.summary.total) * 100).toFixed(1) 
                : 0}% dos agendamentos foram confirmados
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <p>
              <strong>Média por cliente:</strong>{' '}
              {metrics.summary.uniqueClients > 0 
                ? (metrics.summary.total / metrics.summary.uniqueClients).toFixed(1) 
                : 0} agendamentos por pessoa
            </p>
          </div>
          {metrics.summary.thisWeek > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <p>
                <strong>Tendência:</strong> {metrics.summary.thisWeek} agendamentos esta semana
              </p>
            </div>
          )}
          {metrics.summary.cancellationRate < 10 && (
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <p>
                <strong>Parabéns!</strong> Sua taxa de cancelamento está excelente
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
