'use client'

import { startTransition } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { setUserLocale } from '@/registry/new-york/blocks/i18n/locale'
import { locales, Locale } from '@/registry/new-york/blocks/i18n/config'
import { signOut, useSession, signIn } from 'next-auth/react'
import {
  Bell,
  Settings,
  GlobeIcon,
  JapaneseYen,
  Moon,
  Sun,
  Laptop,
  LogOut,
  UserPen,
} from 'lucide-react'
import { Button } from '@/registry/new-york/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/new-york/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/registry/new-york/ui/dropdown-menu'
import { SearchService } from './header-search'
import { SidebarTrigger } from '@/registry/new-york/ui/sidebar'
import { Separator } from '@/registry/new-york/ui/separator'
import Link from '@/registry/new-york/blocks/link/link'

export function Header() {
  const t = useTranslations('components.header')
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-20 w-full bg-background border-b">
      <div className="w-full px-3">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-3" />
            <Link href="/dashboard" className="text-xl font-bold">
              mNi
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <nav className="flex items-center space-x-2">
              <SearchService />
              <div className="hidden md:flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">{t('notifications')}</span>
                </Button>
                <ThemeToggle />
                {session ? (
                  <UserDropdown />
                ) : (
                  <Button size="sm" onClick={() => signIn()}>{t('login')}</Button>
                )}
              </div>
              <div className="flex md:hidden">
                <MobileActions />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const t = useTranslations('components.header')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{"toggle theme"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>{t('system')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserDropdown() {
  const t = useTranslations('components.header')
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'
  const userImage = session?.user?.image
  const userEmail = session?.user?.email
  const initials = userName.split(' ').map(name => name[0]).join('').toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-7 w-7 rounded-full">
          <Avatar className="h-7 w-7">
            {userImage ? (
              <AvatarImage src={userImage} alt={userName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserPen className="mr-2 h-4 w-4" />
          <span>{t('profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bap" className="flex items-center">
            <JapaneseYen className="mr-2 h-5 w-5" />
            <span>{t('billing')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <GlobeIcon className="mr-4 h-4 w-4" />
            <span>{t('language')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <LanguageToggle />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LanguageToggle() {
  const languageNames: Record<Locale, string> = {
    'ja': '日本語',
    'en': 'English',
  }

  function onChange(locale: Locale) {
    startTransition(() => {
      setUserLocale(locale)
    })
  }

  return (
    <>
      {locales.map((locale) => (
        <DropdownMenuItem 
          key={locale} 
          onClick={() => onChange(locale)}
        >
          <span>{languageNames[locale]}</span>
        </DropdownMenuItem>
      ))}
    </>
  )
}

function MobileActions() {
  const t = useTranslations('components.header')
  const { data: session } = useSession()

  return (
    <div className="flex items-center space-x-2">
      <Button size="sm" variant="ghost">
        <Bell className="h-4 w-4" />
        <span className="sr-only">{t('notifications')}</span>
      </Button>
      <ThemeToggle />
      {session ? (
        <UserDropdown />
      ) : (
        <Button size="sm" onClick={() => signIn()}>{t('login')}</Button>
      )}
    </div>
  )
}