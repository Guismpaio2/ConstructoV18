// src/app/models/item-estoque.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface EstoqueItem {
  uid: string;
  produtoUid: string; // ID do produto associado
  nomeProduto: string;
  tipoProduto: string;
  lote: string;
  quantidade: number;
  dataValidade: Timestamp | null;
  localizacao: string;
  dataCadastro: Timestamp; // Data de entrada/cadastro do item no estoque
  dataUltimaAtualizacao: Timestamp; // Data da última atualização/edição do item
  usuarioUltimaEdicaoUid: string;
  usuarioUltimaEdicaoNome: string;
  imageUrl?: string;
  sku: string;
  unidadeMedida: string; // Unidade de medida do item (ex: "un.", "Kg", "m")
}
