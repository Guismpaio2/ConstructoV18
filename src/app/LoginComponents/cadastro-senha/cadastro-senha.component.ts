import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // Importe o AuthService
import { NgForm } from '@angular/forms'; // Para usar validação de formulário

@Component({
  selector: 'app-cadastro-senha',
  templateUrl: './cadastro-senha.component.html',
  styleUrls: ['./cadastro-senha.component.scss'],
})
export class CadastroSenhaComponent implements OnInit, OnDestroy {
  password = '';
  confirmPassword = '';
  passwordVisible = false;
  confirmPasswordVisible = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  // Variáveis para armazenar dados do cadastro da etapa anterior (simulando um serviço ou estado compartilhado)
  // Em um projeto real, você usaria um serviço para compartilhar esses dados ou um state management
  // Por simplicidade, vamos usar localStorage para simular temporariamente
  private tempUserData: {
    email: string;
    nome: string;
    sobrenome: string;
  } | null = null;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'cadastro-background'); // Adiciona a classe específica para a imagem de fundo
    // Recupera os dados temporários do cadastro se existirem
    const storedData = localStorage.getItem('tempCadastroData');
    if (storedData) {
      this.tempUserData = JSON.parse(storedData);
    } else {
      // Se não houver dados da etapa anterior, redireciona de volta para o cadastro
      this.router.navigate(['/cadastro']);
      return;
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'cadastro-background'); // Remove ao sair
    // Opcional: Limpar os dados temporários após o cadastro ser concluído ou cancelado
    // localStorage.removeItem('tempCadastroData');
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  async onCreateAccount(): Promise<void> {
    this.errorMessage = '';
    if (!this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor, preencha todos os campos de senha.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem.';
      return;
    }

    // Adicione validações de segurança da senha (ex: mínimo 6 caracteres)
    if (this.password.length < 6) {
      this.errorMessage = 'A senha deve ter no mínimo 6 caracteres.';
      return;
    }

    if (!this.tempUserData || !this.tempUserData.email) {
      this.errorMessage =
        'Dados de cadastro incompletos. Por favor, retorne à etapa anterior.';
      return;
    }

    this.isLoading = true;
    try {
      // 1. Registrar o usuário no Firebase Authentication
      const userCredential = await this.authService.registerUser(
        this.tempUserData.email,
        this.password
      );

      if (userCredential.user) {
        // 2. Gerar um código de identificação de funcionário único
        // Para simplicidade, vamos gerar um código numérico. Em produção, considere um gerador mais robusto.
        const employeeCode = Math.floor(
          1000000 + Math.random() * 9000000
        ).toString(); // Ex: 7 dígitos

        // 3. Salvar dados adicionais do usuário no Firestore
        // Por padrão, novos usuários se cadastram com a role 'Leitor'
        await this.authService.saveUserData(
          userCredential.user,
          'Leitor',
          employeeCode
        );

        // 4. Armazenar o código de identificação para exibir na tela de sucesso
        localStorage.setItem('newEmployeeCode', employeeCode);
        localStorage.setItem(
          'newUserName',
          `${this.tempUserData.nome} ${this.tempUserData.sobrenome}`
        );

        // Limpa os dados temporários após o sucesso
        localStorage.removeItem('tempCadastroData');

        // Redireciona para a tela de sucesso do cadastro
        this.router.navigate(['/cadastro-sucesso']);
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      if (error.code === 'auth/email-already-in-use') {
        this.errorMessage =
          'Este e-mail já está em uso. Tente outro ou faça login.';
      } else {
        this.errorMessage =
          'Erro ao criar conta. Por favor, tente novamente mais tarde.';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
