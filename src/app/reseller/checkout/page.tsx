
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  query,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Banknote,
  Bike,
  CreditCard,
  Loader2,
  Package,
  Home,
  PlusCircle,
  ArrowLeft,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface BankAccount {
    id: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
}
interface UserAddress {
    id: string;
    label: string;
    address: string;
    whatsapp: string;
}

const INITIAL_SHIPPING_FEE = 15000;


export default function CheckoutPage() {
  const { cart, totalAmount, clearCart, totalItems } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    address: "",
    whatsapp: "",
  });

  const [shippingMethod, setShippingMethod] = useState("expedition");
  const [shippingFee, setShippingFee] = useState(INITIAL_SHIPPING_FEE);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(true);

   useEffect(() => {
    if (!authLoading && user) {
      async function fetchUserData() {
        setIsAddressLoading(true);
        const userDocRef = doc(db, "user", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCustomerDetails(prev => ({
            ...prev,
            name: userData.name || user.displayName || "",
            whatsapp: userData.whatsapp || "",
          }));
        }

        const addressesQuery = query(collection(db, `user/${user.uid}/addresses`));
        const addressesSnapshot = await getDocs(addressesQuery);
        const addresses = addressesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAddress));
        setUserAddresses(addresses);
        setIsAddressLoading(false);
      }
      fetchUserData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchBankAccounts() {
      const querySnapshot = await getDocs(collection(db, "bank_accounts"));
      const accounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setBankAccounts(accounts);
    }
    fetchBankAccounts();
  }, []);
  
   useEffect(() => {
    if (!authLoading && cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Anda akan diarahkan kembali ke halaman utama.",
        variant: "destructive",
      });
      router.push("/reseller");
    }
  }, [cart, authLoading, router, toast]);

  // Logic to disable COD for expedition
  useEffect(() => {
    if (shippingMethod === "expedition" && paymentMethod === "cod") {
      setPaymentMethod("bank_transfer");
      toast({
        title: "Metode Pembayaran Disesuaikan",
        description: "COD tidak tersedia untuk pengiriman via ekspedisi.",
      });
    }
  }, [shippingMethod, paymentMethod, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [id]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProof(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleAddressSelect = (addressId: string) => {
      const selected = userAddresses.find(addr => addr.id === addressId);
      if (selected) {
          setCustomerDetails(prev => ({
              ...prev,
              address: selected.address,
              whatsapp: selected.whatsapp,
          }));
      }
  }

  const handleShippingChange = (value: string) => {
      setShippingMethod(value);
      if (value === 'expedition') {
          setShippingFee(INITIAL_SHIPPING_FEE);
      } else {
          setShippingFee(0);
      }
  }

  const grandTotal = useMemo(() => totalAmount + shippingFee, [totalAmount, shippingFee]);


 const handlePlaceOrder = async () => {
    if (!customerDetails.name || !customerDetails.address || !customerDetails.whatsapp) {
      toast({ title: "Data tidak lengkap", description: "Harap isi semua detail pelanggan.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);

    try {
      const orderRef = doc(collection(db, "orders")); // Generate a new order ID first
      
      const orderData = {
        customer: customerDetails.name,
        customerDetails: customerDetails,
        customerId: user?.uid || 'guest',
        products: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.finalPrice,
          quantity: item.quantity,
          image: item.image,
          sku: item.sku,
        })),
        productIds: cart.map(item => item.id),
        total: formatCurrency(grandTotal),
        shippingFee: shippingFee,
        shippingMethod: shippingMethod,
        subtotal: totalAmount,
        date: serverTimestamp(),
        status: 'Pending' as const,
        paymentStatus: paymentMethod === 'bank_transfer' && paymentProof ? 'Paid' as const : 'Unpaid' as const,
        paymentMethod: paymentMethod,
        paymentProofUrl: '',
      };

      if (paymentMethod === 'instant_payment') {
        // Create order in Firestore first, then create Xendit invoice
        const batch = writeBatch(db);
        batch.set(orderRef, orderData); // Set the data with the pre-generated ID
        await batch.commit();

        const response = await fetch('/api/xendit/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderRef.id,
                amount: grandTotal,
                customer: {
                    given_names: customerDetails.name,
                    email: user?.email,
                    mobile_number: customerDetails.whatsapp,
                },
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.finalPrice,
                }))
            })
        });

        const invoice = await response.json();
        if (response.ok) {
            router.push(invoice.invoice_url);
        } else {
            throw new Error(invoice.message || 'Gagal membuat invoice pembayaran.');
        }

      } else {
        // Handle normal payment methods (COD, Bank Transfer)
        const batch = writeBatch(db);
        let paymentProofUrl = "";
        if (paymentProof) {
          const storage = getStorage();
          const storageRef = ref(storage, `payment_proofs/${orderRef.id}_${paymentProof.name}`);
          await uploadBytes(storageRef, paymentProof);
          paymentProofUrl = await getDownloadURL(storageRef);
          orderData.paymentProofUrl = paymentProofUrl;
        }

        batch.set(orderRef, orderData);

        const notificationRef = doc(collection(db, "notifications"));
        batch.set(notificationRef, {
            title: "Pesanan Baru",
            body: `Pesanan baru sebesar ${formatCurrency(grandTotal)} dari ${customerDetails.name}.`,
            createdAt: serverTimestamp(),
            type: 'new_order',
            relatedId: orderRef.id,
            isRead: false
        });

        for (const item of cart) {
            const productRef = doc(db, "products", item.id);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
                const currentStock = productDoc.data().stock || 0;
                const newStock = currentStock - item.quantity;
                batch.update(productRef, { stock: newStock });
            }
        }
        
        await batch.commit();

        toast({
            title: "Pesanan Berhasil Dibuat!",
            description: "Terima kasih telah berbelanja.",
        });

        clearCart();
        router.push("/reseller/orders");
      }
    } catch (error) {
         console.error("Error placing order:", error);
         toast({ title: "Gagal Membuat Pesanan", description: "Terjadi kesalahan. Silakan coba lagi.", variant: "destructive" });
         setIsProcessing(false);
    }
  };


  if (cart.length === 0) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali</span>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Checkout</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                 {/* Customer Details */}
                <Card>
                    <CardHeader><CardTitle>1. Detail Pengiriman</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         {isAddressLoading ? (
                             <p>Memuat alamat...</p>
                         ) : userAddresses.length > 0 ? (
                            <div className="space-y-2">
                                <Label>Pilih Alamat Tersimpan</Label>
                                <Select onValueChange={handleAddressSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih dari alamat yang sudah Anda simpan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {userAddresses.map(addr => (
                                            <SelectItem key={addr.id} value={addr.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{addr.label}</span>
                                                    <span className="text-xs text-muted-foreground">{addr.address}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground text-center my-2">Atau isi manual di bawah ini.</p>
                            </div>
                         ) : null}

                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Penerima</Label>
                            <Input id="name" value={customerDetails.name} onChange={handleInputChange} placeholder="Masukkan nama lengkap penerima" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">Nomor WhatsApp Penerima</Label>
                            <Input id="whatsapp" value={customerDetails.whatsapp} onChange={handleInputChange} placeholder="Contoh: 081234567890" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Alamat Pengiriman Lengkap</Label>
                            <Textarea id="address" value={customerDetails.address} onChange={handleInputChange} placeholder="Masukkan alamat lengkap (Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos)" />
                        </div>
                    </CardContent>
                </Card>

                 {/* Shipping Method */}
                <Card>
                    <CardHeader><CardTitle>2. Opsi Pengiriman</CardTitle></CardHeader>
                    <CardContent>
                        <RadioGroup value={shippingMethod} onValueChange={handleShippingChange}>
                             <div className="flex flex-col space-y-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="expedition" id="expedition" />
                                    <Label htmlFor="expedition" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <Package className="h-6 w-6"/>
                                            <div>
                                                <p className="font-semibold">Ekspedisi</p>
                                                <p className="text-sm text-muted-foreground">Pesanan akan dikirim ke alamat Anda.</p>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                {shippingMethod === 'expedition' && (
                                     <div className="pl-10 pt-4 border-t">
                                        <h4 className="font-semibold text-sm">Kurir</h4>
                                        <p className="text-xs text-muted-foreground">
                                           Biaya awal mulai dari <strong>{formatCurrency(INITIAL_SHIPPING_FEE)} / koli</strong>. Biaya akhir akan disesuaikan oleh admin.
                                        </p>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                <RadioGroupItem value="pickup" id="pickup" />
                                <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                                     <div className="flex items-center gap-4">
                                        <Bike className="h-6 w-6"/>
                                        <div>
                                            <p className="font-semibold">Jemput Sendiri</p>
                                            <p className="text-sm text-muted-foreground">Ambil pesanan Anda langsung di lokasi kami.</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>
                
                 {/* Payment Method */}
                <Card>
                    <CardHeader><CardTitle>3. Metode Pembayaran</CardTitle></CardHeader>
                    <CardContent>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                           <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                <RadioGroupItem value="instant_payment" id="instant_payment" />
                                <Label htmlFor="instant_payment" className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <Zap className="h-6 w-6 text-yellow-500"/>
                                        <div>
                                            <p className="font-semibold">Instant Payment</p>
                                            <p className="text-sm text-muted-foreground">Bayar dengan Kartu Kredit, QRIS, e-Wallet, dll.</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                            <div className="flex flex-col space-y-4 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <CreditCard className="h-6 w-6"/>
                                            <div>
                                                <p className="font-semibold">Transfer Bank</p>
                                                <p className="text-sm text-muted-foreground">Transfer ke salah satu rekening kami.</p>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                {paymentMethod === 'bank_transfer' && (
                                    <div className="pl-8 pt-4 border-t">
                                        <h4 className="font-semibold mb-2">Silakan transfer ke rekening berikut:</h4>
                                        {bankAccounts.length > 0 ? (
                                            <div className="space-y-4">
                                                {bankAccounts.map(acc => (
                                                     <Alert key={acc.id}>
                                                        <Banknote className="h-4 w-4"/>
                                                        <AlertTitle>{acc.bankName.toUpperCase()}</AlertTitle>
                                                        <AlertDescription>
                                                            {acc.accountNumber} a/n {acc.accountHolder}
                                                        </AlertDescription>
                                                    </Alert>
                                                ))}
                                            </div>
                                        ): (
                                            <p className="text-sm text-muted-foreground">Tidak ada rekening bank yang tersedia saat ini.</p>
                                        )}
                                        <div className="mt-4 space-y-2">
                                            <Label htmlFor="payment-proof">Unggah Bukti Pembayaran (Opsional)</Label>
                                            <Input id="payment-proof" type="file" accept="image/*" onChange={handleFileChange} />
                                             {paymentProofPreview && (
                                                <div className="mt-2">
                                                    <Image src={paymentProofPreview} alt="Preview Bukti Pembayaran" width={150} height={150} className="rounded-md object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                             <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary"
                                  aria-disabled={shippingMethod === 'expedition'}
                             >
                                <RadioGroupItem value="cod" id="cod" disabled={shippingMethod === 'expedition'} />
                                <Label htmlFor="cod" className={cn("flex-1", shippingMethod === 'expedition' ? "cursor-not-allowed text-muted-foreground" : "cursor-pointer")}>
                                    <div className="flex items-center gap-4">
                                        <Banknote className="h-6 w-6"/>
                                        <div>
                                            <p className="font-semibold">COD (Bayar di Tempat)</p>
                                            <p className="text-sm">Siapkan uang pas saat kurir tiba.</p>
                                            {shippingMethod === 'expedition' && <p className="text-xs text-destructive">(Tidak tersedia untuk ekspedisi)</p>}
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

            </div>

             {/* Order Summary */}
            <div className="lg:col-span-1">
                 <Card className="sticky top-20">
                    <CardHeader>
                        <CardTitle>Ringkasan Pesanan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-md"/>
                                        <div>
                                            <p className="font-medium text-sm">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.finalPrice)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium">{formatCurrency(item.finalPrice * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                         <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal ({totalItems} item)</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Ongkos Kirim</span>
                                <span>{formatCurrency(shippingFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isProcessing ? "Memproses Pesanan..." : "Buat Pesanan"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  )
}
