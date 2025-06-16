import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import { IFolder } from "../model/folder.model";
const API_URL = environment.backendUrl + 'api/directory/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {

  constructor(private http: HttpClient) { }

  list(type:string) : Observable<any> {
    return this.http.get(API_URL + type + '/', { responseType: 'json' });
  }

  get(type:string, key: string) : Observable<any> {
    return this.http.get(API_URL + type + '/' + key + '/', { responseType: 'json' });
  }
}
