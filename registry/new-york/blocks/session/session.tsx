'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/registry/new-york/ui/alert-dialog'

export function Session() {
  const { data: session, status } = useSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('component.session')

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsDialogOpen(true)
    } else if (session && 'error' in session && session.error === 'RefreshAccessTokenError') {
      setIsDialogOpen(true)
    }
  }, [status, session])

  const handleLogin = () => {
    setIsDialogOpen(false)
    signIn('keycloak')
  }

  const handleHome = () => {
    setIsDialogOpen(false)
    router.push('/')
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleHome}>
            {t('home')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleLogin}>
            {t('login')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}