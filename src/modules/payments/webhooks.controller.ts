import { Controller, Post, HttpCode, Res, Req, Headers, Logger, HttpStatus } from '@nestjs/common';
import express from 'express';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';

@Controller('webhook')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private readonly stripe: Stripe;

  constructor(private readonly ordersService: OrdersService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil', // Use a stable API version
    });
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: Request & { rawBody: Buffer },
    @Res() res: express.Response,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Stripe webhook received');
    
    let event: Stripe.Event;

    try {
      // Use the raw body stored by middleware
      const rawBody = req.rawBody;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).send('Webhook secret not configured');
      }

      if (!signature) {
        this.logger.error('Missing stripe-signature header');
        return res.status(400).send('Missing stripe-signature header');
      }

      if (!rawBody) {
        this.logger.error('Raw body not available for signature verification');
        return res.status(400).send('Raw body required for webhook verification');
      }

      // Verify webhook signature using raw body
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );

      this.logger.log(`✅ Webhook verified: ${event.type}`);
    } catch (err) {
      this.logger.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          this.logger.log(`Processing checkout.session.completed for order: ${session.client_reference_id}`);
          
          if (session.client_reference_id) {
            await this.ordersService.markAsPaid(session.client_reference_id);
            this.logger.log(`✅ Order ${session.client_reference_id} marked as paid`);
          } else {
            this.logger.warn('No client_reference_id found in checkout session');
          }
          break;

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          this.logger.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);
          
          if (paymentIntent.metadata?.orderId) {
            await this.ordersService.markAsPaid(paymentIntent.metadata.orderId);
            this.logger.log(`✅ Order ${paymentIntent.metadata.orderId} marked as paid`);
          } else {
            this.logger.warn('No orderId found in payment intent metadata');
          }
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      this.logger.error(`❌ Error processing webhook: ${error.message}`, error.stack);
      return res.status(500).send('Error processing webhook');
    }
  }
}
