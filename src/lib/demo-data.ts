import type { Tenant, Cliente, Servico, Produto, CustoFixo, AtendimentoOS, FechamentoDia } from "@/types";

export const DEMO_TENANT: Tenant = {
  id: "demo",
  slug: "demo",
  nome: "Sopinha Lava-Jato",
  logoUrl: undefined,
  telefone: "(11) 98765-4321",
  endereco: "Rua das Palmeiras, 123 - Vila Nova",
  createdAt: new Date(),
  ativo: true,
};

export const DEMO_CLIENTES: Cliente[] = [
  { id: "c1", tenantId: "demo", nome: "João Silva",    telefone: "(11) 99111-1111", email: "joao@email.com",  cpf: "123.456.789-00", veiculos: [{ id: "v1", tipo: "carro" as const, placa: "ABC-1234", modelo: "Civic",    cor: "Prata",  ano: "2021" }], createdAt: new Date() },
  { id: "c2", tenantId: "demo", nome: "Maria Souza",   telefone: "(11) 99222-2222", email: "maria@email.com", cpf: "987.654.321-00", veiculos: [{ id: "v2", tipo: "carro" as const, placa: "DEF-5678", modelo: "HB20",     cor: "Branco", ano: "2022" }, { id: "v3", tipo: "carro" as const, placa: "GHI-9012", modelo: "Onix", cor: "Preto", ano: "2020" }], createdAt: new Date() },
  { id: "c3", tenantId: "demo", nome: "Carlos Pereira",telefone: "(11) 99333-3333", email: undefined,         cpf: undefined,        veiculos: [{ id: "v4", tipo: "carro" as const, placa: "JKL-3456", modelo: "Corolla",  cor: "Cinza",  ano: "2023" }], createdAt: new Date() },
  { id: "c4", tenantId: "demo", nome: "Ana Costa",     telefone: "(11) 99444-4444", email: "ana@email.com",   cpf: "111.222.333-44", veiculos: [{ id: "v5", tipo: "carro" as const, placa: "MNO-7890", modelo: "Argo",     cor: "Azul",   ano: "2022" }], createdAt: new Date() },
  { id: "c5", tenantId: "demo", nome: "Pedro Alves",   telefone: "(11) 99555-5555", email: undefined,         cpf: undefined,        veiculos: [{ id: "v6", tipo: "moto"  as const, placa: "PQR-1122", modelo: "Sandero",  cor: "Vermelho", ano: "2021" }], createdAt: new Date() },
];

export const DEMO_SERVICOS: Servico[] = [
  { id: "s1", tenantId: "demo", nome: "Lavagem Simples",   descricao: "Lavagem externa + aspiração",          preco: 35,  duracaoMin: 30,  ativo: true  },
  { id: "s2", tenantId: "demo", nome: "Lavagem Completa",  descricao: "Lavagem + aspiração + cera + pretinho", preco: 65,  duracaoMin: 60,  ativo: true  },
  { id: "s3", tenantId: "demo", nome: "Polimento",         descricao: "Polimento técnico com máquina",         preco: 150, duracaoMin: 120, ativo: true  },
  { id: "s4", tenantId: "demo", nome: "Higienização",      descricao: "Higienização completa do interior",     preco: 200, duracaoMin: 180, ativo: true  },
  { id: "s5", tenantId: "demo", nome: "Lavagem de Motor",  descricao: "Limpeza do compartimento do motor",     preco: 80,  duracaoMin: 45,  ativo: true  },
  { id: "s6", tenantId: "demo", nome: "Cristalização",     descricao: "Cristalização de vidros",               preco: 120, duracaoMin: 90,  ativo: false },
];

export const DEMO_PRODUTOS: Produto[] = [
  { id: "p1", tenantId: "demo", nome: "Shampoo Automotivo",  unidade: "L",  estoque: 5,  estoqueMinimo: 2, precoCusto: 18,  ativo: true  },
  { id: "p2", tenantId: "demo", nome: "Cera Liquida",        unidade: "L",  estoque: 1,  estoqueMinimo: 2, precoCusto: 35,  ativo: true  },
  { id: "p3", tenantId: "demo", nome: "Pretinho para pneu",  unidade: "un", estoque: 8,  estoqueMinimo: 3, precoCusto: 12,  ativo: true  },
  { id: "p4", tenantId: "demo", nome: "Flanela de microfibra",unidade: "un", estoque: 15, estoqueMinimo: 5, precoCusto: 8,   ativo: true  },
  { id: "p5", tenantId: "demo", nome: "Desengordurante",     unidade: "ml", estoque: 0,  estoqueMinimo: 1, precoCusto: 22,  ativo: true  },
];

export const DEMO_CUSTOS: CustoFixo[] = [
  { id: "cf1", tenantId: "demo", descricao: "Aluguel",       valor: 1500, vencimentoDia: 5,  ativo: true },
  { id: "cf2", tenantId: "demo", descricao: "Água",          valor: 250,  vencimentoDia: 10, ativo: true },
  { id: "cf3", tenantId: "demo", descricao: "Luz",           valor: 180,  vencimentoDia: 15, ativo: true },
  { id: "cf4", tenantId: "demo", descricao: "Internet",      valor: 120,  vencimentoDia: 20, ativo: true },
  { id: "cf5", tenantId: "demo", descricao: "Contador",      valor: 350,  vencimentoDia: 25, ativo: true },
];

const hoje = new Date().toISOString().split("T")[0];

export const DEMO_ATENDIMENTOS: AtendimentoOS[] = [
  { id: "a1", tenantId: "demo", numero: 1, clienteId: "c1", clienteNome: "João Silva",     veiculoPlaca: "ABC-1234", veiculoModelo: "Civic",   veiculoCor: "Prata",  itens: [{ servicoId: "s2", servicoNome: "Lavagem Completa", preco: 65 }], total: 65,  desconto: 0,  totalFinal: 65,  formaPagamento: "pix",      status: "concluido",    createdAt: new Date(), updatedAt: new Date(), concluidoAt: new Date() },
  { id: "a2", tenantId: "demo", numero: 2, clienteId: "c2", clienteNome: "Maria Souza",    veiculoPlaca: "DEF-5678", veiculoModelo: "HB20",    veiculoCor: "Branco", itens: [{ servicoId: "s1", servicoNome: "Lavagem Simples",  preco: 35 }], total: 35,  desconto: 5,  totalFinal: 30,  formaPagamento: "dinheiro", status: "concluido",    createdAt: new Date(), updatedAt: new Date(), concluidoAt: new Date() },
  { id: "a3", tenantId: "demo", numero: 3, clienteId: "c3", clienteNome: "Carlos Pereira", veiculoPlaca: "JKL-3456", veiculoModelo: "Corolla", veiculoCor: "Cinza",  itens: [{ servicoId: "s3", servicoNome: "Polimento",         preco: 150}], total: 150, desconto: 0,  totalFinal: 150, formaPagamento: "credito",  status: "em_andamento", createdAt: new Date(), updatedAt: new Date() },
  { id: "a4", tenantId: "demo", numero: 4, clienteId: "c4", clienteNome: "Ana Costa",      veiculoPlaca: "MNO-7890", veiculoModelo: "Argo",    veiculoCor: "Azul",   itens: [{ servicoId: "s2", servicoNome: "Lavagem Completa", preco: 65 }], total: 65,  desconto: 0,  totalFinal: 65,  formaPagamento: "debito",   status: "aguardando",   createdAt: new Date(), updatedAt: new Date() },
];

export const DEMO_FECHAMENTOS: FechamentoDia[] = [
  { id: "f1", tenantId: "demo", data: hoje, totalAtendimentos: 8, totalBruto: 520, totalDescontos: 25, totalLiquido: 495, totalCustos: 79.67, lucroEstimado: 415.33, fechadoEm: new Date() },
  ...Array.from({ length: 20 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i - 1);
    const ds = d.toISOString().split("T")[0];
    const atend = 5 + Math.floor(Math.random() * 8);
    const liq   = atend * (45 + Math.floor(Math.random() * 40));
    return { id: `f${i+2}`, tenantId: "demo", data: ds, totalAtendimentos: atend, totalBruto: liq + 30, totalDescontos: 30, totalLiquido: liq, totalCustos: 79.67, lucroEstimado: liq - 79.67, fechadoEm: d };
  }),
];
