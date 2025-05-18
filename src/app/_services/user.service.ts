import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
const API_URL = environment.backendUrl + 'api/user/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getPublicContent(): Observable<any> {
    return this.http.get(API_URL + 'all', { responseType: 'text' });
  }
  getUserBoard(): Observable<any> {
    return this.http.get(API_URL + 'user', { responseType: 'text' });
  }
  getAdminBoard(): Observable<any> {
    return this.http.get(API_URL + 'admin', { responseType: 'text' });
  }

  getCurrentUser() : Observable<any> {
    return this.http.get(API_URL, { responseType: 'json' });
  }

  saveUser(username: string, email: string,lastname: string, firstname: string): Observable<any> {
    return this.http.post(API_URL, {
      username,
      email,
      firstname,
      lastname
    }, httpOptions);
  }

  saveUserLanguage(lang: string): Observable<any> {
    return this.http.post(API_URL + 'lang', {
      lang: lang
    }, httpOptions);
  }
}
