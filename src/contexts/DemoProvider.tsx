"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { DEMO_TENANT, DEMO_CLIENTES, DEMO_SERVICOS, DEMO_PRODUTOS, DEMO_CUSTOS, DEMO_ATENDIMENTOS, DEMO_FECHAMENTOS } from "@/lib/demo-data";

interface DemoCtx {
  isDemo: boolean;
  tenant: typeof DEMO_TENANT;
  clientes: typeof DEMO_CLIENTES;
  servicos: typeof DEMO_SERVICOS;
  produtos: typeof DEMO_PRODUTOS;
  custos: typeof DEMO_CUSTOS;
  atendimentos: typeof DEMO_ATENDIMENTOS;
  fechamentos: typeof DEMO_FECHAMENTOS;
}

const DemoContext = createContext<DemoCtx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  return (
    <DemoContext.Provider value={{
      isDemo: true,
      tenant: DEMO_TENANT,
      clientes: DEMO_CLIENTES,
      servicos: DEMO_SERVICOS,
      produtos: DEMO_PRODUTOS,
      custos: DEMO_CUSTOS,
      atendimentos: DEMO_ATENDIMENTOS,
      fechamentos: DEMO_FECHAMENTOS,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
