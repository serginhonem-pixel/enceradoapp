/**
 * Camada de persistência local (localStorage).
 * Usada no modo demo — mesma interface do firestore.ts
 */
import type { Cliente, Servico, Produto, CustoFixo, AtendimentoOS, FechamentoDia, Agendamento } from "@/types";
import {
  DEMO_CLIENTES, DEMO_SERVICOS, DEMO_PRODUTOS,
  DEMO_CUSTOS, DEMO_ATENDIMENTOS, DEMO_FECHAMENTOS,
} from "./demo-data";

type StoreKey = "clientes" | "servicos" | "produtos" | "custos" | "atendimentos" | "fechamentos" | "agendamentos";

const DEFAULTS: Record<StoreKey, unknown[]> = {
  clientes:     DEMO_CLIENTES,
  servicos:     DEMO_SERVICOS,
  produtos:     DEMO_PRODUTOS,
  custos:       DEMO_CUSTOS,
  atendimentos: DEMO_ATENDIMENTOS,
  fechamentos:  DEMO_FECHAMENTOS,
  agendamentos: [],
};

function load<T>(key: StoreKey): T[] {
  if (typeof window === "undefined") return DEFAULTS[key] as T[];
  try {
    const raw = localStorage.getItem(`lavaapp_${key}`);
    if (!raw) {
      // primeiro acesso: persiste os dados de demo
      localStorage.setItem(`lavaapp_${key}`, JSON.stringify(DEFAULTS[key]));
      return DEFAULTS[key] as T[];
    }
    return JSON.parse(raw) as T[];
  } catch { return DEFAULTS[key] as T[]; }
}

function save<T>(key: StoreKey, data: T[]) {
  localStorage.setItem(`lavaapp_${key}`, JSON.stringify(data));
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export function lsGetClientes(): Cliente[] {
  return load<Cliente>("clientes").sort((a, b) => a.nome.localeCompare(b.nome));
}
export function lsSaveCliente(data: Omit<Cliente, "id" | "tenantId" | "createdAt">, id?: string): string {
  const list = load<Cliente>("clientes");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data };
  } else {
    list.push({ id: uid(), tenantId: "demo", createdAt: new Date(), ...data });
  }
  save("clientes", list);
  return id ?? list[list.length - 1].id;
}
export function lsDeleteCliente(id: string) {
  save("clientes", load<Cliente>("clientes").filter(x => x.id !== id));
}

// ─── SERVIÇOS ────────────────────────────────────────────────────────────────
export function lsGetServicos(): Servico[] {
  return load<Servico>("servicos").sort((a, b) => a.nome.localeCompare(b.nome));
}
export function lsSaveServico(data: Omit<Servico, "id" | "tenantId">, id?: string): string {
  const list = load<Servico>("servicos");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data };
  } else {
    list.push({ id: uid(), tenantId: "demo", ...data });
  }
  save("servicos", list);
  return id ?? list[list.length - 1].id;
}
export function lsDeleteServico(id: string) {
  save("servicos", load<Servico>("servicos").filter(x => x.id !== id));
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
export function lsGetProdutos(): Produto[] {
  return load<Produto>("produtos").sort((a, b) => a.nome.localeCompare(b.nome));
}
export function lsSaveProduto(data: Omit<Produto, "id" | "tenantId">, id?: string): string {
  const list = load<Produto>("produtos");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data };
  } else {
    list.push({ id: uid(), tenantId: "demo", ...data });
  }
  save("produtos", list);
  return id ?? list[list.length - 1].id;
}
export function lsDeleteProduto(id: string) {
  save("produtos", load<Produto>("produtos").filter(x => x.id !== id));
}

// ─── CUSTOS FIXOS ────────────────────────────────────────────────────────────
export function lsGetCustos(): CustoFixo[] {
  return load<CustoFixo>("custos").sort((a, b) => a.descricao.localeCompare(b.descricao));
}
export function lsSaveCusto(data: Omit<CustoFixo, "id" | "tenantId">, id?: string): string {
  const list = load<CustoFixo>("custos");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data };
  } else {
    list.push({ id: uid(), tenantId: "demo", ...data });
  }
  save("custos", list);
  return id ?? list[list.length - 1].id;
}
export function lsDeleteCusto(id: string) {
  save("custos", load<CustoFixo>("custos").filter(x => x.id !== id));
}

// ─── ATENDIMENTOS ────────────────────────────────────────────────────────────
export function lsGetAtendimentos(dataStr?: string): AtendimentoOS[] {
  const list = load<AtendimentoOS>("atendimentos");
  if (!dataStr) return list;
  return list.filter(a => {
    const d = typeof a.createdAt === "string"
      ? (a.createdAt as string).slice(0, 10)
      : new Date(a.createdAt as Date).toISOString().slice(0, 10);
    return d === dataStr;
  });
}
export function lsGetProximoNumeroOS(): number {
  const list = load<AtendimentoOS>("atendimentos");
  if (!list.length) return 1;
  return Math.max(...list.map(a => a.numero ?? 0)) + 1;
}
export function lsSaveAtendimento(data: Omit<AtendimentoOS, "id" | "tenantId">, id?: string): string {
  const list = load<AtendimentoOS>("atendimentos");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data, tenantId: "demo" };
  } else {
    list.unshift({ id: uid(), tenantId: "demo", ...data });
  }
  save("atendimentos", list);
  return id ?? list[0].id;
}
export function lsDeleteAtendimento(id: string) {
  save("atendimentos", load<AtendimentoOS>("atendimentos").filter(x => x.id !== id));
}

// ─── FECHAMENTOS ─────────────────────────────────────────────────────────────
export function lsGetFechamentos(): FechamentoDia[] {
  return load<FechamentoDia>("fechamentos").sort((a, b) => b.data.localeCompare(a.data));
}
export function lsSaveFechamento(data: Omit<FechamentoDia, "id" | "tenantId">): string {
  const list = load<FechamentoDia>("fechamentos");
  const idx = list.findIndex(x => x.data === data.data);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; }
  else { list.unshift({ id: uid(), tenantId: "demo", ...data }); }
  save("fechamentos", list);
  return list[idx >= 0 ? idx : 0].id;
}

// ─── AGENDAMENTOS ─────────────────────────────────────────────────────────────
export function lsGetAgendamentos(): Agendamento[] {
  return load<Agendamento>("agendamentos").sort((a, b) =>
    (a.data + a.hora).localeCompare(b.data + b.hora)
  );
}
export function lsGetAgendamentosDia(data: string): Agendamento[] {
  return lsGetAgendamentos().filter(a => a.data === data);
}
export function lsSaveAgendamento(data: Omit<Agendamento, "id" | "tenantId">, id?: string): string {
  const list = load<Agendamento>("agendamentos");
  if (id) {
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data, tenantId: "demo" };
  } else {
    list.push({ id: uid(), tenantId: "demo", ...data });
  }
  save("agendamentos", list);
  return id ?? list[list.length - 1].id;
}
export function lsDeleteAgendamento(id: string) {
  save("agendamentos", load<Agendamento>("agendamentos").filter(x => x.id !== id));
}
