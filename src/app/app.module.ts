import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Módulos para formulários
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // Adicione FormsModule também para ngModel

// Seus componentes de login/cadastro (já fizemos um rascunho na resposta anterior)
import { LoginComponent } from './LoginComponents/login/login.component';
import { CadastroComponent } from './LoginComponents/cadastro/cadastro.component';
// import { RecuperarSenhaComponent } from './LoginComponents/recuperar-senha/recuperar-senha.component'; // A ser criado
// import { CadastroSenhaComponent } from './LoginComponents/cadastro-senha/cadastro-senha.component'; // A ser criado

// Componentes da página inicial (Home)
import { HomeComponent } from './pages/home/home.component';

// Componentes Shared (Feedback Message você já deve ter, adicionando os layouts e modal)
import { FeedbackMessageComponent } from './shared/feedback-message/feedback-message.component'; // Verifique o caminho correto
import { AuthLayoutComponent } from './shared/layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './shared/layout/dashboard-layout/dashboard-layout.component';
import { ModalWrapperComponent } from './shared/components/modal-wrapper/modal-wrapper.component';
import { SharedModule } from './shared.module';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    CadastroComponent,
    // RecuperarSenhaComponent, // Descomente quando criar
    // CadastroSenhaComponent, // Descomente quando criar
    FeedbackMessageComponent,
    AuthLayoutComponent,
    DashboardLayoutComponent,
    ModalWrapperComponent,
    // ... adicione aqui todos os outros componentes à medida que forem criados
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule, // Importe para ngModel
    // Configuração do Firebase:
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    SharedModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
