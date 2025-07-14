import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importe todos os componentes
import { StarterComponent } from './LoginComponents/starter/starter.component';
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component';

// Componentes de Layout
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';

// Componentes de Páginas (exemplo, você precisará criá-los)
import { HomeComponent } from './pages/home/home.component';
import { ProdutosComponent } from './pages/produtos/produtos.component'; // Crie este
import { EstoqueComponent } from './pages/estoque/estoque.component'; // Crie este
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component'; // Crie este
import { UsuariosComponent } from './pages/usuarios/usuarios.component'; // Crie este (para Admin)
import { PerfilComponent } from './pages/perfil/perfil.component'; // Crie este

// Importe seu AuthGuard
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'starter', pathMatch: 'full' },

  // Rotas PÚBLICAS
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'starter',
        component: StarterComponent,
        data: { title: 'Bem-vindo' },
      },
      { path: 'login', component: LoginComponent, data: { title: 'Login' } },
      {
        path: 'cadastro',
        component: CadastroComponent,
        data: { title: 'Cadastro' },
      },
      {
        path: 'cadastro-senha',
        component: CadastroSenhaComponent,
        data: { title: 'Criar Senha' },
      },
      {
        path: 'recuperar-senha',
        component: RecuperarSenhaComponent,
        data: { title: 'Recuperar Senha' },
      },
      {
        path: 'cadastro-sucesso',
        component: CadastroSucessoComponent,
        data: { title: 'Cadastro Concluído' },
      },
    ],
  },

  // Rotas PROTEGIDAS (exigem autenticação)
  {
    path: '', // Este caminho vazio permite que as rotas filhas sejam acessadas diretamente (/home, /produtos, etc.)
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard], // Aplica o AuthGuard a TODAS as rotas filhas deste bloco
    children: [
      // Rota 'home' - Acessível por qualquer usuário logado
      { path: 'home', component: HomeComponent, data: { title: 'Início' } },
      {
        path: 'produtos',
        component: ProdutosComponent,
        data: { title: 'Produtos' },
      },
      {
        path: 'estoque',
        component: EstoqueComponent,
        data: { title: 'Estoque' },
      },
      {
        path: 'registros-baixas',
        component: RegistrosBaixasComponent,
        data: { title: 'Registros de Baixas' },
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        data: { title: 'Meu Perfil' },
      },

      // Rota para Usuários (apenas para Administrador)
      {
        path: 'usuarios',
        component: UsuariosComponent, // Substitua por seu UsuariosComponent
        canActivate: [AuthGuard], // Re-aplica o guard para garantir que a role seja verificada
        data: { title: 'Gerenciamento de Usuários', role: 'Administrador' }, // A role é verificada pelo AuthGuard
      },

      // Você pode adicionar rotas específicas de admin, estoquista, leitor aqui também,
      // se elas tiverem componentes e URLs diferentes.
      // Por exemplo, um painel de relatórios mais detalhado para 'Leitor' ou 'Administrador'.
      // {
      //   path: 'relatorios-avancados',
      //   component: RelatoriosAvancadosComponent,
      //   canActivate: [AuthGuard],
      //   data: { title: 'Relatórios Avançados', role: 'Administrador' },
      // },
    ],
  },

  // Rota wildcard para qualquer caminho não encontrado, redireciona para 'starter'
  { path: '**', redirectTo: 'starter' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
