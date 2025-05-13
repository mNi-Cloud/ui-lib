import { LucideIcon } from "lucide-react"
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/registry/new-york/ui/sidebar"
import Link from "@/registry/new-york/blocks/link/link"

interface NavSubItem {
  name: string
  href: string
}

interface NavItem {
  name: string
  href: string
  items?: NavSubItem[]
}

interface HeaderMenuItem {
  icon: LucideIcon
  title: string
  subtitle: string
  href: string
}

interface SidebarProps {
  navItems: NavItem[]
  headerMenu: HeaderMenuItem
}

const SideNav = ({ navItems, headerMenu }: SidebarProps) => {
  const { icon: Icon, title, subtitle, href } = headerMenu

  return (
    <SidebarRoot>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={href}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.href}
                    className="font-medium"
                  >
                    {item.name}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.name}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.href}>{subItem.name}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarRoot>
  )
}

export default SideNav