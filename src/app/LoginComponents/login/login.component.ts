import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

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

  // Adicionamos uma flag para desabilitar o botão durante o login
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  // Transformamos a função onLogin em async
  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    // Limpa a mensagem de erro e ativa o estado de carregamento
    this.errorMessage = '';
    this.isLoading = true;

    try {
      // Usa await para esperar a Promise do login ser resolvida
      await this.authService.login(this.email, this.password);

      // Se o código chegou até aqui, o login foi um sucesso
      this.router.navigate(['/home']);
    } catch (error) {
      // Se a Promise for rejeitada, o código entra no bloco catch
      this.errorMessage = 'E-mail ou senha inválidos. Tente novamente.';
      console.error(error); // Mostra o erro original no console para debug
    } finally {
      // O bloco finally sempre executa, seja em caso de sucesso ou erro
      this.isLoading = false;
    }
  }
}
