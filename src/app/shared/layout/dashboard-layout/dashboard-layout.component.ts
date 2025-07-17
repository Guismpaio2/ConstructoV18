// src/app/shared/layout/dashboard-layout/dashboard-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  isAdmin$!: Observable<boolean>;
  pageTitle: string = 'Dashboard'; // Valor padrão
  private routerSubscription!: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.isAdmin();

    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          let title = 'Dashboard'; // Default title

          // Loop through the route tree to find the 'title' data
          while (child) {
            if (child.snapshot.data && child.snapshot.data['title']) {
              title = child.snapshot.data['title'];
            }
            child = child.firstChild;
          }
          return title;
        })
      )
      .subscribe((title: string) => {
        this.pageTitle = title;
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  onLogout(): void {
    this.authService.signOut();
  }
}
