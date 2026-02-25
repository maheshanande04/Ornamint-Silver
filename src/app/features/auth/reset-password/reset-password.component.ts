import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

// Custom validator for password match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  
  if (!newPassword || !confirmPassword) {
    return null;
  }
  
  return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css', '../auth.component.css'],
  standalone: false
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  resetForm: FormGroup;
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  isPasswordReset = false;
  errorMessage = '';
  invalidLink = false;
  private userId = '';
  private hash = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParams['user_id'] || '';
    this.hash = this.route.snapshot.queryParams['hash'] || '';
    this.invalidLink = !this.userId || !this.hash;
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

  get newPassword() {
    return this.resetForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  get passwordMismatch() {
    return this.resetForm.errors?.['passwordMismatch'] && 
           this.confirmPassword?.touched;
  }

  onSubmit(): void {
    if (this.isLoading || this.invalidLink || this.resetForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.resetForm.value;
    
    this.authService.resetPassword({
       newPassword:formValue.newPassword,
       hash:this.hash,
       user_id:this.userId,
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
         if (response?.code==200) {
         this.isPasswordReset = true;
            setTimeout(() => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
              lucide.createIcons();
            }
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }, 100);
         }else{
           this.errorMessage =response.message
           setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 3000);
         }
      
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to reset password. The link may have expired.';
      }
    });
  }
}
