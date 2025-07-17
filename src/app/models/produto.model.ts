// src/app/models/produto.model.ts
export interface Produto {
  uid?: string; // uid pode ser opcional ou string
  nome: string;
  descricao?: string | null; // Adicione | null
  tipo: string;
  marca?: string | null; // Adicione | null
  unidadeMedida: string;
  categoria?: string | null; // Adicione | null
  sku?: string | null; // Adicione | null
  imageUrl?: string | null; // Adicione | null
  dataCadastro: Date;
  dataUltimaEdicao?: Date;
  usuarioUltimaEdicaoUid?: string | null; // Adicione | null
  usuarioUltimaEdicaoNome?: string | null; // Adicione | null
}
