import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "./LoadingScreen";

export function DataLoader({ children }: { children: React.ReactNode }) {
  const {
    user,
    server,
    club,
    setUser,
    setServer,
    setClub,
    loading,
    setLoading,
  } = useApp();
  const router = useRouter();
  const [loadingMessage, setLoadingMessage] = useState(
    "Verificando autenticação..."
  );
  const [initialized, setInitialized] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    async function checkData() {
      if (redirecting) return;

      try {
        setLoading(true);
        console.log("Iniciando verificação de dados...");

        // 1. Verificar autenticação
        setLoadingMessage("Verificando autenticação...");
        console.log("Buscando dados do usuário...");

        const userResponse = await fetch("/api/user/me");

        if (!userResponse.ok) {
          console.log("Usuário não autenticado, redirecionando para login...");
          setRedirecting(true);
          router.push("/auth/login");
          return;
        }

        const userData = await userResponse.json();
        console.log("Dados do usuário recebidos:", userData);

        if (!userData.data?.user) {
          console.error("Dados do usuário inválidos:", userData);
          throw new Error("Dados do usuário inválidos");
        }

        setUser(userData.data.user);

        // Se o usuário tem um clube, atualiza no contexto
        if (userData.data.club) {
          console.log("Clube encontrado, atualizando contexto...");
          setClub(userData.data.club);
        }

        // 2. Verificar servidor
        setLoadingMessage("Verificando servidor...");
        console.log("Verificando atribuição de servidor...");

        const serverResponse = await fetch("/api/server/assign", {
          method: "POST",
        });

        if (!serverResponse.ok) {
          console.error("Erro na resposta do servidor:", serverResponse.status);
          throw new Error("Falha ao verificar servidor");
        }

        const serverData = await serverResponse.json();
        console.log("Dados do servidor recebidos:", serverData);

        // Verificar se a resposta tem a estrutura esperada
        if (serverData.error) {
          throw new Error(serverData.error);
        }

        // Atualiza o servidor no contexto se disponível
        if (serverData.server) {
          console.log("Servidor encontrado, atualizando contexto...");
          setServer(serverData.server);
        }

        // 3. Se não tem servidor, aguarda próxima tentativa
        if (!serverData.has_server) {
          console.log("Aguardando servidor disponível...");
          setLoadingMessage("Aguardando servidor disponível...");
          return;
        }

        // 4. Se não tem clube, redireciona para criação
        if (!serverData.has_club) {
          console.log("Redirecionando para criação do clube...");
          setLoadingMessage("Redirecionando para criação do clube...");
          setRedirecting(true);
          router.push(`/server/${serverData.server_id}/club/create`);
          return;
        }

        // 5. Se tem tudo, vai para dashboard
        console.log("Redirecionando para o dashboard...");
        setLoadingMessage("Redirecionando para o dashboard...");
        setRedirecting(true);
        router.push("/web/dashboard");
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        setLoadingMessage("Ocorreu um erro. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }

    // Só executa o checkData se não foi inicializado ainda
    if (!initialized && !redirecting && (!user || !server || !club)) {
      checkData();
    } else {
      setLoading(false);
    }
  }, [
    initialized,
    redirecting,
    user,
    server,
    club,
    setUser,
    setServer,
    setClub,
    setLoading,
    router,
  ]);

  if (loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return children;
}
