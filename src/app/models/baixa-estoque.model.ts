import firebase from 'firebase/compat/app';

export interface BaixaEstoque {
  id: string;
  itemEstoqueId: string; // Referência ao ID do ItemEstoque que foi baixado
  nomeProduto: string; // Nome do produto baixado para facilitar
  quantidadeBaixada: number; // Obrigatório
  dataBaixa: Date | firebase.firestore.Timestamp; // Obrigatório, auto-preenchido
  usuarioUid: string; // UID do usuário que registrou a baixa
  nomeUsuario: string; // Nome do usuário que registrou a baixa
  motivo?: string; // Opcional: Motivo da baixa (ex: venda, descarte, perda)
  produtoId: string;
}
