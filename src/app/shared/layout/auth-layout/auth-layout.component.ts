import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
  standalone: false,
})
export class AuthLayoutComponent {
  // Recebe a URL da imagem de background para a seção da direita
  // Por exemplo: 'assets/images/login-bg.png'
  @Input() backgroundImage: string = '';
}