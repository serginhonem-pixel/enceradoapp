import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, Timestamp,
  onSnapshot, QuerySnapshot, DocumentData, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Tenant, Cliente, Servico, Produto, CustoFixo,
  AtendimentoOS, FechamentoDia, Veiculo,
} from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────
function requireDb() {
  if (!db) throw new Error("Firebase não configurado. Crie o arquivo .env.local com as credenciais.");
  return db;
}
function col(tenantId: string, sub: string) {
  return collection(requireDb(), "tenants", tenantId, sub);
}
function docRef(tenantId: string, sub: string, id: string) {
  return doc(requireDb(), "tenants", tenantId, sub, id);
}
function fromTimestamp(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

// ─── TENANT ─────────────────────────────────────────────────────────────────
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const q = query(collection(requireDb(), "tenants"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data(), createdAt: fromTimestamp(d.data().createdAt) } as Tenant;
}

export async function getTenant(id: string): Promise<Tenant | null> {
  const snap = await getDoc(doc(requireDb(), "tenants", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data(), createdAt: fromTimestamp(snap.data()!.createdAt) } as Tenant;
}

export async function createTenant(data: Omit<Tenant, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(requireDb(), "tenants"), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateTenant(id: string, data: Partial<Tenant>) {
  await updateDoc(doc(requireDb(), "tenants", id), data as DocumentData);
}

export async function saveUserTenant(userId: string, tenantId: string) {
  await updateDoc(doc(requireDb(), "users", userId), { tenantId }).catch(async () => {
    await addDoc(collection(requireDb(), "users"), { userId, tenantId });
  });
}

export async function getUserTenant(userId: string): Promise<Tenant | null> {
  const q = query(collection(requireDb(), "users"), where("userId", "==", userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const tenantId = snap.docs[0].data().tenantId as string;
  return getTenant(tenantId);
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export async function getClientes(tenantId: string): Promise<Cliente[]> {
  const snap = await getDocs(query(col(tenantId, "clientes"), orderBy("nome")));
  return snap.docs.map(d => ({
    id: d.id, ...d.data(), createdAt: fromTimestamp(d.data().createdAt),
  })) as Cliente[];
}

export async function saveCliente(tenantId: string, data: Omit<Cliente, "id" | "tenantId" | "createdAt">, id?: string): Promise<string> {
  if (id) {
    await updateDoc(docRef(tenantId, "clientes", id), data as DocumentData);
    return id;
  }
  const ref = await addDoc(col(tenantId, "clientes"), {
    ...data, tenantId, createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function deleteCliente(tenantId: string, id: string) {
  await deleteDoc(docRef(tenantId, "clientes", id));
}

// ─── SERVIÇOS ────────────────────────────────────────────────────────────────
export async function getServicos(tenantId: string): Promise<Servico[]> {
  const snap = await getDocs(query(col(tenantId, "servicos"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Servico[];
}

export async function saveServico(tenantId: string, data: Omit<Servico, "id" | "tenantId">, id?: string): Promise<string> {
  if (id) {
    await updateDoc(docRef(tenantId, "servicos", id), data as DocumentData);
    return id;
  }
  const ref = await addDoc(col(tenantId, "servicos"), { ...data, tenantId });
  return ref.id;
}

export async function deleteServico(tenantId: string, id: string) {
  await deleteDoc(docRef(tenantId, "servicos", id));
}

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
export async function getProdutos(tenantId: string): Promise<Produto[]> {
  const snap = await getDocs(query(col(tenantId, "produtos"), orderBy("nome")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Produto[];
}

export async function saveProduto(tenantId: string, data: Omit<Produto, "id" | "tenantId">, id?: string): Promise<string> {
  if (id) {
    await updateDoc(docRef(tenantId, "produtos", id), data as DocumentData);
    return id;
  }
  const ref = await addDoc(col(tenantId, "produtos"), { ...data, tenantId });
  return ref.id;
}

export async function deleteProduto(tenantId: string, id: string) {
  await deleteDoc(docRef(tenantId, "produtos", id));
}

// ─── CUSTOS FIXOS ────────────────────────────────────────────────────────────
export async function getCustosFixos(tenantId: string): Promise<CustoFixo[]> {
  const snap = await getDocs(query(col(tenantId, "custos_fixos"), orderBy("descricao")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as CustoFixo[];
}

export async function saveCustoFixo(tenantId: string, data: Omit<CustoFixo, "id" | "tenantId">, id?: string): Promise<string> {
  if (id) {
    await updateDoc(docRef(tenantId, "custos_fixos", id), data as DocumentData);
    return id;
  }
  const ref = await addDoc(col(tenantId, "custos_fixos"), { ...data, tenantId });
  return ref.id;
}

export async function deleteCustoFixo(tenantId: string, id: string) {
  await deleteDoc(docRef(tenantId, "custos_fixos", id));
}

// ─── ATENDIMENTOS ────────────────────────────────────────────────────────────
export async function getAtendimentos(tenantId: string, dataStr?: string): Promise<AtendimentoOS[]> {
  let q = query(col(tenantId, "atendimentos"), orderBy("createdAt", "desc"), limit(200));
  if (dataStr) {
    const start = new Date(dataStr + "T00:00:00");
    const end = new Date(dataStr + "T23:59:59");
    q = query(
      col(tenantId, "atendimentos"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end)),
      orderBy("createdAt", "desc"),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id, ...d.data(),
    createdAt: fromTimestamp(d.data().createdAt),
    updatedAt: fromTimestamp(d.data().updatedAt),
    concluidoAt: d.data().concluidoAt ? fromTimestamp(d.data().concluidoAt) : undefined,
  })) as AtendimentoOS[];
}

export async function getProximoNumeroOS(tenantId: string): Promise<number> {
  const snap = await getDocs(
    query(col(tenantId, "atendimentos"), orderBy("numero", "desc"), limit(1))
  );
  if (snap.empty) return 1;
  return (snap.docs[0].data().numero ?? 0) + 1;
}

export async function saveAtendimento(tenantId: string, data: Omit<AtendimentoOS, "id" | "tenantId">, id?: string): Promise<string> {
  const payload = {
    ...data,
    tenantId,
    createdAt: data.createdAt instanceof Date ? Timestamp.fromDate(data.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
    concluidoAt: data.concluidoAt ? Timestamp.fromDate(data.concluidoAt) : null,
  };
  if (id) {
    await updateDoc(docRef(tenantId, "atendimentos", id), payload as DocumentData);
    return id;
  }
  const ref = await addDoc(col(tenantId, "atendimentos"), payload);
  return ref.id;
}

export async function deleteAtendimento(tenantId: string, id: string) {
  await deleteDoc(docRef(tenantId, "atendimentos", id));
}

// ─── FECHAMENTO ──────────────────────────────────────────────────────────────
export async function getFechamentos(tenantId: string): Promise<FechamentoDia[]> {
  const snap = await getDocs(query(col(tenantId, "fechamentos"), orderBy("data", "desc"), limit(90)));
  return snap.docs.map(d => ({
    id: d.id, ...d.data(), fechadoEm: fromTimestamp(d.data().fechadoEm),
  })) as FechamentoDia[];
}

export async function saveFechamento(tenantId: string, data: Omit<FechamentoDia, "id" | "tenantId">): Promise<string> {
  const ref = await addDoc(col(tenantId, "fechamentos"), {
    ...data, tenantId, fechadoEm: Timestamp.now(),
  });
  return ref.id;
}
