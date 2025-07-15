// src/app/models/baixa-estoque.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface BaixaEstoque {
  uid: string;
  estoqueItemUid: string;
  produtoUid: string;
  nomeProduto: string | null;
  loteItemEstoque: string;
  quantidadeBaixada: number;
  dataBaixa: Timestamp;
  motivo: string;
  observacoes?: string;
  usuarioResponsavelUid: string | null;
  usuarioResponsavelNome: string | null;
}
