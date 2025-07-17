// src/app/models/produto.model.ts

import { Timestamp } from '@angular/fire/firestore';

export interface ProdutoFirestore {
  uid?: string;
  nome: string;
  descricao?: string;
  tipo: string;
  marca: string;
  unidadeMedida: string;
  imageUrl?: string;
  dataCadastro: Timestamp; // No Firestore, é um Timestamp
  dataUltimaEdicao?: Timestamp; // No Firestore, é um Timestamp
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
  dataCadastro: Date | null; // No Angular, queremos Date ou null
  dataUltimaEdicao: Date | null; // No Angular, queremos Date ou null
  usuarioUltimaEdicaoUid?: string;
  usuarioUltimaEdicaoNome?: string;
  categoria?: string;
  sku?: string;
}
