import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface InrBankDetails {
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankAccountName: string;
}

export interface InrDepositRequest {
  transactionId: string;
  currency: string;
  method: string;
  date:string;
  amount?: number;
  file?: File;
}

export interface InrWithdrawalRequest {
  withdrawalAmount: number;
  currency: 'inr';
}

export interface InrToUsdConversionRequest {
  inrAmount: number;
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

  /** GET consolidated dashboard stats (earnings + optional userCounts) */
  getDashboardStats(includeUserCounts = true): Observable<any> {
    let params = new HttpParams();
    if (includeUserCounts) {
      params = params.set('includeUserCounts', 'true');
    }
    return this.http.get(`${this.baseUrl}/dashboard`, { params });
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

  /** GET INR deposit bank details - /deposit/inr/bank-details */
  getInrBankDetails(): Observable<{ code: number; data: InrBankDetails }> {
    return this.http.get<{ code: number; data: InrBankDetails }>(`${this.baseUrl}/deposit/inr/bank-details`);
  }

  /**
   * Dummy INR deposit request API.
   * Backend path can be updated later; payload kept as described.
   */
  createInrDepositRequest(payload: InrDepositRequest): Observable<any> {
    const formData = new FormData();
    formData.append('txnID', payload.transactionId);
    formData.append('currency', payload.currency);
    formData.append('paymentMethod', payload.method);
    formData.append('initiatedDate', payload.date);
    
    if (payload.amount != null) {
      formData.append('amount', String(payload.amount));
    }
    if (payload.file) {
      formData.append('file', payload.file);
    }
    return this.http.post(`${this.baseUrl}/deposit/initiateRequest`, formData);
  }

  /** POST initiate INR withdrawal - /withdrawal/initiateRequest */
  initiateInrWithdrawal(payload: InrWithdrawalRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/withdrawal/initiateRequest`, payload);
  }

  /** POST convert INR balance to USD - /conversion/inr-to-usd/convert */
  convertInrToUsd(payload: InrToUsdConversionRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/conversion/inr-to-usd/convert`, payload);
  }

  /** POST update profile (e.g. mobile_number) - /getUserDetails/updateProfile */
  updateUserProfile(payload: { mobile_number?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/getUserDetails/updateProfile`, payload);
  }

}
