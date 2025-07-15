// src/app/models/baixa-estoque.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface BaixaEstoque {
  uid: string;
  estoqueItemUid: string;
  produtoUid: string;
  nomeProduto: string;
  loteItemEstoque: string;
  quantidadeBaixada: number;
  motivo: string;
  unidadeMedida: string; // ADICIONAR ESTA LINHA
  observacoes?: string;
  usuarioResponsavelUid: string | null;
  usuarioResponsavelNome: string | null;
  dataBaixa: Timestamp;
}
