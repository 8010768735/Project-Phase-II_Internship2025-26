import React from 'react';
import { formatINR } from '../utils/currency';
import './OrderReceipt.css';

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const pdfCurrency = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const truncatePdfText = (value, max = 44) => {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
};

export const downloadReceiptPdf = (details) => {
  const {
    orderId,
    date,
    items,
    subtotal,
    discount,
    tax,
    total,
    cafeName,
  } = details;

  const itemLines = items.map((item) => {
    const itemLabel = `${item.name}${item.qty > 1 ? ` x${item.qty}` : ''}`;
    return `${truncatePdfText(itemLabel, 34)}  ${pdfCurrency(item.price * (item.qty || 1))}`;
  });

  const receiptLines = [
    { text: cafeName || 'Cafe Receipt', x: 50, y: 790, size: 18, font: 'F2' },
    { text: 'PAYMENT RECEIPT', x: 50, y: 766, size: 11, font: 'F1' },
    { text: '----------------------------------------------', x: 50, y: 748, size: 10, font: 'F1' },
    { text: `Order ID : ${orderId}`, x: 50, y: 728, size: 11, font: 'F1' },
    { text: `Date     : ${date}`, x: 50, y: 710, size: 11, font: 'F1' },
    { text: 'Status   : Payment Successful', x: 50, y: 692, size: 11, font: 'F1' },
    { text: '----------------------------------------------', x: 50, y: 674, size: 10, font: 'F1' },
    { text: 'Items', x: 50, y: 652, size: 12, font: 'F2' },
  ];

  let itemY = 632;
  itemLines.forEach((line) => {
    receiptLines.push({ text: line, x: 50, y: itemY, size: 11, font: 'F1' });
    itemY -= 18;
  });

  receiptLines.push(
    { text: '----------------------------------------------', x: 50, y: itemY - 4, size: 10, font: 'F1' },
    { text: `Subtotal      ${pdfCurrency(subtotal)}`, x: 50, y: itemY - 24, size: 11, font: 'F1' },
    { text: `Discount      ${pdfCurrency(discount)}`, x: 50, y: itemY - 42, size: 11, font: 'F1' },
    { text: `GST & Charges ${pdfCurrency(tax)}`, x: 50, y: itemY - 60, size: 11, font: 'F1' },
    { text: '----------------------------------------------', x: 50, y: itemY - 78, size: 10, font: 'F1' },
    { text: `Grand Total   ${pdfCurrency(total)}`, x: 50, y: itemY - 98, size: 13, font: 'F2' },
    { text: '----------------------------------------------', x: 50, y: itemY - 116, size: 10, font: 'F1' },
    { text: 'Thank you for your order!', x: 50, y: itemY - 140, size: 11, font: 'F1' },
    { text: 'Visit again.', x: 50, y: itemY - 158, size: 11, font: 'F1' }
  );

  const textStream = receiptLines
    .map((line) => `BT /${line.font} ${line.size} Tf ${line.x} ${line.y} Td (${escapePdfText(line.text)}) Tj ET`)
    .join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj',
    `6 0 obj\n<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });

  const startXref = pdf.length;
  pdf += `xref\n0 ${offsets.length}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${orderId || 'receipt'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

const OrderReceipt = ({ orderDetails, onClose }) => {
  const { 
    orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    date = new Date().toLocaleString(),
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    cafeName = 'Modern Cafe',
    paymentMethod = 'Razorpay',
    paymentStatus = 'Paid',
  } = orderDetails;

  return (
    <div className="receipt-overlay">
      <div className="receipt-container">
        <div className="receipt-paper">
          <div className="receipt-header">
            <div className="receipt-kicker">Payment Receipt</div>
            <div className="cafe-brand">{cafeName}</div>
            <div className="receipt-status">{paymentStatus === 'Paid' ? 'Payment Successful' : paymentStatus}</div>
          </div>

          <div className="receipt-meta-grid">
            <div className="receipt-meta-card">
              <span>Order ID</span>
              <strong>{orderId}</strong>
            </div>
            <div className="receipt-meta-card">
              <span>Payment Method</span>
              <strong>{paymentMethod}</strong>
            </div>
            <div className="receipt-meta-card">
              <span>Date</span>
              <strong>{date}</strong>
            </div>
            <div className="receipt-meta-card">
              <span>Total Paid</span>
              <strong>{formatINR(total)}</strong>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-items">
            <div className="receipt-section-title">Items Ordered</div>
            {items.map((item, index) => (
              <div key={index} className="receipt-item-row">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  {item.qty > 1 && <span className="item-qty">x{item.qty}</span>}
                </div>
                <div className="item-price">{formatINR(item.price * (item.qty || 1))}</div>
              </div>
            ))}
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-summary">
            <div className="receipt-section-title">Payment Breakdown</div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>Discount Applied</span>
                <span>- {formatINR(discount)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>GST & Charges</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="receipt-total-row">
              <span>Grand Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <div className="receipt-footer">
            <div className="thank-you">Thank you for your order!</div>
            <div className="footer-note">A copy of this receipt has been sent to your email.</div>
            <div className="receipt-qr">
              {/* Dummy QR placeholder */}
              <div className="qr-box"></div>
            </div>
          </div>
        </div>
        
        <button className="receipt-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

export default OrderReceipt;
