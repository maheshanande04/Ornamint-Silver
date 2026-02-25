import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { API_CONFIG } from '../../../../core/config/api.config';

declare var lucide: any;

@Component({
  selector: 'app-referral-details',
  templateUrl: './referral-details.component.html',
  styleUrls: ['./referral-details.component.css']
})
export class ReferralDetailsComponent implements OnInit, AfterViewInit {
  referralCode = '';
  referralLink = '';
  copyFeedback: 'id' | 'link' | null = null;
  isLoading = false;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadReferralData();
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

  private getAppBaseUrl(): string {
    return API_CONFIG.appBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  private loadReferralData(): void {
    const userId = this.authService.getUserId();
    if (userId == null) return;
    this.isLoading = true;
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const data = response?.data || response;
        if (data) {
          this.referralCode = data.referral_code?.toString() || data.referralCode?.toString() || '';
          const baseUrl = this.getAppBaseUrl();
          this.referralLink = `${baseUrl}/auth/register?ref=${this.referralCode}`;
          if (data.user_id != null) {
            this.authService.setUserId(data.user_id);
          }
        }
      },
      error: () => {
        this.isLoading = false;
        this.referralCode = '';
        this.referralLink = `${this.getAppBaseUrl()}/auth/register?ref=`;
      }
    });
  }

  copyToClipboard(text: string, type: 'id' | 'link'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copyFeedback = type;
      setTimeout(() => (this.copyFeedback = null), 2000);
    });
  }

  shareOnWhatsApp(): void {
    const url = `https://wa.me/?text=${encodeURIComponent(this.referralLink)}`;
    window.open(url, '_blank');
  }

  shareOnFacebook(): void {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  shareOnLinkedIn(): void {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.referralLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  shareOnTwitter(): void {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.referralLink)}&text=Join%20me%20on%20Ornamint!`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  shareOnTelegram(): void {
    const url = `https://t.me/share/url?url=${encodeURIComponent(this.referralLink)}&text=Join%20me%20on%20Ornamint!`;
    window.open(url, '_blank');
  }

}
