'use client'

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export interface LineItemDraft {
  description: string
  quantity: string
  unit_price: string
}

interface InvoiceLineItemRowProps {
  value: LineItemDraft
  onChange: (field: keyof LineItemDraft, value: string) => void
  onRemove: () => void
  showRemove: boolean
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function InvoiceLineItemRow({
  value,
  onChange,
  onRemove,
  showRemove,
}: InvoiceLineItemRowProps) {
  const qty = parseFloat(value.quantity) || 0
  const unit = parseFloat(value.unit_price) || 0
  const amount = Math.round(qty * unit * 100) / 100

  return (
    <div className="grid grid-cols-12 gap-2 items-start py-2">
      <div className="col-span-12 md:col-span-6">
        <Input
          placeholder="Description"
          value={value.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="col-span-4 md:col-span-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Qty"
          value={value.quantity}
          onChange={(e) => onChange('quantity', e.target.value)}
          className="text-sm text-right"
        />
      </div>
      <div className="col-span-4 md:col-span-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="Unit price"
          value={value.unit_price}
          onChange={(e) => onChange('unit_price', e.target.value)}
          className="text-sm text-right"
        />
      </div>
      <div className="col-span-3 md:col-span-2 flex items-center justify-end h-10 text-sm font-medium text-foreground">
        {fmtMoney(amount)}
      </div>
      <div className="col-span-1 flex items-center justify-end h-10">
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove line item"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
