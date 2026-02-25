import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface UserDetails {
  walletAddress?: string;
  balance?: number;
  [key: string]: any;
}

export interface WithdrawRequest {
  currency: string;
  toAddress: string;
  amount: number;
  otp?: number;  // Optional: omit for OTP request, include for withdrawal confirm
}

export interface CreateContractRequest {
  planId: number;
  amount: number;
  // packageCurrency: string;  // 'usdt'
}

export interface PanVerificationRequest {
  number: string;
}

export interface AadhaarVerificationRequest {
  aadharNumber: string;
  aadharFullName: string;
  aadharDob: string;
  frontImage: File;
  backImage: File;
}

export interface BankVerificationRequest {
  number: string;
  ifsc: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly baseUrl = API_CONFIG.baseUrl;
  // private readonly referralTreeUrl = `${API_CONFIG.referralTreeBaseUrl}/referralTree`;

  constructor(private http: HttpClient) {}

  /** POST getUserDetails with user_id in payload */
  getUserDetails(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/getUserDetails`, { user_id: userId });
  }

  /** Extract balance for a currency from getUserDetails response. balances array: [{currency, current_balance}, ...] */
  static extractBalance(data: any, currency: string): number {
    const balances = data?.balances;
    if (Array.isArray(balances)) {
      const item = balances.find((b: any) => (b?.currency || '').toLowerCase() === currency.toLowerCase());
      const val = item?.current_balance;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    }
    const key = currency.toLowerCase() === 'usdt' ? 'balance' : `${currency}Balance`;
    return data?.[key] ?? data?.walletBalance ?? 0;
  }

  /** Extract wallet address from getUserDetails response. walletAddress: { address: "0x..." } */
  static extractWalletAddress(data: any): string {
    const wa = data?.walletAddress;
    if (typeof wa === 'string') return wa;
    if (wa && typeof wa === 'object' && wa.address) return wa.address;
    return data?.address ?? '';
  }

  /** Determine if KYC is fully completed based on userdetails response */
  static isKycComplete(data: any): boolean {
    if (!data) return false;
    const panVerified = data.panVerified === 1 || data.panVerified === true;
    const aadharStatus = data.aadharVerified;
    const bankStatus = data.bankAccountVerified;
    const aadharVerified = aadharStatus === 1 || aadharStatus === true;
    const bankVerified = bankStatus === 1 || bankStatus === true;
    // const isVerifiedFlag = data.isVerified === 1 || data.isVerified === true;
    return  (panVerified && aadharVerified && bankVerified);
  }

  /** POST getTreeDataForIndividualUser - returns referred_users for tree */
  getTreeDataForIndividualUser(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/referralTree/getTreeDataForIndividualUser`, { user_id: userId });
  }

  /** POST getSmallTreeTable - returns referral table data */
  getSmallTreeTable(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/referralTree/getSmallTreeTable`, { user_id: userId });
  }

  initiateWithdrawal(payload: WithdrawRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/usdtWithdrawal/initiateRequest`, payload);
  }

  getUserContracts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/contract/user-contracts`);
  }

  createContract(payload: CreateContractRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/contract/createContract`, payload);
  }

  // KYC APIs
  verifyPan(payload: PanVerificationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/kyc/pan`, payload);
  }

  verifyAadhaar(payload: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/kyc/offlineAadharVerification`, payload);
  }

  verifyBank(payload: BankVerificationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/user/kyc/bank`, payload);
  }

  /** GET Deposit history - /getTransactions/usdt/deposit */
  getDepositHistory(params?: { pageNumber?: number; pageSize?: number; sortBy?: string; sortOrder?: string }): Observable<any> {
    const p = params || {};
    const pageNumber = p.pageNumber ?? 1;
    const pageSize = p.pageSize ?? 10;
    const sortBy = p.sortBy ?? '_id';
    const sortOrder = p.sortOrder ?? 'desc';
    const query = `?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return this.http.get(`${this.baseUrl}/getTransactions/usdt/deposit${query}`);
  }

  /** POST Withdrawal history - /withdrawal/transactionHistory/usdt */
  getWithdrawalHistory(params?: { pageNumber?: number; pageSize?: number; sortBy?: string; sortOrder?: string }): Observable<any> {
    const p = params || {};
    const body = {
      pageNumber: p.pageNumber ?? 1,
      pageSize: p.pageSize ?? 10,
      sortBy: p.sortBy ?? '_id',
      sortOrder: p.sortOrder ?? 'desc'
    };
    return this.http.post(`${this.baseUrl}/withdrawal/transactionHistory/usdt`, body);
  }

}
