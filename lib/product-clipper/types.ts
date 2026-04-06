// ============================================
// Product Clipper — Type Definitions
// ============================================

export interface ClippedProduct {
  id: string
  user_id: string
  project_id: string | null
  product_name: string
  brand: string | null
  url: string | null
  price: number | null
  currency: string
  image_url: string | null
  storage_path: string | null
  description: string | null
  category: string
  dimensions: string | null
  material: string | null
  color: string | null
  sku: string | null
  retailer: string | null
  notes: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  user_id: string
  image_url: string
  storage_path: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface ProductCollection {
  id: string
  user_id: string
  project_id: string | null
  name: string
  description: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface CollectionProduct {
  id: string
  collection_id: string
  product_id: string
  user_id: string
  added_at: string
}

/** Shape sent by the Chrome extension to POST /api/products/clip */
export interface ClipProductRequest {
  url?: string
  product_name: string
  brand?: string
  price?: number
  currency?: string
  image_url?: string
  description?: string
  category?: string
  dimensions?: string
  material?: string
  color?: string
  sku?: string
  retailer?: string
  notes?: string
  project_id?: string
  collection_id?: string
}
