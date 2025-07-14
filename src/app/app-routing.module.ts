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
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

// // Novas importações para os componentes de cadastro/edição/baixa
// import { CadastroProdutoComponent } from './pages/produtos/cadastro-produto/cadastro-produto.component';
// import { EdicaoProdutoComponent } from './pages/produtos/edicao-produto/edicao-produto.component';
// import { CadastroEstoqueComponent } from './pages/estoque/cadastro-estoque/cadastro-estoque.component';
// import { EdicaoEstoqueComponent } from './pages/estoque/edicao-estoque/edicao-estoque.component';
// import { RegistrarBaixaComponent } from './pages/estoque/registrar-baixa/registrar-baixa.component';

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
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard], // Aplica o AuthGuard a todas as rotas filhas
    children: [
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
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [AuthGuard],
        data: { title: 'Gerenciamento de Usuários', role: 'Administrador' }, // Apenas administradores
      },
      // Rotas para cadastro/edição com roles específicas
      {
        path: 'cadastro-produto',
        component: CadastroComponent,
        canActivate: [AuthGuard],
        data: { title: 'Cadastrar Produto', role: 'Estoquista' }, // Estoquista pode cadastrar
      },
      {
        path: 'edicao-produto/:id',
        component: EdicaoProdutoComponent,
        canActivate: [AuthGuard],
        data: { title: 'Editar Produto', role: 'Estoquista' }, // Estoquista pode editar
      },
      {
        path: 'cadastro-estoque',
        component: EstoqueComponent,
        canActivate: [AuthGuard],
        data: { title: 'Cadastrar Item no Estoque', role: 'Estoquista' }, // Estoquista pode cadastrar
      },
      {
        path: 'edicao-estoque/:id',
        component: EdicaoEstoqueComponent,
        canActivate: [AuthGuard],
        data: { title: 'Editar Item no Estoque', role: 'Estoquista' }, // Estoquista pode editar
      },
      {
        path: 'registrar-baixa/:id',
        component: RegistrosBaixasComponent,
        canActivate: [AuthGuard],
        data: { title: 'Registrar Baixa', role: 'Estoquista' }, // Estoquista pode registrar baixa
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
