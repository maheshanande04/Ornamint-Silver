import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface RegisterRequest {
  email: string;
  password: string;
  referring_code: number; 
}

export interface VerifyUserRequest {
  email: string;
  otp: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  platform: string;
  device_add:string;
  device_type:string
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  hash:string;
  user_id:string
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  register(payload: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, payload);
  }

  verifyUser(payload: VerifyUserRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/verifyUser`, payload);
  }

  login(payload: LoginRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, {
      ...payload,
      platform: payload.platform || 'Ornamint'
    });
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/resetPassword/forgot`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/resetPassword/reset`, payload);
  }

  resendOtp(payload: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/resendOtp`, payload);
  }

  getUserId(): number | null {
    const id = localStorage.getItem('user_id');
    return id ? parseInt(id, 10) : null;
  }

  setUserId(userId: number): void {
    localStorage.setItem('user_id', userId.toString());
  }
}
