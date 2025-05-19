import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './account/login/login.component';
import { RegisterComponent } from './account/register/register.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './account/profile/profile.component';
import { BoardAdminComponent } from './admin/board-admin/board-admin.component';
import { BoardUserComponent } from './board-user/board-user.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule} from '@angular/common/http';
import { authInterceptorProviders } from './_helpers/auth.interceptor';
import {ForgotPasswordComponent} from "./account/forgot-password/forgot-password.component";
import {PasswordResetComponent} from "./account/password-reset/password-reset.component";
import {NgxTranslateModule} from "./translate/translate.module";
import {SettingsComponent} from "./account/settings/settings.component";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsersComponent } from "./admin/users/users.component";
import { UsersEditComponent } from "./admin/users/edit/users-edit.component";
import { MetricsComponent } from "./admin/metrics/metrics.component";
import { SharedModule } from "./shared-components/shared.module";
import { LogsComponent } from "./admin/logs/logs.component";
import { ConfigsComponent } from "./admin/configs/configs.component";

@NgModule({
  declarations: [
    AppComponent,
    ConfigsComponent,
    LogsComponent,
    LoginComponent,
    ForgotPasswordComponent,
    PasswordResetComponent,
    RegisterComponent,
    HomeComponent,
    ProfileComponent,
    SettingsComponent,
    BoardAdminComponent,
    BoardUserComponent,
    MetricsComponent,
    UsersComponent,
    UsersEditComponent
  ],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		HttpClientModule,
		NgxTranslateModule,
		NgbModule,
        NgSelectModule,
		ReactiveFormsModule,
        SharedModule
	],
  providers: [authInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule { }

