import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// Resolve API base URL — works on any device on same network
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

export default function PrintReceipt() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState(null);

  // Fetch order directly from backend — no localStorage, no Zustand needed
  useEffect(() => {
    axios.get(`${API_URL}/orders/${orderId}`)
      .then(res => setOrder(res.data))
      .catch(() => {
        setError('Order not found or server unreachable.');
      });
  }, [orderId]);

  // Fetch restaurant details directly from backend
  useEffect(() => {
    axios.get(`${API_URL}/restaurant`)
      .then(res => setRestaurant(res.data))
      .catch(() => {});
  }, []);

  // Auto-print once order data is loaded
  useEffect(() => {
    if (order) {
      setTimeout(() => {
        window.print();
      }, 600);
    }
  }, [order]);

  if (error) {
    return (
      <div style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px', color: '#000' }}>
        <p><strong>Error:</strong> {error}</p>
        <p>Order ID: #{orderId}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ fontFamily: 'monospace', fontSize: '12px', padding: '8px', color: '#000', textAlign: 'center' }}>
        Loading receipt...
      </div>
    );
  }

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount_amount || 0);
  const tax = Number(order.tax_amount || 0);
  const total = Number(order.total_amount || (subtotal - discount + tax));

  const S = {
    // Page wrapper — exactly 80mm, pure white background
    page: {
      width: '72mm',
      margin: '0 auto',
      padding: '4mm 2mm',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#000',
      background: '#fff',
    },
    center: { textAlign: 'center' },
    bold: { fontWeight: 'bold' },
    dash: { borderTop: '1px dashed #000', margin: '4px 0' },
    solid: { borderTop: '1px solid #000', margin: '4px 0' },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: '1px' },
    colName: { width: '50%', fontWeight: 'bold', wordBreak: 'break-word' },
    colQty: { width: '10%', textAlign: 'center' },
    colRate: { width: '20%', textAlign: 'right' },
    colAmt: { width: '20%', textAlign: 'right', fontWeight: 'bold' },
    small: { fontSize: '9px' },
    labelRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: '1px' },
    label: { width: '90px', textAlign: 'left' },
    noprint: { marginTop: '12px', textAlign: 'center' },
  };

  return (
    <>
      {/* 80mm Epson TM-T88IV print CSS */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }
        body {
          margin: 0;
          padding: 0;
          background: #fff;
        }
      `}</style>

      <div style={S.page}>
        {/* Header */}
        <div style={S.center}>
          <div style={{ ...S.bold, fontSize: '13px', letterSpacing: '1px', marginBottom: '2px' }}>
            {restaurant?.name || 'AppThat Restaurant'}
          </div>
          {restaurant?.address && <div style={S.small}>{restaurant.address}</div>}
          {restaurant?.phone && <div style={S.small}>Ph: {restaurant.phone}</div>}
          {restaurant?.gst && <div style={{ ...S.small, ...S.bold }}>GSTIN: {restaurant.gst}</div>}
        </div>

        <div style={S.dash} />

        {/* Bill Meta */}
        <div style={{ fontSize: '10px', marginBottom: '4px' }}>
          <div style={S.row}><span style={S.bold}>BILL NO:</span><span>#{order.id}</span></div>
          <div style={S.row}><span style={S.bold}>Date:</span><span>{new Date(order.created_at).toLocaleString('en-IN')}</span></div>
          <div style={S.row}><span style={S.bold}>Type:</span><span>{(order.order_type || 'dine_in').replace('_', ' ').toUpperCase()}</span></div>
          {order.table_number && <div style={S.row}><span style={S.bold}>Table:</span><span>{order.table_number}</span></div>}
          {order.customer_name && <div style={S.row}><span style={S.bold}>Cust:</span><span>{order.customer_name}</span></div>}
          {order.waiter_name && <div style={S.row}><span style={S.bold}>Served By:</span><span>{order.waiter_name}</span></div>}
        </div>

        <div style={S.dash} />

        {/* Items Header */}
        <div style={{ ...S.row, ...S.bold, fontSize: '10px', marginBottom: '2px' }}>
          <span style={S.colName}>Item</span>
          <span style={S.colQty}>Qty</span>
          <span style={S.colRate}>Rate</span>
          <span style={S.colAmt}>Amt</span>
        </div>
        <div style={S.solid} />

        {/* Items */}
        {(order.items || []).map(item => {
          const rate = Number(item.price || 0);
          const qty = Number(item.quantity || 1);
          const itemDiscount = Number(item.discount_amount || 0);
          const amt = (rate * qty) - itemDiscount;
          return (
            <div key={item.id} style={{ marginBottom: '3px' }}>
              <div style={S.row}>
                <span style={S.colName}>{item.name}</span>
                <span style={S.colQty}>{qty}</span>
                <span style={S.colRate}>{rate.toFixed(0)}</span>
                <span style={S.colAmt}>{amt.toFixed(0)}</span>
              </div>
              {itemDiscount > 0 && (
                <div style={{ textAlign: 'right', fontSize: '9px', fontStyle: 'italic' }}>
                  (Item disc: -₹{itemDiscount.toFixed(2)})
                </div>
              )}
            </div>
          );
        })}

        <div style={S.dash} />

        {/* Totals */}
        <div style={{ fontSize: '10px' }}>
          <div style={S.labelRow}>
            <span style={S.label}>Subtotal:</span>
            <span style={S.bold}>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={S.labelRow}>
              <span style={S.label}>Discount:</span>
              <span style={S.bold}>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div style={S.labelRow}>
            <span style={S.label}>Tax ({restaurant?.tax_percent || 5}%):</span>
            <span style={S.bold}>₹{tax.toFixed(2)}</span>
          </div>
          <div style={S.solid} />
          <div style={{ ...S.labelRow, fontSize: '12px', fontWeight: 'bold' }}>
            <span style={{ ...S.label, fontWeight: 'bold' }}>GRAND TOTAL:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div style={S.dash} />

        {/* Footer */}
        <div style={{ ...S.center, fontSize: '10px', marginTop: '4px' }}>
          <div style={{ fontStyle: 'italic' }}>Thank you! Please visit again.</div>
          <div style={{ fontSize: '8px', marginTop: '2px' }}>Powered by AppThat POS</div>
        </div>

        {/* Manual print button — hidden on print */}
        <div className="no-print" style={S.noprint}>
          <button
            onClick={() => window.print()}
            style={{
              background: '#000', color: '#fff', border: 'none',
              padding: '6px 16px', borderRadius: '6px',
              fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
            }}
          >
            🖨 Print Receipt
          </button>
        </div>
      </div>
    </>
  );
}
