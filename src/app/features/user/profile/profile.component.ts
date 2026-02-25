import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

interface KYCStep {
  number: number;
  name: string;
  status: 'verified' | 'not-verified' | 'pending' | 'waiting-approval';
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  profileForm: FormGroup;
  panForm: FormGroup;
  aadhaarForm: FormGroup;
  bankForm: FormGroup;

  userDetails: any = {
    userName: '',
    email: '',
    accountHolderName: '',
    panNumber: '',
    aadhaarNumber: ''
  };

  kycSteps: KYCStep[] = [
    { number: 1, name: 'Pan Verification', status: 'not-verified' },
    { number: 2, name: 'Aadhaar Verification', status: 'not-verified' },
    { number: 3, name: 'Add Bank Account', status: 'not-verified' },
    { number: 4, name: 'Completed', status: 'not-verified' }
  ];

  currentKycStep = 1;
  kycStatus = 'Pending';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // File uploads
  aadhaarFrontFile: File | null = null;
  aadhaarBackFile: File | null = null;
  aadhaarFrontPreview: string | null = null;
  aadhaarBackPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      phoneCode: ['+1'],
      phone: ['', [Validators.required]]
    });

    this.panForm = this.fb.group({
      number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]]
    });

    this.aadhaarForm = this.fb.group({
      number: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      name: ['', [Validators.required]],
      dob: ['', [Validators.required]]
    });

    this.bankForm = this.fb.group({
      number: ['', [Validators.required]],
      ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserDetails();
  }

  ngAfterViewInit(): void {
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
  }

  private loadUserDetails(): void {
    const userId = this.authService.getUserId();
    if (userId == null) return;
    this.isLoading = true;
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const data = response?.data || response;
        if (data) {
          this.userDetails = {
            userName: data.userName || data.username || data.referral_code || '',
            email: data.email || '',
            accountHolderName: data.accountHolderName || data.fullName || data.panFullName || '',
            panNumber: data.panNumber || '',
            aadhaarNumber: data.aadharNumber || data.aadhaarNumber || ''
          };

          this.profileForm.patchValue({
            fullName: this.userDetails.accountHolderName,
            email: this.userDetails.email
          });

          // Update KYC status from userdetails API verification fields
          this.updateKycStatusFromUserDetails(data);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading user details:', err);
      }
    });
  }

  /**
   * Updates KYC section based on userdetails API response.
   * Status: 0/undefined = not verified, 1 = verified, 2 = waiting for admin approval
   */
  private updateKycStatusFromUserDetails(data: any): void {
    const panVerified = data.panVerified === 1 || data.panVerified === true;
    const aadharStatus = data.aadharVerified;
    const bankStatus = data.bankAccountVerified;
    const aadharVerified = aadharStatus === 1 || aadharStatus === true;
    const bankVerified = bankStatus === 1 || bankStatus === true;
    const aadharWaiting = aadharStatus === 2;
    const bankWaiting = bankStatus === 2;
    const isVerified = data.isVerified === 1 || data.isVerified === true;

    // Update PAN step (PAN is auto-verified, no admin approval)
    this.kycSteps[0].status = panVerified ? 'verified' : (this.kycSteps[0].status || 'not-verified');
    if (panVerified) this.currentKycStep = 2;

    // Update Aadhaar step: 1=verified, 2=waiting for approval
    if (aadharVerified) {
      this.kycSteps[1].status = 'verified';
      this.currentKycStep = 3;
    } else if (aadharWaiting) {
      this.kycSteps[1].status = 'waiting-approval';
      this.currentKycStep = 2;
    } else {
      this.kycSteps[1].status = this.kycSteps[1].status || 'not-verified';
    }

    // Update Bank step: 1=verified, 2=waiting for approval
    if (bankVerified) {
      this.kycSteps[2].status = 'verified';
      this.currentKycStep = 4;
    } else if (bankWaiting) {
      this.kycSteps[2].status = 'waiting-approval';
      this.currentKycStep = 3;
    } else {
      this.kycSteps[2].status = this.kycSteps[2].status || 'not-verified';
    }

    // Update Completed step
    this.kycSteps[3].status = (panVerified && aadharVerified && bankVerified) ? 'verified' : (this.kycSteps[3].status || 'not-verified');
    if (this.kycSteps[3].status === 'verified') {
      this.kycStatus = 'Verified';
    }
  }

  onFileSelected(event: Event, type: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (type === 'front') {
        this.aadhaarFrontFile = file;
        this.createPreview(file, 'front');
      } else {
        this.aadhaarBackFile = file;
        this.createPreview(file, 'back');
      }
    }
  }

  private createPreview(file: File, type: 'front' | 'back'): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (type === 'front') {
        this.aadhaarFrontPreview = e.target.result;
      } else {
        this.aadhaarBackPreview = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  submitPanVerification(): void {
    if (this.panForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.verifyPan(this.panForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response?.code === 200) {
          this.successMessage = 'PAN verified successfully';
          this.kycSteps[0].status = 'verified';
          this.currentKycStep = 2;
          this.userDetails.panNumber = this.panForm.value.number;
        } else {
          this.errorMessage = response?.message || 'PAN verification failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'PAN verification failed';
      }
    });
  }

  submitAadhaarVerification(): void {
    if (this.aadhaarForm.invalid || !this.aadhaarFrontFile || !this.aadhaarBackFile) {
      this.errorMessage = 'Please fill all fields and upload both images';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('aadharNumber', this.aadhaarForm.value.number);
    formData.append('aadharFullName', this.aadhaarForm.value.name);
    formData.append('aadharDob', this.aadhaarForm.value.dob);
    formData.append('frontImage', this.aadhaarFrontFile);
    formData.append('backImage', this.aadhaarBackFile);

    this.userService.verifyAadhaar(formData).subscribe({
      next: (response) => {
        if (response?.code === 200) {
          this.userDetails.aadhaarNumber = this.aadhaarForm.value.number;
          this.successMessage = response.message;
          setTimeout(() => {
            this.refreshUserDetailsAfterSubmit();
          }, 3000);
        } else {
          this.isLoading = false;
          this.errorMessage = response?.message || 'Aadhaar verification failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Aadhaar verification failed';
      }
    });
  }

  submitBankVerification(): void {
    if (this.bankForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.verifyBank(this.bankForm.value).subscribe({
      next: (response) => {
        if (response?.code === 200) {
          this.successMessage = response.message;
          setTimeout(() => {
            this.refreshUserDetailsAfterSubmit();
          }, 3000);
        } else {
          this.isLoading = false;
          this.errorMessage = response?.message || 'Bank verification failed';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Bank verification failed';
      }
    });
  }

  private refreshUserDetailsAfterSubmit(): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this.isLoading = false;
      return;
    }
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const data = response?.data || response;
        if (data) {
          this.updateKycStatusFromUserDetails(data);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    // In real app, call API to save profile
    const formValue = this.profileForm.getRawValue();
    console.log('Saving profile...', formValue);
  }

  getStepStatusClass(step: KYCStep): string {
    if (step.status === 'verified') return 'step-verified';
    if (step.status === 'waiting-approval') return 'step-waiting';
    if (step.number === this.currentKycStep) return 'step-active';
    return 'step-pending';
  }

  getStepStatusText(step: KYCStep): string {
    if (step.status === 'verified') return 'Verified';
    if (step.status === 'waiting-approval') return 'Waiting for approval';
    return 'Not Verified';
  }

  showAadhaarForm(): boolean {
    return this.currentKycStep === 2 && this.kycSteps[1].status !== 'waiting-approval';
  }

  showBankForm(): boolean {
    return this.currentKycStep === 3 && this.kycSteps[2].status !== 'waiting-approval';
  }

  get panNumber() {
    return this.panForm.get('number');
  }

  get aadhaarNumber() {
    return this.aadhaarForm.get('number');
  }

  get aadhaarName() {
    return this.aadhaarForm.get('name');
  }

  get aadhaarDob() {
    return this.aadhaarForm.get('dob');
  }

  get bankNumber() {
    return this.bankForm.get('number');
  }

  get bankIfsc() {
    return this.bankForm.get('ifsc');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    });
  }
}
