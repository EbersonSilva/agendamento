import { useState, useEffect } from "react";
import { api } from "../service/api";
import { Calendar, CheckCircle2, AlertCircle, Loader2, Link2, Unlink } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export function GoogleSettings() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Check connection status
  async function checkStatus() {
    try {
      setIsLoading(true);
      const response = await api.get("/auth/google/status");
      setIsConnected(response.data.connected);
    } catch (err) {
      console.error("Erro ao obter status da integração Google:", err);
      setError("Não foi possível carregar o status da integração.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();

    // Check url search parameters for callback results
    const status = searchParams.get("googleCalendar");
    if (status === "connected") {
      setSuccess("Agenda do Google conectada com sucesso!");
      // Clean query params
      searchParams.delete("googleCalendar");
      setSearchParams(searchParams);
    } else if (status === "error") {
      setError("Erro ao autenticar com o Google. Tente novamente.");
      searchParams.delete("googleCalendar");
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // Connect Google account
  async function handleConnect() {
    try {
      setIsActionLoading(true);
      setError(null);
      const response = await api.get("/auth/google");
      if (response.data.url) {
        // Redirect to Google Consent Screen
        window.location.href = response.data.url;
      } else {
        throw new Error("URL de autenticação não retornada pelo servidor.");
      }
    } catch (err) {
      console.error("Erro ao conectar com Google Calendar:", err);
      setError("Erro ao iniciar conexão com o Google. Verifique o servidor.");
      setIsActionLoading(false);
    }
  }

  // Disconnect Google account
  async function handleDisconnect() {
    if (!confirm("Tem certeza que deseja desconectar sua Agenda do Google? Os novos agendamentos não serão mais sincronizados.")) {
      return;
    }

    try {
      setIsActionLoading(true);
      setError(null);
      await api.post("/auth/google/disconnect");
      setIsConnected(false);
      setSuccess("Integração desconectada com sucesso.");
    } catch (err) {
      console.error("Erro ao desconectar Google Calendar:", err);
      setError("Erro ao desconectar a conta. Tente novamente.");
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-2 text-zinc-500">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm">Carregando status da integração...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Calendar className="text-zinc-600" size={20} />
              Sincronização com Google Agenda
            </h3>
            <p className="text-zinc-500 text-sm">
              Conecte sua conta do Google para sincronizar automaticamente os horários e serviços agendados no estúdio.
            </p>
          </div>

          <div className="shrink-0">
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={14} />
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
                Não conectado
              </span>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm animate-fade-in">
            <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
            <div>{success}</div>
          </div>
        )}

        <div className="border-t border-zinc-100 pt-6">
          {isConnected ? (
            <div className="space-y-4">
              <div className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-xl space-y-2 border border-zinc-100">
                <p className="font-medium text-zinc-800">Como funciona a sincronização ativa:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-500 pl-1">
                  <li>Os agendamentos novos entram na sua agenda com o status <strong className="text-zinc-700">[PENDENTE]</strong>.</li>
                  <li>Assim que você confirmar o agendamento no dashboard, a etiqueta <strong className="text-zinc-700">[PENDENTE]</strong> é removida.</li>
                  <li>Se um agendamento for cancelado ou rejeitado por você, ele é excluído automaticamente da sua agenda do Google.</li>
                </ul>
              </div>

              <button
                disabled={isActionLoading}
                onClick={handleDisconnect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl border border-red-200 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Unlink size={18} />
                )}
                Desconectar Google Agenda
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-zinc-600 space-y-3">
                <p>
                  Ao vincular sua agenda, você poderá ver todos os horários marcados pelas clientes diretamente no seu celular ou computador usando o Google Calendar.
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-1">
                  <p className="font-bold">⚠️ Nota sobre o ambiente local:</p>
                  <p>
                    Para funcionar, é necessário configurar as chaves <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">GOOGLE_CLIENT_ID</code> e <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">GOOGLE_CLIENT_SECRET</code> no seu arquivo <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300">.env</code> do backend.
                  </p>
                </div>
              </div>

              <button
                disabled={isActionLoading}
                onClick={handleConnect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isActionLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Link2 size={18} />
                )}
                Conectar Google Agenda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
