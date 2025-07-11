import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
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

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'cadastro-background');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'cadastro-background');
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
