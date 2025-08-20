
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, deleteDoc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  'data-ai-hint'?: string;
  isPromo?: boolean;
  discountPrice?: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
  finalPrice: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const parseCurrency = (value: string): number => {
    return Number(String(value).replace(/[^0-9]/g, ''));
}


export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Subscribe to cart changes in Firestore
  useEffect(() => {
    if (user) {
      setLoading(true);
      const cartRef = collection(db, 'user', user.uid, 'cart');
      
      const unsubscribe = onSnapshot(cartRef, async (snapshot) => {
        const productPromises = snapshot.docs.map(async (cartDoc) => {
          const cartData = cartDoc.data();
          const productRef = doc(db, 'products', cartDoc.id);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data() as Omit<Product, 'id'>;
            
            // TODO: promo logic
            const finalPrice = parseCurrency(productData.price);

            return {
              ...productData,
              id: cartDoc.id,
              quantity: cartData.quantity,
              finalPrice: finalPrice
            } as CartItem;
          }
          return null;
        });

        const cartItems = (await Promise.all(productPromises)).filter(item => item !== null) as CartItem[];
        setCart(cartItems);
        setLoading(false);
      }, (error) => {
        console.error("Error listening to cart changes:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // If no user, clear the cart and stop loading
      setCart([]);
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Harap login terlebih dahulu' });
        return;
    }
    
    const cartRef = doc(db, 'user', user.uid, 'cart', product.id);
    
    try {
        const docSnap = await getDoc(cartRef);
        const newQuantity = docSnap.exists() ? docSnap.data().quantity + quantity : quantity;

        if (newQuantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok tidak mencukupi' });
            return;
        }

        await setDoc(cartRef, { quantity: newQuantity }, { merge: true });
        toast({ title: 'Produk ditambahkan ke keranjang' });

    } catch (error) {
        console.error("Error adding to cart:", error);
        toast({ variant: 'destructive', title: 'Gagal menambahkan ke keranjang' });
    }
  };

  const removeFromCart = async (productId: string) => {
     if (!user) return;
     const cartRef = doc(db, 'user', user.uid, 'cart', productId);
     try {
         await deleteDoc(cartRef);
     } catch (error) {
         console.error("Error removing from cart:", error);
         toast({ variant: 'destructive', title: 'Gagal menghapus dari keranjang' });
     }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }
    const cartRef = doc(db, 'user', user.uid, 'cart', productId);
    try {
        await setDoc(cartRef, { quantity: quantity }, { merge: true });
    } catch (error) {
        console.error("Error updating quantity:", error);
        toast({ variant: 'destructive', title: 'Gagal memperbarui jumlah' });
    }
  };
  
  const clearCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const cartRef = collection(db, 'user', user.uid, 'cart');
        const querySnapshot = await getDocs(cartRef);
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error clearing cart:", error);
        toast({ variant: 'destructive', title: 'Gagal mengosongkan keranjang' });
    } finally {
        setLoading(false);
    }
  }

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => total + (item.finalPrice * item.quantity), 0);
  
  const value = {
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems,
      totalAmount,
      loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
