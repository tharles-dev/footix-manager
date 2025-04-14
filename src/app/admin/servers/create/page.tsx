"use client";

import { ServerFormComplete } from "@/components/admin/server-form-complete";

export default function CreateServerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Criar Novo Servidor</h1>
      </div>
      <ServerFormComplete />
    </div>
  );
}
