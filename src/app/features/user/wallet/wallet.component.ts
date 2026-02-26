import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

interface Transaction {
  amount: number;
  date: string;
  type: string;
  status: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, AfterViewInit {
  currentPage = 1;
  totalPages = 1;
  balance = 0;
  walletAddress = '';
  isKycComplete = false;
  showDepositModal = false; 
  showWithdrawModal = false;
  withdrawStep: 1 | 2 = 1;
  
  withdrawForm: FormGroup;
  otpForm: FormGroup;
  
  transactions: Transaction[] = [];

  isLoading = false;
  isLoadingTransactions = false;
  isSubmittingWithdraw = false;
  errorMessage = '';
  withdrawData: any = {};

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.withdrawForm = this.fb.group({
      toAddress: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(2)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

  }

  ngOnInit(): void {
    this.loadUserDetails();
    this.loadTransactions();
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

  loadUserDetails(): void {
    const userId = this.authService.getUserId();
    if (userId == null) return;
    this.isLoading = true;
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const data = response?.data || response;
        if (data) {
          this.balance = UserService.extractBalance(data, 'usdt');
          this.walletAddress = UserService.extractWalletAddress(data);
          this.isKycComplete = UserService.isKycComplete(data);
          console.log(this.isKycComplete);
          
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading user details:', err);
      }
    });
  }

  get walletQrUrl(): string {
    if (!this.walletAddress) {
      return '';
    }
    const encoded = encodeURIComponent(this.walletAddress);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
  }

  openDepositModal(): void {
    if (!this.isKycComplete) {
      this.errorMessage = 'Please complete your KYC to use wallet deposit.';
      return;
    }
    this.showDepositModal = true;
    setTimeout(() => this.initializeIcons(), 100);
  }

  closeDepositModal(): void {
    this.showDepositModal = false;
  }

  openWithdrawModal(): void {
    if (!this.isKycComplete) {
      this.errorMessage = 'Please complete your KYC to withdraw funds.';
      return;
    }
    this.showWithdrawModal = true;
    this.withdrawStep = 1;
    this.withdrawForm.reset();
    this.otpForm.reset();
    this.errorMessage = '';
    setTimeout(() => this.initializeIcons(), 100);
  }

  closeWithdrawModal(): void {
    this.showWithdrawModal = false;
    this.withdrawStep = 1;
    this.withdrawForm.reset();
    this.otpForm.reset();
    this.errorMessage = '';
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Show toast notification
      console.log('Copied to clipboard');
    });
  }


  onWithdrawSubmit(): void {
    if (this.withdrawForm.invalid) return;

    this.isSubmittingWithdraw = true;
    this.errorMessage = '';
    
    const formValue = this.withdrawForm.value;
    this.withdrawData = {
      toAddress: formValue.toAddress,
      amount: parseFloat(formValue.amount)
    };

    this.userService.initiateWithdrawal({
      currency: 'usdt',
      toAddress: this.withdrawData.toAddress,
      amount: this.withdrawData.amount
      // No otp - API sends OTP to user's email
    }).subscribe({
      next: (response) => {
        this.isSubmittingWithdraw = false;
        if (response?.code === 200) {
          this.withdrawStep = 2;
          this.errorMessage = '';
          setTimeout(() => this.initializeIcons(), 100);
        } else {
          this.errorMessage = response?.message || 'Failed to send OTP';
        }
      },
      error: (err) => {
        this.isSubmittingWithdraw = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to send OTP. Please try again.';
      }
    });
  }

  onOtpSubmit(): void {
    if (this.otpForm.invalid) return;

    this.isSubmittingWithdraw = true;
    this.errorMessage = '';

    const otpValue = parseInt(this.otpForm.value.otp, 10);
    
    this.userService.initiateWithdrawal({
      currency: 'usdt',
      toAddress: this.withdrawData.toAddress,
      amount: this.withdrawData.amount,
      otp: otpValue
    }).subscribe({
      next: (response) => {
        this.isSubmittingWithdraw = false;
        if (response?.code === 200) {
          this.closeWithdrawModal();
          this.loadUserDetails(); // Refresh balance
          // Show success message
        } else {
          this.errorMessage = response?.message || 'Withdrawal failed';
        }
      },
      error: (err) => {
        this.isSubmittingWithdraw = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Withdrawal failed. Please try again.';
      }
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    const params = {
      pageNumber: this.currentPage,
      pageSize: 10,
      sortBy: '_id',
      sortOrder: 'desc'
    };

    const deposit$ = this.userService.getDepositHistory(params);
    const withdrawal$ = this.userService.getWithdrawalHistory(params);

    forkJoin([deposit$, withdrawal$]).subscribe({
        next: ([depositRes, withdrawRes]) => {
          const deposits = this.mapDeposits(depositRes);
          const withdrawals = this.mapWithdrawals(withdrawRes);
          const combined = [...deposits, ...withdrawals].sort((a, b) => {
            const dA = new Date(a.date).getTime();
            const dB = new Date(b.date).getTime();
            return dB - dA;
          });
          this.transactions = combined;
          this.totalPages = Math.max(
            this.getTotalPages(depositRes),
            this.getTotalPages(withdrawRes),
            1
          );
          this.isLoadingTransactions = false;
          setTimeout(() => this.initializeIcons(), 100);
        },
        error: (err) => {
          this.isLoadingTransactions = false;
          this.transactions = [];
          console.error('Error loading transactions:', err);
          setTimeout(() => this.initializeIcons(), 100);
        }
      });
  }

  private mapDeposits(res: any): Transaction[] {
    const list = res?.data ?? res?.transactions ?? res?.list ?? (Array.isArray(res) ? res : []);
    return (list || []).map((item: any) => ({
      amount: Math.abs(parseFloat(item.amount ?? item.amountUsdt ?? 0)),
      date: item.createdAt ?? item.date ?? item.timestamp ?? '',
      type: 'Deposit',
      status: item.status ?? 'Committed'
    }));
  }

  private mapWithdrawals(res: any): Transaction[] {
    const list = res?.data ?? res?.transactions ?? res?.list ?? (Array.isArray(res) ? res : []);
    return (list || []).map((item: any) => ({
      amount: -Math.abs(parseFloat(item.amount ?? item.amountUsdt ?? 0)),
      date: item.createdAt ?? item.date ?? item.timestamp ?? '',
      type: 'Withdraw',
      status: item.status ?? 'Pending'
    }));
  }

  private getTotalPages(res: any): number {
    const total = res?.total ?? res?.totalRecords ?? res?.totalCount ?? 0;
    const pageSize = 10;
    return total > 0 ? Math.ceil(total / pageSize) : 1;
  }

  get toAddress() {
    return this.withdrawForm.get('toAddress');
  }

  get amount() {
    return this.withdrawForm.get('amount');
  }

  get otp() {
    return this.otpForm.get('otp');
  }

}
