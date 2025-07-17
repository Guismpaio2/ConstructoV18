// src/app/pages/perfil/perfil.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../models/user.model';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore'; // Importar Timestamp

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit, OnDestroy {
  user$!: Observable<User | null | undefined>;
  currentUser: User | null | undefined;
  perfilForm!: FormGroup;
  isEditing: boolean = false;
  message: string = '';
  isSuccess: boolean = false;

  private userSubscription!: Subscription;

  constructor(private authService: AuthService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.perfilForm = this.fb.group({
      email: [
        { value: '', disabled: true },
        [Validators.required, Validators.email],
      ],
      nome: ['', Validators.required],
      sobrenome: [''],
      employeeCode: [''],
    });

    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.perfilForm.patchValue({
          email: user.email,
          nome: user.nome,
          sobrenome: user.sobrenome,
          employeeCode: user.employeeCode,
        });
        // Desabilita os campos editáveis por padrão (modo de visualização)
        this.perfilForm.get('nome')?.disable();
        this.perfilForm.get('sobrenome')?.disable();
        this.perfilForm.get('employeeCode')?.disable();
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
    this.message = '';
    this.perfilForm.get('nome')?.enable();
    this.perfilForm.get('sobrenome')?.enable();
    this.perfilForm.get('employeeCode')?.enable();
  }

  async onSave(): Promise<void> {
    this.message = '';
    if (this.perfilForm.valid && this.currentUser) {
      try {
        const updatedData: Partial<User> = {
          nome: this.perfilForm.get('nome')?.value,
          sobrenome: this.perfilForm.get('sobrenome')?.value,
          employeeCode: this.perfilForm.get('employeeCode')?.value,
        };

        // Usa o UID do currentUser para a atualização
        await this.authService.createOrUpdateUserData({
          ...this.currentUser,
          ...updatedData,
        } as User);

        this.isEditing = false;
        this.isSuccess = true;
        this.message = 'Perfil atualizado com sucesso!';
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
    this.message = '';
    if (this.currentUser) {
      this.perfilForm.patchValue({
        email: this.currentUser.email,
        nome: this.currentUser.nome,
        sobrenome: this.currentUser.sobrenome,
        employeeCode: this.currentUser.employeeCode,
      });
    }
    this.perfilForm.get('nome')?.disable();
    this.perfilForm.get('sobrenome')?.disable();
    this.perfilForm.get('employeeCode')?.disable();
  }

  formatTimestamp(timestamp: Timestamp | null | undefined): string {
    if (timestamp instanceof Timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    return 'N/A';
  }
}
