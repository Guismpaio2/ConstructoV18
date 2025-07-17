import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro-sucesso',
  templateUrl: './cadastro-sucesso.component.html',
  styleUrls: ['./cadastro-sucesso.component.scss'],
})
export class CadastroSucessoComponent implements OnInit {
  employeeCode: string = '';
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Recupera o código de identificação e o nome do usuário do localStorage
    this.employeeCode = localStorage.getItem('newEmployeeCode') || 'N/A';
    this.userName = localStorage.getItem('newUserName') || 'Usuário';

    // Opcional: Limpar os dados do localStorage após exibi-los
    localStorage.removeItem('newEmployeeCode');
    localStorage.removeItem('newUserName');
  }

  closeModal(): void {
    this.goToLogin();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
