import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime, distinctUntilChanged, forkJoin, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

declare var lucide: any;

interface Transaction {
  amount: number;
  date: string;
  type: string;
  status: string;
}

@Component({
  selector: 'app-inr-wallet',
  templateUrl: './inr-wallet.component.html',
  styleUrls: ['./inr-wallet.component.css']
})
export class InrWalletComponent implements OnInit, AfterViewInit {
  currentPage = 1;
  totalPages = 1;
  inrBalance = 0;
  isKycComplete = false;

  showDepositModal = false;
  showWithdrawModal = false;
  showConvertModal = false;

  inrDepositForm: FormGroup;
  inrWithdrawForm: FormGroup;
  convertForm: FormGroup;

  isLoading = false;
  isLoadingTransactions = false;
  isSubmittingInrDeposit = false;
  isSubmittingInrWithdraw = false;
  isConverting = false;
  errorMessage = '';

  inrBankDetails: any = null;
  inrDepositScreenshotFile: File | null = null;

  transactions: Transaction[] = [];
  previewData: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.inrDepositForm = this.fb.group({
      transactionId: ['', [Validators.required]],
      method: ['', [Validators.required]],
      date: ['', [Validators.required]],
      amount: ['', [Validators.required], [Validators.min(1)]]
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

     // Call preview API when amount changes
    this.convertForm.get('inrAmount')?.valueChanges
      .pipe(
        debounceTime(500),          // wait 500ms after typing
        distinctUntilChanged(),     // only if value changed
        switchMap(value => 
          this.userService.convertpreview(value)
        )
      )
      .subscribe(response => {
        this.previewData = response.data;
      });
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
      error: (err: any) => {
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
      currency: 'INR',
      method: formValue.method,
      date: formValue.date,
      amount: formValue.amount ? parseFloat(formValue.amount) : undefined,
      file: this.inrDepositScreenshotFile || undefined
    }).subscribe({
      next: (response) => {
        this.isSubmittingInrDeposit = false;
        if (response?.code === 200) {
          Swal.fire({
            title: 'Success!',
            text: response.message,
            icon: 'success',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed) {
              this.closeDepositModal();
            }
          });
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
          Swal.fire({
            title: 'Success!',
            text: response.message,
            icon: 'success',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed) {
              this.closeConvertModal();
              this.loadUserDetails();
            }
          });

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

