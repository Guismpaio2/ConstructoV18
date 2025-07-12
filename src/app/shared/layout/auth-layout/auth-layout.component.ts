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
  currentRoute: string = '';
  private routerSubscription: Subscription | undefined;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    // Define o caminho da rota inicial imediatamente
    this.setInitialRoutePath();

    // Escuta por eventos subsequentes do roteador
    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        map((route) => route.snapshot.url[0]?.path || '')
      )
      .subscribe((path) => {
        this.currentRoute = path;
        console.log('Current Route Path for Background:', this.currentRoute);
      });
  }

  private setInitialRoutePath(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    if (route.outlet === 'primary') {
      this.currentRoute = route.snapshot.url[0]?.path || '';
      console.log('Initial Route Path for Background:', this.currentRoute);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
