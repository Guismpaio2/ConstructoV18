import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'; // Contém CommonModule
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModule para formulários reativos, se for usar
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importações do AngularFire (confira o caminho para 'compat')
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

// Caminho corrigido para o environment
import { environment } from './enviroments/enviroment'; // <<< ATENÇÃO: 'environments' (plural) é o padrão

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

// Se você tiver um SharedModule para AuthLayoutComponent e DashboardLayoutComponent
import { SharedModule } from './shared/shared.module'; // Importa o SharedModule

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
    // AuthLayoutComponent e DashboardLayoutComponent NÃO SÃO declarados aqui
    // se já estão no SharedModule e SharedModule é importado abaixo.
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule, // Adicione se for usar formulários reativos
    SharedModule, // Importa o SharedModule que deve declarar e exportar os layouts

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
