import { Timestamp } from '@angular/fire/firestore'; // Importe Timestamp aqui

export interface ItemEstoque {
  id?: string;
  produtoId: string;
  quantidade: number;
  dataValidade?: Timestamp | null; // Definido como Timestamp ou null
  dataCadastro: Timestamp; // Definido como Timestamp (presumindo que sempre existirá)
  dataUltimaEdicao?: Timestamp | null; // Definido como Timestamp ou null
  usuarioQueCadastrou: string;
  usuarioQueEditou?: string;
}
