declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      order_id: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      prefill?: { name?: string; email?: string };
      theme?: { color?: string };
    }) => { open: () => void };
  }
}

export {};
