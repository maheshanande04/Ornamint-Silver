import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

interface RewardStatus {
  windowState: 'upcoming' | 'active' | 'closed';
  windowProgressPct: number;
  daysLeft: number;
  totalWindowDays: number;
  participationAmount: number;
  participationProgressPct: number;
  isGoldRank: boolean;
  goldProgressPct: number;
  isEligible: boolean;
}

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit {
  readonly participationTarget = 7500;
  readonly qualificationStart = new Date(new Date().getFullYear(), 2, 5);  // Mar 5
  readonly qualificationEnd = new Date(new Date().getFullYear(), 3, 10, 23, 59, 59, 999); // Apr 10
  readonly bannerImage = '/assets/Rewards/thailand-business-visit.jpeg';

  status: RewardStatus = {
    windowState: 'upcoming',
    windowProgressPct: 0,
    daysLeft: 0,
    totalWindowDays: 0,
    participationAmount: 0,
    participationProgressPct: 0,
    isGoldRank: false,
    goldProgressPct: 0,
    isEligible: false
  };

  loading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.evaluateWindowState();
    this.loadProgressData();
  }

  private evaluateWindowState(): void {
    const now = new Date();
    const start = this.qualificationStart.getTime();
    const end = this.qualificationEnd.getTime();
    const nowMs = now.getTime();

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    this.status.totalWindowDays = totalDays;

    if (nowMs < start) {
      this.status.windowState = 'upcoming';
      this.status.windowProgressPct = 0;
      this.status.daysLeft = Math.ceil((start - nowMs) / (1000 * 60 * 60 * 24));
      return;
    }

    if (nowMs > end) {
      this.status.windowState = 'closed';
      this.status.windowProgressPct = 100;
      this.status.daysLeft = 0;
      return;
    }

    const elapsed = nowMs - start;
    const total = end - start;
    this.status.windowState = 'active';
    this.status.windowProgressPct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    this.status.daysLeft = Math.max(0, Math.ceil((end - nowMs) / (1000 * 60 * 60 * 24)));
  }

  private loadProgressData(): void {
    this.loading = true;

    this.userService.getDashboardStats(true).subscribe({
      next: (response) => {
        const data = response?.data || response;
        this.status.isGoldRank = this.detectGoldRank(data);
        this.status.goldProgressPct = this.status.isGoldRank ? 100 : 0;
        this.updateEligibility();
      },
      error: () => {
        this.status.isGoldRank = false;
        this.status.goldProgressPct = 0;
        this.updateEligibility();
      }
    });

    this.userService.getUserContracts().subscribe({
      next: (response) => {
        const payload = response?.data ?? response;
        const contracts = Array.isArray(payload) ? payload : (payload?.list ?? payload?.contracts ?? []);
        this.status.participationAmount = this.calculateWindowParticipation(contracts);
        this.status.participationProgressPct = Math.min(100, (this.status.participationAmount / this.participationTarget) * 100);
        this.updateEligibility();
        this.loading = false;
      },
      error: () => {
        this.status.participationAmount = 0;
        this.status.participationProgressPct = 0;
        this.updateEligibility();
        this.loading = false;
      }
    });
  }

  private calculateWindowParticipation(contracts: any[]): number {
    return contracts.reduce((sum, contract) => {
      const amount = Number(contract?.initialAmount ?? contract?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sum;
      }

      const dateVal = contract?.ist_date ?? contract?.createdAt ?? contract?.startDate;
      const createdAt = dateVal ? new Date(dateVal) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return sum;
      }

      const inWindow = createdAt >= this.qualificationStart && createdAt <= this.qualificationEnd;
      return inWindow ? (sum + amount) : sum;
    }, 0);
  }

  private detectGoldRank(data: any): boolean {
    const candidateValues = [
      data?.rank,
      data?.userRank,
      data?.currentRank,
      data?.rankName,
      data?.profile?.rank,
      data?.profile?.currentRank,
      data?.user?.rank
    ];

    return candidateValues.some((v) => String(v ?? '').trim().toLowerCase() === 'gold');
  }

  private updateEligibility(): void {
    const withinWindow = this.status.windowState === 'active';
    const qualifiedByAmount = this.status.participationAmount >= this.participationTarget;
    this.status.isEligible = withinWindow && (this.status.isGoldRank || qualifiedByAmount);
  }

  getWindowDateLabel(): string {
    return `5th March to 10th April ${this.qualificationStart.getFullYear()}`;
  }

  getWindowStateLabel(): string {
    if (this.status.windowState === 'upcoming') {
      return `Starts in ${this.status.daysLeft} day${this.status.daysLeft === 1 ? '' : 's'}`;
    }
    if (this.status.windowState === 'closed') {
      return 'Qualification window has ended';
    }
    return `${this.status.daysLeft} day${this.status.daysLeft === 1 ? '' : 's'} left`;
  }

  formatAmount(v: number): string {
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
}
