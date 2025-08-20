
"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, query, where, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "@/components/product-card";
import { useToast } from "@/hooks/use-toast";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image: string;
  'data-ai-hint'?: string;
  stock: number;
  description?: string;
  isPromo?: boolean;
  discountPrice?: string;
}

interface BestSeller {
    productId: string;
    totalSold: number;
}

interface Promotion {
    productId: string;
    discountPrice: number;
    startDate: Timestamp;
    endDate: Timestamp;
}

const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}

export default function TrendingPage() {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const fetchBestSellingProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Step 1: Fetch aggregated data from best_sellers collection
            const bestSellersQuery = query(collection(db, "best_sellers"), orderBy("totalSold", "desc"), limit(100));
            const bestSellersSnapshot = await getDocs(bestSellersQuery);
            const bestSellerData = bestSellersSnapshot.docs.map(doc => doc.data() as BestSeller);

            if (bestSellerData.length === 0) {
                setAllProducts([]);
                setLoading(false);
                return;
            }

            const productIds = bestSellerData.map(item => item.productId);

            // Step 2: Fetch product details for the best-selling products
            // Firestore 'in' query is limited to 30 items per batch. We may need to chunk this.
            const productChunks = [];
            for (let i = 0; i < productIds.length; i += 30) {
                productChunks.push(productIds.slice(i, i + 30));
            }
            
            const productPromises = productChunks.map(chunk => 
                getDocs(query(collection(db, "products"), where("__name__", "in", chunk)))
            );
            const productSnapshots = await Promise.all(productPromises);
            
            const productsMap = new Map<string, Product>();
            productSnapshots.forEach(snapshot => {
                snapshot.forEach(doc => {
                    productsMap.set(doc.id, { 
                        id: doc.id, 
                        ...doc.data(),
                        stock: doc.data().stock || 0,
                        description: doc.data().description || ''
                    } as Product);
                });
            });

            // Step 3: Check for promotions
            const now = new Date();
            const promoQuery = query(collection(db, "promotions"), where("endDate", ">", now));
            const promoSnapshot = await getDocs(promoQuery);
            const activePromos = new Map<string, { discountPrice: number }>();
            promoSnapshot.forEach(doc => {
                const data = doc.data() as Promotion;
                 if (data.startDate.toDate() <= now) {
                    activePromos.set(data.productId, { discountPrice: data.discountPrice });
                 }
            });

            // Step 4: Combine all data
            const finalProducts = bestSellerData.map(item => {
                const product = productsMap.get(item.productId);
                if (!product) return null;

                if (activePromos.has(item.productId)) {
                    product.isPromo = true;
                    product.discountPrice = formatCurrency(activePromos.get(item.productId)!.discountPrice);
                }
                return product;
            }).filter(p => p !== null) as Product[];

            setAllProducts(finalProducts);

        } catch(error) {
            console.error("Failed to fetch best-selling products:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat produk",
            })
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchBestSellingProducts();
    }, [fetchBestSellingProducts]);

    const filteredProducts = useMemo(() => {
        let filtered = allProducts;
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (p.sku && String(p.sku).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return filtered;
    }, [allProducts, searchTerm]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredProducts.slice(startIndex, endIndex);
    }, [currentPage, itemsPerPage, filteredProducts]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
     useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <section className="w-full py-6 md:py-10">
            <div className="container max-w-screen-2xl">
                <h2 className="text-2xl font-bold font-headline mb-4 text-center">Produk Terlaris</h2>
                <div className="relative w-full md:max-w-lg mx-auto mb-6">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk terlaris..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                        {[...Array(10)].map((_, i) => (
                            <Card key={i} className="overflow-hidden group">
                                <div className="bg-muted aspect-square w-full animate-pulse"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse mt-4"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : paginatedProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                            {paginatedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                        <CardFooter className="mt-8">
                             <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                                <div className="flex-1">
                                    Menampilkan {paginatedProducts.length} dari {filteredProducts.length} produk.
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <p>Baris per halaman</p>
                                        <Select
                                            value={`${itemsPerPage}`}
                                            onValueChange={(value) => {
                                                setItemsPerPage(Number(value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-[70px]">
                                                <SelectValue placeholder={itemsPerPage} />
                                            </SelectTrigger>
                                            <SelectContent side="top">
                                                {[20, 50, 100].map((pageSize) => (
                                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                                        {pageSize}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>Halaman {currentPage} dari {totalPages}</div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardFooter>
                    </>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Tidak ada data produk terlaris saat ini. Coba lagi nanti.</p>
                    </div>
                )}
            </div>
        </section>
    )
}
