import firebase from 'firebase/compat/app';

export interface User {
  uid: string;
  email: string | null;
  nome: string;
  sobrenome: string;
  employeeCode: string; // Código exclusivo para crachás
  role: 'Administrador' | 'Estoquista' | 'Leitor';
  dataCadastro?: Date | firebase.firestore.Timestamp; // Opcional, para registrar quando o usuário foi criado
}
