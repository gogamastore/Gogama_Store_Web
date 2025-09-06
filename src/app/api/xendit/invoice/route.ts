import { xenditClient } from '@/lib/xendit';
import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const { Invoice } = xenditClient;
const invoiceSpecificOptions = {};
const invoiceClient = new Invoice(invoiceSpecificOptions);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, amount, customer, items } = body;

        if (!orderId || !amount) {
            return NextResponse.json({ message: 'Order ID and amount are required.' }, { status: 400 });
        }
        
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
             return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
        }
        
        const orderData = orderDoc.data();
        let invoice;

        // Check if an invoice was already created for this order
        if (orderData.xenditInvoiceId) {
            invoice = await invoiceClient.getInvoice({ invoiceID: orderData.xenditInvoiceId });
            // If the invoice is expired, create a new one.
             if (new Date(invoice.expiryDate) < new Date()) {
                  invoice = await createNewInvoice(orderId, amount, customer, items);
                  await updateDoc(orderRef, { xenditInvoiceId: invoice.id });
             }
        } else {
             invoice = await createNewInvoice(orderId, amount, customer, items);
             await updateDoc(orderRef, { xenditInvoiceId: invoice.id });
        }


        return NextResponse.json(invoice);

    } catch (error: any) {
        console.error("Xendit API Error:", error);
        return NextResponse.json({ message: error.message || 'An unknown error occurred' }, { status: 500 });
    }
}

async function createNewInvoice(orderId: string, amount: number, customer: any, items: any[]) {
    const { Invoice } = xenditClient;
    const invoiceClient = new Invoice({});
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
    
    const invoice = await invoiceClient.createInvoice({
        externalID: orderId,
        amount,
        currency: 'IDR',
        customer: {
            given_names: customer.given_names,
            email: customer.email,
            mobile_number: customer.mobile_number,
        },
        items: items,
        successRedirectURL: `${baseUrl}/reseller/orders?payment_success=true&order_id=${orderId}`,
        failureRedirectURL: `${baseUrl}/reseller/orders?payment_failed=true&order_id=${orderId}`,
        paymentMethods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'GOPAY', 'SHOPEEPAY', 'QRIS']
    });

    return invoice;
}

export async function GET(request: Request) {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
