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
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params, withCredentials: true });
    }
    
    post<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, { params, withCredentials: true });
    }

    postWithCredentials<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
            withCredentials: true,
        });
    }
    
    put<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, { params, withCredentials: true });
    }   

    delete<T>(endpoint: string, params?: HttpParams): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params, withCredentials: true });
    }   

}