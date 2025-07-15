import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { AuthService} from '../../../auth/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  pageTitle: string = 'Bem-vindo';
  user: Observable<User | null>;
  isAdmin: Observable<boolean>;
  private routerSubscription!: Subscription; // <<< Adicione o '!' aqui

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {
    this.user = this.authService.user$;
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(
        // A atribuição ocorre aqui
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        switchMap((route) => route.data)
      )
      .subscribe((data) => {
        this.pageTitle = data['title'] || this.getPageTitleFromRoute(data);
      });
  }


  // NOVO MÉTODO: Obtém o título da página da rota
  private getPageTitleFromRoute(routeData: any): string {
    // Implemente a lógica para criar um título padrão se 'title' não estiver nos dados da rota
    // Por exemplo, você pode usar o caminho da rota ou um valor padrão
    if (routeData && routeData['path']) {
      return this.capitalizeFirstLetter(routeData['path'].replace(/-/g, ' '));
    }
    return 'Página'; // Título padrão se nada for encontrado
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      // Agora 'routerSubscription' é sempre um Subscription ou undefined no runtime
      this.routerSubscription.unsubscribe();
    }
  }
}
