import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Adicionado
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importações do AngularFire
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage'; // Adicionado para Cloud Storage

// Caminho para o environment (você já corrigiu para './enviroments/enviroment')
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
import { CadastroProdutoComponent } from './pages/produtos/cadastro-produto/cadastro-produto.component'; // Confirmado

// SharedModule para layouts e outros componentes/módulos compartilhados
import { SharedModule } from './shared/shared.module';
import { EdicaoProdutoComponent } from './pages/produtos/edicao-produto/edicao-produto.component';
import { CadastroEstoqueComponent } from './pages/estoque/cadastro-estoque/cadastro-estoque.component';
import { EdicaoEstoqueComponent } from './pages/estoque/edicao-estoque/edicao-estoque.component';
import { RegistrarBaixaComponent } from './pages/baixas/registrar-baixa/registrar-baixa.component';
import { BaixasComponent } from './pages/baixas/baixas.component';

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
    CadastroProdutoComponent,
    EdicaoProdutoComponent,
    CadastroEstoqueComponent,
    EdicaoEstoqueComponent,
    RegistrarBaixaComponent,
    BaixasComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // Adicionei para compatibilidade futura com animações
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule, // Importa o SharedModule que deve declarar e exportar os layouts

    // Inicialização do Firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule, // Adicionado
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
