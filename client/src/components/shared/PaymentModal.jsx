import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';

export default function PaymentModal({ isOpen, onClose, paymentDetails, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'failed'
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePayment = async () => {
    if (!paymentDetails) return;
    
    try {
      setLoading(true);
      setPaymentStatus('processing');

      // Create order on backend
      const { data } = await api.post('/payments/create-order', {
        amount: paymentDetails.amount,
        type: paymentDetails.type,
        studentId: paymentDetails.studentId,
        referenceId: paymentDetails.referenceId,
        gstPercent: paymentDetails.gstPercent || 18,
        description: paymentDetails.description || `Payment for ${paymentDetails.type}`,
      });

      // Open Razorpay modal
      if (window.Razorpay && scriptLoaded) {
        const options = {
          key: data.keyId,
          order_id: data.razorpayOrder.id,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          description: paymentDetails.description || `Payment for ${paymentDetails.type}`,
          customer_details: {
            name: paymentDetails.customerName || 'Customer',
            email: paymentDetails.customerEmail || '',
            contact: paymentDetails.customerPhone || '',
          },
          theme: {
            color: '#000000',
          },
          handler: async (response) => {
            try {
              // Verify payment
              const verifyRes = await api.post('/payments/verify', {
                razorpayOrderId: options.order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              setPaymentStatus('success');
              toast.success('Payment successful! ✓');
              
              setTimeout(() => {
                onSuccess?.(verifyRes.data.payment);
                onClose?.();
                setPaymentStatus(null);
              }, 2000);
            } catch (error) {
              setPaymentStatus('failed');
              toast.error(error.response?.data?.message || 'Payment verification failed');
              setTimeout(() => setPaymentStatus(null), 3000);
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              setPaymentStatus(null);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      setPaymentStatus('failed');
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      setTimeout(() => setPaymentStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA]">
              <h2 className="text-xl font-bold text-[#111111]">Payment</h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-[#666666] hover:text-[#111111] transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {paymentStatus === 'success' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <CheckCircle size={64} className="text-green-600" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-bold text-[#111111]">Payment Successful!</p>
                    <p className="text-sm text-[#666666] mt-2">
                      Your payment has been verified and processed.
                    </p>
                  </div>
                </motion.div>
              ) : paymentStatus === 'failed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-4"
                >
                  <AlertCircle size={64} className="text-red-600 mx-auto" />
                  <div>
                    <p className="text-lg font-bold text-[#111111]">Payment Failed</p>
                    <p className="text-sm text-[#666666] mt-2">
                      Please try again or contact support.
                    </p>
                  </div>
                </motion.div>
              ) : paymentStatus === 'processing' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Loader size={48} className="text-[#111111] mx-auto" />
                  </motion.div>
                  <p className="text-sm text-[#666666]">Processing your payment...</p>
                </motion.div>
              ) : (
                <>
                  {/* Payment Details */}
                  <div className="rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666]">Type</span>
                      <span className="font-semibold text-[#111111] capitalize">
                        {paymentDetails?.type?.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666666]">Amount</span>
                      <span className="font-semibold text-[#111111]">
                        ₹{paymentDetails?.amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {paymentDetails?.gstPercent > 0 && (
                      <>
                        <div className="border-t border-[#EAEAEA]"></div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#666666]">Subtotal</span>
                          <span className="text-[#111111]">
                            ₹{(paymentDetails?.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#666666]">GST ({paymentDetails?.gstPercent}%)</span>
                          <span className="text-[#111111]">
                            ₹{(paymentDetails?.amount * paymentDetails?.gstPercent / 100).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="border-t border-[#EAEAEA] pt-3 flex justify-between">
                      <span className="font-semibold text-[#111111]">Total</span>
                      <span className="text-lg font-bold text-black">
                        ₹{(paymentDetails?.amount * (1 + (paymentDetails?.gstPercent || 0) / 100)).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      You'll be redirected to Razorpay to complete the payment securely.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!paymentStatus && (
              <div className="border-t border-[#EAEAEA] p-6 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="btn-ghost flex-1 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading || !scriptLoaded}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : null}
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
