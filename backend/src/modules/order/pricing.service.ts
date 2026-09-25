export interface PriceCalculationResult {
  originalPrice: number;
  area?: number;
}

/**
 * Pure function to calculate the original price of an item based on its catalogue entry and input parameters.
 * Does not access the DB. Independently unit-testable.
 * 
 * @param catalogueEntry The catalogue item from shop.priceList
 * @param itemInput The item data submitted by the client
 * @returns Object containing originalPrice and, for carpets, the computed area
 */
export const calculateOriginalPrice = (
  catalogueEntry: any,
  itemInput: any
): PriceCalculationResult => {
  if (!catalogueEntry) {
    throw new Error('Catalogue entry not found');
  }

  const category = catalogueEntry.category;

  if (category === 'apparel') {
    const serviceOption = itemInput.serviceOption;
    if (!serviceOption) {
      throw new Error('serviceOption is required for apparel items');
    }
    if (!catalogueEntry.pricing || typeof catalogueEntry.pricing[serviceOption] !== 'number') {
      throw new Error(`Invalid or missing pricing for service option "${serviceOption}" on apparel item`);
    }
    return {
      originalPrice: catalogueEntry.pricing[serviceOption],
    };
  } else if (category === 'carpet') {
    const dims = itemInput.dimensions;
    if (!dims || typeof dims.length !== 'number' || typeof dims.width !== 'number') {
      throw new Error('Carpet items require valid numeric length and width dimensions');
    }
    const rawArea = dims.length * dims.width;
    // Round area to 2 decimal places to prevent floating point inaccuracies (e.g. 2.5 * 1.8 = 4.5)
    const area = Math.round((rawArea + Number.EPSILON) * 100) / 100;
    const pricePerMeter = catalogueEntry.pricePerMeter;
    if (typeof pricePerMeter !== 'number') {
      throw new Error('Invalid or missing pricePerMeter on carpet catalogue entry');
    }
    const rawPrice = area * pricePerMeter;
    const originalPrice = Math.round((rawPrice + Number.EPSILON) * 100) / 100;
    return {
      originalPrice,
      area,
    };
  } else if (category === 'linen') {
    if (typeof catalogueEntry.basePrice !== 'number') {
      throw new Error('Invalid or missing basePrice on linen catalogue entry');
    }
    return {
      originalPrice: catalogueEntry.basePrice,
    };
  } else {
    throw new Error(`Unknown category "${category}"`);
  }
};
