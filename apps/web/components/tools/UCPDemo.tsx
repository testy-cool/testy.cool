"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/shadverse/components/card";
import { Badge } from "@repo/shadverse/components/badge";
import { Button } from "@repo/shadverse/components/button";

type Step = "idle" | "discovery" | "negotiation" | "checkout" | "payment" | "complete";

const MOCK_PROFILE = {
  ucp: {
    version: "2026-01-11",
    capabilities: ["checkout", "fulfillment", "discounts"],
  },
  payment: {
    handlers: ["gpay", "apple_pay", "tokenizer"],
  },
};

const MOCK_CHECKOUT = {
  session_id: "cs_" + Math.random().toString(36).slice(2, 10),
  status: "ready_for_complete",
  line_items: [{ title: "Classic Hoodie", price: 68.0, quantity: 1 }],
  totals: { subtotal: 68.0, shipping: 5.99, total: 73.99 },
};

export function UCPDemo() {
  const [step, setStep] = useState<Step>("idle");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const reset = () => {
    setStep("idle");
    setLog([]);
  };

  const runDemo = async () => {
    reset();

    // Step 1: Discovery
    setStep("discovery");
    addLog("GET nike.com/.well-known/ucp");
    await sleep(800);
    addLog("Found UCP profile! Capabilities: checkout, fulfillment, discounts");

    // Step 2: Negotiation
    setStep("negotiation");
    await sleep(600);
    addLog("Agent supports: checkout, fulfillment");
    addLog("Intersection: checkout, fulfillment");

    // Step 3: Checkout
    setStep("checkout");
    await sleep(500);
    addLog("POST /checkout-sessions { line_items: [...] }");
    await sleep(700);
    addLog(`Created session: ${MOCK_CHECKOUT.session_id}`);
    addLog("Session status: incomplete");

    // Step 4: Payment
    setStep("payment");
    await sleep(500);
    addLog("User selects Google Pay...");
    await sleep(600);
    addLog("POST /checkout-sessions/{id}/complete { payment: gpay_token }");
    await sleep(800);

    // Step 5: Complete
    setStep("complete");
    addLog("Order complete! Merchant confirms.");
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Try it: UCP Checkout Flow</span>
          <Badge variant="outline" className="font-mono text-xs">
            Simulated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Flow */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <StepBubble label="Discovery" active={step === "discovery"} done={stepIndex(step) > 0} />
          <Arrow />
          <StepBubble label="Negotiate" active={step === "negotiation"} done={stepIndex(step) > 1} />
          <Arrow />
          <StepBubble label="Checkout" active={step === "checkout"} done={stepIndex(step) > 2} />
          <Arrow />
          <StepBubble label="Payment" active={step === "payment"} done={stepIndex(step) > 3} />
          <Arrow />
          <StepBubble label="Done" active={step === "complete"} done={step === "complete"} />
        </div>

        {/* Current State */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: What's happening */}
          <div className="bg-muted/30 rounded-lg p-4 min-h-[200px]">
            <p className="text-xs text-muted-foreground mb-2 font-medium">What's happening</p>
            {step === "idle" && (
              <p className="text-sm text-muted-foreground">Click "Run Demo" to simulate an AI agent buying a hoodie via UCP.</p>
            )}
            {step === "discovery" && (
              <div className="space-y-2">
                <p className="text-sm">Agent checks if nike.com supports UCP...</p>
                <code className="block text-xs bg-background p-2 rounded font-mono">
                  GET https://nike.com/.well-known/ucp
                </code>
              </div>
            )}
            {step === "negotiation" && (
              <div className="space-y-2">
                <p className="text-sm">Nike supports checkout + fulfillment + discounts.</p>
                <p className="text-sm">Agent supports checkout + fulfillment.</p>
                <p className="text-sm font-medium text-green-500">Match: checkout, fulfillment</p>
              </div>
            )}
            {step === "checkout" && (
              <div className="space-y-2">
                <p className="text-sm">Agent creates a checkout session with the hoodie...</p>
                <pre className="text-xs bg-background p-2 rounded font-mono overflow-x-auto">
{`{
  "line_items": [{
    "title": "Classic Hoodie",
    "price": 68.00
  }]
}`}
                </pre>
              </div>
            )}
            {step === "payment" && (
              <div className="space-y-2">
                <p className="text-sm">User approves via Google Pay.</p>
                <p className="text-sm">Payment token sent to merchant (agent never sees card).</p>
              </div>
            )}
            {step === "complete" && (
              <div className="space-y-2 text-center py-4">
                <div className="text-4xl">🎉</div>
                <p className="text-sm font-medium">Order placed!</p>
                <p className="text-xs text-muted-foreground">
                  The whole thing happened via API. No browser redirect. No scraping.
                </p>
              </div>
            )}
          </div>

          {/* Right: Log */}
          <div className="bg-background border rounded-lg p-4 min-h-[200px]">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Request log</p>
            <div className="space-y-1 font-mono text-xs max-h-[160px] overflow-y-auto">
              {log.length === 0 && <p className="text-muted-foreground">Waiting...</p>}
              {log.map((l, i) => (
                <p key={i} className={l.includes("Error") ? "text-red-500" : "text-muted-foreground"}>
                  {l}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={runDemo} disabled={step !== "idle" && step !== "complete"}>
            {step === "complete" ? "Run Again" : "Run Demo"}
          </Button>
          {step !== "idle" && step !== "complete" && (
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StepBubble({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? "scale-110" : ""
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
          done
            ? "bg-green-500 border-green-500 text-white"
            : active
            ? "bg-primary border-primary text-primary-foreground animate-pulse"
            : "bg-muted border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        {done ? "✓" : active ? "..." : ""}
      </div>
      <span className={`text-[10px] ${active || done ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex-1 h-0.5 bg-muted-foreground/20 relative">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-muted-foreground/20" />
    </div>
  );
}

function stepIndex(step: Step): number {
  const order: Step[] = ["idle", "discovery", "negotiation", "checkout", "payment", "complete"];
  return order.indexOf(step);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
