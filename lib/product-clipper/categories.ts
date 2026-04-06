// ============================================
// Product Clipper — Interior Design Categories
// ============================================

export type ProductCategory =
  | 'furniture'
  | 'seating'
  | 'tables'
  | 'lighting'
  | 'textiles'
  | 'rugs'
  | 'window_treatments'
  | 'wall_decor'
  | 'accessories'
  | 'hardware'
  | 'plumbing'
  | 'tile'
  | 'flooring'
  | 'countertops'
  | 'paint'
  | 'wallpaper'
  | 'outdoor'
  | 'other'

export const PRODUCT_CATEGORIES: Array<{ value: ProductCategory; label: string }> = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'seating', label: 'Seating' },
  { value: 'tables', label: 'Tables' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'textiles', label: 'Textiles & Fabric' },
  { value: 'rugs', label: 'Rugs' },
  { value: 'window_treatments', label: 'Window Treatments' },
  { value: 'wall_decor', label: 'Wall Decor & Art' },
  { value: 'accessories', label: 'Accessories & Decor' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'plumbing', label: 'Plumbing & Fixtures' },
  { value: 'tile', label: 'Tile' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'paint', label: 'Paint & Finish' },
  { value: 'wallpaper', label: 'Wallpaper' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'other', label: 'Other' },
]

export function getCategoryLabel(value: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || 'Other'
}
