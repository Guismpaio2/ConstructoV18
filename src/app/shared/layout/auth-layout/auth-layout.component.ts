import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  currentRoute: string = ''; // Variável para armazenar o nome da rota atual
  private routerSubscription: Subscription | undefined; // Para gerenciar a inscrição do router

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    // Escuta os eventos do router para identificar a rota atual
    this.routerSubscription = this.router.events
      .pipe(
        // Filtra apenas eventos de NavigationEnd (fim da navegação)
        filter((event) => event instanceof NavigationEnd),
        // Mapeia para a rota ativada
        map(() => this.activatedRoute),
        // Percorre a árvore de rotas para encontrar a rota primária ativa
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        // Garante que é a rota principal (outlet 'primary')
        filter((route) => route.outlet === 'primary'),
        // Extrai o primeiro segmento do caminho da URL (ex: 'starter', 'login', 'cadastro')
        map((route) => route.snapshot.url[0]?.path || '')
      )
      .subscribe((path) => {
        this.currentRoute = path; // Atualiza a variável com o nome da rota
        console.log('Current Route Path for Background:', this.currentRoute); // Debug: verifique isso no console do navegador!
      });
  }

  ngOnDestroy(): void {
    // Desinscreve-se do router para evitar vazamento de memória
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
