import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

const API_URL = environment.backendUrl + 'api/contact';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  constructor(private http: HttpClient) {}

  send(contactForm: { questionType: string; subject: string; comment: string }): Observable<any> {
    return this.http.post(API_URL, contactForm, httpOptions);
  }
}

