'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ShoppingBag,
  Plus,
  Search,
  X,
  ExternalLink,
  Trash2,
  Archive,
  Edit3,
  Loader2,
  Link as LinkIcon,
  Sparkles,
  Lock,
  Package,
  Users,
  FileText,
  ImageIcon,
} from 'lucide-react'
import { PRODUCT_CATEGORIES, getCategoryLabel } from '@/lib/product-clipper/categories'
import type { ClippedProduct } from '@/lib/product-clipper/types'

export default function SourcingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'products' | 'vendors' | 'ffe'>('products')

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-semibold text-foreground">Product Sourcing</h1>
            <p className="text-muted-foreground mt-1">Find, clip, and manage products for your design projects</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Product Library
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground/50 cursor-not-allowed"
              disabled
            >
              <Users className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Vendors
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">Soon</Badge>
            </button>
            <button
              onClick={() => setActiveTab('ffe')}
              className="px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground/50 cursor-not-allowed"
              disabled
            >
              <FileText className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              FF&E Schedules
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">Soon</Badge>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'products' && <ProductLibrary />}
        </motion.div>
      </div>
    </div>
  )
}

function ProductLibrary() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ClippedProduct[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; project_name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  const [isEnriching, setIsEnriching] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'archive' | 'delete'
    item: { id: string; name: string }
  } | null>(null)

  // Form state
  const [formUrl, setFormUrl] = useState('')
  const [formName, setFormName] = useState('')
  const [formBrand, setFormBrand] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('other')
  const [formDescription, setFormDescription] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formRetailer, setFormRetailer] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('clipped_products')
        .select('*')
        .eq('user_id', user.id)
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })

      if (categoryFilter) query = query.eq('category', categoryFilter)

      const { data, error } = await query

      if (error) {
        toast.error('Failed to load products')
        return
      }
      setProducts(data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [user, categoryFilter])

  const fetchProjects = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('id, project_name')
      .or('archived.is.null,archived.eq.false')
      .order('project_name')
    setProjects(data || [])
  }, [user])

  useEffect(() => {
    fetchProducts()
    fetchProjects()
  }, [fetchProducts, fetchProjects])

  const resetForm = () => {
    setFormUrl('')
    setFormName('')
    setFormBrand('')
    setFormPrice('')
    setFormCategory('other')
    setFormDescription('')
    setFormImageUrl('')
    setFormRetailer('')
    setFormProjectId('')
    setFormNotes('')
    setCurrentProductId(null)
    setIsEditing(false)
  }

  const handleEnrichUrl = async () => {
    if (!formUrl.trim()) return
    setIsEnriching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/products/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url: formUrl.trim() }),
      })

      if (!res.ok) {
        toast.error('Could not extract product data from this URL')
        return
      }

      const data = await res.json()
      if (data.product_name) setFormName(data.product_name)
      if (data.brand) setFormBrand(data.brand)
      if (data.price) setFormPrice(String(data.price))
      if (data.description) setFormDescription(data.description)
      if (data.image_url) setFormImageUrl(data.image_url)
      if (data.retailer) setFormRetailer(data.retailer)
      if (data.material) setFormNotes((prev) => prev ? `${prev}\nMaterial: ${data.material}` : `Material: ${data.material}`)
      toast.success('Product data extracted')
    } catch {
      toast.error('Failed to extract product data')
    } finally {
      setIsEnriching(false)
    }
  }

  const handleSave = async () => {
    if (!user || !formName.trim()) {
      toast.error('Product name is required')
      return
    }
    setIsSaving(true)

    try {
      const payload = {
        product_name: formName.trim(),
        brand: formBrand.trim() || null,
        url: formUrl.trim() || null,
        price: formPrice ? parseFloat(formPrice) : null,
        category: formCategory,
        description: formDescription.trim() || null,
        image_url: formImageUrl.trim() || null,
        retailer: formRetailer.trim() || null,
        project_id: formProjectId || null,
        notes: formNotes.trim() || null,
      }

      if (isEditing && currentProductId) {
        const { error } = await supabase
          .from('clipped_products')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', currentProductId)
          .eq('user_id', user.id)

        if (error) throw error
        toast.success('Product updated')
      } else {
        const { error } = await supabase
          .from('clipped_products')
          .insert({ ...payload, user_id: user.id })

        if (error) throw error
        toast.success('Product added')
      }

      resetForm()
      setIsFormOpen(false)
      fetchProducts()
    } catch {
      toast.error('Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (product: ClippedProduct) => {
    setCurrentProductId(product.id)
    setFormName(product.product_name)
    setFormBrand(product.brand || '')
    setFormUrl(product.url || '')
    setFormPrice(product.price ? String(product.price) : '')
    setFormCategory(product.category || 'other')
    setFormDescription(product.description || '')
    setFormImageUrl(product.image_url || '')
    setFormRetailer(product.retailer || '')
    setFormProjectId(product.project_id || '')
    setFormNotes(product.notes || '')
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog || !user) return
    const { type, item } = confirmDialog

    try {
      if (type === 'archive') {
        await supabase
          .from('clipped_products')
          .update({ archived: true })
          .eq('id', item.id)
          .eq('user_id', user.id)
        toast.success('Product archived')
      } else {
        await supabase
          .from('clipped_products')
          .delete()
          .eq('id', item.id)
          .eq('user_id', user.id)
        toast.success('Product deleted')
      }
      setConfirmDialog(null)
      fetchProducts()
    } catch {
      toast.error(`Failed to ${type} product`)
    }
  }

  const filteredProducts = search
    ? products.filter((p) =>
        [p.product_name, p.brand, p.retailer, p.notes]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(search.toLowerCase()))
      )
    : products

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          {PRODUCT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <Button
          onClick={() => { resetForm(); setIsFormOpen(!isFormOpen) }}
          className="gap-2"
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isFormOpen ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {isEditing ? 'Edit Product' : 'Add Product'}
                </h3>

                {/* URL Auto-fill Row */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="url">Product URL</Label>
                    <Input
                      id="url"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://www.westelm.com/products/..."
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={handleEnrichUrl}
                      disabled={!formUrl.trim() || isEnriching}
                      className="gap-1.5"
                    >
                      {isEnriching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Auto-fill
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Harmony Sofa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. West Elm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="retailer">Retailer</Label>
                    <Input
                      id="retailer"
                      value={formRetailer}
                      onChange={(e) => setFormRetailer(e.target.value)}
                      placeholder="e.g. West Elm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project">Assign to Project</Label>
                    <select
                      id="project"
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-4">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Product details, dimensions, materials..."
                  />
                </div>

                <div className="mb-4">
                  <Label htmlFor="notes">Designer Notes</Label>
                  <textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Personal notes, alternatives, client preferences..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { resetForm(); setIsFormOpen(false) }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!formName.trim() || isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isEditing ? 'Update' : 'Save Product'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <ShoppingBag className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search || categoryFilter ? 'No matching products' : 'No products yet'}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              {search || categoryFilter
                ? 'Try adjusting your search or filters.'
                : 'Add products manually or install the IDStudio Clipper extension to save products from any website.'}
            </p>
            {!search && !categoryFilter && (
              <Button onClick={() => { resetForm(); setIsFormOpen(true) }} className="gap-2">
                <Plus className="h-4 w-4" /> Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group hover:shadow-soft-md transition-shadow overflow-hidden">
                {/* Product Image */}
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    {product.url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => window.open(product.url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => setConfirmDialog({ type: 'archive', item: { id: product.id, name: product.product_name } })}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                      {product.product_name}
                    </h4>
                    {product.price !== null && (
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {formatPrice(product.price, product.currency)}
                      </span>
                    )}
                  </div>
                  {product.brand && (
                    <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {getCategoryLabel(product.category)}
                    </Badge>
                    {product.retailer && (
                      <Badge variant="outline" className="text-[10px]">
                        {product.retailer}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === 'archive' ? 'Archive' : 'Delete'} Product
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.type === 'archive'
                ? `Archive "${confirmDialog?.item.name}"? You can restore it later.`
                : `Permanently delete "${confirmDialog?.item.name}"? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              variant={confirmDialog?.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
            >
              {confirmDialog?.type === 'archive' ? 'Archive' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
