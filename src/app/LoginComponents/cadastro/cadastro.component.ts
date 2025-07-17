// src/app/LoginComponents/cadastro/cadastro.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Nenhuma lógica de background ou inicialização aqui
  }

  ngOnDestroy(): void {
    // Nenhuma lógica de background ou limpeza aqui
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
      // Se você pretende usar employeeCode ou role do primeiro passo de cadastro,
      // deve adicioná-los aqui com valores padrão ou nulos.
      // Exemplo:
      employeeCode: null, // Ou algum valor padrão
      role: 'Leitor' // Ou a role padrão para novos usuários
    };
    // **CORREÇÃO AQUI: Mudando 'tempCadastroData' para 'tempUserData'**
    localStorage.setItem('tempUserData', JSON.stringify(userData));

    this.router.navigate(['/cadastro-senha']);
  }
}
