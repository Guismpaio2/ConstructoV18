import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { User, UserRole } from '../../models/user.model'; // Importa User e UserRole

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  users$!: Observable<User[]>; // Observable que obtém todos os usuários do serviço
  filteredUsers: User[] = []; // Array que armazena os usuários filtrados e ordenados para exibição
  private usersSubscription!: Subscription;
  currentUserId: string | null = null; // Para desabilitar edição da própria role

  searchTerm: string = '';
  selectedRoleFilter: '' | UserRole = ''; // Usa o tipo UserRole
  selectedSort: string = 'nome_asc';

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    // Obter o UID do usuário logado para desabilitar a edição da própria role
    // Usamos async/await aqui para obter o UID de forma síncrona na inicialização
    this.currentUserId = await this.authService.getCurrentUserUid();

    this.users$ = this.authService.getUsersForAdminView();

    // Assina o observable de usuários para aplicar filtros e ordenação
    this.usersSubscription = this.users$.subscribe((users) => {
      this.applyFilterAndSort(users);
    });
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }

  applyFilterAndSort(users: User[]): void {
    let tempUsers = [...users];

    // 1. Filtrar
    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      tempUsers = tempUsers.filter(
        (user) =>
          user.nome.toLowerCase().includes(lowerCaseSearch) ||
          user.sobrenome.toLowerCase().includes(lowerCaseSearch) ||
          user.email?.toLowerCase().includes(lowerCaseSearch) ||
          user.employeeCode.toLowerCase().includes(lowerCaseSearch)
      );
    }

    if (this.selectedRoleFilter) {
      tempUsers = tempUsers.filter(
        (user) => user.role === this.selectedRoleFilter
      );
    }

    // 2. Ordenar
    switch (this.selectedSort) {
      case 'nome_asc':
        tempUsers.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'nome_desc':
        tempUsers.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      case 'role_asc':
        tempUsers.sort((a, b) => a.role.localeCompare(b.role));
        break;
      case 'role_desc':
        tempUsers.sort((a, b) => b.role.localeCompare(a.role));
        break;
      default:
        break;
    }
    this.filteredUsers = tempUsers;
  }

  // Métodos chamados pelo UI para aplicar filtros/ordenação
  triggerFilterAndSort(): void {
    // Obtém o valor atual de users$ e aplica o filtro/ordenação
    this.users$.pipe(take(1)).subscribe((users) => {
      this.applyFilterAndSort(users);
    });
  }

  onRoleChange(user: User): void {
    // Certifique-se de que o usuário logado não está tentando mudar a própria role
    if (user.uid === this.currentUserId) {
      alert('Você não pode alterar sua própria permissão através desta tela.');
      // Para reverter a mudança no UI, se a role já tiver sido atualizada
      // na interface antes da confirmação, você precisaria armazenar a role
      // original ou recarregar os dados. Por simplicidade, confiamos no alerta.
      return;
    }

    if (
      confirm(
        `Tem certeza que deseja alterar a role de ${user.nome} para ${user.role}?`
      )
    ) {
      this.authService
        .updateUserRole(user.uid, user.role)
        .then(() => {
          console.log(`Role de ${user.nome} atualizada para ${user.role}`);
          alert(`Role de ${user.nome} atualizada para ${user.role}.`);
        })
        .catch((error) => {
          console.error('Erro ao atualizar role:', error);
          alert('Erro ao atualizar role. Verifique as permissões.');
        });
    } else {
      // Se o usuário cancelar, reverte a seleção no dropdown para o valor original
      // Para isso, você precisaria de uma forma de saber a role anterior.
      // Uma abordagem simples é recarregar a lista ou ter uma cópia do objeto User antes da mudança.
      // Neste caso, se o usuário cancelar, o valor no UI permanece o que ele selecionou,
      // mas o backend não será atualizado. Ao recarregar a página, o valor correto será exibido.
      this.users$.pipe(take(1)).subscribe((users) => {
        const originalUser = users.find((u) => u.uid === user.uid);
        if (originalUser) {
          user.role = originalUser.role; // Reverte a role no objeto local
        }
      });
    }
  }

  onDeleteUser(uid: string, userName: string): void {
    if (uid === this.currentUserId) {
      alert('Você não pode excluir sua própria conta através desta tela.');
      return;
    }
    if (
      confirm(
        `Tem certeza que deseja excluir o usuário ${userName}? Esta ação é irreversível e excluirá o usuário do Firestore.`
      )
    ) {
      this.authService
        .deleteUser(uid)
        .then(() => {
          console.log('Usuário excluído com sucesso!');
          alert('Usuário excluído com sucesso!');
        })
        .catch((error) => {
          console.error('Erro ao excluir usuário:', error);
          alert(
            'Erro ao excluir usuário. Verifique as permissões e tente novamente.'
          );
        });
    }
  }

  // Função para formatar o Timestamp para exibição
  formatTimestamp(timestamp: any): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR'); // Ex: DD/MM/YYYY
    }
    return '';
  }
}
