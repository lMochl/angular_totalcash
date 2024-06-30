import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://172.17.0.3:3000/api/auth';
  private tokenKey = 'token';
  private expirationKey = 'token_expiration';

  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) { }

  // Funcion del registro
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  // Funcion del login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      map((response: any) => {
        localStorage.setItem('token', response.token);
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 60);
        localStorage.setItem(this.expirationKey, expirationDate.toString());

        return response;
      })
    );
  }

  // Verificar si esta autenticado 
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    const expiration = localStorage.getItem(this.expirationKey);

    if (!token || !expiration) {
      return false;
    }

    const expirationDate = new Date(expiration);
    return expirationDate > new Date();
  }

  // Cerrar sesion
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.expirationKey);
  }

  // Obtener el nombre del usuario
  getUsername(): string {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken.username;
    }
    return '';
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    const decodedToken = this.jwtHelper.decodeToken(token);
    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decodedToken.exp);
    localStorage.setItem(this.expirationKey, expirationDate.toString());
  }

  // Actualiza la info del usuario
  updateProfile(formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, formData).pipe(
      map((response: any) => {
        if (response.token) {
          this.setToken(response.token);
        }
        return response;
      })
    );
  }

  // Se obtiene la imagen de perfil
  getUserProfileImage(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/profile/image`, { responseType: 'blob' });
  }

}
