import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; 

import { AppRoutingModule } from './app-routing.module'; // <<-- VERIFIQUE ESTE CAMINHO
import { AppComponent } from './app.component';

import { environment } from '../app/enviroments/enviroment'; 

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

// IMPORTAÇÕES DOS SEUS COMPONENTES (Todos estes DEVEM ser 'import' e 'declarados' abaixo)
// Caminhos conforme sua estrutura
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component';
import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component';
import { StarterComponent } from './LoginComponents/starter/starter.component';

import { HomeComponent } from './pages/home/home.component';

import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { FeedbackMessageComponent } from './shared/feedback-message/feedback-message.component';
import { ModalWrapperComponent } from './shared/components/modal-wrapper/modal-wrapper.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CadastroComponent,
    CadastroSenhaComponent,
    RecuperarSenhaComponent,
    StarterComponent,
    HomeComponent,
    AuthLayoutComponent,
    DashboardLayoutComponent,
    FeedbackMessageComponent,
    ModalWrapperComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,

    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }