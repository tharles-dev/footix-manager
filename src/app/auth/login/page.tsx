"use client";

import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function LoginPage() {
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
