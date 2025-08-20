
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  Archive,
  ClipboardList,
  Warehouse,
  FileBox
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronRight } from "lucide-react";


export function MainNav() {
  const pathname = usePathname();
  const isReportsOpen = pathname.startsWith('/dashboard/reports');
  const isSettingsOpen = pathname.startsWith('/dashboard/settings');


  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Pesanan", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Produk", icon: Package },
    { href: "/dashboard/customers", label: "Pelanggan", icon: Users },
    { href: "/dashboard/stock-management", label: "Manajemen Stok", icon: Warehouse },
    { href: "/dashboard/purchases", label: "Pembelian", icon: Archive },
    { href: "/dashboard/operational-costs", label: "Biaya Operasional", icon: ClipboardList },
  ];

  const reportsSubMenu = [
    { href: "/dashboard/reports/sales", label: "Penjualan", icon: LineChart },
    { href: "/dashboard/reports/product-sales", label: "Penjualan Produk", icon: Package },
    // more items can be added here
  ];

  const renderMenuItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");
    
    return (
        <TooltipProvider key={item.href}>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 group-[.collapsed]:w-full",
                            isActive && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  };
  
   const renderCollapsibleMenu = (
        label: string, 
        Icon: React.ElementType, 
        isOpen: boolean,
        submenu: { href: string; label: string; }[]
    ) => (
         <Collapsible defaultOpen={isOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <CollapsibleTrigger asChild>
                             <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 group-[.collapsed]:w-full", isOpen && "bg-accent text-accent-foreground")}>
                                <Icon className="h-5 w-5" />
                                <span className="sr-only">{label}</span>
                            </div>
                         </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            
            {/* Expanded view */}
            <div className="hidden group-[.collapsed]:hidden flex-col gap-1 mt-2">
                 <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-semibold">{label}</span>
                     <CollapsibleTrigger asChild>
                         <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90"/>
                     </CollapsibleTrigger>
                </div>
                 <CollapsibleContent className="space-y-1 ml-4 border-l pl-2">
                    {submenu.map(subItem => (
                         <Link key={subItem.href} href={subItem.href} className={cn("flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent", pathname.startsWith(subItem.href) ? "bg-accent" : "")}>
                            {subItem.label}
                        </Link>
                    ))}
                </CollapsibleContent>
            </div>
        </Collapsible>
    )


  return (
    <>
      {menuItems.map(renderMenuItem)}
       <Collapsible defaultOpen={isReportsOpen} className="w-full">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <CollapsibleTrigger asChild>
                             <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 group-[.collapsed]:w-full", isReportsOpen && "bg-accent text-accent-foreground")}>
                                <LineChart className="h-5 w-5" />
                                <span className="sr-only">Laporan</span>
                            </div>
                         </CollapsibleTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Laporan</TooltipContent>
                </Tooltip>
            </TooltipProvider>
             <div className="hidden group-[.collapsed]:hidden flex-col gap-1 mt-2">
                 <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 cursor-pointer">
                        <span className="text-sm font-semibold">Laporan</span>
                        <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90"/>
                    </div>
                </CollapsibleTrigger>
                 <CollapsibleContent className="space-y-1 ml-4 border-l pl-2">
                     <Link href="/dashboard/reports/sales" className={cn("block rounded-md p-2 text-sm font-medium hover:bg-accent", pathname === "/dashboard/reports/sales" && "bg-accent")}>Penjualan</Link>
                     <Link href="/dashboard/reports/product-sales" className={cn("block rounded-md p-2 text-sm font-medium hover:bg-accent", pathname === "/dashboard/reports/product-sales" && "bg-accent")}>Penjualan Produk</Link>
                      <Link href="/dashboard/reports/purchases" className={cn("block rounded-md p-2 text-sm font-medium hover:bg-accent", pathname === "/dashboard/reports/purchases" && "bg-accent")}>Pembelian</Link>
                 </CollapsibleContent>
             </div>
       </Collapsible>
        <TooltipProvider>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 mt-auto",
                            pathname.startsWith("/dashboard/settings") && "bg-accent text-accent-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Pengaturan</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Pengaturan</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    </>
  );
}

    