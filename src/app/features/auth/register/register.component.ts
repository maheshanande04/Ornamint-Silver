import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

// Custom validator for password match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css', '../auth.component.css'],
  standalone: false
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      referralCode: ['', [Validators.required, Validators.maxLength]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    // Prefill referral code from ?ref= query param if present
    const refFromQuery = this.route.snapshot.queryParamMap.get('ref');
    if (refFromQuery) {
      this.registerForm.patchValue({ referralCode: refFromQuery });
    }
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

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 50);
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get referralCode() {
    return this.registerForm.get('referralCode');
  }

  get acceptTerms() {
    return this.registerForm.get('acceptTerms');
  }

  get passwordMismatch() {
    return this.registerForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }

  onSubmit(): void {
    if (this.isLoading || this.registerForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.registerForm.value;
    
    this.authService.register({
      email: formValue.email,
      password: formValue.password,
      referring_code: formValue.referralCode
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Navigate to OTP verification with email
         if (response?.code==200) {
            this.router.navigate(['/auth/otp-verification'], {
            queryParams: { email: formValue.email }
           });
         }else{
          this.errorMessage=response.message
        }
       
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Registration failed. Please try again.';
      }
    });
  }
}
