import { Component, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare var lucide: any;

@Component({
  selector: 'app-referral',
  templateUrl: './referral.component.html',
  styleUrls: ['./referral.component.css']
})
export class ReferralComponent implements AfterViewInit {

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    this.initializeIcons();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.initializeIcons());
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

  isReferralDetails(): boolean {
    return this.router.url.includes('/referral') && !this.router.url.includes('/referral/team');
  }

  isReferralTeam(): boolean {
    return this.router.url.includes('/referral/team');
  }

  goToDetails(): void {
    this.router.navigate(['/user/referral']);
  }

  goToTeam(): void {
    this.router.navigate(['/user/referral/team']);
  }
}
