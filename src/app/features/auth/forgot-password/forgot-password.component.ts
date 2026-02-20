import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

declare var lucide: any;

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css', '../auth.component.css'],
  standalone: false
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  resetData = {
    email: ''
  };

  isLoading = false;
  isEmailSent = false;

  constructor(private router: Router) {}

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

  onSubmit(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log('Password reset request:', this.resetData);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.isEmailSent = true;
      setTimeout(() => {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          lucide.createIcons();
        }
        // In a real app, you would redirect to reset-password with a token
        // For now, show success message and user can click link from email
        // this.router.navigate(['/auth/reset-password'], { queryParams: { token: 'reset-token' } });
      }, 100);
    }, 1500);
  }
}
