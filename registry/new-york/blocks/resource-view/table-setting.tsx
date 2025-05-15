import { useState } from 'react'
import { Column } from "@tanstack/react-table"
import { Button } from "@/registry/new-york/ui/button"
import { Input } from "@/registry/new-york/ui/input"
import { RadioGroup, RadioGroupItem } from "@/registry/new-york/ui/radio-group"
import { Switch } from "@/registry/new-york/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/registry/new-york/ui/dialog"
import { Label } from "@/registry/new-york/ui/label"
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface TableSettingProps {
  columns: Column<any, unknown>[]
  pageSize: number
  columnVisibility: Record<string, boolean>
  onApplySettings: (newPageSize: number, newColumnVisibility: Record<string, boolean>) => void
}

export function TableSetting({
  columns,
  pageSize,
  columnVisibility,
  onApplySettings
}: TableSettingProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempPageSize, setTempPageSize] = useState<number | 'custom'>(pageSize)
  const [tempColumnVisibility, setTempColumnVisibility] = useState(columnVisibility)
  const [customPageSize, setCustomPageSize] = useState('')
  const t = useTranslations('components.table-setting')

  const handleApply = () => {
    const newPageSize = tempPageSize === 'custom' ? parseInt(customPageSize, 10) : tempPageSize
    if (!isNaN(newPageSize) && newPageSize > 0) {
      onApplySettings(newPageSize, tempColumnVisibility)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempPageSize(pageSize)
    setTempColumnVisibility(columnVisibility)
    setCustomPageSize('')
    setIsOpen(false)
  }

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setTempColumnVisibility(prev => ({ ...prev, [columnId]: isVisible }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 py-4">
          <div className="w-1/2 pr-4 border-r">
            <h3 className="text-lg font-semibold mb-4">{t('pagesize')}</h3>
            <RadioGroup
              value={tempPageSize.toString()}
              onValueChange={(value) => {
                setTempPageSize(value === 'custom' ? 'custom' : parseInt(value, 10))
              }}
            >
              {[10, 20, 30].map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <RadioGroupItem value={size.toString()} id={`size-${size}`} />
                  <Label htmlFor={`size-${size}`}>{size}{t('row')}</Label>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="size-custom" />
                <Label htmlFor="size-custom">{t('custom')}:</Label>
                <Input
                  type="number"
                  value={customPageSize}
                  onChange={(e) => setCustomPageSize(e.target.value)}
                  className="w-20"
                  min="1"
                />
              </div>
            </RadioGroup>
          </div>
          <div className="w-1/2 pl-4">
            <h3 className="text-lg font-semibold mb-4">{t('column')}</h3>
            {columns.map((column) => (
              <div key={column.id} className="flex items-center justify-between py-2">
                <Label htmlFor={`column-${column.id}`}>
                  {column.columnDef.header && typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </Label>
                <Switch
                  checked={tempColumnVisibility[column.id] !== false}
                  onCheckedChange={(value) => handleColumnVisibilityChange(column.id, value)}
                  id={`column-${column.id}`}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>{t('cancel')}</Button>
          <Button onClick={handleApply}>{t('apply')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}