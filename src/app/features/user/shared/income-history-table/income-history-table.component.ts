import { Component, Input, AfterViewInit } from '@angular/core';

declare var lucide: any;

@Component({
  selector: 'app-income-history-table',
  templateUrl: './income-history-table.component.html',
  styleUrls: ['./income-history-table.component.css']
})
export class IncomeHistoryTableComponent implements AfterViewInit {
  @Input() showTitle = true;
  incomeTabs = [
    { id: 'direct', label: 'Direct Referral Income' },
    { id: 'level', label: 'Level Income' },
    { id: 'rank', label: 'Rank Income' },
    { id: 'team', label: 'Team Royalty Income' }
  ];
  activeTab = 'direct';
  incomeHistory: any[] = [];

  ngAfterViewInit(): void {
    const tryInit = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      } else {
        setTimeout(tryInit, 100);
      }
    };
    tryInit();
  }

  setActiveTab(id: string): void {
    this.activeTab = id;
  }
}
