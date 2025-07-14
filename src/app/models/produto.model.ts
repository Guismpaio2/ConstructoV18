import { Timestamp } from '@angular/fire/firestore'; // Importe Timestamp aqui

export interface Produto {
  id?: string;
  nome: string;
  lote: string;
  tipo: string;
  marca: string;
  descricao?: string;
  imageUrl?: string;
  dataCadastro: Timestamp; // Mudado para ser explicitamente Timestamp
  dataUltimaEdicao: Timestamp; // Mudado para ser explicitamente Timestamp
  usuarioQueCadastrou: string; // Nome do usuário
  usuarioQueEditou: string; // Nome do usuário
}
