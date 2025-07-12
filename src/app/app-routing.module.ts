// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StarterComponent } from './LoginComponents/starter/starter.component';
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component';

import { HomeComponent } from './pages/home/home.component';

import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { AuthGuard } from './auth/auth.guard'; // Importar AuthGuard

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'starter', pathMatch: 'full' }, // Garante que a raiz do layout Auth vai para starter
      { path: 'starter', component: StarterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'cadastro', component: CadastroComponent },
      { path: 'cadastro-senha', component: CadastroSenhaComponent },
      { path: 'recuperar-senha', component: RecuperarSenhaComponent },
      { path: 'cadastro-sucesso', component: CadastroSucessoComponent },
    ],
  },

  {
    path: '', // Este caminho vazio serve como prefixo para o layout do dashboard
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard], // Habilitar o AuthGuard para proteger estas rotas
    children: [
      { path: 'home', component: HomeComponent },
      // Rotas do Dashboard aqui (Produtos, Estoque, Perfil, etc.)
      // Exemplo de rota protegida por papel:
      // { path: 'usuarios', component: UsuariosComponent, canActivate: [AuthGuard], data: { role: 'Administrador' } },
    ],
  },

  // Rota curinga (catch-all) - redireciona qualquer rota não encontrada para 'starter'
  { path: '**', redirectTo: 'starter' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard], // Adicionar AuthGuard aos providers aqui para que possa ser injetado
})
export class AppRoutingModule {}
