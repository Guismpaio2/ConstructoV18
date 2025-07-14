import { Timestamp } from '@angular/fire/firestore';

export interface Baixa {
  id?: string;
  itemEstoqueId: string; // ID do item de estoque que foi baixado
  quantidadeBaixada: number;
  motivo: string;
  dataBaixa: Timestamp; // Data e hora da baixa
  usuarioQueRegistrou: string;
}