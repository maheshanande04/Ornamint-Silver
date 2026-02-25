import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../auth.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Initialize Lucide Icons
    this.initializeIcons();
  }

  private initializeIcons(): void {
    const tryInit = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
    
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 500);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 50);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }

  onSubmit(): void {
    if (this.isLoading || this.loginForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.loginForm.value;
    
    this.authService.login({
      username: formValue.email,
      password: formValue.password,
      platform: 'Ornamint',
      device_add: "123.3.1.2",
      device_type: "web"
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Store token/session if API returns it
        if (response?.code === 200) {
          localStorage.setItem('auth_token', response.token);
          const userId = response.userDetails?.user_id;
          console.log('userId', userId);
          
          if (userId != null) {
            
            this.authService.setUserId(userId);
          }
          this.router.navigate(['/user/dashboard']);
        } else {
          this.errorMessage=response.message
        }
        ;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Login failed. Please check your credentials.';
      }
    });
  }
}
