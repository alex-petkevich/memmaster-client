import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {LoginComponent} from "./account/login/login.component";
import {RegisterComponent} from "./account/register/register.component";
import {ProfileComponent} from "./account/profile/profile.component";
import {BoardUserComponent} from "./board-user/board-user.component";
import {BoardAdminComponent} from "./admin/board-admin/board-admin.component";
import {ForgotPasswordComponent} from "./account/forgot-password/forgot-password.component";
import {PasswordResetComponent} from "./account/password-reset/password-reset.component";
import {SettingsComponent} from "./account/settings/settings.component";
import { UsersComponent } from "./admin/users/users.component";
import { UsersEditComponent } from "./admin/users/edit/users-edit.component";
import { MetricsComponent } from "./admin/metrics/metrics.component";
import { LogsComponent } from "./admin/logs/logs.component";
import { ConfigsComponent } from "./admin/configs/configs.component";
import { FoldersComponent } from './folders/folders.component';
import { FoldersEditComponent } from './folders/edit/folders-edit.component';

const routes: Routes = [
  { path: 'account/activate', component: LoginComponent },
  { path: 'account/forgot-password', component: ForgotPasswordComponent },
  { path: 'account/password-reset', component: PasswordResetComponent },
  { path: 'admin', component: BoardAdminComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin/users', component: UsersComponent },
  { path: 'admin/users/new', component: UsersEditComponent },
  { path: 'admin/users/:id/edit', component: UsersEditComponent },
  { path: 'admin/users/:id/delete', component: UsersEditComponent },
  { path: 'admin/metrics', component: MetricsComponent },
  { path: 'admin/metrics/:id', component: MetricsComponent },
  { path: 'admin/logs', component: LogsComponent },
  { path: 'admin/configs', component: ConfigsComponent },
  { path: 'folders', component: FoldersComponent },
  { path: 'folders/new', component: FoldersEditComponent },
  { path: 'folders/:id/:action', component: FoldersEditComponent },
  { path: 'folders/:id/delete', component: FoldersEditComponent },
  { path: 'user', component: BoardUserComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
