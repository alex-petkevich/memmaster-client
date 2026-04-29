import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpResponse} from "@angular/common/http";
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

  bulkImport(folder_id:number, dictionary: IDictionaryPair[]) : Observable<any> {
    return this.http.post(API_URL + folder_id + '/bulk-import', dictionary, httpOptions);
  }

  bulkImportFile(folder_id:number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post(API_URL + folder_id + '/bulk-import-file', fd);
  }

  markAsRemembered(folder_id: number, pair_id: number): Observable<any> {
    return this.http.patch(API_URL + folder_id + '/' + pair_id + '/remembered', {}, httpOptions);
  }

  markAsArchived(folder_id: number, pair_id: number): Observable<any> {
    return this.http.patch(API_URL + folder_id + '/' + pair_id + '/archived', {}, httpOptions);
  }

  toggleArchived(folder_id: number, pair_id: number): Observable<any> {
    return this.http.patch(API_URL + folder_id + '/' + pair_id + '/toggle-archived', {}, httpOptions);
  }

  export(folder_id:number, format: 'csv' | 'xlsx' | 'docx'): Observable<HttpResponse<Blob>> {
    return this.http.get(API_URL + folder_id + '/export?format=' + encodeURIComponent(format), {
      observe: 'response',
      responseType: 'blob'
    });
  }

  copyToFolder(source_folder_id: number, target_folder_id: number): Observable<any> {
    return this.http.post(API_URL + source_folder_id + '/copy-to/' + target_folder_id, {}, httpOptions);
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
