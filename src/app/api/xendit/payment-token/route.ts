
import { NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const verificationToken = request.headers.get('x-callback-token');
        const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;

        if (verificationToken !== expectedToken) {
            console.warn("Invalid Xendit payment_token webhook verification token received.");
            return NextResponse.json({ message: 'Invalid verification token' }, { status: 401 });
        }

        const payload = await request.json();
        console.log("Xendit Payment Token Webhook Received:", payload);
        
        const { event, data } = payload;
        const orderId = data?.reference_id;

        if (!orderId) {
            console.log("Webhook received without a reference_id (orderId). Skipping.");
            return NextResponse.json({ message: 'Webhook processed, no orderId found.' });
        }
        
        const orderRef = doc(db, 'orders', orderId);

        if (event === 'payment_token.activation') {
             await updateDoc(orderRef, {
                paymentStatus: 'Paid',
                paidAt: serverTimestamp(),
            });
             console.log(`Order ${orderId} marked as PAID via payment_token activation.`);
        } else if (event === 'payment_token.failure' || event === 'payment_token.expiry') {
            await updateDoc(orderRef, {
                // Optionally handle failed/expired tokens, e.g., keep as unpaid.
                paymentStatus: 'Unpaid',
            });
             console.log(`Payment token for order ${orderId} failed or expired. Status: ${data.status}`);
        }

        return NextResponse.json({ message: 'Webhook processed successfully' });

    } catch (error: any) {
        console.error('Error processing Xendit payment_token webhook:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
