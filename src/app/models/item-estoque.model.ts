// src/app/models/item-estoque.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface EstoqueItem {
  uid: string;
  produtoUid: string;
  nomeProduto: string;
  tipoProduto: string;
  lote: string;
  quantidade: number;
  dataValidade: Timestamp | null;
  localizacao: string;
  dataCadastro: Timestamp; // Era 'dataEntrada' no erro
  dataUltimaAtualizacao: Timestamp; // Era 'dataUltimaEdicao' no erro
  usuarioUltimaEdicaoUid: string;
  usuarioUltimaEdicaoNome: string;
  imageUrl?: string;
  sku: string;
  unidadeMedida: string; // ADICIONAR ESTA LINHA
}
