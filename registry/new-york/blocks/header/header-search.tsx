'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/registry/new-york/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/new-york/ui/command'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface SearchItem {
  value: string
  label: string | React.ReactNode
  category: string
  description: string
  path: string
  keywords: string[]
}

interface GroupedData {
  [key: string]: SearchItem[]
}

export function SearchService() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const t = useTranslations('components.header-search')

  const searchData = useMemo<SearchItem[]>(
    () => [
      {
        value: 'mNi Dashboard',
        label: 'mNi Dashboard',
        category: 'Management',
        description: 'Cloud Dashboard',
        path: '/dashboard',
        keywords: ['dashboard', 'console', 'management'],
      },
      {
        value: 'mNi VPC',
        label: 'mNi VPC',
        category: 'Networking',
        description: 'Secure and isolate cloud resources',
        path: '/vpc',
        keywords: [
          'vpc',
          'network',
          'virtual private cloud',
          'networking',
          'eip',
          'subnet',
          'security group',
          'security',
          'sg',
        ],
      },
      {
        value: 'mNi Block Storage',
        label: 'mNi Block Storage',
        category: 'Storage',
        description: 'Scalable cloud storage services',
        path: '/bs',
        keywords: [
          'storage',
          'data',
          'cloud storage',
          'file system',
          'block',
          'block storage',
          'bs',
        ],
      },
      {
        value: 'mNi VM',
        label: 'mNi VM',
        category: 'Computing',
        description: 'Scalable computing capacity',
        path: '/vm',
        keywords: [
          'compute',
          'processing',
          'cloud computing',
          'virtual machines',
          'vm',
        ],
      },
      {
        value: 'mNi Container',
        label: 'mNi Container',
        category: 'Computing',
        description: 'Managed database services',
        path: '/ctr',
        keywords: ['compute', 'processing', 'cloud computing', 'container', 'ctr'],
      },
    ],
    []
  )

  const groupedData = useMemo<GroupedData>(() => {
    return searchData.reduce<GroupedData>(
      (groups, item) => {
        const category = item.category
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(item)
        return groups
      },
      {}
    )
  }, [searchData])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useMemo(
    () => (path: string) => {
      router.push(path)
      setOpen(false)
    },
    [router]
  )

  return (
    <>
      <div className="hidden md:block">
        <Button
          variant="outline"
          className="h-7 px-3 min-w-[140px] text-sm text-[13px] text-muted-foreground hover:text-foreground [font-feature-settings:'kern'] antialiased"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="translate-y-0">Search</span>
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-80 translate-y-0">
            <span className="text-xs translate-y-0">⌘</span>K
          </kbd>
        </Button>
      </div>
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('placeholder')} className="text-base" />
        <CommandList>
          <CommandEmpty className="text-sm py-6">
            {t('noresults')}
          </CommandEmpty>
          {Object.entries(groupedData).map(([category, items]) => (
            <CommandGroup
              key={category}
              heading={category}
              className="text-sm font-medium [font-feature-settings:'kern']"
            >
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  onSelect={() => handleSelect(item.path)}
                  className="py-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm translate-y-0 [font-feature-settings:'kern']">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground translate-y-0">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}