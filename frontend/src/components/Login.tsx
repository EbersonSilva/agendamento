import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../service/api';
import { Lock, Eye, EyeOff, LogIn, Smartphone } from 'lucide-react';

export function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('@Estudio:token');
    if (storedToken) {
      navigate('/admin');
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      const response = await api.post('/login', {
        phone: normalizedPhone,
        password
      });
      
      const { token, user } = response.data;

      // Persistência: Salvamos o token e os dados básicos
      localStorage.setItem('@Estudio:token', token);
      localStorage.setItem('@Estudio:user', JSON.stringify(user));

      // Configura o Axios para enviar o token em todas as próximas chamadas
      api.defaults.headers.Authorization = `Bearer ${token}`;

      navigate('/admin'); // Sucesso! Vai para a área da dona
    } catch (error: any) {
      alert(error.response?.data?.error || "Falha no login. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-100 bg-white rounded-3xl p-8 shadow-xl border border-zinc-100">
        <header className="text-center mb-8">
          <div className="bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-zinc-200">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Acesso Restrito</h1>
          <p className="text-zinc-500">Área exclusiva para administração</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 ml-1">Telefone</label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 p-4 pl-12 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-6 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Autenticando..." : (
              <>
                <LogIn size={20} />
                Entrar no Painel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}