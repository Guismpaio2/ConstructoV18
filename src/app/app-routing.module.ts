import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StarterComponent } from './LoginComponents/starter/starter.component';
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component'; // Nova importação

import { HomeComponent } from './pages/home/home.component';

import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';

const routes: Routes = [
  { path: '', redirectTo: 'starter', pathMatch: 'full' },

  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'starter', component: StarterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'cadastro', component: CadastroComponent },
      { path: 'cadastro-senha', component: CadastroSenhaComponent },
      { path: 'recuperar-senha', component: RecuperarSenhaComponent },
      { path: 'cadastro-sucesso', component: CadastroSucessoComponent }, // Nova rota
    ],
  },

  {
    path: '',
    component: DashboardLayoutComponent,
    // canActivate: [AuthGuard], // Habilitar depois de criar e configurar o AuthGuard
    children: [
      { path: 'home', component: HomeComponent },
      // Rotas do Dashboard aqui (Produtos, Estoque, Perfil, etc.)
      // { path: 'perfil', component: PerfilComponent },
      // { path: 'estoque', component: EstoqueComponent },
      // { path: 'produtos', component: ProdutosComponent },
      // { path: 'registro-baixas', component: RegistroBaixasComponent },
      // { path: 'usuarios', component: UsuariosComponent },
    ],
  },

  { path: '**', redirectTo: 'starter' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
