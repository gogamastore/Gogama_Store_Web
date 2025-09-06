import { NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const verificationToken = request.headers.get('x-callback-token');
        const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;

        if (verificationToken !== expectedToken) {
            console.warn("Invalid Xendit webhook verification token received.");
            return NextResponse.json({ message: 'Invalid verification token' }, { status: 401 });
        }

        const payload = await request.json();
        console.log("Xendit Webhook Received:", payload);

        const { external_id: orderId, status } = payload;

        if (orderId && status === 'PAID') {
            const orderRef = doc(db, 'orders', orderId);
            
            await updateDoc(orderRef, {
                paymentStatus: 'Paid',
                paymentProofUrl: payload.payment_link || payload.invoice_url, // Use invoice URL as proof
                paidAt: serverTimestamp(), // Record when it was paid
            });

            console.log(`Order ${orderId} successfully marked as PAID.`);
        } else if (orderId && (status === 'EXPIRED' || status === 'FAILED')) {
             const orderRef = doc(db, 'orders', orderId);
            
            await updateDoc(orderRef, {
                status: 'Cancelled', // Optionally cancel the order on failure/expiry
                paymentStatus: 'Unpaid',
            });
            console.log(`Payment for order ${orderId} failed or expired. Status: ${status}`);
        }

        return NextResponse.json({ message: 'Webhook processed successfully' });

    } catch (error: any) {
        console.error('Error processing Xendit webhook:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
