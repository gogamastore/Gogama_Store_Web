
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, ArrowLeft, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface UserAddress {
    id: string;
    label: string;
    address: string;
    whatsapp: string;
}

export default function AddressPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', whatsapp: '' });

  const fetchAddresses = async () => {
    if (!user) return;
    setIsAddressLoading(true);
    const addressesQuery = collection(db, `user/${user.uid}/addresses`);
    const querySnapshot = await getDocs(addressesQuery);
    const userAddresses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserAddress));
    setAddresses(userAddresses);
    setIsAddressLoading(false);
  };
  
  useEffect(() => {
    if (!authLoading && user) {
      fetchAddresses();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);


  const handleAddressDialogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewAddress(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAddress = async () => {
      if (!user) return;
      if (!newAddress.label || !newAddress.address || !newAddress.whatsapp) {
          toast({ variant: 'destructive', title: 'Data alamat tidak lengkap' });
          return;
      }
      setIsSubmitting(true);
      try {
          await addDoc(collection(db, `user/${user.uid}/addresses`), newAddress);
          toast({ title: 'Alamat baru berhasil disimpan' });
          setIsAddressDialogOpen(false);
          setNewAddress({ label: '', address: '', whatsapp: '' });
          fetchAddresses();
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal menyimpan alamat' });
      } finally {
          setIsSubmitting(false);
      }
  }

  const handleDeleteAddress = async (addressId: string) => {
      if (!user) return;
      
      try {
          await deleteDoc(doc(db, `user/${user.uid}/addresses`, addressId));
          toast({ title: 'Alamat berhasil dihapus' });
          fetchAddresses();
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Gagal menghapus alamat' });
      }
  }

  if (authLoading) {
    return <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></div>;
  }
  if (!user) {
    router.replace('/login');
    return <div className="text-center p-8"><Loader2 className="mx-auto h-8 w-8 animate-spin"/></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-screen-lg">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali</span>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Alamat Saya</h1>
       </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
             <div>
                <CardTitle>Buku Alamat</CardTitle>
                 <CardDescription>
                    Kelola alamat pengiriman Anda untuk proses checkout yang lebih cepat.
                </CardDescription>
             </div>
             <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Tambah Alamat</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Alamat Baru</DialogTitle>
                        <DialogDescription>Simpan alamat untuk mempermudah proses checkout nanti.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="label">Label Alamat</Label>
                            <Input id="label" value={newAddress.label} onChange={handleAddressDialogInputChange} placeholder="Contoh: Rumah, Kantor, Toko"/>
                        </div>
                            <div className="space-y-1">
                            <Label htmlFor="address">Alamat Lengkap</Label>
                            <Textarea id="address" value={newAddress.address} onChange={handleAddressDialogInputChange} placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"/>
                        </div>
                            <div className="space-y-1">
                            <Label htmlFor="whatsapp">Nomor WhatsApp Penerima</Label>
                            <Input id="whatsapp" value={newAddress.whatsapp} onChange={handleAddressDialogInputChange} placeholder="Nomor telepon di alamat ini"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddressDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveAddress} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
        </CardHeader>
        <CardContent>
            {isAddressLoading ? (
                 <p>Memuat alamat...</p>
            ) : addresses.length > 0 ? (
                <div className="space-y-4">
                    {addresses.map(addr => (
                         <div key={addr.id} className="flex items-start justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                               <Home className="h-5 w-5 mt-1 text-muted-foreground"/>
                               <div>
                                    <p className="font-bold">{addr.label}</p>
                                    <p className="text-sm text-muted-foreground">{addr.address}</p>
                                    <p className="text-sm text-muted-foreground">Telp: {addr.whatsapp}</p>
                                </div>
                            </div>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini akan menghapus alamat <span className='font-bold'>{addr.label}</span> secara permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteAddress(addr.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Anda belum menambahkan alamat tersimpan.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
