"use client";

import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.authenticated) {
          // Redireciona baseado no papel do usuário
          if (data.user.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/web/dashboard");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Footix Manager</h1>
          <p className="mt-2 text-gray-600">Faça login para continuar</p>
        </div>

        <div className="space-y-4">
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
