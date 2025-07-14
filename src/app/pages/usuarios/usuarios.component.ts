import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service'; // User now comes from auth.service or models/user.model
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit, OnDestroy {
  users$!: Observable<User[]>;
  filteredUsers: User[] = [];
  private usersSubscription!: Subscription;
  currentUserId: string | null = null; // Para desabilitar edição da própria role

  searchTerm: string = '';
  selectedRoleFilter: '' | 'Administrador' | 'Estoquista' | 'Leitor' = '';
  selectedSort: string = 'nome_asc';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Obter o UID do usuário logado para desabilitar a edição da própria role
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      this.currentUserId = user ? user.uid : null;
    });

    this.users$ = this.authService.getUsersForAdminView(); // Agora este método está implementado

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

  applyFilter(): void {
    this.users$.pipe(take(1)).subscribe((users) => {
      this.applyFilterAndSort(users);
    });
  }

  applySort(): void {
    this.users$.pipe(take(1)).subscribe((users) => {
      this.applyFilterAndSort(users);
    });
  }

  onRoleChange(user: User): void {
    // Certifique-se de que o usuário logado não está tentando mudar a própria role
    if (user.uid === this.currentUserId) {
      alert('Você não pode alterar sua própria permissão através desta tela.');
      // Reverter a mudança no UI, se necessário
      // user.role = // role original; você precisaria armazenar a role original antes da mudança
      return;
    }

    if (
      confirm(
        `Tem certeza que deseja alterar a role de ${user.nome} para ${user.role}?`
      )
    ) {
      // Chamar um método no AuthService para atualizar a role no Firestore
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
      // Opcional: Reverter a alteração no UI se o usuário cancelar
      // Você precisaria de uma cópia da role original para fazer isso.
    }
  }

  onDeleteUser(uid: string): void {
    if (uid === this.currentUserId) {
      alert('Você não pode excluir sua própria conta através desta tela.');
      return;
    }
    if (
      confirm(
        'Tem certeza que deseja excluir este usuário? Esta ação é irreversível.'
      )
    ) {
      // Chamar um método no AuthService para excluir o usuário (Firestore e Auth)
      // **Atenção**: Excluir usuários do Firebase Auth no frontend é geralmente desaconselhado.
      // É mais seguro fazer isso via Cloud Functions ou um backend seguro para evitar abusos.
      // Para fins de demonstração, podemos adicionar aqui, mas tenha isso em mente.
      this.authService
        .deleteUser(uid) // Você precisará criar este método no AuthService
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
}
