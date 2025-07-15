import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../models/user.model';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-cadastro-senha',
  templateUrl: './cadastro-senha.component.html',
  styleUrls: ['./cadastro-senha.component.scss'],
})
export class CadastroSenhaComponent implements OnInit {
  passwordForm!: FormGroup;
  tempUserData: any;
  isLoading: boolean = false;
  errorMessage: string = '';

  passwordVisible: boolean = false; // Adicionado para a visibilidade da senha
  confirmPasswordVisible: boolean = false; // Adicionado para a visibilidade da senha de confirmação

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const storedData = localStorage.getItem('tempUserData');
    if (storedData) {
      this.tempUserData = JSON.parse(storedData);
      console.log('Dados recuperados do localStorage:', this.tempUserData);
    } else {
      this.router.navigate(['/cadastro']);
      return;
    }

    this.passwordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  async onSubmit(): Promise<void> {
    // Renomeado de onCreateAccount para onSubmit
    this.isLoading = true;
    this.errorMessage = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const { password } = this.passwordForm.value;

    try {
      const userCredential = await this.authService.signUp(
        this.tempUserData.email,
        password
      );

      if (userCredential.user) {
        const newUser: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          nome: this.tempUserData.nome,
          sobrenome: this.tempUserData.sobrenome,
          employeeCode: this.tempUserData.employeeCode || '',
          role: this.tempUserData.role || 'Leitor',
          dataCadastro: Timestamp.now(),
          lastLogin: Timestamp.now(),
        };
        await this.authService.createOrUpdateUserData(newUser);

        localStorage.removeItem('tempUserData');
        this.router.navigate(['/cadastro-sucesso']);
      } else {
        throw new Error('Usuário não retornado após o cadastro.');
      }
    } catch (error: any) {
      console.error('Erro no cadastro final:', error);
      this.errorMessage =
        error.message ||
        'Ocorreu um erro ao finalizar o cadastro. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  goBack(): void {
    this.router.navigate(['/cadastro']);
  }
}
