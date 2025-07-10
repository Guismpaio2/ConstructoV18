import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Imports dos seus componentes (Caminhos ajustados)
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { StarterComponent } from './LoginComponents/starter/starter.component';
import { HomeComponent } from './pages/home/home.component'; //

// Imports dos seus layouts
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';

// Futuro Auth Guard (por enquanto não está implementado)
// import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  // Rotas que usam o AuthLayout (Páginas de autenticação)
  {
    path: '', // A rota principal usará o AuthLayout
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'starter', pathMatch: 'full' }, // Redireciona a raiz para a página inicial/starter
      { path: 'starter', component: StarterComponent },
      { path: 'login', component: LoginComponent }, //
      { path: 'cadastro', component: CadastroComponent }, //
      { path: 'cadastro-senha', component: CadastroSenhaComponent }, //
      { path: 'recuperar-senha', component: RecuperarSenhaComponent },
    ]
  },
  // Rotas que usam o DashboardLayout (Páginas protegidas após o login)
  {
    path: '', // Pode ser 'dashboard' ou vazio para que as filhas sejam absolutas
    component: DashboardLayoutComponent,
    // canActivate: [AuthGuard], // Habilitar quando o AuthGuard for implementado
    children: [
      { path: 'home', component: HomeComponent }, // Página Home/Dashboard
      // Adicione aqui as rotas para Produtos, Estoque, Usuários, Perfil, Registros de Baixas etc.
      // { path: 'produtos', component: ProdutosComponent }, //
      // { path: 'estoque', component: EstoqueComponent }, //
      // { path: 'usuarios', component: UsuariosComponent }, //
      // { path: 'perfil', component: PerfilComponent }, //
      // { path: 'registros-baixas', component: RegistrosBaixasComponent },
    ]
  },
  // Rota wildcard para qualquer rota não encontrada, redireciona para a página inicial/starter
  { path: '**', redirectTo: '/starter' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }