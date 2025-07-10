import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Necessário se houver routerLink em componentes shared

// Importações dos componentes compartilhados
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { ModalWrapperComponent } from './components/modal-wrapper/modal-wrapper.component';
import { FeedbackMessageComponent } from './feedback-message/feedback-message.component';

@NgModule({
  declarations: [
    AuthLayoutComponent,
    DashboardLayoutComponent,
    ModalWrapperComponent,
    FeedbackMessageComponent, 
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule, // Importei pois componentes compartilhados usarem rotas
  ],
  exports: [
    // ESSAS EXPORTAÇÕES SÃO VITAIS para que outros módulos possam usar esses componentes
    AuthLayoutComponent,
    DashboardLayoutComponent,
    ModalWrapperComponent,
    FeedbackMessageComponent, // Exporte aqui
    // Exporte também os módulos que são comumente usados pelos componentes compartilhados
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule, // Exporte se os módulos que importam SharedModule forem usar routerLink e não o importarem diretamente
  ],
})
export class SharedModule {}
