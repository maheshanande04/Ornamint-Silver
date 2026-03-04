import { AfterViewInit, Component, OnDestroy } from '@angular/core';

declare var lucide: any;

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements AfterViewInit, OnDestroy {
  isMobileMenuOpen = false;

  ngAfterViewInit(): void {
    this.initializeIcons();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      setTimeout(() => lucide.createIcons(), 50);
    }
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
}
