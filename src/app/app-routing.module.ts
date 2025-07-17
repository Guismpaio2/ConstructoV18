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

// Componentes de Páginas
import { HomeComponent } from './pages/home/home.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component'; // Lista de baixas
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

// Novas importações para os componentes de cadastro/edição/baixa
import { CadastroEstoqueComponent } from './pages/estoque/cadastro-estoque/cadastro-estoque.component';
import { EdicaoEstoqueComponent } from './pages/estoque/edicao-estoque/edicao-estoque.component';
import { BaixasComponent } from './pages/baixas/baixas.component'; // Agora é o FORMULÁRIO DE REGISTRO DE BAIXA

// Importe seu AuthGuard
import { AuthGuard } from './auth/auth.guard';
import { UserRole } from './models/user.model';

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

  // Rotas PROTEGIDAS (exigem autenticação e/ou roles específicas)
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard], // Aplica o AuthGuard a todas as rotas filhas
    children: [
      {
        path: 'home',
        component: HomeComponent,
        data: {
          title: 'Início',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'produtos',
        component: ProdutosComponent,
        data: {
          title: 'Produtos',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'estoque',
        component: EstoqueComponent,
        data: {
          title: 'Estoque',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'registros-baixas', // Esta é a LISTA de baixas (Screenshot_11.png)
        component: RegistrosBaixasComponent,
        data: {
          title: 'Registros de Baixas',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'baixas', // Esta é o FORMULÁRIO de REGISTRO de baixa (Screenshot_14.png)
        component: BaixasComponent,
        data: {
          title: 'Registrar Baixa',
          roles: ['Administrador', 'Estoquista'] as UserRole[], // Somente quem pode registrar
        },
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        data: {
          title: 'Meu Perfil',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'usuarios',
        component: UsuariosComponent,
        data: {
          title: 'Gerenciamento de Usuários',
          roles: ['Administrador'] as UserRole[],
        },
      },
      {
        path: 'cadastro-estoque',
        component: CadastroEstoqueComponent,
        data: {
          title: 'Cadastrar Item no Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        },
      },
      {
        path: 'edicao-estoque/:id',
        component: EdicaoEstoqueComponent,
        data: {
          title: 'Editar Item no Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        },
      },
      // Removida a rota 'registrar-baixa/:id' pois agora 'baixas' é o formulário.
      // E a rota de 'registros-baixas' é para a lista.
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
