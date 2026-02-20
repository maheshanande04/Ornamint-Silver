import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './user.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WalletComponent } from './wallet/wallet.component';
import { ProfileComponent } from './profile/profile.component';
import { ReferralComponent } from './referral/referral.component';
import { IncomeComponent } from './income/income.component';


@NgModule({
  declarations: [
    UserComponent,
    DashboardComponent,
    WalletComponent,
    ProfileComponent,
    ReferralComponent,
    IncomeComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule
  ]
})
export class UserModule { }
