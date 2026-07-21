'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { getAppNavigationItems } from '@/components/app-navigation'
import { BrandLockup } from '@/components/brand-lockup'
import { ClubIcon } from '@/components/club-icon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'
import { getClubByName } from '@/lib/clubs'
import {
  IconCheck,
  IconChevronRight,
  IconLogout,
  IconMonitor,
  IconMoon,
  IconShield,
  IconSun,
  IconUser,
} from '@/components/app-icons'

const themeItems = [
  { value: 'light', label: 'Hell', icon: IconSun },
  { value: 'dark', label: 'Dunkel', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconMonitor },
] as const

type ThemeValue = (typeof themeItems)[number]['value']

export function AppSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { theme = 'system', resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const { isMobile } = useSidebar()
  const favoriteClub = session?.user?.favoriteTeam
    ? getClubByName(session.user.favoriteTeam)
    : undefined
  const activeTheme: ThemeValue = themeMounted && themeItems.some((item) => item.value === theme)
    ? (theme as ThemeValue)
    : 'system'
  const ThemeIcon = activeTheme === 'system'
    ? IconMonitor
    : resolvedTheme === 'dark'
      ? IconMoon
      : IconSun

  const navigationItems = getAppNavigationItems(pathname, searchParams.get('ansicht'))

  useEffect(() => setThemeMounted(true), [])

  if (isMobile) return null

  return (
    <Sidebar variant="inset" collapsible="icon" className="sidebar-shell">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-2">
        <BrandLockup
          compact
          className="w-full rounded-xl px-0.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
        />
      </SidebarHeader>

      <div
        aria-hidden="true"
        className="mx-3 mb-2 h-px shrink-0 bg-sidebar-border group-data-[collapsible=icon]:mx-2"
      />

      <SidebarContent>
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    tooltip={{ children: item.label, sideOffset: 10 }}
                    className="sidebar-nav-item h-11 gap-3 rounded-xl px-3 text-sm group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5!"
                  >
                    <Link href={item.href} aria-current={item.active ? 'page' : undefined}>
                      <item.icon strokeWidth={1.6} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-2 px-3 py-2 group-data-[collapsible=icon]:px-2">
            <SidebarSeparator className="mx-0 mb-3" />
            <SidebarGroupLabel className="h-7 px-3 text-xs font-semibold normal-case tracking-normal text-neutral-600 dark:text-neutral-300">
              Verwaltung
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin' || pathname.startsWith('/admin/')}
                    tooltip={{ children: 'Admin', sideOffset: 10 }}
                    className="sidebar-nav-item h-11 gap-3 rounded-xl px-3 text-sm group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5!"
                  >
                    <Link
                      href="/admin"
                      aria-current={pathname === '/admin' || pathname.startsWith('/admin/') ? 'page' : undefined}
                    >
                      <IconShield strokeWidth={1.6} />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-0 px-2 pb-2 pt-0 group-data-[collapsible=icon]:px-1">
        <SidebarSeparator className="mx-1 mb-3 group-data-[collapsible=icon]:mx-2" />
        <div className="sidebar-footer-well space-y-2 rounded-xl bg-neutral-200 p-2 dark:bg-neutral-800 group-data-[collapsible=icon]:space-y-1.5 group-data-[collapsible=icon]:p-1.5">
          <div
            role="group"
            aria-label="Darstellung"
            className="sidebar-theme-track grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900 group-data-[collapsible=icon]:hidden"
          >
            {themeItems.map((item) => (
              <Button
                key={item.value}
                type="button"
                variant="ghost"
                aria-pressed={activeTheme === item.value}
                aria-label={item.label}
                title={item.label}
                data-active={activeTheme === item.value}
                className="sidebar-theme-segment h-11 w-full rounded-md text-neutral-600 focus-visible:ring-sidebar-ring dark:text-neutral-300"
                onClick={() => setTheme(item.value)}
              >
                <item.icon className="size-4" strokeWidth={1.6} />
              </Button>
            ))}
          </div>

          <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    aria-label="Darstellung"
                    tooltip={{ children: `Darstellung: ${themeItems.find((item) => item.value === activeTheme)?.label ?? 'System'}`, sideOffset: 10 }}
                    className="sidebar-footer-control size-10! justify-center rounded-lg p-0!"
                  >
                    <ThemeIcon strokeWidth={1.6} />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-48">
                  <DropdownMenuLabel>Darstellung</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
                    {themeItems.map((item) => (
                      <DropdownMenuRadioItem key={item.value} value={item.value}>
                        <item.icon strokeWidth={1.6} />
                        {item.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {session?.user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      aria-label="Benutzerkonto"
                      size="lg"
                      tooltip={{ children: 'Benutzerkonto', sideOffset: 10 }}
                      className="sidebar-account-control group/account h-14 gap-3 rounded-lg px-2.5 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden"
                    >
                      <Avatar className="size-9 rounded-lg group-data-[collapsible=icon]:size-8">
                        <AvatarFallback
                          className="rounded-lg text-neutral-50"
                          style={{ backgroundColor: session.user.color ?? 'var(--primary)' }}
                        >
                          {favoriteClub?.iconUrl ? (
                            <ClubIcon
                              src={favoriteClub.iconUrl}
                              fallbackSrc={favoriteClub.iconSourceUrl}
                              label={favoriteClub.name}
                              className="size-5 object-contain"
                            />
                          ) : (
                            <IconUser className="size-4" strokeWidth={1.6} />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                        <span className="truncate text-sm font-semibold">{session.user.nickname}</span>
                        <span className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-300">
                          {isAdmin ? 'Administrator' : 'Spieler'}
                        </span>
                      </span>
                      <IconChevronRight className="size-4 shrink-0 text-neutral-500 transition-transform duration-150 group-data-[state=open]/account:rotate-90 dark:text-neutral-400" strokeWidth={1.6} />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="end"
                    sideOffset={10}
                    className="w-60"
                  >
                    <DropdownMenuLabel>
                      <span className="block truncate">{session.user.nickname}</span>
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                        {session.user.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profil">
                        <IconUser strokeWidth={1.6} />
                        Konto verwalten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/spieler/${session.user.nickname}`}>
                        <IconCheck strokeWidth={1.6} />
                        Öffentliches Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => signOut({ callbackUrl: '/login' })}
                    >
                      <IconLogout strokeWidth={1.6} />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
