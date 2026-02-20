import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

declare var lucide: any;

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css', '../auth.component.css'],
  standalone: false
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  resetData = {
    newPassword: '',
    confirmPassword: ''
  };

  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  isPasswordReset = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize component
    // In a real app, you would verify the reset token from the URL
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

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 50);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 50);
  }

  onSubmit(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log('Password reset data:', this.resetData);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.isPasswordReset = true;
      setTimeout(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }, 100);
    }, 1500);
  }
}
