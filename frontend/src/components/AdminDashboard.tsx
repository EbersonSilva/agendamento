import { Calendar, Settings, Menu, X, Clock, LogOut, KeyRound, List, BarChart2, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../service/api';

export function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Começa fechado no mobile
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation(); // Para saber qual link está ativo

  const menuItems = [
    { label: 'Agenda do dia', path: '/admin', icon: <Calendar size={20} /> },
    { label: 'Novo Agendamento', path: '/admin/novo-agendamento', icon: <PlusCircle size={20} /> },
    { label: 'Todos Agendamentos', path: '/admin/agendamentos', icon: <List size={20} /> },
    { label: 'Pendentes', path: '/admin/pendentes', icon: <Clock size={20} /> },
    { label: 'Métricas', path: '/admin/metricas', icon: <BarChart2 size={20} /> },
    // { label: 'Clientes', path: '/admin/clientes', icon: <Users size={20} /> },
    { label: 'Configurações', path: '/admin/configuracoes', icon: <Settings size={20} /> },
    { label: 'Alterar Senha', path: '/admin/alterar-senha', icon: <KeyRound size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('@Estudio:token');
    localStorage.removeItem('@Estudio:user');
    delete api.defaults.headers.Authorization;
    navigate('/login');
  };

  // Buscar quantidade de pendentes
  useEffect(() => {
    async function loadPendingCount() {
      try {
        const response = await api.get('/appointments?status=pending');
        setPendingCount(response.data.length);
      } catch (error) {
        console.error('Erro ao carregar pendentes:', error);
      }
    }

    loadPendingCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(loadPendingCount, 30000);

    // Escutar evento de mudança (quando aprovar/recusar)
    const handlePendingChange = () => loadPendingCount();
    window.addEventListener('pendingCountChanged', handlePendingChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pendingCountChanged', handlePendingChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}
      >
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold italic text-white">Admin Estúdio</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item, index) => {
            // Verifica dinamicamente se a rota atual é esta para marcar o "active"
            const isActive = location.pathname === item.path;
            const isPendingItem = item.path === '/admin/pendentes';
            
            return (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false); // Fecha o menu ao clicar (importante no mobile)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                  isActive ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium flex-1 text-left">{item.label}</span>
                
                {/* Badge de pendentes */}
                {isPendingItem && pendingCount > 0 && (
                  <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
           {/* Botão de Logout sempre visível no rodapé do menu */}
        <div className="mt-6 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {/* Botão de abrir menu (Mobile) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mb-6 p-2 bg-zinc-900 text-white rounded-md md:hidden"
          >
            <Menu size={24} />
          </button>
        )}

        {/* O OUTLET É OBRIGATÓRIO AQUI: Ele renderiza a sub-rota selecionada */}
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}