import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
const API_URL = environment.backendUrl + 'api/management/';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  constructor(private http: HttpClient) { }

  getHealth() : Observable<any> {
    return this.http.get(API_URL + 'health', { responseType: 'json' });
  }

  getBeans() : Observable<any> {
    return this.http.get(API_URL + 'beans', { responseType: 'json' });
  }

  getCaches() : Observable<any> {
    return this.http.get(API_URL + 'caches', { responseType: 'json' });
  }

  getCacheInfo(cache: string) : Observable<any> {
    return this.http.get(API_URL + 'caches/' + cache, { responseType: 'json' });
  }

  getConditions() : Observable<any> {
    return this.http.get(API_URL + 'conditions', { responseType: 'json' });
  }

  getConfigprops() : Observable<any> {
    return this.http.get(API_URL + 'configprops', { responseType: 'json' });
  }

  getEnv() : Observable<any> {
    return this.http.get(API_URL + 'env', { responseType: 'json' });
  }

  getFlyway() : Observable<any> {
    return this.http.get(API_URL + 'flyway', { responseType: 'json' });
  }

  getLoggers() : Observable<any> {
    return this.http.get(API_URL + 'loggers', { responseType: 'json' });
  }

  getLoggerInfo(name: string) : Observable<any> {
    return this.http.get(API_URL + 'loggers/' + name, { responseType: 'json' });
  }

  getMetrics() : Observable<any> {
    return this.http.get(API_URL + 'metrics', { responseType: 'json' });
  }

  getMetricInfo(name: string) : Observable<any> {
    return this.http.get(API_URL + 'metrics/'+name, { responseType: 'json' });
  }

  getScheduledtasks() : Observable<any> {
    return this.http.get(API_URL + 'scheduledtasks', { responseType: 'json' });
  }

  getMappings() : Observable<any> {
    return this.http.get(API_URL + 'mappings', { responseType: 'json' });
  }

}
