import { Component, OnInit, AfterViewInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

declare var lucide: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats = {
    totalEarnings: 0,
    referralEarnings: 0,
    levelEarnings: 0,
    rankEarnings: 0,
    royaltyEarnings: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  };

  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  earningsData: { date: string; value: number }[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadEarningsData();
  }

  ngAfterViewInit(): void {
    this.initializeIcons();
    setTimeout(() => {
      this.drawEarningsChart();
    }, 500);
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

  private loadUserData(): void {
    const userId = this.authService.getUserId();
    console.log('userId', userId);
    
    if (userId == null) return;
    this.userService.getUserDetails(userId).subscribe({
      next: (response) => {
        // Update stats from API response
        if (response?.data) {
          this.stats = {
            totalEarnings: response.data.totalEarnings || 0,
            referralEarnings: response.data.referralEarnings || 0,
            levelEarnings: response.data.levelEarnings || 0,
            rankEarnings: response.data.rankEarnings || 0,
            royaltyEarnings: response.data.royaltyEarnings || 0,
            totalUsers: response.data.totalUsers || 0,
            activeUsers: response.data.activeUsers || 0,
            inactiveUsers: response.data.inactiveUsers || 0
          };
        }
      },
      error: (err) => {
        console.error('Error loading user data:', err);
      }
    });
  }

  selectPeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.selectedPeriod = period;
    this.loadEarningsData();
    setTimeout(() => {
      this.drawEarningsChart();
    }, 100);
  }

  private loadEarningsData(): void {
    // Generate sample data based on selected period
    const days = this.selectedPeriod === 'daily' ? 7 : this.selectedPeriod === 'weekly' ? 4 : 12;
    this.earningsData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      if (this.selectedPeriod === 'daily') {
        date.setDate(date.getDate() - i);
        this.earningsData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: 0
        });
      } else if (this.selectedPeriod === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
        this.earningsData.push({
          date: `Week ${i + 1}`,
          value: 0
        });
      } else {
        date.setMonth(date.getMonth() - i);
        this.earningsData.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          value: 0
        });
      }
    }
  }

  private drawEarningsChart(): void {
    const canvas = document.getElementById('earningsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 400;
    const padding = { top: 20, right: 20, bottom: 50, left: 60 };

    ctx.clearRect(0, 0, width, height);

    if (this.earningsData.length === 0) return;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...this.earningsData.map(d => d.value)) * 1.1;
    const minValue = 0;

    // Draw grid lines
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#71717a';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (maxValue - minValue) * (i / 5);
      const y = padding.top + (i / 5) * chartHeight;
      ctx.fillText('$' + Math.floor(value).toLocaleString(), padding.left - 10, y + 4);
    }

    // Draw line and area
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);

    this.earningsData.forEach((point, index) => {
      const x = padding.left + (index / (this.earningsData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.earningsData.forEach((point, index) => {
      const x = padding.left + (index / (this.earningsData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#3b82f6';
    this.earningsData.forEach((point, index) => {
      const x = padding.left + (index / (this.earningsData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw X-axis labels
    ctx.fillStyle = '#71717a';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    this.earningsData.forEach((point, index) => {
      const x = padding.left + (index / (this.earningsData.length - 1)) * chartWidth;
      ctx.fillText(point.date, x, height - padding.bottom + 20);
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCurrentDate(): string {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayName} ${month}/${day}/${year}`;
  }
}
