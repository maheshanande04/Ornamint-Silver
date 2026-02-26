import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-inr-wallet',
  templateUrl: './inr-wallet.component.html',
  styleUrls: ['./inr-wallet.component.css']
})
export class InrWalletComponent implements OnInit, AfterViewInit {
  inrBalance = 0;
  isKycComplete = false;

  showDepositModal = false;
  showWithdrawModal = false;
  showConvertModal = false;

  inrDepositForm: FormGroup;
  inrWithdrawForm: FormGroup;
  convertForm: FormGroup;

  isLoading = false;
  isSubmittingInrDeposit = false;
  isSubmittingInrWithdraw = false;
  isConverting = false;
  errorMessage = '';

  inrBankDetails: any = null;
  inrDepositScreenshotFile: File | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.inrDepositForm = this.fb.group({
      transactionId: ['', [Validators.required]],
      method: ['', [Validators.required]],
      amount: ['', [Validators.min(1)]]
    });

    this.inrWithdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]]
    });

    this.convertForm = this.fb.group({
      inrAmount: ['', [Validators.required, Validators.min(1)]]
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
          this.inrBalance = UserService.extractBalance(data, 'inr');
          this.isKycComplete = UserService.isKycComplete(data);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // INR deposit
  openDepositModal(): void {
    if (!this.isKycComplete) {
      this.errorMessage = 'Please complete your KYC for INR wallet.';
      return;
    }
    this.showDepositModal = true;
    this.errorMessage = '';
    this.inrDepositForm.reset();
    this.inrDepositScreenshotFile = null;

    this.userService.getInrBankDetails().subscribe({
      next: (res) => {
        this.inrBankDetails = res?.data || res;
        setTimeout(() => this.initializeIcons(), 100);
      },
      error: () => {
        this.inrBankDetails = null;
        setTimeout(() => this.initializeIcons(), 100);
      }
    });
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
  }

  onInrDepositScreenshotSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.inrDepositScreenshotFile = input.files[0];
    }
  }

  submitInrDeposit(): void {
    if (this.inrDepositForm.invalid) {
      return;
    }
    this.isSubmittingInrDeposit = true;
    this.errorMessage = '';
    const formValue = this.inrDepositForm.value;

    this.userService.createInrDepositRequest({
      transactionId: formValue.transactionId,
      method: formValue.method,
      amount: formValue.amount ? parseFloat(formValue.amount) : undefined,
      screenshot: this.inrDepositScreenshotFile || undefined
    }).subscribe({
      next: (response) => {
        this.isSubmittingInrDeposit = false;
        if (response?.code === 200) {
          this.closeDepositModal();
        } else {
          this.errorMessage = response?.message || 'Failed to create deposit request';
        }
      },
      error: (err) => {
        this.isSubmittingInrDeposit = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to create deposit request';
      }
    });
  }

  // INR withdraw
  openWithdrawModal(): void {
    if (!this.isKycComplete) {
      this.errorMessage = 'Please complete your KYC for INR withdrawal.';
      return;
    }
    this.showWithdrawModal = true;
    this.errorMessage = '';
    this.inrWithdrawForm.reset();
    setTimeout(() => this.initializeIcons(), 100);
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
  }

  submitInrWithdraw(): void {
    if (this.inrWithdrawForm.invalid) {
      return;
    }
    this.isSubmittingInrWithdraw = true;
    this.errorMessage = '';
    const amount = parseFloat(this.inrWithdrawForm.value.amount);

    this.userService.initiateInrWithdrawal({
      withdrawalAmount: amount,
      currency: 'inr'
    }).subscribe({
      next: (response) => {
        this.isSubmittingInrWithdraw = false;
        if (response?.code === 200) {
          this.closeWithdrawModal();
          this.loadUserDetails();
        } else {
          this.errorMessage = response?.message || 'INR withdrawal failed';
        }
      },
      error: (err) => {
        this.isSubmittingInrWithdraw = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'INR withdrawal failed';
      }
    });
  }

  // INR to USD convert
  openConvertModal(): void {
    if (!this.isKycComplete) {
      this.errorMessage = 'Please complete your KYC to convert INR to USD.';
      return;
    }
    this.showConvertModal = true;
    this.errorMessage = '';
    this.convertForm.reset();
    setTimeout(() => this.initializeIcons(), 100);
  }

  closeConvertModal(): void {
    this.showConvertModal = false;
  }

  submitConversion(): void {
    if (this.convertForm.invalid) {
      return;
    }
    this.isConverting = true;
    this.errorMessage = '';
    const amount = parseFloat(this.convertForm.value.inrAmount);

    this.userService.convertInrToUsd({ inrAmount: amount }).subscribe({
      next: (response) => {
        this.isConverting = false;
        if (response?.code === 200) {
          this.closeConvertModal();
          this.loadUserDetails();
        } else {
          this.errorMessage = response?.message || 'Conversion failed';
        }
      },
      error: (err) => {
        this.isConverting = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Conversion failed';
      }
    });
  }

  get inrTransactionId() {
    return this.inrDepositForm.get('transactionId');
  }

  get inrMethod() {
    return this.inrDepositForm.get('method');
  }

  get inrWithdrawAmount() {
    return this.inrWithdrawForm.get('amount');
  }

  get convertInrAmount() {
    return this.convertForm.get('inrAmount');
  }
}

