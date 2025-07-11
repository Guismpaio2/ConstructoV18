import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss'],
})
export class CadastroComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'cadastro-background'); // Adiciona a classe específica
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'cadastro-background'); // Remove ao sair
  }

  // Método para simular o "Próximo"
  goToNextStep(): void {
    // Lógica de validação do formulário de cadastro, salvar dados temporariamente
    this.router.navigate(['/cadastro-senha']);
  }
}
