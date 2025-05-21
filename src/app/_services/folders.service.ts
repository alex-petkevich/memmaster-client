import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import { IFolder } from "../model/folder.model";
const API_URL = environment.backendUrl + 'api/folder/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class FoldersService {

  constructor(private http: HttpClient) { }

  list(name:string, uuid: string, parent_id: string, active: boolean, sort = "", order = "") : Observable<any> {
    let sortOrder = '';
    if (order == 'desc' && sort) {
      sortOrder = '-desc';
    }
    return this.http.get(API_URL + '?name='+name+'&uuid='+uuid+'&parent_id='+parent_id+'&active='+active+'&sort='+sort + sortOrder, { responseType: 'json' });
  }

  get(id: Number) : Observable<any> {
    return this.http.get(API_URL + id, { responseType: 'json' });
  }

  delete(id: Number) : Observable<any> {
    return this.http.delete(API_URL + id, { responseType: 'json' });
  }

  save(user: IFolder): Observable<any> {
    return this.http.post(API_URL, user, httpOptions);
  }

  activateFolder(folderId: number): Observable<any> {
    return this.http.post(API_URL + 'activate/', folderId, httpOptions);
  }
}
