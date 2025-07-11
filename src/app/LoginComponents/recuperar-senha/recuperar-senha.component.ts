import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['./recuperar-senha.component.scss'],
})
export class RecuperarSenhaComponent implements OnInit, OnDestroy {
  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'recuperar-senha-background'); // Adiciona a classe específica
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'recuperar-senha-background');
  }

  sendRecoveryLink(): void {
    // Lógica para enviar link de recuperação de senha
    console.log('Enviando link de recuperação...');
    // Exemplo:
    // alert('Link de recuperação enviado para o e-mail!');
    // this.router.navigate(['/login']);
  }
}
