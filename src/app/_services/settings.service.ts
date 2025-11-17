import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import { ISettingsInfo } from "../model/setting.model";
const API_URL = environment.backendUrl + 'api/settings/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private http: HttpClient) {

  }

  getUserSettings() : Observable<any> {
    return this.http.get(API_URL, { responseType: 'json' });
  }

  getGlobalSettings() : Observable<any> {
    return this.http.get(API_URL + 'global/', { responseType: 'json' });
  }

  save(settings: ISettingsInfo): Observable<any> {
    return this.http.post(API_URL, settings, httpOptions);
  }

  saveGlobalSettings(settings: ISettingsInfo): Observable<any> {
    return this.http.post(API_URL + 'global/', settings, httpOptions);
  }
}
