import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';

declare var lucide: any;

interface TableLevelRow {
  levelIndex: number;
  referralContractHoldersCount: number;
  activeUsersCount: number;
  inactiveUsersCount: number;
  totalAmountOfContractsUsd: number;
  holders: Array<{ user_id: number; email: string; username: string; isContractHolder: number }>;
}

interface TreeUserNode {
  user_id: number;
  email: string;
  username: string;
  isContractHolder: number;
  children?: TreeUserNode[];
  expanded?: boolean;
  loaded?: boolean;
}

@Component({
  selector: 'app-referral-team',
  templateUrl: './referral-team.component.html',
  styleUrls: ['./referral-team.component.css']
})
export class ReferralTeamComponent implements OnInit, AfterViewInit {
  viewMode: 'report' | 'tree' = 'report';
  isLoading = false;
  tier = 'Bronze';
  teamMembers = 0;
  activeMembers = 0;
  inactiveMembers = 0;
  totalAum = '0';
  highLegBusiness = '0';
  otherLegBusiness = '0';
  tableLevels: TableLevelRow[] = [];
  selectedLevel = 1;
  filterType: 'all' | 'subscribed' | 'nonSubscribed' = 'all';

  rootNode: TreeUserNode | null = null;
  treeLoading = false;
  treeLoadingUserId: number | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTableData();
    this.loadTreeData();
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

  private getUserId(): number | null {
    return this.authService.getUserId();
  }

  private loadTableData(): void {
    const userId = this.getUserId();
    if (userId == null) return;
    this.isLoading = true;
    this.userService.getSmallTreeTable(userId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const arr = response?.data;
        if (Array.isArray(arr) && arr.length > 0) {
          this.tableLevels = arr.map((item: any, idx: number) => {
            const holdersKey = 'referral_contract_holders_with_status';
            const holders = item[holdersKey] ?? item.referral_contract_holders_with_status ?? item.holders ?? [];
            return {
              levelIndex: idx + 1,
              referralContractHoldersCount: item.referral_contract_holders_count ?? item.referralContractHoldersCount ?? holders.length,
              activeUsersCount: item.activeUsersCount ?? 0,
              inactiveUsersCount: item.inactiveUsersCount ?? 0,
              totalAmountOfContractsUsd: item.totalAmountOfContractsUsd ?? item.totalAmountOfContractsUsd ?? 0,
              holders: Array.isArray(holders) ? holders : []
            };
          });
          this.selectedLevel = 1;
          this.updateTeamStats();
        }
      },
      error: () => {
        this.isLoading = false;
        this.tableLevels = [];
      }
    });
  }

  private updateTeamStats(): void {
    let totalActive = 0;
    let totalInactive = 0;
    let totalAumVal = 0;
    this.tableLevels.forEach(l => {
      totalActive += l.activeUsersCount;
      totalInactive += l.inactiveUsersCount;
      totalAumVal += l.totalAmountOfContractsUsd;
    });
    this.teamMembers = totalActive + totalInactive;
    this.activeMembers = totalActive;
    this.inactiveMembers = totalInactive;
    this.totalAum = this.formatNumber(totalAumVal);
  }

  getCurrentLevelHolders(): Array<{ user_id: number; email: string; username: string; isContractHolder: number }> {
    const level = this.tableLevels.find(l => l.levelIndex === this.selectedLevel);
    if (!level) return [];
    let list = level.holders;
    if (this.filterType === 'subscribed') {
      list = list.filter(h => h.isContractHolder === 1);
    } else if (this.filterType === 'nonSubscribed') {
      list = list.filter(h => h.isContractHolder !== 1);
    }
    return list;
  }

  private loadTreeData(): void {
    const userId = this.getUserId();
    if (userId == null) return;
    this.treeLoading = true;
    this.treeLoadingUserId = userId;
    this.userService.getTreeDataForIndividualUser(userId).subscribe({
      next: (response) => {
        this.treeLoading = false;
        this.treeLoadingUserId = null;
        const data = response?.data || response;
        if (data) {
          this.rootNode = {
            user_id: data.user_id,
            email: data.email ?? '',
            username: data.username ?? '',
            isContractHolder: data.isContractHolder ?? 0,
            children: [],
            expanded: true,
            loaded: true
          };
          const refs = data.referred_users ?? [];
          this.rootNode.children = refs.map((u: any) => ({
            user_id: u.user_id,
            email: u.email ?? '',
            username: u.username ?? '',
            isContractHolder: u.isContractHolder ?? 0,
            children: [],
            expanded: false,
            loaded: false
          }));
        } else {
          this.rootNode = null;
        }
        this.initializeIcons();
      },
      error: () => {
        this.treeLoading = false;
        this.treeLoadingUserId = null;
        this.rootNode = null;
      }
    });
  }

  onTreeNodeClick(node: TreeUserNode): void {
    if (node.loaded) {
      node.expanded = !node.expanded;
      this.initializeIcons();
      return;
    }
    this.treeLoadingUserId = node.user_id;
    this.userService.getTreeDataForIndividualUser(node.user_id).subscribe({
      next: (response) => {
        this.treeLoadingUserId = null;
        const data = response?.data || response;
        const refs = data?.referred_users ?? [];
        node.children = refs.map((u: any) => ({
          user_id: u.user_id,
          email: u.email ?? '',
          username: u.username ?? '',
          isContractHolder: u.isContractHolder ?? 0,
          children: [],
          expanded: false,
          loaded: false
        }));
        node.loaded = true;
        node.expanded = true;
        this.initializeIcons();
      },
      error: () => {
        this.treeLoadingUserId = null;
      }
    });
  }

  toggleTreeMinimize(): void {
    if (this.rootNode) {
      this.rootNode.expanded = !this.rootNode.expanded;
      this.initializeIcons();
    }
  }

  private formatNumber(val: number | string): string {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? '0' : n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  setViewMode(mode: 'report' | 'tree'): void {
    this.viewMode = mode;
  }

  setFilter(type: 'all' | 'subscribed' | 'nonSubscribed'): void {
    this.filterType = type;
  }

  setSelectedLevel(level: number): void {
    this.selectedLevel = level;
  }

  get levels(): number[] {
    return this.tableLevels.map(l => l.levelIndex);
  }
}
