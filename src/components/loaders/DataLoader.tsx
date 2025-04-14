import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "./LoadingScreen";

export function DataLoader({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useApp();
  const router = useRouter();
  const [loadingMessage, setLoadingMessage] = useState(
    "Verificando autenticação..."
  );

  useEffect(() => {
    async function checkData() {
      try {
        setLoading(true);

        // 1. Verificar autenticação
        setLoadingMessage("Verificando autenticação...");

        const userResponse = await fetch("/api/user/me");

        if (!userResponse.ok) {
          router.push("/auth/login");
          return;
        }

        const userData = await userResponse.json();

        setUser(userData.user);

        // 2. Verificar servidor
        setLoadingMessage("Verificando servidor...");

        const serverResponse = await fetch("/api/server/assign", {
          method: "POST",
        });

        if (!serverResponse.ok) {
          console.error("Erro na resposta do servidor:", serverResponse.status);
          throw new Error("Falha ao verificar servidor");
        }

        const serverData = await serverResponse.json();

        // Verificar se a resposta tem a estrutura esperada
        if (serverData.error) {
          throw new Error(serverData.error);
        }

        // 3. Se não tem servidor, aguarda próxima tentativa
        if (!serverData.has_server) {
          setLoadingMessage("Aguardando servidor disponível...");
          return;
        }

        // 4. Se não tem clube, redireciona para criação
        if (!serverData.has_club) {
          setLoadingMessage("Redirecionando para criação do clube...");
          router.push(`/server/${serverData.server_id}/club/create`);
          return;
        }

        // 5. Se tem tudo, vai para dashboard
        setLoadingMessage("Redirecionando para o dashboard...");
        router.push("/web/dashboard");
      } catch (error) {
        console.error("Erro ao processar dados:", error);
        // Não redirecionamos para a página de erro, apenas logamos
        setLoadingMessage("Ocorreu um erro. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }

    checkData();
  }, [setUser, setLoading, router]);

  return (
    <>
      <LoadingScreen message={loadingMessage} />
      {children}
    </>
  );
}
