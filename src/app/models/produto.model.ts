import { Timestamp } from '@angular/fire/firestore';

export interface Produto {
  uid: string; // ID único do produto, gerado pelo Firestore
  nome: string;
  descricao: string;
  tipo: string; // Ex: "Elétrico", "Hidráulico", "Alvenaria"
  marca: string;
  unidadeMedida: string; // Ex: "kg", "metros", "unidade"
  // Imagem do produto (opcional, se for usar Firebase Storage)
  // imageUrl?: string;
  dataCadastro: Timestamp;
  dataUltimaEdicao?: Timestamp; // Opcional, para registrar a última atualização
  usuarioUltimaEdicaoUid?: string; // UID do usuário que editou por último
  usuarioUltimaEdicaoNome?: string; // Nome do usuário que editou por último (para facilitar a exibição)
}
