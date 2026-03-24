'use client'

import { Suspense } from 'react'
import { Layout, PlusCircle } from 'lucide-react'

import { Link, usePathname, useRouter, type Locale } from '@/i18n/navigation'
import { routes } from '@/lib/routes'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  RecentPreparationsSidebarGroup,
  RecentPreparationsSkeleton,
} from '@/components/layout/sidebar/recent-preparations'
import { useLocale, useTranslations } from 'next-intl'
import { useUser, useClerk } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronsUpDown, Globe, LogOut, Settings, Check } from 'lucide-react'

/**
 * Application sidebar component
 * Main navigation for the application
 *
 * Uses Suspense pattern for Recent Preparations section:
 * - RecentPreparationsSidebarGroup fetches data via useSuspenseQuery
 * - RecentPreparationsSkeleton shown as fallback while loading
 */
export function AppSidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const t = useTranslations('common.sidebar')

  const handleLanguageChange = (newLocale: Locale) => {
    // next-intl handles locale switching automatically
    router.replace(pathname, { locale: newLocale })
  }

  const mainMenuItems = [
    {
      title: t('home'),
      href: '/dashboard',
      icon: Layout,
    },
    {
      title: t('newInterviewPrep'),
      href: '/interview-prep/new',
      icon: PlusCircle,
    },
  ]

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center px-2 py-2 group-data-[collapsible=icon]:justify-center'>
          <div className='flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80'>
            <SidebarTrigger />
            <div className='flex flex-col items-start group-data-[collapsible=icon]:hidden'>
              <Link href={routes.home}>
                <p className='text-lg leading-none font-bold text-primary'>
                  Deep Quest
                </p>
              </Link>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-bold tracking-wider text-muted-foreground/70 uppercase'>
            {t('main')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(item => {
                // usePathname from @/i18n/navigation returns path WITHOUT locale prefix
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className='data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium'
                    >
                      <Link href={item.href}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Preparations with Suspense */}
        <Suspense fallback={<RecentPreparationsSkeleton />}>
          <RecentPreparationsSidebarGroup />
        </Suspense>

        {/* Support */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href='/settings'>
                    <Settings className='h-4 w-4' />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href='/help'>
                    <HelpCircle className='h-4 w-4' />
                    <span>Help & Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || ''}
                    />
                    <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.fullName}
                    </span>
                    <span className='truncate text-xs'>
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side={isMobile ? 'bottom' : 'right'}
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='h-8 w-8 rounded-lg'>
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || ''}
                      />
                      <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>
                        {user?.fullName}
                      </span>
                      <span className='truncate text-xs'>
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openUserProfile()}>
                  <Settings className='mr-2 h-4 w-4' />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe className='mr-2 h-4 w-4' />
                    {t('language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange('ko')}
                    >
                      <span className='mr-2'>🇰🇷</span>
                      {t('languageKorean')}
                      {locale === 'ko' && <Check className='ml-auto h-4 w-4' />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange('en')}
                    >
                      <span className='mr-2'>🌎</span>
                      {t('languageEnglish')}
                      {locale === 'en' && <Check className='ml-auto h-4 w-4' />}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className='mr-2 h-4 w-4' />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
