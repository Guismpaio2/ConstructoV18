import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  editableUser: Partial<User> = {}; // Objeto para armazenar as edições temporariamente
  isEditing: boolean = false;
  message: string = '';
  isSuccess: boolean = false;

  private userSubscription!: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        // Copia os dados do usuário para o objeto editável
        this.editableUser = { ...user };
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onEdit(): void {
    this.isEditing = true;
    this.message = ''; // Limpa mensagens anteriores
  }

  async onSave(): Promise<void> {
    if (
      !this.currentUser ||
      !this.editableUser.nome ||
      !this.editableUser.sobrenome
    ) {
      this.message = 'Nome e sobrenome são obrigatórios.';
      this.isSuccess = false;
      return;
    }

    try {
      await this.authService.updateUserData(
        // Você precisará criar este método no AuthService
        this.currentUser.uid,
        {
          nome: this.editableUser.nome,
          sobrenome: this.editableUser.sobrenome,
        }
      );
      this.message = 'Perfil atualizado com sucesso!';
      this.isSuccess = true;
      this.isEditing = false; // Sai do modo de edição
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      this.message = 'Erro ao atualizar perfil. Tente novamente.';
      this.isSuccess = false;
    }
  }

  onCancel(): void {
    this.isEditing = false;
    // Restaura os dados editáveis para os dados originais do usuário
    if (this.currentUser) {
      this.editableUser = { ...this.currentUser };
    }
    this.message = ''; // Limpa mensagens
  }
}
