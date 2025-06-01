// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigurationComponent } from './features/configuration/configuration.component';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ServiceWizardComponent } from './features/services/service-wizard/service-wizard.component';
import { ApplicationDetailComponent } from './features/applications/application-detail/application-detail.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/config', pathMatch: 'full' },
  { path: 'config', component: ConfigurationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'service/:id', component: ServiceWizardComponent, canActivate: [AuthGuard] },
  { path: 'application/:id', component: ApplicationDetailComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/config' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
