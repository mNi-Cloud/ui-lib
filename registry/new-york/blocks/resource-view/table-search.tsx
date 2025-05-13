import { Input } from "@/registry/new-york/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/registry/new-york/ui/button"

interface TableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TableSearch({
  value,
  onChange,
  placeholder = 'Search'
}: TableSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8 h-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1.5 h-6 w-6 p-0 hover:bg-transparent"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}