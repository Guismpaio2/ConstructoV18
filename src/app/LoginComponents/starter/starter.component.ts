import { Component, OnInit, OnDestroy } from '@angular/core'; // Renderer2 removido
import { Router } from '@angular/router';

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.scss'],
})
export class StarterComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {} // Renderer2 removido do constructor

  ngOnInit(): void {
    // Linha removida
  }

  ngOnDestroy(): void {
    // Linha removida
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToCadastro(): void {
    this.router.navigate(['/cadastro']);
  }
}
