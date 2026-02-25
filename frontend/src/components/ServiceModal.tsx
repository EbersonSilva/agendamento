import { useEffect, useState } from "react"; // Importação do useState para gerenciar o estado do modal
import { api } from "../service/api"; // Importação do serviço de API para fazer requisições ao backend
import { X, Save } from "lucide-react"; // Importação do ícone de fechar e salvar

interface ServiceData {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

interface ServiceModalProps {
    onClose: () => void; // Função para fechar o modal
    onSuccess: () => void; // Função para salvar as alterações
  service?: ServiceData | null;
}

export function ServiceModal({ onClose, onSuccess, service }: ServiceModalProps) {
    const [name, setName] = useState(""); // Estado para o nome do serviço
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState(""); // Estado para a duração do serviço
    const [ isSubmitting, setIsSubmitting] = useState(false); // Estado para indicar se o formulário está sendo submetido

  useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice(String(service.price));
      setDuration(String(service.durationMinutes));
      return;
    }

    setName("");
    setPrice("");
    setDuration("");
  }, [service]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); // Previne o comportamento padrão do formulário
        setIsSubmitting(true); // Define o estado de submissão como verdadeiro

        try {
      if (service) {
        await api.put(`/services/${service.id}`, { name, price, duration });
      } else {
        await api.post("/services", { name, price, duration });// Faz uma requisição POST para criar um novo serviço com os dados do formulário
      }
            onSuccess(); // Chama a função de sucesso para atualizar a lista de serviços
            onClose(); // Fecha o modal após salvar as alterações
        } catch (error) {
            console.error("Erro ao criar serviço:", error); // Loga o erro no console para depuração
        } finally {
            setIsSubmitting(false); // Define o estado de submissão como falso após a requisição
        }
    }
    

  return (
    <div className="fixed inset-0 bg-black/60 z-60 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900">{service ? 'Editar Serviço' : 'Novo Serviço'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={24} className="text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome do Serviço</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Limpeza de Pele"
              className="w-full p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço (R$)</label>
              <input 
                required
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
                className="w-full p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Duração (min)</label>
              <input 
                required
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="45"
                className="w-full p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {isSubmitting ? 'Salvando...' : service ? 'Atualizar Serviço' : 'Salvar Serviço'}
          </button>
        </form>
      </div>
    </div>
  );
}
