// src/app/LoginComponents/cadastro/cadastro.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Renderer2 removido
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss'],
})
export class CadastroComponent implements OnInit, OnDestroy {
  nome: string = '';
  sobrenome: string = '';
  email: string = '';
  errorMessage: string = '';

  // Renderer2 removido pois o AuthLayoutComponent gerencia o background
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Lógica de background removida
  }

  ngOnDestroy(): void {
    // Lógica de background removida
  }

  goToNextStep(): void {
    this.errorMessage = '';
    if (!this.nome || !this.sobrenome || !this.email) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    // Validação de e-mail básica
    if (!this.email.includes('@') || !this.email.includes('.')) {
      this.errorMessage = 'Por favor, insira um e-mail válido.';
      return;
    }

    // Salva os dados temporariamente no localStorage para a próxima etapa
    const userData = {
      nome: this.nome,
      sobrenome: this.sobrenome,
      email: this.email,
    };
    localStorage.setItem('tempCadastroData', JSON.stringify(userData));

    this.router.navigate(['/cadastro-senha']);
  }
}
