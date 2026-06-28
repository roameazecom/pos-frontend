import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function PrintReceipt() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    async function loadData() {
      try {
        const [orderRes, itemsRes, restRes] = await Promise.all([
          axios.get(`${API_URL}/orders`),
          axios.get(`${API_URL}/orders`), // helper, we will filter below
          axios.get(`${API_URL}/restaurant`)
        ]);

        const allOrders = orderRes.data;
        const currentOrder = allOrders.find(o => o.id === parseInt(orderId, 10));
        
        if (currentOrder) {
          setOrder(currentOrder);
          setItems(currentOrder.items || []);
        }
        setRestaurant(restRes.data);
      } catch (err) {
        console.error('Failed to load print receipt data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId, API_URL]);

  useEffect(() => {
    if (!loading && order) {
      // Trigger native browser print dialog
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, order]);

  if (loading) {
    return <div className="p-4 text-xs font-bold text-slate-500 text-center">Loading receipt preview...</div>;
  }

  if (!order) {
    return <div className="p-4 text-xs font-bold text-red-500 text-center">Order not found.</div>;
  }

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount_amount || 0);
  const tax = Number(order.tax_amount || 0);
  const total = subtotal - discount + tax;

  return (
    <div className="print-receipt-container font-mono text-[11px] leading-tight text-black max-w-[280px] mx-auto p-2 bg-white">
      {/* CSS print overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white;
            color: black;
            margin: 0;
            padding: 0;
            width: 80mm;
          }
          .no-print { display: none !important; }
          .print-receipt-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
        @page {
          size: auto;
          margin: 0mm;
        }
      `}} />

      {/* Header */}
      <div className="text-center space-y-1 mb-2">
        <h2 className="text-sm font-bold uppercase">{restaurant?.name || 'AppThat Restaurant'}</h2>
        {restaurant?.address && <p className="text-[10px]">{restaurant.address}</p>}
        {restaurant?.phone && <p className="text-[10px]">Phone: {restaurant.phone}</p>}
        {restaurant?.gst && <p className="text-[10px] font-bold">GSTIN: {restaurant.gst}</p>}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Meta details */}
      <div className="space-y-0.5 text-[10px] mb-2">
        <p><strong>BILL NO:</strong> #{order.id}</p>
        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString('en-IN')}</p>
        <p><strong>Type:</strong> {order.order_type ? order.order_type.replace('_', ' ').toUpperCase() : 'N/A'}</p>
        {order.table_number && <p><strong>Table:</strong> {order.table_number}</p>}
        {order.customer_name && <p><strong>Cust:</strong> {order.customer_name}</p>}
        {order.waiter_name && <p><strong>Served By:</strong> {order.waiter_name}</p>}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Items list */}
      <div className="space-y-1 mb-2">
        <div className="flex justify-between font-bold text-[10px] pb-0.5">
          <span className="w-[50%]">Item Description</span>
          <span className="w-[10%] text-center">Qty</span>
          <span className="w-[20%] text-right">Rate</span>
          <span className="w-[20%] text-right">Total</span>
        </div>
        <div className="border-b border-black my-0.5" />
        {items.map(item => {
          const itemDiscount = Number(item.discount_amount || 0);
          const rate = Number(item.price || 0);
          const qty = item.quantity;
          const itemTotal = (rate * qty) - itemDiscount;

          return (
            <div key={item.id} className="space-y-0.5">
              <div className="flex justify-between items-start">
                <span className="w-[50%] font-bold">{item.name}</span>
                <span className="w-[10%] text-center">{qty}</span>
                <span className="w-[20%] text-right">{rate.toFixed(0)}</span>
                <span className="w-[20%] text-right font-bold">{itemTotal.toFixed(0)}</span>
              </div>
              {itemDiscount > 0 && (
                <div className="text-[9px] text-right pr-1 italic text-slate-800">
                  (Item Disc: -₹{itemDiscount})
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Totals */}
      <div className="space-y-1 text-right text-[10px] mb-3">
        <div className="flex justify-between">
          <span className="ml-auto w-24 text-left">Subtotal:</span>
          <span className="font-bold">₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-red-700">
            <span className="ml-auto w-24 text-left">Discount:</span>
            <span className="font-bold">-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="ml-auto w-24 text-left">Tax ({restaurant?.tax_percent || 5}%):</span>
          <span className="font-bold">₹{tax.toFixed(2)}</span>
        </div>
        <div className="border-b border-black my-0.5" />
        <div className="flex justify-between text-xs font-bold">
          <span className="ml-auto w-24 text-left">Grand Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-[10px] space-y-0.5 mt-2">
        <p className="italic">Thank you! Please visit again.</p>
        <p className="text-[8px] text-slate-500">Powered by AppThat POS</p>
      </div>

      {/* Helper Print Button for manual click */}
      <div className="no-print mt-4 flex justify-center">
        <button
          onClick={() => window.print()}
          className="bg-black hover:bg-slate-850 text-white font-bold text-xs px-4 py-2 rounded-lg"
        >
          Print Manually
        </button>
      </div>
    </div>
  );
}
