// src/app/models/produto.model.ts

// Remova a importação de Timestamp, pois não usaremos mais para ProdutoFirestore
// import { Timestamp } from '@angular/fire/firestore';

export interface ProdutoFirestore {
  uid?: string;
  nome: string;
  descricao?: string;
  tipo: string;
  marca: string;
  unidadeMedida: string;
  imageUrl?: string;
  // Alterado para string, conforme seus dados no Firestore
  dataCadastro: string;
  // Alterado para string, conforme seus dados no Firestore
  dataUltimaEdicao?: string;
  usuarioUltimaEdicaoUid?: string;
  usuarioUltimaEdicaoNome?: string;
  categoria?: string;
  sku?: string;
}

export interface Produto {
  uid?: string;
  nome: string;
  descricao?: string;
  tipo: string;
  marca: string;
  unidadeMedida: string;
  imageUrl?: string;
  // No Angular, queremos Date ou null
  dataCadastro: Date | null;
  // No Angular, queremos Date ou null
  dataUltimaEdicao: Date | null;
  usuarioUltimaEdicaoUid?: string;
  usuarioUltimaEdicaoNome?: string;
  categoria?: string;
  sku?: string;
}
