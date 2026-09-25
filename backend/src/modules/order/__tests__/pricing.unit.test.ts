import { calculateOriginalPrice } from '../pricing.service.js';

describe('Pricing Service Unit Suite (Task 2.1)', () => {
  describe('Apparel pricing', () => {
    const catalogueEntry = {
      category: 'apparel',
      name: 'Suit',
      pricing: {
        fullService: 25,
        ironOnly: 10,
      },
    };

    it('returns correct price for fullService option', () => {
      const res = calculateOriginalPrice(catalogueEntry, { serviceOption: 'fullService' });
      expect(res.originalPrice).toBe(25);
      expect(res.area).toBeUndefined();
    });

    it('returns correct price for ironOnly option', () => {
      const res = calculateOriginalPrice(catalogueEntry, { serviceOption: 'ironOnly' });
      expect(res.originalPrice).toBe(10);
      expect(res.area).toBeUndefined();
    });

    it('throws error if serviceOption is missing or invalid', () => {
      expect(() => calculateOriginalPrice(catalogueEntry, {})).toThrow('serviceOption is required');
      expect(() => calculateOriginalPrice(catalogueEntry, { serviceOption: 'unknownOption' })).toThrow('Invalid or missing pricing');
    });
  });

  describe('Carpet pricing', () => {
    const catalogueEntry = {
      category: 'carpet',
      name: 'Persian Rug',
      pricePerMeter: 12,
    };

    it('computes area and price correctly for integer dimensions', () => {
      const res = calculateOriginalPrice(catalogueEntry, {
        dimensions: { length: 3, width: 2 },
      });
      expect(res.area).toBe(6);
      expect(res.originalPrice).toBe(72); // 6 * 12
    });

    it('computes area and price correctly for non-integer dimensions (e.g. 2.5m x 1.8m)', () => {
      const res = calculateOriginalPrice(catalogueEntry, {
        dimensions: { length: 2.5, width: 1.8 },
      });
      expect(res.area).toBe(4.5); // 2.5 * 1.8 = 4.5
      expect(res.originalPrice).toBe(54); // 4.5 * 12 = 54
    });

    it('handles decimal prices and dimensions cleanly without floating point precision noise', () => {
      const entry = { category: 'carpet', name: 'Rug', pricePerMeter: 15.5 };
      const res = calculateOriginalPrice(entry, {
        dimensions: { length: 2.3, width: 1.7 },
      });
      expect(res.area).toBe(3.91); // 2.3 * 1.7 = 3.91
      expect(res.originalPrice).toBe(60.61); // 3.91 * 15.5 = 60.605 -> 60.61
    });

    it('throws error if dimensions are missing or non-numeric', () => {
      expect(() => calculateOriginalPrice(catalogueEntry, {})).toThrow('require valid numeric length and width');
      expect(() => calculateOriginalPrice(catalogueEntry, { dimensions: { length: 'fast', width: 2 } })).toThrow('require valid numeric length and width');
    });
  });

  describe('Linen pricing', () => {
    const catalogueEntry = {
      category: 'linen',
      name: 'Bed Sheet',
      basePrice: 15,
    };

    it('returns correct basePrice for linen items', () => {
      const res = calculateOriginalPrice(catalogueEntry, {});
      expect(res.originalPrice).toBe(15);
      expect(res.area).toBeUndefined();
    });

    it('throws error if basePrice is invalid or missing', () => {
      expect(() => calculateOriginalPrice({ category: 'linen', name: 'Sheet' }, {})).toThrow('Invalid or missing basePrice');
    });
  });

  it('throws error for unknown category', () => {
    expect(() => calculateOriginalPrice({ category: 'spacecraft' }, {})).toThrow('Unknown category "spacecraft"');
  });
});
