import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

// Public endpoints that don't require Authorization header
const PUBLIC_ENDPOINTS = [
  '/register',
  '/login',
  '/verifyUser',
  '/resetPassword/forgot',
  '/resetPassword/reset',
  '/resendOtp'
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('auth_token');
    const url = request.url;
    const isApiRequest = url.startsWith(API_CONFIG.baseUrl);
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(ep => url.includes(ep));

    // Add token only for authorized API requests (skip public auth endpoints)
    if (token && isApiRequest && !isPublicEndpoint) {
      const clonedRequest = request.clone({
        setHeaders: {
          Token: token
        }
      });
      return next.handle(clonedRequest);
    }

    return next.handle(request);
  }
}
