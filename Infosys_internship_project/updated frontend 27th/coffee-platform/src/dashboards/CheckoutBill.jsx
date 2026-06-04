import React, { useMemo, useState } from 'react';
import { formatINR, toINR } from '../utils/currency';
import './CheckoutBill.css';

const CheckoutBill = ({ cartItems, onBack, onProceed, exactPayment = false }) => {
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('none');

  const currentUserName = useMemo(() => localStorage.getItem('userName') || 'Guest', []);
  const isAdminVerified = currentUserName === 'admin';

  const normalizePrice = (price) => {
    const numericPrice = Number(price || 0);
    return numericPrice > 0 && numericPrice < 20 ? toINR(numericPrice) : numericPrice;
  };

  const totalBillAmount = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + (normalizePrice(item.price) * (item.quantity || item.qty || 1)),
        0
      ),
    [cartItems]
  );

  const originalBillAmount = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + (normalizePrice(item.originalPrice ?? item.price) * (item.quantity || item.qty || 1)),
        0
      ),
    [cartItems]
  );

  const seasonalOfferDiscount = Math.max(0, originalBillAmount - totalBillAmount);
  const discountPercent = 10;
  const discountAmount = exactPayment ? 0 : Math.round(totalBillAmount * (discountPercent / 100));
  const convenienceFee = exactPayment ? 0 : 8.48;
  const gstOnConvenienceFee = exactPayment ? 0 : 1.52;
  const totalBeforeTip = totalBillAmount - discountAmount + convenienceFee + gstOnConvenienceFee;
  const finalToPay = Math.ceil(totalBeforeTip + tip);
  const dineCashEarned = Math.round(finalToPay * 0.1);

  const handleSimulatedPayment = () => {
    setIsProcessing(true);
    setPaymentStep('modal');

    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentStep('none');
        onProceed({
          subtotal: totalBillAmount,
          discount: discountAmount,
          tax: convenienceFee + gstOnConvenienceFee,
          total: finalToPay,
          tip,
        });
      }, 2000);
    }, 2500);
  };

  return (
    <div className="checkout-bill-container">
      {isProcessing && (
        <div className="razorpay-simulation-overlay">
          {paymentStep === 'modal' ? (
            <div className="razorpay-dummy-modal">
              <div className="razorpay-modal-header">
                <div className="rzp-logo">Razorpay</div>
                <div className="rzp-amount">{formatINR(finalToPay)}</div>
              </div>
              <div className="rzp-modal-body">
                <div className="rzp-loader"></div>
                <p>Securing your payment...</p>
                <div className="rzp-dummy-user">
                  <span>Paying as:</span>
                  <strong>{currentUserName}</strong>
                  {isAdminVerified && <span className="admin-verified-badge">Admin Verified</span>}
                </div>
              </div>
              <div className="rzp-modal-footer">
                <small>Test Mode - No real money will be charged</small>
              </div>
            </div>
          ) : (
            <div className="payment-success-modal">
              <div className="success-icon-check">+</div>
              <h3>Payment Successful</h3>
              <p>Transaction ID: pay_dummy_{Math.floor(Math.random() * 1000000)}</p>
              <div className="success-amount">{formatINR(finalToPay)}</div>
            </div>
          )}
        </div>
      )}

      <div className="bill-header">
        <button className="bill-back-btn" onClick={onBack}>x</button>
        <div className="bill-title">Your bill</div>
        <div className="original-total">{formatINR(originalBillAmount)}</div>
        <div className="discounted-total">{formatINR(finalToPay)}</div>

        <div className="savings-banner">
          <span className="emoji">Saving</span>
          <span>Woah! you're saving {formatINR(seasonalOfferDiscount + discountAmount)}</span>
        </div>
      </div>

      <div className="bill-content">
        <div className="dine-cash-card">
          <div className="dine-cash-info">
            <span className="dine-cash-icon">*</span>
            <span>You will earn 10% DineCash</span>
          </div>
          <div className="dine-cash-amount">{formatINR(dineCashEarned)}</div>
        </div>

        <div className="section-label">Additional Offers</div>
        <div className="offers-card">
          <div className="offer-item">
            <div className="offer-main">
              <div className="offer-title">Applied offers</div>
              <div className="bank-offer">
                <img src="https://img.icons8.com/color/48/000000/hdfc-bank.png" alt="HDFC" className="bank-logo" />
                <span>Up to 10% off with HDFC Bank Credit Cards</span>
              </div>
              {seasonalOfferDiscount > 0 && (
                <div className="bank-offer">
                  <span>Seasonal menu offers applied: {formatINR(seasonalOfferDiscount)}</span>
                </div>
              )}
            </div>
            <span className="arrow">{">"}</span>
          </div>
        </div>

        <div className="section-label">Bill Details</div>
        <div className="bill-details-card">
          <div className="detail-row">
            <span>Total bill amount</span>
            <span>{formatINR(originalBillAmount)}</span>
          </div>
          {seasonalOfferDiscount > 0 && (
            <div className="detail-row discount">
              <span>Seasonal offer discount</span>
              <span>-{formatINR(seasonalOfferDiscount)}</span>
            </div>
          )}
          <div className="detail-row">
            <span>After seasonal offers</span>
            <span>{formatINR(totalBillAmount)}</span>
          </div>
          <div className="detail-row discount">
            <span>{discountPercent}% Regular discount</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
          <div className="detail-row dashed">
            <span className="dashed-underline">Convenience fee</span>
            <span>{formatINR(convenienceFee)}</span>
          </div>
          <div className="detail-row">
            <span>GST on convenience fee</span>
            <span>{formatINR(gstOnConvenienceFee)}</span>
          </div>
          <div className="detail-row tip">
            <div className="add-tip">
              <span className="plus-icon">+</span>
              <span>Add Tip</span>
            </div>
            <span>{formatINR(tip)}</span>
          </div>
          <div className="total-row">
            <span>To Pay <small>(Rounded off)</small></span>
            <span>{formatINR(finalToPay)}</span>
          </div>
        </div>
      </div>

      <div className="bill-footer">
        <button className="proceed-pay-btn" onClick={handleSimulatedPayment}>
          Proceed to Pay {formatINR(finalToPay)}
        </button>
      </div>
    </div>
  );
};

export default CheckoutBill;
