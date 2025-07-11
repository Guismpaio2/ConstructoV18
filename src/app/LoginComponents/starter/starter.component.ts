import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.scss'],
})
export class StarterComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Adiciona uma classe ao body ao iniciar o componente
    this.renderer.addClass(document.body, 'starter-background');
  }

  ngOnDestroy(): void {
    // Remove a classe do body ao sair do componente para limpar os estilos
    this.renderer.removeClass(document.body, 'starter-background');
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToCadastro(): void {
    this.router.navigate(['/cadastro']);
  }
}
