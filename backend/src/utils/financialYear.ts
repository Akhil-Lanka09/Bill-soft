import config from '../config';

/**
 * Financial year utilities for India (April 1 - March 31)
 */
export class FinancialYear {
  /**
   * Get the financial year for a given date
   * e.g., 2026-10-08 → "2026-27"
   *       2027-02-15 → "2026-27"
   *       2027-04-01 → "2027-28"
   */
  static getFinancialYear(date: Date = new Date()): string {
    // Convert to IST
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: config.business.timezone }));
    const month = istDate.getMonth(); // 0-indexed
    const year = istDate.getFullYear();

    // Financial year starts April (month 3)
    if (month >= 3) {
      // April onwards: FY is year-(year+1)
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      // Jan-March: FY is (year-1)-year
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  /**
   * Get the start date of a financial year
   * e.g., "2026-27" → 2026-04-01T00:00:00.000+05:30
   */
  static getStartDate(fy: string): Date {
    const startYear = parseInt(fy.split('-')[0], 10);
    // April 1st, midnight IST = March 31, 18:30:00 UTC
    return new Date(Date.UTC(startYear, 3, 1, -5, -30, 0));
  }

  /**
   * Get the end date of a financial year
   * e.g., "2026-27" → 2027-03-31T23:59:59.999+05:30
   */
  static getEndDate(fy: string): Date {
    const startYear = parseInt(fy.split('-')[0], 10);
    return new Date(Date.UTC(startYear + 1, 2, 31, 18, 29, 59, 999));
  }

  /**
   * Get current date in IST
   */
  static getCurrentIST(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: config.business.timezone }));
  }

  /**
   * Format date for display in IST
   */
  static formatIST(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
    const options: Intl.DateTimeFormatOptions = { timeZone: config.business.timezone };
    
    switch (format) {
      case 'date':
        return date.toLocaleDateString('en-IN', { ...options, day: '2-digit', month: '2-digit', year: 'numeric' });
      case 'time':
        return date.toLocaleTimeString('en-IN', { ...options, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      case 'datetime':
        return date.toLocaleString('en-IN', { 
          ...options, 
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
        });
    }
  }

  /**
   * Get today's date range in UTC for database queries
   */
  static getTodayRange(): { start: Date; end: Date } {
    const now = new Date();
    const istStr = now.toLocaleString('en-US', { timeZone: config.business.timezone });
    const ist = new Date(istStr);
    
    const startOfDay = new Date(ist);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(ist);
    endOfDay.setHours(23, 59, 59, 999);

    // Convert back to UTC for MongoDB queries
    const offset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return {
      start: new Date(startOfDay.getTime() - offset),
      end: new Date(endOfDay.getTime() - offset),
    };
  }

  /**
   * Get date range for a given period
   */
  static getDateRange(period: string): { start: Date; end: Date } {
    const offset = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istStr = now.toLocaleString('en-US', { timeZone: config.business.timezone });
    const ist = new Date(istStr);

    let start: Date;
    let end: Date;

    switch (period) {
      case 'today':
        return this.getTodayRange();

      case 'yesterday': {
        const yesterday = new Date(ist);
        yesterday.setDate(yesterday.getDate() - 1);
        start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
        return { start: new Date(start.getTime() - offset), end: new Date(end.getTime() - offset) };
      }

      case 'this-week': {
        const dayOfWeek = ist.getDay();
        start = new Date(ist);
        start.setDate(ist.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end = new Date(ist);
        end.setHours(23, 59, 59, 999);
        return { start: new Date(start.getTime() - offset), end: new Date(end.getTime() - offset) };
      }

      case 'this-month': {
        start = new Date(ist.getFullYear(), ist.getMonth(), 1);
        end = new Date(ist);
        end.setHours(23, 59, 59, 999);
        return { start: new Date(start.getTime() - offset), end: new Date(end.getTime() - offset) };
      }

      case 'previous-month': {
        start = new Date(ist.getFullYear(), ist.getMonth() - 1, 1);
        end = new Date(ist.getFullYear(), ist.getMonth(), 0, 23, 59, 59, 999);
        return { start: new Date(start.getTime() - offset), end: new Date(end.getTime() - offset) };
      }

      case 'financial-year': {
        const fy = this.getFinancialYear(now);
        return { start: this.getStartDate(fy), end: this.getEndDate(fy) };
      }

      default:
        return this.getTodayRange();
    }
  }
}
