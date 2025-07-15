import { Timestamp } from '@angular/fire/firestore';

export interface EstoqueItem {
  uid: string;
  produtoUid: string;
  nomeProduto: string; // Adicionado para facilitar, vem do Produto
  tipoProduto: string; // Adicionado para facilitar, vem do Produto
  lote: string;
  quantidade: number;
  dataValidade: Timestamp | null; // Pode ser nulo se o produto não tiver validade
  localizacao: string;
  dataCadastro: Timestamp; // Era 'dataEntrada' no erro
  dataUltimaAtualizacao: Timestamp; // Era 'dataUltimaEdicao' no erro
  usuarioUltimaEdicaoUid: string;
  usuarioUltimaEdicaoNome: string;
  imageUrl?: string; // Opcional, vem do Produto
}
