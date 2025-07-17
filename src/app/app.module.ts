// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Adicione estas importações para ngx-toastr
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importações do AngularFire
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

import { environment } from './enviroments/enviroment';

// Components de Login
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroSucessoComponent } from './LoginComponents/cadastro-sucesso/cadastro-sucesso.component';
import { StarterComponent } from './LoginComponents/starter/starter.component';

// Componentes de Páginas
import { HomeComponent } from './pages/home/home.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { RegistrosBaixasComponent } from './pages/registros-baixas/registros-baixas.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { BaixasComponent } from './pages/baixas/baixas.component';

import { ProdutoFormComponent } from './pages/produtos/produto-form/produto-form.component';

// O NOVO componente unificado de formulário de estoque
import { EstoqueFormComponent } from './pages/estoque/estoque-form/estoque-form.component';

// SharedModule para layouts e outros componentes/módulos compartilhados
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CadastroComponent,
    CadastroSenhaComponent,
    RecuperarSenhaComponent,
    CadastroSucessoComponent,
    StarterComponent,
    HomeComponent,
    ProdutosComponent,
    EstoqueComponent,
    RegistrosBaixasComponent,
    UsuariosComponent,
    PerfilComponent,
    BaixasComponent,
    ProdutoFormComponent,
    EstoqueFormComponent, // O NOVO componente está declarado aqui
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,

    SharedModule,

    // Inicialização do Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,

    // Configuração do ToastrModule
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
