import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

interface Package {
  id: number;
  planId: number;
  name: string;
  minAmount: number;
  maxAmount: number | null;  // null = no upper limit
  roi: number;
  duration: string;
  penalty: string;
  ribbonText: string;
}

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit, AfterViewInit {
  packages: Package[] = [
    {
      id: 1,
      planId: 1,
      name: 'Mini Lot',
      minAmount: 100,
      maxAmount: 500,
      roi: 3,
      duration: '12 months',
      penalty: '25% penalty on withdraw before maturity',
      ribbonText: 'Start from $100'
    },
    {
      id: 2,
      planId: 2,
      name: 'Small Lot',
      minAmount: 501,
      maxAmount: 3500,
      roi: 4,
      duration: '12 months',
      penalty: '25% penalty on withdraw before maturity',
      ribbonText: 'Start from $1,501'
    },
    {
      id: 3,
      planId: 3,
      name: 'Medium Lot',
      minAmount: 3500,
      maxAmount: 7500,
      roi: 5,
      duration: '12 months',
      penalty: '25% penalty on withdraw before maturity',
      ribbonText: 'Start from $3,500'
    },
    {
      id: 4,
      planId: 4,
      name: 'Standard Lot',
      minAmount: 7501,
      maxAmount: null,
      roi: 7,
      duration: '12 months',
      penalty: '25% penalty on withdraw before maturity',
      ribbonText: 'Start from $7,501'
    }
  ];

  showBuyModal = false;
  selectedPackage: Package | null = null;
  buyForm: FormGroup;
  usdtBalance = 0;
  finoBalance = 0;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  activeContracts: any[] = [];
  deactivepreview: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.buyForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadUserDetails();
    this.loadUserContracts();
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
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        const data = response?.data || response;
        if (data) {
          this.usdtBalance = UserService.extractBalance(data, 'usdt');
          this.finoBalance = UserService.extractBalance(data, 'fino');
        }
      },
      error: () => {}
    });
  }

  loadUserContracts(): void {
    this.userService.getUserContracts().subscribe({
      next: (response) => {
        const data = response?.data ?? response;
        this.activeContracts = Array.isArray(data) ? data : (data?.list ?? data?.contracts ?? []);
      },
      error: () => {
        this.activeContracts = [];
      }
    });
  }

  getContractId(c: any): string {
    return c.contractId ?? c._id ?? '-';
  }

  getContractAmount(c: any): number {
    return c.initialAmount ?? c.amount ?? 0;
  }

  getContractRoi(c: any): number | string {
    if (c.roi != null) return c.roi;
    if (c.percentage != null) return c.percentage;
    const planId = c.contractPlanId ?? c.planId;
    const plan = this.packages.find(p => p.planId === planId);
    return plan ? plan.roi : '-';
  }

  getContractStatus(c: any): string {
    const status = c.status;
    if (status === 1 || status === '1' || status === true || status === 'active') return 'Active';
    return 'Inactive';
  }

  deActivepkg(id:any){
   this.userService.deActivepkg({contractId:id}).subscribe((res:any)=>{
       this.deactivepreview=res.data
    });
    
  }
  openBuyModal(pkg: Package): void {
    this.selectedPackage = pkg;
    this.showBuyModal = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.buyForm.reset();
    const amountControl = this.buyForm.get('amount');
    if (amountControl) {
      amountControl.setValidators([
        Validators.required,
        Validators.min(0.01),
        this.amountRangeValidatorFn(pkg)
      ]);
      amountControl.updateValueAndValidity();
    }
    setTimeout(() => this.initializeIcons(), 100);
  }

  private amountRangeValidatorFn(pkg: Package): ValidatorFn {
    return (control: AbstractControl) => {
      const val = parseFloat(control.value);
      if (isNaN(val) || !control.value) return null;
      if (val < pkg.minAmount) return { minAmount: { required: pkg.minAmount } };
      if (pkg.maxAmount != null && val > pkg.maxAmount) return { maxAmount: { required: pkg.maxAmount } };
      return null;
    };
  }

  closeBuyModal(): void {
    this.showBuyModal = false;
    this.selectedPackage = null;
    this.buyForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  getAmountError(): string {
    const err = this.buyForm.get('amount')?.errors;
    const val = parseFloat(this.buyForm.get('amount')?.value);
    const pkg = this.selectedPackage;
    if (!pkg) return '';
    if (err?.['required']) return 'Amount is required.';
    if (!isNaN(val)) {
      if (val < pkg.minAmount) return `Minimum amount is $${pkg.minAmount.toLocaleString()}.`;
      if (pkg.maxAmount != null && val > pkg.maxAmount) return `Maximum amount is $${pkg.maxAmount.toLocaleString()}.`;
    }
    return '';
  }

  onSubmitBuy(): void {
    if (!this.selectedPackage || this.buyForm.invalid) return;

    const amount = parseFloat(this.buyForm.value.amount);
    if (amount < this.selectedPackage.minAmount) {
      this.errorMessage = `Minimum amount is $${this.selectedPackage.minAmount.toLocaleString()}.`;
      return;
    }
    if (this.selectedPackage.maxAmount != null && amount > this.selectedPackage.maxAmount) {
      this.errorMessage = `Maximum amount is $${this.selectedPackage.maxAmount.toLocaleString()}.`;
      return;
    }
    if (amount > this.usdtBalance) {
      this.errorMessage = 'Insufficient USDT balance.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.createContract({
      planId: this.selectedPackage.planId,
      amount: amount,
      // pacdkageCurrency: 'usdt'
    }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response?.code === 200) {
          this.successMessage = 'Package purchased successfully!';
          this.loadUserDetails();
          this.loadUserContracts();
          setTimeout(() => {
            this.closeBuyModal();
          }, 1500);
        } else {
          this.errorMessage = response?.message || 'Failed to purchase package.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Failed to purchase package. Please try again.';
      }
    });
  }

  getAmountRange(pkg: Package): string {
    if (pkg.maxAmount == null) return `$${pkg.minAmount.toLocaleString()} - above`;
    return `$${pkg.minAmount.toLocaleString()} - $${pkg.maxAmount.toLocaleString()}`;
  }
}
