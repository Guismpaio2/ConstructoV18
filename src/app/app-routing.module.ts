import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importe componentes
import { StarterComponent } from './LoginComponents/starter/starter.component';
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component';
import { HomeComponent } from './pages/home/home.component';

// Importe layouts
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';

// Importe  AuthGuard
import { AuthGuard } from './auth/auth.guard';

// Importe componentes para as rotas protegidas por role (apenas exemplos, substitua pelos seus)

const routes: Routes = [
  {
    path: '', 
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'starter', pathMatch: 'full' },
      { path: 'starter', component: StarterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'cadastro', component: CadastroComponent },
      { path: 'cadastro-senha', component: CadastroSenhaComponent },
      { path: 'recuperar-senha', component: RecuperarSenhaComponent },
      { path: 'cadastro-sucesso', component: CadastroSucessoComponent },
    ],
  },

  {
    path: '',
    component: DashboardLayoutComponent,
    // canActivate: [AuthGuard], // O AuthGuard aqui protegeria TODAS as rotas filhas.
    // Melhor aplicar o guard individualmente ou em rotas específicas
    // que precisam de autenticação, para maior flexibilidade.
    // Deixarei comentado para você decidir a granularidade.
    children: [
      // Rota 'home' - Acessível por qualquer usuário logado (não tem 'data.role')
      { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },

      // Exemplo de rota para Administrador: Apenas 'Administrador' pode acessar.
      {
        path: 'admin-panel',
        component: null as any, // Substitua por seu AdminPanelComponent
        canActivate: [AuthGuard],
        data: { role: 'Administrador' },
      },

      // Exemplo de rota para Estoquistas: 'Estoquista' E 'Administrador' podem acessar.
      {
        path: 'estoque-management',
        component: null as any, // Substitua por seu EstoqueManagementComponent
        canActivate: [AuthGuard],
        data: { role: 'Estoquista' },
      },

      // Exemplo de rota para Leitores: 'Leitor', 'Estoquista' E 'Administrador' podem acessar.
      {
        path: 'relatorios',
        component: null as any, // Substitua por seu RelatoriosComponent
        canActivate: [AuthGuard],
        data: { role: 'Leitor' },
      },

      // Adicione mais rotas protegidas conforme necessário, seguindo o padrão.
      // Ex: { path: 'produtos', component: ProdutosComponent, canActivate: [AuthGuard], data: { role: 'Estoquista' } },
      // { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
    ],
  },

  // Rota wildcard para qualquer caminho não encontrado (deve ser a última)
  { path: '**', redirectTo: 'starter' }, // Redireciona para a página inicial se a rota não for encontrada
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  // O AuthGuard já está 'providedIn: root' no seu @Injectable, então não precisa ser adicionado aqui como provider.
  // providers: [AuthGuard], // Remova esta linha, pois já está providedIn: 'root'
})
export class AppRoutingModule {}
