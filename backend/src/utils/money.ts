import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 20,
});

/**
 * Decimal-safe money calculation utilities.
 * NEVER use native JavaScript floating-point for money.
 */
export class Money {
  /**
   * Create a Decimal from a number or string
   */
  static from(value: number | string | Decimal): Decimal {
    if (value instanceof Decimal) return value;
    return new Decimal(value || 0);
  }

  /**
   * Add two values
   */
  static add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return Money.from(a).plus(Money.from(b));
  }

  /**
   * Subtract b from a
   */
  static subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return Money.from(a).minus(Money.from(b));
  }

  /**
   * Multiply two values
   */
  static multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return Money.from(a).times(Money.from(b));
  }

  /**
   * Divide a by b
   */
  static divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return Money.from(a).dividedBy(Money.from(b));
  }

  /**
   * Calculate percentage of value
   * e.g., percentage(1000, 18) = 180
   */
  static percentage(value: number | string | Decimal, percent: number | string | Decimal): Decimal {
    return Money.from(value).times(Money.from(percent)).dividedBy(100);
  }

  /**
   * Round to 2 decimal places (standard currency rounding)
   */
  static round2(value: number | string | Decimal): Decimal {
    return Money.from(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Round to nearest integer (for final invoice total in INR)
   */
  static roundToRupee(value: number | string | Decimal): Decimal {
    return Money.from(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculate round-off amount
   * e.g., if total is 1250.40, round-off is -0.40, rounded total is 1250
   *        if total is 1250.60, round-off is +0.40, rounded total is 1251
   */
  static calculateRoundOff(preRoundTotal: number | string | Decimal): { roundOff: Decimal; grandTotal: Decimal } {
    const pre = Money.round2(preRoundTotal);
    const rounded = Money.roundToRupee(pre);
    const roundOff = rounded.minus(pre);
    return { roundOff, grandTotal: rounded };
  }

  /**
   * Calculate GST from exclusive price
   * price = base price (excluding tax)
   * gstRate = e.g., 18 for 18%
   */
  static calculateGSTExclusive(price: number | string | Decimal, gstRate: number | string | Decimal) {
    const taxableAmount = Money.from(price);
    const rate = Money.from(gstRate);
    const totalTax = Money.round2(Money.percentage(taxableAmount, rate));
    const halfRate = Money.divide(rate, 2);
    const cgst = Money.round2(Money.percentage(taxableAmount, halfRate));
    const sgst = Money.round2(Money.percentage(taxableAmount, halfRate));
    const total = Money.round2(Money.add(taxableAmount, totalTax));

    return {
      taxableAmount: Money.round2(taxableAmount),
      cgst,
      sgst,
      igst: Money.from(0),
      totalTax,
      total,
    };
  }

  /**
   * Calculate GST from inclusive price
   * price = price including tax
   * gstRate = e.g., 18 for 18%
   */
  static calculateGSTInclusive(price: number | string | Decimal, gstRate: number | string | Decimal) {
    const inclusivePrice = Money.from(price);
    const rate = Money.from(gstRate);
    // taxableAmount = inclusivePrice * 100 / (100 + rate)
    const taxableAmount = Money.round2(
      inclusivePrice.times(100).dividedBy(Money.add(100, rate))
    );
    const totalTax = Money.round2(Money.subtract(inclusivePrice, taxableAmount));
    const halfRate = Money.divide(rate, 2);
    const cgst = Money.round2(Money.percentage(taxableAmount, halfRate));
    const sgst = Money.round2(Money.percentage(taxableAmount, halfRate));

    return {
      taxableAmount,
      cgst,
      sgst,
      igst: Money.from(0),
      totalTax,
      total: Money.round2(inclusivePrice),
    };
  }

  /**
   * Calculate IGST (inter-state) from exclusive price
   */
  static calculateIGSTExclusive(price: number | string | Decimal, gstRate: number | string | Decimal) {
    const taxableAmount = Money.from(price);
    const rate = Money.from(gstRate);
    const igst = Money.round2(Money.percentage(taxableAmount, rate));
    const total = Money.round2(Money.add(taxableAmount, igst));

    return {
      taxableAmount: Money.round2(taxableAmount),
      cgst: Money.from(0),
      sgst: Money.from(0),
      igst,
      totalTax: igst,
      total,
    };
  }

  /**
   * Calculate IGST (inter-state) from inclusive price
   */
  static calculateIGSTInclusive(price: number | string | Decimal, gstRate: number | string | Decimal) {
    const inclusivePrice = Money.from(price);
    const rate = Money.from(gstRate);
    const taxableAmount = Money.round2(
      inclusivePrice.times(100).dividedBy(Money.add(100, rate))
    );
    const igst = Money.round2(Money.subtract(inclusivePrice, taxableAmount));

    return {
      taxableAmount,
      cgst: Money.from(0),
      sgst: Money.from(0),
      igst,
      totalTax: igst,
      total: Money.round2(inclusivePrice),
    };
  }

  /**
   * Convert Decimal to number for JSON serialization
   */
  static toNumber(value: Decimal): number {
    return value.toNumber();
  }

  /**
   * Convert Decimal to string
   */
  static toString(value: Decimal): string {
    return value.toFixed(2);
  }

  /**
   * Check if value is zero
   */
  static isZero(value: number | string | Decimal): boolean {
    return Money.from(value).isZero();
  }

  /**
   * Check if a > b
   */
  static greaterThan(a: number | string | Decimal, b: number | string | Decimal): boolean {
    return Money.from(a).greaterThan(Money.from(b));
  }

  /**
   * Check if a < b
   */
  static lessThan(a: number | string | Decimal, b: number | string | Decimal): boolean {
    return Money.from(a).lessThan(Money.from(b));
  }

  /**
   * Sum an array of values
   */
  static sum(values: (number | string | Decimal)[]): Decimal {
    return values.reduce<Decimal>((acc, val) => acc.plus(Money.from(val)), Money.from(0));
  }

  /**
   * Format money amount to Indian currency format
   */
  static formatINR(value: number | string | Decimal): string {
    const num = Money.from(value).toNumber();
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  /**
   * Convert number to words (Indian numbering system) for invoice
   */
  static toWords(num: number): string {
    if (num === 0) return 'Zero Rupees Only';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const rupees = Math.floor(Math.abs(num));
    const paise = Math.round((Math.abs(num) - rupees) * 100);

    function convertToWords(n: number): string {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertToWords(n % 100) : '');
      if (n < 100000) return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertToWords(n % 1000) : '');
      if (n < 10000000) return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertToWords(n % 100000) : '');
      return convertToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertToWords(n % 10000000) : '');
    }

    let result = convertToWords(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convertToWords(paise) + ' Paise';
    }
    result += ' Only';
    return result;
  }
}
