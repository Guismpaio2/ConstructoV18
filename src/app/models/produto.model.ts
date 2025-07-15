// src/app/models/produto.model.ts
import { Timestamp } from '@angular/fire/firestore';

export interface Produto {
  uid: string; // ID único do produto, gerado pelo Firestore
  nome: string;
  descricao: string;
  tipo: string; // Ex: "Elétrico", "Hidráulico", "Alvenaria"
  marca: string;
  unidadeMedida: string; // Ex: "kg", "metros", "unidade"
  imageUrl?: string; // Imagem do produto (opcional, se for usar Firebase Storage)
  dataCadastro: Timestamp;
  dataUltimaEdicao?: Timestamp; // <--- JÁ ESTÁ AQUI COMO dataUltimaEdicao
  usuarioUltimaEdicaoUid?: string; // UID do usuário que editou por último
  usuarioUltimaEdicaoNome?: string; // Nome do usuário que editou por último (para facilitar a exibição)
  categoria?: string; // Adicionado para corrigir o erro
  sku?: string; // Adicionado para corrigir o erro
}
