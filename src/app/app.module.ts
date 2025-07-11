import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Adicione esta linha
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importações do AngularFire
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

// Sua configuração do environment
import { environment } from '../app/enviroments/enviroment';

// Importe seus componentes aqui para que o Angular os reconheça
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { SharedModule } from './shared/shared.module';
// ... adicione outros componentes que você usa

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent, // Declare os componentes
    CadastroComponent,
    // ...
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    SharedModule, // Adicione o FormsModule para usar ngModel nos formulários

    // Inicializa o Firebase com as suas chaves
    AngularFireModule.initializeApp(environment.firebase),

    // Importa os módulos que você vai usar (Autenticação e Banco de Dados)
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
