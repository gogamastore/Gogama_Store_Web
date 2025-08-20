

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Users, FileText, ShoppingCart, DollarSign, ArrowLeft } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { id as dateFnsLocaleId } from "date-fns/locale";
import { useRouter } from "next/navigation";


interface Order {
  id: string;
  customer: string;
  customerId: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Pending';
  paymentStatus: 'Paid' | 'Unpaid';
  total: number;
  date: string;
}

interface CustomerReport {
  id: string;
  name: string;
  transactionCount: number;
  totalSpent: number;
  receivables: number;
  orders: Order[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CustomersReportPage() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customerReports, setCustomerReports] = useState<CustomerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const router = useRouter();

  const processOrdersToReports = useCallback((orders: Order[]) => {
    const reportMap = new Map<string, CustomerReport>();

    orders.forEach(order => {
        const customerId = order.customerId || order.customer; // Fallback to name if ID is missing
        if (!reportMap.has(customerId)) {
            reportMap.set(customerId, {
                id: customerId,
                name: order.customer,
                transactionCount: 0,
                totalSpent: 0,
                receivables: 0,
                orders: []
            });
        }

        const report = reportMap.get(customerId)!;
        report.transactionCount += 1;
        report.totalSpent += order.total;
        if (order.paymentStatus === 'Unpaid' && (order.status === 'Shipped' || order.status === 'Delivered')) {
            report.receivables += order.total;
        }
        report.orders.push(order);
    });

    return Array.from(reportMap.values()).sort((a,b) => b.totalSpent - a.totalSpent);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const total = typeof data.total === 'string' 
                ? parseFloat(data.total.replace(/[^0-9]/g, '')) 
                : typeof data.total === 'number' ? data.total : 0;
            return { 
                id: doc.id, 
                ...data,
                total,
                date: data.date.toDate ? data.date.toDate().toISOString() : new Date(data.date).toISOString(),
            } as Order;
        });
        setAllOrders(ordersData);
        setCustomerReports(processOrdersToReports(ordersData));
      } catch (error) {
        console.error("Error fetching orders for customer report: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [processOrdersToReports]);

  const handleFilter = () => {
    const { from, to } = dateRange;
    let filtered = allOrders;
    if (from || to) {
        filtered = allOrders.filter(order => {
            const orderDate = new Date(order.date);
            if (from && orderDate < startOfDay(from)) return false;
            if (to && orderDate > endOfDay(to)) return false;
            return true;
        });
    }
    setCustomerReports(processOrdersToReports(filtered));
  };
  
  const handleReset = () => {
      setDateRange({});
      setCustomerReports(processOrdersToReports(allOrders));
  }
  
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/reports')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali ke Laporan</span>
            </Button>
            <div>
                <CardTitle>Laporan Pelanggan</CardTitle>
                <CardDescription>
                Analisis data dan perilaku pelanggan. Filter berdasarkan rentang tanggal transaksi.
                </CardDescription>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Filter Data</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : (<span>Pilih rentang tanggal</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleFilter}>Filter</Button>
                <Button variant="outline" onClick={handleReset}>Reset ke Semua</Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ringkasan Pelanggan</CardTitle>
                 <CardDescription>
                    Daftar pelanggan berdasarkan total belanja dalam periode yang dipilih.
                 </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Pelanggan</TableHead>
                                <TableHead className="text-center">Jumlah Transaksi</TableHead>
                                <TableHead className="text-right">Total Belanja</TableHead>
                                <TableHead className="text-right">Total Piutang</TableHead>
                                <TableHead className="text-center w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Memuat data pelanggan...</TableCell>
                                </TableRow>
                            ) : customerReports.length > 0 ? (
                                customerReports.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell className="text-center">{customer.transactionCount}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={customer.receivables > 0 ? "destructive" : "outline"}>
                                            {formatCurrency(customer.receivables)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                    <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <FileText className="h-4 w-4" />
                                                    <span className="sr-only">Lihat Riwayat</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle>Riwayat Transaksi: {customer.name}</DialogTitle>
                                                    <DialogDescription>
                                                        Semua transaksi yang dilakukan oleh pelanggan ini dalam periode yang dipilih.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex-1 overflow-y-auto p-1">
                                                    <div className="overflow-auto">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Order ID</TableHead>
                                                                    <TableHead>Tanggal</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead>Pembayaran</TableHead>
                                                                    <TableHead className="text-right">Total</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {customer.orders.map(order => (
                                                                    <TableRow key={order.id}>
                                                                        <TableCell className="font-medium">
                                                                             <Button variant="link" asChild className="p-0 h-auto">
                                                                                 <span className="cursor-pointer">{order.id}</span>
                                                                             </Button>
                                                                        </TableCell>
                                                                        <TableCell>{format(new Date(order.date), "dd MMM yyyy")}</TableCell>
                                                                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                                                                        <TableCell><Badge variant={order.paymentStatus === 'Paid' ? 'default' : 'destructive'}>{order.paymentStatus === 'Paid' ? 'Lunas' : 'Belum Lunas'}</Badge></TableCell>
                                                                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Tidak ada data pelanggan untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
    </div>
  )
}
