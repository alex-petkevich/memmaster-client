import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import {IDictionaryPair} from "../model/name_value.model";
const API_URL = environment.backendUrl + 'api/dictionary/';
const FILES_URL = environment.backendUrl + 'api/files/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {

  constructor(private readonly http: HttpClient) { }

  list(folder_id:number) : Observable<any> {
    return this.http.get(API_URL + folder_id + '/', { responseType: 'json' });
  }

  save(folder_id:number, dictionary: IDictionaryPair[]) : Observable<any> {
    return this.http.post(API_URL + folder_id + '/', dictionary, httpOptions);
  }

  uploadAttachment(file: File): Observable<{ filename: string }> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<{ filename: string }>(FILES_URL + 'upload-attachment', fd);
  }

  attachmentUrl(storedPath: string): string {
    const normalizedPath = storedPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const encodedPath = normalizedPath
      .split('/')
      .filter(Boolean)
      .map(part => encodeURIComponent(part))
      .join('/');
    return FILES_URL + 'attachment/' + encodedPath;
  }
}
