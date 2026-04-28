import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import {environment} from "../../environments/environment";

declare const google: any;

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit {

  form: any = {
    username: null,
    email: null,
    firstname: null,
    lastname: null
  };
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';
  constructor(
    private authService: AuthService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    if (!environment.googleClientId || typeof google === 'undefined') {
      return;
    }

    const buttonHolder = document.getElementById('googleRegisterButton');
    if (!buttonHolder) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.onGoogleCredential(response?.credential)
    });

    google.accounts.id.renderButton(buttonHolder, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: 'continue_with'
    });
  }

  private onGoogleCredential(idToken?: string): void {
    if (!idToken) {
      this.translate.get('account.login.google-problem').subscribe({
        next: data => { this.errorMessage = data; }
      });
      this.isSignUpFailed = true;
      return;
    }

    this.authService.loginWithGoogle(idToken).subscribe({
      next: data => this.handleAuthSuccess(data),
      error: err => {
        this.errorMessage = err.error?.message || 'Google sign-in failed';
        this.isSignUpFailed = true;
      }
    });
  }

  private handleAuthSuccess(data: any): void {
    this.tokenStorage.saveToken(data.accessToken);
    this.tokenStorage.saveUser(data);
    if (data.lang) {
      this.tokenStorage.saveLang(data.lang);
    }

    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  onSubmit(): void {
    const { username, email, lastname, firstname } = this.form;
    this.authService.register(username, email, lastname, firstname).subscribe({
      next: data => {
        this.isSuccessful = true;
        this.isSignUpFailed = false;
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isSignUpFailed = true;
      }
    });
  }

}
