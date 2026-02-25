import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css', '../auth.component.css'],
  standalone: false
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isEmailSent = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Initialize component
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

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  onSubmit(): void {
    if (this.isLoading || this.forgotPasswordForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.forgotPasswordForm.value;
    
    this.authService.forgotPassword({ email: formValue.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isEmailSent = true;
        setTimeout(() => {
          if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
          }
        }, 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to send reset link. Please try again.';
      }
    });
  }
}
