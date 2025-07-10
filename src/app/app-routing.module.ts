import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/LoginComponents/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { RecuperarSenhaComponent } from './pages/LoginComponents/recuperar-senha/recuperar-senha.component';
import { CadastroComponent } from './pages/LoginComponents/cadastro/cadastro.component';
import { StarterComponent } from './pages/LoginComponents/starter/starter.component';

const routes: Routes = [
  { path: '', redirectTo: 'starter', pathMatch: 'full' },
  { path: 'starter', component: StarterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}