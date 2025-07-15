import { Timestamp } from '@angular/fire/firestore';

export interface BaixaEstoque {
  uid: string; // ID do documento no Firestore
  estoqueItemUid: string; // UID do item de estoque relacionado
  produtoUid: string; // UID do produto relacionado (para facilitar consultas)
  nomeProduto: string; // Nome do produto no momento da baixa. Alterado de `string | null` para `string` já que o item de estoque sempre terá um nome
  loteItemEstoque: string; // Lote do item baixado
  quantidadeBaixada: number;
  motivo: string;
  observacoes?: string; // Opcional
  usuarioResponsavelUid: string | null; // UID do usuário que registrou a baixa. Pode ser string ou null
  usuarioResponsavelNome: string | null; // Nome do usuário que registrou a baixa. Pode ser string ou null
  dataBaixa: Timestamp; // Garante que não é opcional se SEMPRE existir.
}
