import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import { IUser } from "../model/user.model";
const API_URL = environment.backendUrl + 'api/user/admin/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }

  list(name:string, username: string, email: string, role: string, active: boolean, pg: number = 0, sort = "", order = "") : Observable<any> {
    let sortOrder = '';
    if (order == 'desc' && sort) {
      sortOrder = '-desc';
    }
    return this.http.get(API_URL + '?name='+name+'&username='+username+'&email='+email+'&role='+role+'&active='+active+'&sort='+sort + sortOrder +'&page=' + pg, { responseType: 'json' });
  }

  get(id: Number) : Observable<any> {
    return this.http.get(API_URL + id, { responseType: 'json' });
  }

  getRoles() : Observable<any> {
    return this.http.get(API_URL + 'roles/', { responseType: 'json' });
  }

  delete(id: Number) : Observable<any> {
    return this.http.delete(API_URL + id, { responseType: 'json' });
  }

  save(user: IUser): Observable<any> {
    return this.http.post(API_URL, user, httpOptions);
  }

  activateUser(userId: number): Observable<any> {
    return this.http.post(API_URL + 'activate/', userId, httpOptions);
  }
}
