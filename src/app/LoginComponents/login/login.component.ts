// src/app/LoginComponents/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // Caminho corrigido para o AuthService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  errorMessage = '';
  email = '';
  password = '';
  passwordVisible = false;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preença todos os campos.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    try {
      await this.authService.signIn(this.email, this.password);
      // Login bem-sucedido. O AuthGuard (se configurado) ou sua lógica de redirecionamento
      // no serviço/componente do Dashboard cuidará de levar o usuário ao lugar certo.
      this.router.navigate(['/home']); // Redireciona para a página principal após o login
    } catch (error: any) {
      console.error('Erro de login:', error);
      // Mensagens de erro mais específicas do Firebase
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.errorMessage = 'E-mail ou senha inválidos. Tente novamente.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/user-disabled':
          this.errorMessage =
            'Sua conta foi desativada. Entre em contato com o suporte.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage =
            'Muitas tentativas de login. Tente novamente mais tarde.';
          break;
        default:
          this.errorMessage =
            'Ocorreu um erro ao fazer login. Por favor, tente novamente.';
          break;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
