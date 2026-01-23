"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/shadverse/components/card";
import { Badge } from "@repo/shadverse/components/badge";
import { Button } from "@repo/shadverse/components/button";
import Script from "next/script";

// Mock data
const MOCK_PRODUCT = {
  name: "Classic Hoodie",
  store: "nike.com",
  price: 68.0,
  originalPrice: 85.0,
};

type CheckoutState = "idle" | "processing" | "complete";

export function UCPDemo() {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [orderInfo, setOrderInfo] = useState<{
    address?: string;
    card?: string;
    orderId?: string;
  }>({});
  const gpayContainerRef = useRef<HTMLDivElement>(null);
  const [gpayReady, setGpayReady] = useState(false);

  // Initialize Google Pay when script loads
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google?.payments?.api) {
      initGooglePay();
    }
  }, [gpayReady]);

  const initGooglePay = () => {
    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: "TEST",
    });

    paymentsClient
      .isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"],
            },
          },
        ],
      })
      .then((response: any) => {
        if (response.result && gpayContainerRef.current) {
          const button = paymentsClient.createButton({
            onClick: () => processPayment(paymentsClient),
            buttonColor: "black",
            buttonType: "buy",
            buttonSizeMode: "fill",
          });
          gpayContainerRef.current.innerHTML = "";
          gpayContainerRef.current.appendChild(button);
        }
      })
      .catch(console.error);
  };

  const processPayment = async (paymentsClient: any) => {
    setCheckoutState("processing");

    try {
      const paymentData = await paymentsClient.loadPaymentData({
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: {
          merchantId: "16708973830884969730",
          merchantName: "UCP Demo Store",
        },
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"],
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: { gateway: "example", gatewayMerchantId: "exampleMerchantId" },
            },
          },
        ],
        transactionInfo: {
          totalPrice: MOCK_PRODUCT.price.toFixed(2),
          totalPriceStatus: "FINAL",
          currencyCode: "USD",
        },
        shippingAddressRequired: true,
        shippingAddressParameters: {
          allowedCountryCodes: ["US", "CA", "GB", "AU"],
          phoneNumberRequired: true,
        },
        emailRequired: true,
      });

      const address = paymentData.shippingAddress || {};
      const cardInfo = paymentData.paymentMethodData?.info || {};

      setOrderInfo({
        address: `${address.locality || "City"}, ${address.administrativeArea || "ST"}`,
        card: `${cardInfo.cardNetwork || "CARD"} ••••${cardInfo.cardDetails || "0000"}`,
        orderId: "UCP-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      });

      setTimeout(() => setCheckoutState("complete"), 1500);
    } catch (err: any) {
      if (err.statusCode !== "CANCELED") {
        console.error(err);
      }
      setCheckoutState("idle");
    }
  };

  const reset = () => {
    setCheckoutState("idle");
    setOrderInfo({});
  };

  return (
    <>
      <Script
        src="https://pay.google.com/gp/p/js/pay.js"
        onLoad={() => setGpayReady(true)}
        strategy="lazyOnload"
      />

      <Card className="my-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>UCP Checkout Flow</span>
            <Badge variant="outline" className="font-mono text-xs">
              Live Demo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Step 1: Discovery */}
          <div className="flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="w-0.5 flex-1 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-2">
              <h4 className="font-semibold mb-2">Discovery</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Platform checks if the merchant supports UCP by hitting their well-known endpoint.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                <span className="text-green-500">GET</span> https://nike.com/.well-known/ucp
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Returns: capabilities, payment handlers, API endpoints
              </div>
            </div>
          </div>

          {/* Step 2: Capability Negotiation */}
          <div className="flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="w-0.5 flex-1 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-2">
              <h4 className="font-semibold mb-2">Capability Negotiation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Platform and merchant agree on which capabilities to use.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Merchant supports</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">checkout</Badge>
                    <Badge variant="secondary" className="text-xs">fulfillment</Badge>
                    <Badge variant="secondary" className="text-xs">discounts</Badge>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Platform supports</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">checkout</Badge>
                    <Badge variant="secondary" className="text-xs">fulfillment</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-green-500 font-medium">
                ✓ Match: checkout, fulfillment
              </div>
            </div>
          </div>

          {/* Step 3: Create Checkout Session */}
          <div className="flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="w-0.5 flex-1 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-2">
              <h4 className="font-semibold mb-2">Create Checkout Session</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Platform creates a checkout session with the items.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <div><span className="text-blue-500">POST</span> /api/ucp/checkout-sessions</div>
                <pre className="mt-2 text-muted-foreground">{`{
  "line_items": [{
    "title": "${MOCK_PRODUCT.name}",
    "price": ${MOCK_PRODUCT.price}
  }]
}`}</pre>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Returns: session_id, totals, shipping options
              </div>
            </div>
          </div>

          {/* Step 4: Payment */}
          <div className="flex gap-4 pb-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div className="w-0.5 flex-1 bg-border mt-2" />
            </div>
            <div className="flex-1 pb-2">
              <h4 className="font-semibold mb-2">Payment via Payment Handler</h4>
              <p className="text-sm text-muted-foreground mb-3">
                User approves payment. Platform gets a token (never raw card data), sends it to merchant.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                  <div className="text-sm">
                    <span className="font-medium">Google Pay provides address + payment token</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Platform never sees your card number. Token goes to merchant → PSP → charged.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                <div><span className="text-blue-500">POST</span> /checkout-sessions/&#123;id&#125;/complete</div>
                <pre className="mt-2 text-muted-foreground">{`{ "payment": { "handler": "gpay", "token": "..." } }`}</pre>
              </div>
            </div>
          </div>

          {/* Step 5: Complete */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                5
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Order Complete</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Merchant confirms. User gets order confirmation. No redirect, no browser automation.
              </p>
            </div>
          </div>

          {/* Live Demo Section */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Try it: Real Google Pay Flow
            </h4>

            {checkoutState === "idle" && (
              <div className="bg-muted/30 rounded-xl p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl">
                    👕
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{MOCK_PRODUCT.store}</p>
                    <p className="font-medium">{MOCK_PRODUCT.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold">${MOCK_PRODUCT.price.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        ${MOCK_PRODUCT.originalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div ref={gpayContainerRef} className="h-12 mb-3">
                  {!gpayReady && (
                    <div className="h-full bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                      Loading Google Pay...
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This triggers the real Google Pay flow. Use test mode - no actual charge.
                </p>
              </div>
            )}

            {checkoutState === "processing" && (
              <div className="bg-muted/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-medium">Processing with UCP...</p>
                <p className="text-sm text-muted-foreground">Sending payment token to merchant</p>
              </div>
            )}

            {checkoutState === "complete" && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-green-500">Order Complete!</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono">{orderInfo.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping to</span>
                    <span>{orderInfo.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid with</span>
                    <span>{orderInfo.card}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center mb-4">
                  The whole flow happened via API. No redirect. No scraping.
                </p>

                <Button onClick={reset} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
