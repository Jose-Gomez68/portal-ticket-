import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    private readonly baseUrl = 'http://localhost:8080/api'

    constructor(private http: HttpClient) {}

    get<T>(endpoint: string, params?: HttpParams): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params });
    }
    
    post<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, { params });
    }
    
    put<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, { params });
    }   

    delete<T>(endpoint: string, params?: HttpParams): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params });
    }   

}