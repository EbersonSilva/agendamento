import { useState, useEffect } from "react";
import { api } from "../service/api";
import { Search, Pencil, Check, X, Phone, User, Loader2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
  phone: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadClients() {
    try {
      setIsLoading(true);
      const response = await api.get("/users");
      setClients(response.data);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setError("Erro ao carregar lista de clientes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditName(client.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function handleSaveEdit(id: number) {
    if (!editName.trim()) return;
    try {
      setIsSaving(true);
      await api.put(`/users/${id}`, { name: editName.trim() });
      setClients(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
      setEditingId(null);
    } catch (err) {
      console.error("Erro ao atualizar nome do cliente:", err);
      alert("Não foi possível salvar o nome do cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const formatPhoneDisplay = (phone: string) => {
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    }
    if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500">
        <Loader2 className="animate-spin" size={28} />
        <span>Carregando lista de clientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-800">Clientes</h1>
        <p className="text-zinc-500 text-sm">Gerencie o cadastro das clientes do estúdio</p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Barra de Busca */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Buscar cliente por nome ou WhatsApp..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm transition-all"
        />
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <div
              key={client.id}
              className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                {editingId === client.id ? (
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-800 text-sm font-medium"
                      autoFocus
                    />
                    <button
                      disabled={isSaving}
                      onClick={() => handleSaveEdit(client.id)}
                      className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      title="Salvar"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-colors"
                      title="Cancelar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 truncate flex items-center gap-1.5">
                      <User size={16} className="text-zinc-400" />
                      {client.name}
                    </h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <Phone size={14} className="text-zinc-400" />
                      {formatPhoneDisplay(client.phone)}
                    </p>
                  </div>
                )}
              </div>

              {editingId !== client.id && (
                <button
                  onClick={() => startEdit(client)}
                  className="text-zinc-600 p-2.5 hover:bg-zinc-100 rounded-xl transition-colors active:scale-95 shrink-0"
                  title="Editar nome"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-zinc-100 rounded-2xl text-zinc-400">
            Nenhuma cliente encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
