import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AuthService} from "../../_services/auth.service";
import {TokenStorageService} from "../../_services/token-storage.service";
import {ActivatedRoute, Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import {environment} from "../../environments/environment";

declare const google: any;

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {

  form: any = {
    username: null,
    password: null
  };
  isLoggedIn = false;
  isLoginFailed = false;
    isActivationSuccessful = false;
  errorMessage = '';
  roles: string[] = [];

  constructor(private authService: AuthService,
              private tokenStorage: TokenStorageService,
              private route: ActivatedRoute,
              private router: Router,
              private translate: TranslateService) {
    this.route.url.subscribe(params => {
      if (params.length > 1 && params[1].path == 'activate') {
        this.route.queryParams.subscribe(queryParams => {
          queryParams['key'] != '' && this.onActivate(queryParams['key']);
        })
      }
    })
  }

  private onActivate(key: string) {
    this.authService.activate(key).subscribe({
      next: data => {
        if (!data.id) {
          this.translate.get('account.login.activation-key-not-exists').subscribe({
            next:data => { this.errorMessage = data; }
          });
          this.isLoginFailed = true;
        } else {
          this.isActivationSuccessful = true;
        }
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    });
  }

  ngOnInit(): void {
    if (this.tokenStorage.getToken()
    ) {
      this.isLoggedIn = true;
      this.roles = this.tokenStorage.getUser().roles;
    }
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    if (this.isLoggedIn || !environment.googleClientId || typeof google === 'undefined') {
      return;
    }

    const buttonHolder = document.getElementById('googleLoginButton');
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
      this.isLoginFailed = true;
      return;
    }

    this.authService.loginWithGoogle(idToken).subscribe({
      next: data => this.handleLoginSuccess(data),
      error: err => {
        this.errorMessage = err.error?.message || 'Google sign-in failed';
        this.isLoginFailed = true;
      }
    });
  }

  private handleLoginSuccess(data: any): void {
    this.tokenStorage.saveToken(data.accessToken);
    this.tokenStorage.saveUser(data);
    if (data.lang) {
      this.tokenStorage.saveLang(data.lang);
    }

    this.router.navigate(['/']).then(() => {
      window.location.reload();
    });
  }

  onSubmit() : void {
    const {username, password} = this.form;
    this.authService.login(username, password).subscribe({
      next: data => this.handleLoginSuccess(data),
      error: err => {
        this.errorMessage = err.error.message || 'Unexpected error, try later';
        this.isLoginFailed = true;
      }
    });
  }
}
