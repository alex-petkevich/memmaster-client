import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {environment} from "../environments/environment";
import {TokenStorageService} from "./token-storage.service";
import {Router} from "@angular/router";

const AUTH_API = 'api/account/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private token: TokenStorageService, private route: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post(environment.backendUrl + AUTH_API + 'signin', {
      username,
      password
    }, httpOptions);
  }

  register(username: string, email: string, lastname: string, firstname: string): Observable<any> {
    return this.http.post(environment.backendUrl + AUTH_API + 'signup', {
      username,
      email,
      firstname,
      lastname
    }, httpOptions);
  }

  activate(key: string): Observable<any> {
    return this.http.post(environment.backendUrl + AUTH_API + 'activate', {
      key
    }, httpOptions);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.get(environment.backendUrl + AUTH_API + 'forgot-password/' + email, { responseType: 'json' });
  }

  passwordReset(username: string, password: string): Observable<any> {
    return this.http.post(environment.backendUrl + AUTH_API + 'password-reset/', {
      username,
      password
    }, httpOptions);
  }

  checkKey(key: string): Observable<any> {
    return this.http.post(environment.backendUrl + AUTH_API + 'check-key', {
      key
    }, httpOptions);
  }

  isLoggedIn() {
    if (!this.token.getToken()) {
      this.route.navigate(['/login']).then(() => {
        window.location.reload();
      });
    }
  }
}
