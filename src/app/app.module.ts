import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms'; // Já estava aqui
import { ReactiveFormsModule } from '@angular/forms'; // Já estava aqui
import { CommonModule } from '@angular/common'; // <--- ADICIONAR ESTE PARA PIPES E NGLIKE
import { RouterModule } from '@angular/router'; // <--- ADICIONAR ESTE PARA ROUTER-OUTLET

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importações do AngularFire
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';

// Caminho para o environment
// VERIFIQUE SE O CAMINHO E O NOME DA PASTA 'enviroments' ESTÃO CORRETOS.
// Geralmente é './environments/environment' (com "s" no final)
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
import { CadastroEstoqueComponent } from './pages/estoque/cadastro-estoque/cadastro-estoque.component';
import { EdicaoEstoqueComponent } from './pages/estoque/edicao-estoque/edicao-estoque.component';
import { BaixasComponent } from './pages/baixas/baixas.component';

// ATENÇÃO: Verifique este caminho! O erro "Could not resolve" aponta para ele.
// Se product-form-modal.component.ts estiver em './pages/produtos/produto-form-modal/', o caminho está correto.
// Se não, ajuste.// Importação correta (verifique o caminho)

// O ProdutoFormComponent que você declarou também
import { ProdutoFormComponent } from './pages/produtos/produto-form/produto-form.component';

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
    CadastroEstoqueComponent,
    EdicaoEstoqueComponent,
    BaixasComponent,
    ProdutoFormComponent, // Confirme que este componente é o que você quer declarar
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule, // <--- ADICIONADO AQUI
    RouterModule, // <--- ADICIONADO AQUI PARA ROUTER-OUTLET

    SharedModule, // SharedModule já está importado e deve exportar ModalWrapperComponent

    // Inicialização do Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
