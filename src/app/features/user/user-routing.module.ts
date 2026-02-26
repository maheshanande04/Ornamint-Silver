import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserComponent } from './user.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WalletComponent } from './wallet/wallet.component';
import { InrWalletComponent } from './inr-wallet/inr-wallet.component';
import { ProfileComponent } from './profile/profile.component';
import { ReferralComponent } from './referral/referral.component';
import { ReferralDetailsComponent } from './referral/referral-details/referral-details.component';
import { ReferralTeamComponent } from './referral/referral-team/referral-team.component';
import { IncomeComponent } from './income/income.component';
import { PackagesComponent } from './packages/packages.component';

const routes: Routes = [
  { 
    path: '', 
    component: UserComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'wallet', component: WalletComponent },
      { path: 'wallet-inr', component: InrWalletComponent },
      { path: 'packages', component: PackagesComponent },
      { 
        path: 'referral', 
        component: ReferralComponent,
        children: [
          { path: '', component: ReferralDetailsComponent },
          { path: 'team', component: ReferralTeamComponent }
        ]
      },
      { path: 'income-history', component: IncomeComponent },
      { path: 'settings', component: ProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
