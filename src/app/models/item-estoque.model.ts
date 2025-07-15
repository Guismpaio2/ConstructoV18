// src/app/models/item-estoque.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface EstoqueItem {
  // Garanta que o nome seja 'EstoqueItem' aqui
  uid: string;
  produtoUid: string;
  nomeProduto: string;
  lote: string;
  quantidade: number;
  dataValidade?: Timestamp | null;
  localizacao?: string;
  dataEntrada: Timestamp;
  dataUltimaEdicao?: Timestamp;
  usuarioUltimaEdicaoUid?: string;
  usuarioUltimaEdicaoNome?: string;
}
