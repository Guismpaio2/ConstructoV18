import { Timestamp } from '@angular/fire/firestore';

// Defina os tipos de papel para padronização
export type UserRole = 'Administrador' | 'Estoquista' | 'Leitor';

export interface User {
  uid: string; // User ID do Firebase Authentication
  email: string | null;
  nome: string;
  sobrenome: string;
  employeeCode: string; // Código de funcionário, se aplicável
  role: UserRole; // 'Administrador', 'Estoquista', 'Leitor'
  dataCadastro: Timestamp; // Usar Timestamp do Firestore
  lastLogin: Timestamp; // Usar Timestamp do Firestore
  // Adicione outros campos conforme a necessidade
}
