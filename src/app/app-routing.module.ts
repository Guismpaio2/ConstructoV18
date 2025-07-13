// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importe todos os componentes
import { StarterComponent } from './LoginComponents/starter/starter.component';
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component';

// Componentes de Layout (importados de shared, mas usados aqui para rotas)
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';

// Componente Home (importado do pages)
import { HomeComponent } from './pages/home/home.component';

// Importe seu AuthGuard
import { AuthGuard } from './auth/auth.guard';

// Importe componentes para as rotas protegidas por role (apenas exemplos, substitua pelos seus)
// import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
// import { EstoqueManagementComponent } from './pages/estoque-management/estoque-management.component';
// import { RelatoriosComponent } from './pages/relatorios/relatorios.component';

const routes: Routes = [
  // Rota raiz que redireciona para a página 'starter' (rota de entrada pública)
  { path: '', redirectTo: 'starter', pathMatch: 'full' },

  // =====================================================================
  // Rotas PÚBLICAS (não exigem autenticação)
  // Agrupadas sob um prefixo '/auth' para clareza ou diretamente no raiz
  // Use AuthLayoutComponent como o layout para essas páginas
  // =====================================================================
  {
    path: '', // Este caminho vazio permite que as rotas filhas sejam acessadas diretamente (/starter, /login)
    component: AuthLayoutComponent, // O layout para todas as páginas de autenticação
    children: [
      { path: 'starter', component: StarterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'cadastro', component: CadastroComponent },
      { path: 'cadastro-senha', component: CadastroSenhaComponent },
      { path: 'recuperar-senha', component: RecuperarSenhaComponent },
      { path: 'cadastro-sucesso', component: CadastroSucessoComponent },
    ],
  },

  // =====================================================================
  // Rotas PROTEGIDAS (exigem autenticação)
  // Agrupadas sob um prefixo '/dashboard' ou diretamente no raiz
  // Use DashboardLayoutComponent como o layout para essas páginas
  // =====================================================================
  {
    path: '', // Este caminho vazio permite que as rotas filhas sejam acessadas diretamente (/home, /admin-panel)
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard], // Aplica o AuthGuard a TODAS as rotas filhas deste bloco
    children: [
      // Rota 'home' - Acessível por qualquer usuário logado (o canActivate do pai já protege)
      { path: 'home', component: HomeComponent },

      // // Exemplo de rota para Administrador:
      // {
      //   path: 'admin-panel',
      //   component: null as any, // Substitua por seu AdminPanelComponent
      //   data: { role: 'Administrador' }, // A role é verificada pelo AuthGuard
      // },

      // // Exemplo de rota para Estoquistas:
      // {
      //   path: 'estoque-management',
      //   component: null as any, // Substitua por seu EstoqueManagementComponent
      //   data: { role: 'Estoquista' },
      // },

      // // Exemplo de rota para Leitores:
      // {
      //   path: 'relatorios',
      //   component: null as any, // Substitua por seu RelatoriosComponent
      //   data: { role: 'Leitor' },
      // },

      // Adicione mais rotas protegidas conforme necessário
    ],
  },

  // Rota wildcard para qualquer caminho não encontrado, redireciona para 'starter'
  { path: '**', redirectTo: 'starter' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  // AuthGuard já é providedIn: 'root', não precisa ser adicionado aqui.
})
export class AppRoutingModule {}
