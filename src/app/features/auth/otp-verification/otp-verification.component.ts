import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css', '../auth.component.css'],
  standalone: false
})
export class OtpVerificationComponent implements OnInit, OnDestroy, AfterViewInit {
  otpForm: FormGroup;
  timer = 180; // 3 minutes in seconds
  private timerInterval?: any;
  canResend = false;
  isLoading = false;
  isResending = false;
  isVerified = false;
  otpError = '';
  email = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.otpForm = this.fb.group({
      otpDigits: this.fb.array([
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]),
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]),
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]),
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]),
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)]),
        this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)])
      ])
    });
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
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

  get otpDigitsArray(): FormArray {
    return this.otpForm.get('otpDigits') as FormArray;
  }

  get otpDigits(): string[] {
    return this.otpDigitsArray.controls.map(control => control.value || '');
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
      this.otpDigitsArray.at(index).setValue('');
      return;
    }

    this.otpDigitsArray.at(index).setValue(value);
    this.otpError = '';

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
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
        this.otpDigitsArray.at(i).setValue(pastedData[i]);
      }
      // Focus last input
      const lastInput = document.getElementById('otp-5');
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigitsArray.valid && this.otpDigits.every(digit => digit !== '');
  }

  resendOTP(): void {
    if (!this.canResend || !this.email || this.isResending) return;
    
    this.isResending = true;
    this.otpError = '';
    
    this.authService.resendOtp({ email: this.email }).subscribe({
      next: () => {
        this.isResending = false;
        // Reset OTP fields
        this.otpDigitsArray.controls.forEach(control => control.setValue(''));
        this.otpError = '';
        this.canResend = false;
        this.timer = 180;
        this.startTimer();
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }, 100);
      },
      error: (err) => {
        this.isResending = false;
        this.otpError = err?.error?.message || err?.error?.error || 'Failed to resend OTP.';
      }
    });
  }

  onSubmit(): void {
    if (this.isLoading || this.isVerified) return;
    
    if (!this.isOtpComplete()) {
      this.otpError = 'Please enter all 6 digits';
      return;
    }

    if (!this.email) {
      this.otpError = 'Email is required. Please go back and register again.';
      return;
    }

    this.isLoading = true;
    this.otpError = '';
    
    const otpCode = parseInt(this.otpDigits.join(''), 10);
    
    this.authService.verifyUser({
      email: this.email,
      otp: otpCode
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isVerified = true;
        setTimeout(() => {
          if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
          }
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }, 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.otpError = err?.error?.message || err?.error?.error || 'Invalid verification code. Please try again.';
        // Reset OTP fields
        this.otpDigitsArray.controls.forEach(control => control.setValue(''));
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          if (firstInput) {
            (firstInput as HTMLInputElement).focus();
          }
        }, 100);
      }
    });
  }
}
