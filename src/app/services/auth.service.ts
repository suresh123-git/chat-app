import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptorFn } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../types/user.types';

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const parsedUser = JSON.parse(user);
      // Ensure the user object has the required properties
      parsedUser.isOnline = parsedUser.isOnline || false;
      parsedUser.lastSeen = parsedUser.lastSeen ? new Date(parsedUser.lastSeen) : new Date();
      this.currentUserSubject.next(parsedUser);
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => {
          // Ensure the user object has the required properties
          response.user.isOnline = response.user.isOnline || false;
          response.user.lastSeen = response.user.lastSeen ? new Date(response.user.lastSeen) : new Date();
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('token', response.access_token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { username, email, password })
      .pipe(
        tap(response => {
          // Ensure the user object has the required properties
          response.user.isOnline = response.user.isOnline || false;
          response.user.lastSeen = response.user.lastSeen ? new Date(response.user.lastSeen) : new Date();
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('token', response.access_token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }
} 