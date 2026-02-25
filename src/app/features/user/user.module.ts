import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './user.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WalletComponent } from './wallet/wallet.component';
import { ProfileComponent } from './profile/profile.component';
import { ReferralComponent } from './referral/referral.component';
import { ReferralDetailsComponent } from './referral/referral-details/referral-details.component';
import { ReferralTeamComponent } from './referral/referral-team/referral-team.component';
import { TreeNodeComponent } from './referral/referral-team/tree-node/tree-node.component';
import { IncomeComponent } from './income/income.component';
import { PackagesComponent } from './packages/packages.component';
import { IncomeHistoryTableComponent } from './shared/income-history-table/income-history-table.component';


@NgModule({
  declarations: [
    UserComponent,
    DashboardComponent,
    WalletComponent,
    ProfileComponent,
    ReferralComponent,
    ReferralDetailsComponent,
    ReferralTeamComponent,
    TreeNodeComponent,
    IncomeComponent,
    PackagesComponent,
    IncomeHistoryTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    UserRoutingModule
  ]
})
export class UserModule { }
