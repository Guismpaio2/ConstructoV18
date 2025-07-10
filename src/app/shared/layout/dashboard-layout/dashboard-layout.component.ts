import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  standalone: false,
})
export class DashboardLayoutComponent {
  // Input para o título da página
  @Input() pageTitle: string = '';
}
