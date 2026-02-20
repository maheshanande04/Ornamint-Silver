import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

declare var lucide: any;

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css', '../auth.component.css'],
  standalone: false
})
export class OtpVerificationComponent implements OnInit, OnDestroy, AfterViewInit {
  otpDigits: string[] = ['', '', '', '', '', ''];
  timer = 180; // 3 minutes in seconds
  private timerInterval?: any;
  canResend = false;
  isLoading = false;
  isVerified = false;
  otpError = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Start timer
    this.startTimer();
  }

  ngAfterViewInit(): void {
    // Initialize Lucide Icons
    this.initializeIcons();
    
    // Focus first input
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
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

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.canResend = true;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onOtpInput(index: number, event: any): void {
    const value = event.target.value;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      this.otpDigits[index] = '';
      return;
    }

    this.otpDigits[index] = value;
    this.otpError = '';

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Auto-submit if all fields are filled
    if (this.isOtpComplete()) {
      // Optionally auto-submit
      // this.onSubmit();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent): void {
    // Handle backspace
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim() || '';
    
    if (/^\d{6}$/.test(pastedData)) {
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = pastedData[i];
      }
      // Focus last input
      const lastInput = document.getElementById('otp-5');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }

  resendOTP(): void {
    if (!this.canResend) return;
    
    // Reset OTP fields
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
    this.canResend = false;
    this.timer = 180;
    this.startTimer();
    
    // Focus first input
    setTimeout(() => {
      const firstInput = document.getElementById('otp-0');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    }, 100);
    
    // Simulate API call to resend OTP
    console.log('Resending OTP...');
    // In real app: this.authService.resendOTP().subscribe(...)
  }

  onSubmit(): void {
    if (this.isLoading || this.isVerified) return;
    
    if (!this.isOtpComplete()) {
      this.otpError = 'Please enter all 6 digits';
      return;
    }

    this.isLoading = true;
    this.otpError = '';
    
    const otpCode = this.otpDigits.join('');
    console.log('Verifying OTP:', otpCode);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      
      // Simulate verification (in real app, check with backend)
      if (otpCode === '123456') {
        // Test OTP for demo
        this.isVerified = true;
        setTimeout(() => {
          if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
          }
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }, 100);
      } else {
        this.otpError = 'Invalid verification code. Please try again.';
        // Clear OTP fields
        this.otpDigits = ['', '', '', '', '', ''];
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }, 100);
      }
    }, 1500);
  }
}
