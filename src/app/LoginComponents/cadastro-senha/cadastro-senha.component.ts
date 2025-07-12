// src/app/LoginComponents/cadastro-senha/cadastro-senha.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Renderer2 removido
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // Caminho corrigido para o AuthService

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

  private tempUserData: {
    email: string;
    nome: string;
    sobrenome: string;
  } | null = null;

  // Renderer2 removido
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Lógica de background removida
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
    // Lógica de background removida
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
        const employeeCode = Math.floor(
          1000000 + Math.random() * 9000000
        ).toString(); // Ex: 7 dígitos

        // 3. Salvar dados adicionais do usuário no Firestore
        // Novos usuários se cadastram com a role 'Leitor' por padrão, conforme o PDF
        await this.authService.saveUserData(
          userCredential.user.uid, // UID do usuário
          userCredential.user.email, // E-mail do usuário
          'Leitor', // Papel padrão para o cadastro via formulário
          employeeCode,
          this.tempUserData.nome, // Nome
          this.tempUserData.sobrenome // Sobrenome
        );

        // 4. Armazenar o código de identificação e nome para exibir na tela de sucesso
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
      // Mensagens de erro mais específicas
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage =
            'Este e-mail já está em uso. Tente outro ou faça login.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'O formato do e-mail é inválido.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'A senha é muito fraca (mínimo 6 caracteres).';
          break;
        default:
          this.errorMessage =
            'Erro ao criar conta. Por favor, tente novamente mais tarde.';
          break;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
