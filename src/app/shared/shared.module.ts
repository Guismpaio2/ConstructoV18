import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importe o RouterModule

// Importe seus componentes compartilhados
import { ModalWrapperComponent } from './components/modal-wrapper/modal-wrapper.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';
import { FeedbackMessageComponent } from './feedback-message/feedback-message.component';

@NgModule({
  declarations: [
    // Declare os componentes que pertencem a este módulo
    ModalWrapperComponent,
    FeedbackMessageComponent,
    AuthLayoutComponent,
    DashboardLayoutComponent,
  ],
  imports: [
    CommonModule,
    RouterModule, // Importe o RouterModule aqui para que <router-outlet> funcione nos layouts
  ],
  exports: [
    // Exporte os componentes para que outros módulos possam usá-los
    ModalWrapperComponent,
    FeedbackMessageComponent,
    AuthLayoutComponent,
    DashboardLayoutComponent,
  ],
})
export class SharedModule {}
