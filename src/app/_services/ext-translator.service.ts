import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import { IFolder } from "../model/folder.model";
import {IDictionaryPair} from "../model/name_value.model";
import {IWord} from "../model/word.model";
const API_URL = environment.backendUrl + 'api/translator';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ExtTranslatorService {

  constructor(private readonly http: HttpClient) { }

  lookup(text: string, lng_src: string, lng_dest: string) : Observable<IWord[]> {
    return this.http.post(API_URL + '/', {text: text, lng_src: lng_src, lng_dest: lng_dest}, httpOptions) as Observable<IWord[]>;
  }
}
