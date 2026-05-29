// ─── TENANT ──────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  slug: string;           // subdomínio: "sopinha" → sopinha.lavaapp.com.br
  nome: string;
  logoUrl?: string;
  corPrimaria?: string;
  telefone?: string;
  endereco?: string;
  createdAt: Date;
  ativo: boolean;
}

// ─── USUÁRIO ─────────────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  papel: "admin" | "operador";
  createdAt: Date;
}

// ─── CLIENTE ─────────────────────────────────────────────────────────────────
export interface Cliente {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  cpf?: string;
  email?: string;
  veiculos: Veiculo[];
  createdAt: Date;
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  ano?: string;
}

// ─── SERVIÇO ─────────────────────────────────────────────────────────────────
export interface ConsumívelServico {
  nome: string;       // ex: "Shampoo", "Cera"
  quantidade: number; // ex: 0.1
  unidade: string;    // ex: "L", "ml", "un"
  custoUnitario: number;
}

export interface Servico {
  id: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMin: number;
  ativo: boolean;
  // Custos do serviço
  custoMaoObra?: number;      // custo de mão de obra (R$)
  consumiveis?: ConsumívelServico[]; // insumos utilizados
  // calculado: preco - custoMaoObra - total consumíveis = margem
}

// ─── PRODUTO ─────────────────────────────────────────────────────────────────
export interface Produto {
  id: string;
  tenantId: string;
  nome: string;
  unidade: string;      // "un", "L", "kg"
  estoque: number;
  estoqueMinimo: number;
  precoCusto: number;
  ativo: boolean;
}

// ─── CUSTO FIXO ──────────────────────────────────────────────────────────────
export interface CustoFixo {
  id: string;
  tenantId: string;
  descricao: string;
  valor: number;
  vencimentoDia: number; // dia do mês
  ativo: boolean;
}

// ─── ATENDIMENTO (ORDEM DE SERVIÇO) ──────────────────────────────────────────
export type StatusOS = "aguardando" | "em_andamento" | "concluido" | "cancelado";

export interface ItemOS {
  servicoId: string;
  servicoNome: string;
  preco: number;
}

export interface AtendimentoOS {
  id: string;
  tenantId: string;
  numero: number;
  clienteId: string;
  clienteNome: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  veiculoCor: string;
  itens: ItemOS[];
  total: number;
  desconto: number;
  totalFinal: number;
  formaPagamento: string;
  status: StatusOS;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  concluidoAt?: Date;
  // Agendamento
  agendadoPara?: string;  // ISO string: "2025-06-10T09:00"
  agendadoHora?: string;  // "09:00"
}

// ─── AGENDAMENTO ──────────────────────────────────────────────────────────────
export interface Agendamento {
  id: string;
  tenantId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  veiculoCor: string;
  servicoIds: string[];
  servicoNomes: string[];
  totalEstimado: number;
  data: string;       // "2025-06-10"
  hora: string;       // "09:00"
  observacoes?: string;
  status: "agendado" | "confirmado" | "cancelado" | "convertido";
  osId?: string;      // OS gerada ao converter
  createdAt: Date;
}

// ─── FECHAMENTO DO DIA ────────────────────────────────────────────────────────
export interface FechamentoDia {
  id: string;
  tenantId: string;
  data: string;          // "2025-01-15"
  totalAtendimentos: number;
  totalBruto: number;
  totalDescontos: number;
  totalLiquido: number;
  totalCustos: number;
  lucroEstimado: number;
  fechadoEm: Date;
}
