/** Badge + icon for listing cards; derived from listing_type only. */
export function storefrontListingPresentation(listingType: string | null | undefined): {
  badge: string;
  badgeColor: 'green' | 'blue' | 'purple' | 'red';
  icon: string;
} {
  const t = String(listingType || '');
  if (t === 'Equipment / Machinery') {
    return { badge: 'Equipment', badgeColor: 'green', icon: 'fa-dolly' };
  }
  if (t === 'Raw Materials') {
    return { badge: 'Surplus', badgeColor: 'blue', icon: 'fa-shapes' };
  }
  if (t === 'Surplus Parts') {
    return { badge: 'Surplus', badgeColor: 'blue', icon: 'fa-cog' };
  }
  if (t === 'Production Capacity') {
    return { badge: 'Capacity', badgeColor: 'purple', icon: 'fa-industry' };
  }
  return { badge: 'Available', badgeColor: 'green', icon: 'fa-box' };
}
