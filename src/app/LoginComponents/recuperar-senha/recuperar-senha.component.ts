import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service'; // Certifique-se de importar o AuthService
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['./recuperar-senha.component.scss'],
})
export class RecuperarSenhaComponent {
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  async onResetPassword(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email) {
      this.errorMessage = 'Por favor, insira seu e-mail.';
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.resetPassword(this.email);
      this.successMessage =
        'Um link de redefinição de senha foi enviado para o seu e-mail.';
      this.email = ''; // Limpa o campo após o envio
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      if (error.code === 'auth/user-not-found') {
        this.errorMessage =
          'E-mail não encontrado. Verifique e tente novamente.';
      } else if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'E-mail inválido.';
      } else {
        this.errorMessage =
          'Ocorreu um erro ao enviar o link de redefinição. Por favor, tente novamente.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
