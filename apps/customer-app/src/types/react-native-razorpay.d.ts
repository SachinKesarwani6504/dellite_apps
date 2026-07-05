declare module 'react-native-razorpay' {
  type RazorpayOptions = Record<string, unknown>;

  type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };

  type RazorpayCheckout = {
    open: (options: RazorpayOptions) => Promise<RazorpaySuccess>;
  };

  const RazorpayCheckout: RazorpayCheckout;
  export default RazorpayCheckout;
}
