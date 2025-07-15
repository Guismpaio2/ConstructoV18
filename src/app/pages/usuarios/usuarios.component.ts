// src/app/pages/usuarios/usuarios.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { AuthService } from '../../auth/auth.service';
import { User, UserRole } from '../../models/user.model';
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs'; // Adicionado Subscription, combineLatest, BehaviorSubject
import { map, startWith } from 'rxjs/operators'; // Adicionado startWith
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  allUsers$!: Observable<User[]>; // Observable para todos os usuários do Firestore
  filteredUsers: User[] = []; // Array para os usuários filtrados e ordenados
  currentUserId: string | null = null;

  // Variáveis para filtros e ordenação, vinculadas ao ngModel no HTML
  searchTerm: string = '';
  selectedRoleFilter: UserRole | '' = ''; // Pode ser uma role ou string vazia para "Todas as Roles"
  selectedSort: string = 'nome_asc'; // Valor inicial para ordenação

  private usersSubscription!: Subscription; // Assinatura para gerenciar o stream de usuários
  private filterTrigger = new BehaviorSubject<void>(undefined); // Gatilho para re-filtrar/ordenar

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    this.currentUserId = await this.authService.getCurrentUserUid();

    // Obtém todos os usuários do serviço
    this.allUsers$ = this.authService.getUsersForAdminView();

    // Combina o stream de todos os usuários com o gatilho de filtro/ordenação
    // Sempre que allUsers$ emitir ou filterTrigger for ativado, a lógica de filtro/ordenação será executada
    this.usersSubscription = combineLatest([
      this.allUsers$,
      this.filterTrigger.asObservable().pipe(startWith(undefined)), // startWith para acionar o filtro na inicialização
    ])
      .pipe(
        map(([users, _]) => {
          let tempUsers = [...users]; // Cria uma cópia para não modificar o array original

          // 1. Aplicar filtro de busca (searchTerm)
          if (this.searchTerm) {
            const lowerSearchTerm = this.searchTerm.toLowerCase();
            tempUsers = tempUsers.filter(
              (user) =>
                user.nome.toLowerCase().includes(lowerSearchTerm) ||
                user.email.toLowerCase().includes(lowerSearchTerm) ||
                user.employeeCode?.toLowerCase().includes(lowerSearchTerm)
            );
          }

          // 2. Aplicar filtro de role (selectedRoleFilter)
          if (this.selectedRoleFilter) {
            tempUsers = tempUsers.filter(
              (user) => user.role === this.selectedRoleFilter
            );
          }

          // 3. Aplicar ordenação (selectedSort)
          tempUsers.sort((a, b) => {
            if (this.selectedSort === 'nome_asc') {
              return a.nome.localeCompare(b.nome);
            } else if (this.selectedSort === 'nome_desc') {
              return b.nome.localeCompare(a.nome);
            } else if (this.selectedSort === 'role_asc') {
              return a.role.localeCompare(b.role);
            } else if (this.selectedSort === 'role_desc') {
              return b.role.localeCompare(a.role);
            }
            return 0; // Caso padrão, sem ordenação
          });

          return tempUsers;
        })
      )
      .subscribe((filteredAndSortedUsers) => {
        this.filteredUsers = filteredAndSortedUsers;
      });
  }

  ngOnDestroy(): void {
    // Desinscreve-se da subscription para evitar vazamentos de memória
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }

  // Método chamado pelo HTML para acionar o filtro e a ordenação
  triggerFilterAndSort(): void {
    this.filterTrigger.next(); // Emite um valor para re-acionar o combineLatest
  }

  // Método chamado quando a role de um usuário é alterada no dropdown
  async onRoleChange(user: User): Promise<void> {
    // O valor de user.role já foi atualizado pelo ngModel
    const newRole = user.role;
    await this.updateUserRole(user, newRole);
  }

  // Método existente, renomeado para ser mais genérico e chamado por onRoleChange
  async updateUserRole(user: User, newRole: UserRole): Promise<void> {
    if (user.uid === this.currentUserId) {
      alert('Você não pode alterar sua própria função.');
      // Reverte a seleção no dropdown se for o próprio usuário
      // Isso pode exigir uma busca do usuário original ou um re-patch do formulário.
      // Por simplicidade, o alerta é suficiente por enquanto.
      this.triggerFilterAndSort(); // Para forçar a atualização visual caso a role não mude
      return;
    }
    if (
      confirm(
        `Tem certeza que deseja alterar a função de ${user.nome} para ${newRole}?`
      )
    ) {
      try {
        await this.authService.updateUserRole(user.uid, newRole);
        alert('Função do usuário atualizada com sucesso!');
        // Não precisa re-chamar triggerFilterAndSort aqui, pois o allUsers$ já vai emitir
        // uma nova lista de usuários do Firestore após a atualização.
      } catch (error: any) {
        console.error('Erro ao atualizar função do usuário:', error);
        alert(
          `Erro ao atualizar função: ${error.message || 'Erro desconhecido'}`
        );
        this.triggerFilterAndSort(); // Para reverter a seleção visual em caso de erro
      }
    } else {
      this.triggerFilterAndSort(); // Se o usuário cancelar, reverte a seleção visual
    }
  }

  // Método chamado pelo HTML para confirmar a exclusão
  async onDeleteUser(uid: string, nome: string): Promise<void> {
    await this.confirmDeleteUser(uid, nome);
  }

  // Método existente, renomeado para ser mais genérico e chamado por onDeleteUser
  async confirmDeleteUser(uid: string, nome: string): Promise<void> {
    if (uid === this.currentUserId) {
      alert('Você não pode excluir sua própria conta.');
      return;
    }
    if (
      confirm(
        `Tem certeza que deseja excluir o usuário ${nome}? Esta ação é irreversível e removerá o usuário do sistema.`
      )
    ) {
      try {
        await this.authService.deleteUser(uid);
        alert('Usuário excluído com sucesso (apenas do Firestore).');
        // Não precisa re-chamar triggerFilterAndSort aqui, pois o allUsers$ já vai emitir
        // uma nova lista de usuários do Firestore após a exclusão.
      } catch (error: any) {
        console.error('Erro ao excluir usuário:', error);
        alert(
          `Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`
        );
      }
    }
  }

  // Método auxiliar para formatar Timestamp
  formatTimestamp(timestamp: Timestamp | undefined): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
