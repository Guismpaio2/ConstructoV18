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
  tempUserData: any; // Mantenha como 'any' ou tipagem mais específica se tiver um modelo temporário
  isLoading: boolean = false;
  errorMessage: string = '';

  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;

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
    this.isLoading = true;
    this.errorMessage = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const { password } = this.passwordForm.value;

    try {
      // CORREÇÃO AQUI: Passando todos os 6 argumentos para signUp
      const userCredential = await this.authService.signUp(
        this.tempUserData.email,
        password,
        this.tempUserData.nome, // Argumento 3
        this.tempUserData.sobrenome, // Argumento 4
        this.tempUserData.employeeCode || '', // Argumento 5 (garantindo string vazia se undefined)
        this.tempUserData.role || 'Leitor' // Argumento 6 (garantindo 'Leitor' se undefined)
      );

      // NOTA: Se o signUp já cria o usuário no Firestore (como na minha última sugestão),
      // a chamada subsequente a createOrUpdateUserData pode ser redundante
      // se você não tiver dados adicionais para salvar APENAS aqui.
      // Se userCredential.user for suficiente, esta parte pode ser simplificada.
      // Manterei para não remover funcionalidade existente, mas é um ponto a revisar.
      if (userCredential.user) {
        // Esta parte pode ser redundante se o signUp no service já cria o UserData completo.
        // Se você tiver certeza que o signUp já persiste tudo, pode remover este bloco `newUser` e `createOrUpdateUserData`.
        const newUser: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          nome: this.tempUserData.nome,
          sobrenome: this.tempUserData.sobrenome,
          employeeCode: this.tempUserData.employeeCode || '',
          role: this.tempUserData.role || 'Leitor',
          dataCadastro: Timestamp.now(), // Pode ser definida no service
          lastLogin: Timestamp.now(), // Pode ser definida no service
        };
        await this.authService.createOrUpdateUserData(newUser); // Chamar ou não depende da sua lógica final

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
