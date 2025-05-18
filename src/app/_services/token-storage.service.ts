import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const DEF_LANG = 'def-lang';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  constructor() { }

  signOut(): void {
    const lang = this.getLang();
    window.sessionStorage.clear();
    this.saveLang(lang);
  }

  public saveToken(token: string): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
    token && window.sessionStorage.setItem(TOKEN_KEY, token);
  }

  public getToken(): string | null {
    let token = window.sessionStorage.getItem(TOKEN_KEY);

    if (token !== undefined && token && this.tokenExpired(token as string)) {
      this.signOut();
      return null;
    }
    return token;
  }

  public saveUser(user: any): void {
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public getUser(): any {
    const user = window.sessionStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return {};
  }

  private tokenExpired(token: string) {
    const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
    return (Math.floor((new Date).getTime() / 1000)) >= expiry;
  }

  public saveLang(lang: string) {
    window.sessionStorage.setItem(DEF_LANG, lang);
  }

  public getLang() : string {
    const lang = window.sessionStorage.getItem(DEF_LANG);
    return lang || environment.defaultLanguage;
  }
}
