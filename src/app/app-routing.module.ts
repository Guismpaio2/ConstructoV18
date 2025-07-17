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

// Componentes de Layout
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';

// Componentes de Páginas
import { HomeComponent } from './pages/home/home.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

// Novas importações para os componentes de cadastro/edição/baixa
import { BaixasComponent } from './pages/baixas/baixas.component'; // Formulário de registro de baixa
import { EstoqueFormComponent } from './pages/estoque/estoque-form/estoque-form.component'; // IMPORTANTE: O NOVO COMPONENTE

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
      // NOVAS ROTAS PARA O FORMULÁRIO DE ESTOQUE UNIFICADO
      {
        path: 'estoque/cadastro', // Rota para adicionar um novo item de estoque
        component: EstoqueFormComponent,
        data: {
          title: 'Adicionar Item ao Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        },
      },
      {
        path: 'estoque/edicao/:uid', // Rota para editar um item de estoque existente
        component: EstoqueFormComponent,
        data: {
          title: 'Editar Item de Estoque',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        },
      },
      {
        path: 'registros-baixas',
        component: RegistrosBaixasComponent,
        data: {
          title: 'Registros de Baixas',
          roles: ['Administrador', 'Estoquista', 'Leitor'] as UserRole[],
        },
      },
      {
        path: 'baixas', // Formulário de REGISTRO de baixa
        component: BaixasComponent,
        data: {
          title: 'Registrar Baixa',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
        },
      },
      {
        path: 'registrar-baixa/:uid', // Rota para registrar baixa de um item específico
        component: BaixasComponent, // Assumindo que BaixasComponent é o formulário de registro de baixa
        data: {
          title: 'Registrar Baixa',
          roles: ['Administrador', 'Estoquista'] as UserRole[],
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
    ],
  },
  { path: '**', redirectTo: 'starter' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
