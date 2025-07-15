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
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component'; // Mantido, mas pode ser renomeado para 'BaixasComponent' se você o mudou
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

// Novas importações para os componentes de cadastro/edição/baixa
import { CadastroProdutoComponent } from './pages/produtos/cadastro-produto/cadastro-produto.component';
import { EdicaoProdutoComponent } from './pages/produtos/edicao-produto/edicao-produto.component';
import { CadastroEstoqueComponent } from './pages/estoque/cadastro-estoque/cadastro-estoque.component';
import { EdicaoEstoqueComponent } from './pages/estoque/edicao-estoque/edicao-estoque.component';
import { RegistrarBaixaComponent } from './pages/baixas/registrar-baixa/registrar-baixa.component'; // Ajustado para 'pages/baixas'
import { BaixasComponent } from './pages/baixas/baixas.component'; // Adicionado para a rota /baixas se RegistrosBaixasComponent for o principal

// Importe seu AuthGuard
import { AuthGuard } from './auth/auth.guard';
import { UserRole } from './models/user.model'; // Importa UserRole para tipagem

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
        path: 'registros-baixas', // Se este for o componente principal para exibir baixas
        component: RegistrosBaixasComponent,
        data: {
          title: 'Registros de Baixas',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      // Se 'BaixasComponent' for o componente principal para visualização de baixas
      {
        path: 'baixas',
        component: BaixasComponent,
        data: {
          title: 'Baixas',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
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
        // canActivate: [AuthGuard], // Não é necessário repetir se já está no pai
        data: {
          title: 'Gerenciamento de Usuários',
          roles: ['Administrador'] as UserRole[],
        }, // Apenas administradores
      },
      // Rotas para cadastro/edição com roles específicas
      {
        path: 'cadastro-produto',
        component: CadastroProdutoComponent,
        // canActivate: [AuthGuard],
        data: {
          title: 'Cadastrar Produto',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        }, // Estoquista e Admin podem cadastrar
      },
      {
        path: 'edicao-produto/:id',
        component: EdicaoProdutoComponent,
        // canActivate: [AuthGuard],
        data: {
          title: 'Editar Produto',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        }, // Estoquista e Admin podem editar
      },
      {
        path: 'cadastro-estoque',
        component: CadastroEstoqueComponent, // Corrigido para CadastroEstoqueComponent
        // canActivate: [AuthGuard],
        data: {
          title: 'Cadastrar Item no Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        }, // Estoquista e Admin podem cadastrar
      },
      {
        path: 'edicao-estoque/:id',
        component: EdicaoEstoqueComponent,
        // canActivate: [AuthGuard],
        data: {
          title: 'Editar Item no Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        }, // Estoquista e Admin podem editar
      },
      {
        path: 'registrar-baixa/:id',
        component: RegistrarBaixaComponent, // Corrigido para RegistrarBaixaComponent
        // canActivate: [AuthGuard],
        data: {
          title: 'Registrar Baixa',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        }, // Estoquista e Admin podem registrar baixa
      },
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
