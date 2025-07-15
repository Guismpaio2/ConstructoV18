// src/app/pages/perfil/perfil.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../models/user.model';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importar FormBuilder, FormGroup, Validators
import { take } from 'rxjs/operators'; // Importar take
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit, OnDestroy {
  user$!: Observable<User | null | undefined>; // Observable do usuário autenticado
  currentUser: User | null | undefined; // Variável para armazenar o usuário atual
  perfilForm!: FormGroup; // FormGroup para o formulário de perfil
  isEditing: boolean = false; // Estado para controlar o modo de edição
  message: string = ''; // Mensagem de feedback para o usuário
  isSuccess: boolean = false; // Indica se a mensagem de feedback é de sucesso ou erro

  private userSubscription!: Subscription; // Assinatura para o user$

  constructor(private authService: AuthService, private fb: FormBuilder) {} // Injetar FormBuilder

  ngOnInit(): void {
    // Inicializa o formulário com validadores
    this.perfilForm = this.fb.group({
      email: [
        { value: '', disabled: true },
        [Validators.required, Validators.email],
      ], // Email geralmente não é editável diretamente
      nome: ['', Validators.required],
      sobrenome: [''],
      employeeCode: [''], // Não é obrigatório para todos os usuários
    });

    // Assina o Observable user$ para obter os dados do usuário
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user; // Armazena o usuário na variável para uso no template
      if (user) {
        // Preenche o formulário com os dados do usuário
        this.perfilForm.patchValue({
          email: user.email,
          nome: user.nome,
          sobrenome: user.sobrenome,
          employeeCode: user.employeeCode,
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Garante que a subscription seja desinscrita para evitar vazamentos de memória
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onEdit(): void {
    this.isEditing = true;
    this.message = ''; // Limpa qualquer mensagem anterior
    // Habilita os campos que podem ser editados (nome, sobrenome, employeeCode)
    this.perfilForm.get('nome')?.enable();
    this.perfilForm.get('sobrenome')?.enable();
    this.perfilForm.get('employeeCode')?.enable();
  }

  async onSave(): Promise<void> {
    this.message = ''; // Limpa mensagens anteriores
    if (this.perfilForm.valid && this.currentUser) {
      try {
        const updatedData: Partial<User> = {
          nome: this.perfilForm.get('nome')?.value,
          sobrenome: this.perfilForm.get('sobrenome')?.value,
          employeeCode: this.perfilForm.get('employeeCode')?.value,
          // Não atualize email ou role diretamente por aqui, use métodos específicos se necessário
        };

        // Chama o serviço para atualizar o usuário
        // O método createOrUpdateUserData do AuthService já lida com o merge e UID
        // O currentUser já possui o UID necessário
        await this.authService.createOrUpdateUserData({
          ...this.currentUser,
          ...updatedData,
        } as User);

        this.isEditing = false;
        this.isSuccess = true;
        this.message = 'Perfil atualizado com sucesso!';
        // Desabilita os campos após salvar
        this.perfilForm.get('nome')?.disable();
        this.perfilForm.get('sobrenome')?.disable();
        this.perfilForm.get('employeeCode')?.disable();
      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        this.isSuccess = false;
        this.message = 'Erro ao atualizar perfil. Tente novamente.';
      }
    } else {
      this.isSuccess = false;
      this.message = 'Por favor, preencha os campos obrigatórios corretamente.';
    }
  }

  onCancel(): void {
    this.isEditing = false;
    this.message = ''; // Limpa a mensagem
    // Reseta o formulário para os valores originais do currentUser
    if (this.currentUser) {
      this.perfilForm.patchValue({
        email: this.currentUser.email,
        nome: this.currentUser.nome,
        sobrenome: this.currentUser.sobrenome,
        employeeCode: this.currentUser.employeeCode,
      });
    }
    // Desabilita os campos novamente
    this.perfilForm.get('nome')?.disable();
    this.perfilForm.get('sobrenome')?.disable();
    this.perfilForm.get('employeeCode')?.disable();
  }

  // Método auxiliar para formatar Timestamp (se necessário para algum campo de data no perfil)
  formatTimestamp(timestamp: Timestamp | undefined): string {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
