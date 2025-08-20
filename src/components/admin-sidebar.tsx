"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Building,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";

const menuItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  {
    label: "Products",
    icon: Package,
    subItems: [
        { href: "/admin/products", label: "Product List" },
        { href: "/admin/products/autogenerator", label: "AI Autogenerator", icon: Sparkles },
    ]
  },
  { href: "/admin/inventory", label: "Inventory", icon: BarChart3 },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-bold text-lg font-headline"
          >
            <Building className="w-6 h-6 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">
              Toko Central
            </span>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) =>
            item.subItems ? (
              <SidebarGroup key={item.label}>
                <SidebarGroupLabel className="flex items-center">
                  <item.icon className="mr-2" />
                  {item.label}
                </SidebarGroupLabel>
                {item.subItems.map(subItem => (
                <SidebarMenuItem key={subItem.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === subItem.href}
                      className="justify-start"
                    >
                      <Link href={subItem.href}>
                        {subItem.icon && <subItem.icon />}
                        <span>{subItem.label}</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
              </SidebarGroup>
            ) : (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href!}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button variant="ghost" className="w-full justify-start gap-2" asChild>
                <Link href="/">
                    <LogOut />
                    <span className="group-data-[collapsible=icon]:hidden">
                    Back to Store
                    </span>
                </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
