import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralComponent } from './referral.component';

describe('ReferralComponent', () => {
  let component: ReferralComponent;
  let fixture: ComponentFixture<ReferralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReferralComponent]
    });
    fixture = TestBed.createComponent(ReferralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
