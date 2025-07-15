// src/app/pages/usuarios/usuarios.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { User, UserRole } from '../../models/user.model'; // Importar UserRole
import { Observable, Subscription, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  allUsers$!: Observable<User[]>;
  filteredUsers: User[] = [];
  currentUserId: string | null = null;

  searchTerm: string = '';
  selectedRoleFilter: UserRole | '' = '';
  selectedSort: string = 'nome_asc';

  private usersSubscription!: Subscription;
  private filterTrigger = new BehaviorSubject<void>(undefined);

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    this.currentUserId = await this.authService.getCurrentUserUid();

    this.allUsers$ = this.authService.getUsersForAdminView();

    this.usersSubscription = combineLatest([
      this.allUsers$,
      this.filterTrigger.asObservable().pipe(startWith(undefined)),
    ])
      .pipe(
        map(([users, _]) => {
          let tempUsers = [...users];

          if (this.searchTerm) {
            const lowerSearchTerm = this.searchTerm.toLowerCase();
            tempUsers = tempUsers.filter(
              (user) =>
                user.nome.toLowerCase().includes(lowerSearchTerm) ||
                (user.email || '').toLowerCase().includes(lowerSearchTerm) || // Corrigido 'user.email' possibly 'null'
                (user.employeeCode || '')
                  .toLowerCase()
                  .includes(lowerSearchTerm)
            );
          }

          if (this.selectedRoleFilter) {
            tempUsers = tempUsers.filter(
              (user) => user.role === this.selectedRoleFilter
            );
          }

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
            return 0;
          });

          return tempUsers;
        })
      )
      .subscribe((filteredAndSortedUsers) => {
        this.filteredUsers = filteredAndSortedUsers;
      });
  }

  ngOnDestroy(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }

  triggerFilterAndSort(): void {
    this.filterTrigger.next();
  }

  async onRoleChange(user: User): Promise<void> {
    const newRole = user.role; // ngModel já atualiza user.role
    await this.updateUserRole(user, newRole);
  }

  async updateUserRole(user: User, newRole: UserRole): Promise<void> {
    if (user.uid === this.currentUserId) {
      alert('Você não pode alterar sua própria função.');
      this.triggerFilterAndSort(); // Para reverter a seleção visual no dropdown
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
        // A atualização no Firestore irá disparar uma nova emissão em allUsers$
        // que, por sua vez, acionará o combineLatest e o filtro/ordenação,
        // então não precisamos chamar triggerFilterAndSort aqui.
      } catch (error: any) {
        console.error('Erro ao atualizar função do usuário:', error);
        alert(
          `Erro ao atualizar função: ${error.message || 'Erro desconhecido'}`
        );
        this.triggerFilterAndSort(); // Em caso de erro, reverte a seleção visual
      }
    } else {
      this.triggerFilterAndSort(); // Se o usuário cancelar, reverte a seleção visual
    }
  }

  async onDeleteUser(uid: string, nome: string): Promise<void> {
    await this.confirmDeleteUser(uid, nome);
  }

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
        // A exclusão no Firestore irá disparar uma nova emissão em allUsers$
        // que, por sua vez, acionará o combineLatest e o filtro/ordenação,
        // então não precisamos chamar triggerFilterAndSort aqui.
      } catch (error: any) {
        console.error('Erro ao excluir usuário:', error);
        alert(
          `Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`
        );
      }
    }
  }

  formatTimestamp(timestamp: Timestamp | null | undefined): string {
    if (timestamp instanceof Timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
