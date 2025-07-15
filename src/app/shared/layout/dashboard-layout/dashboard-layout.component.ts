import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../models/user.model';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  user!: Observable<User | null | undefined>; // Tipagem corrigida
  private userSubscription!: Subscription; // Se você for usar .subscribe()

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.user$; // Atribuição direta do Observable
  }

  ngOnDestroy(): void {
    // Se você não usa .subscribe() explicitamente aqui, não precisa de unsubscribe.
    // Se usar, descomente:
    // if (this.userSubscription) {
    //   this.userSubscription.unsubscribe();
    // }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
