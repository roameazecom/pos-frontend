import { useState } from 'react';
import { Eye, Printer, Edit2, DownloadCloud, FileText } from 'lucide-react';
import { usePosStore } from '../../../store/posStore';
import OrderDetailsModal from './OrderDetailsModal';

export default function OrderDataTable() {
  const { orderHistory, orders } = usePosStore();
  const allOrders = [...(orders || []).filter(o => o.status === 'open'), ...(orderHistory || [])];
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  
  // Search States
  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterCustomerPhone, setFilterCustomerPhone] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOrderType, setFilterOrderType] = useState('All');
  const [filterPaymentType, setFilterPaymentType] = useState('All');
  const [filterOrderStatus, setFilterOrderStatus] = useState('All');
  const [filterGrandTotalOp, setFilterGrandTotalOp] = useState('=');
  const [filterGrandTotalVal, setFilterGrandTotalVal] = useState('');

  // Filtered Data
  const filteredOrders = allOrders.filter(order => {
    if (filterOrderId && !order.id.toString().includes(filterOrderId)) return false;
    if (filterCustomerName && order.customer_name && !order.customer_name.toLowerCase().includes(filterCustomerName.toLowerCase())) return false;
    if (filterCustomerPhone && order.customer_phone && !order.customer_phone.includes(filterCustomerPhone)) return false;
    
    if (filterStartDate) {
      const orderDate = new Date(order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30');
      if (orderDate < new Date(filterStartDate)) return false;
    }
    if (filterEndDate) {
      const orderDate = new Date(order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30');
      if (orderDate > new Date(filterEndDate)) return false;
    }
    
    if (filterOrderType !== 'All') {
       if (filterOrderType === 'Dine In' && order.order_type !== 'dine_in') return false;
       if (filterOrderType === 'Delivery' && order.order_type !== 'delivery') return false;
       if (filterOrderType === 'Takeaway' && order.order_type !== 'takeaway') return false;
    }
    
    if (filterPaymentType !== 'All' && order.payment_type !== filterPaymentType) return false;
    if (filterOrderStatus !== 'All' && order.status !== filterOrderStatus.toLowerCase()) return false;
    
    if (filterGrandTotalVal) {
      const total = (order.subtotal || 0) + (order.tax_amount || 0);
      const val = parseFloat(filterGrandTotalVal);
      if (!isNaN(val)) {
         if (filterGrandTotalOp === '=' && total !== val) return false;
         if (filterGrandTotalOp === '>' && total <= val) return false;
         if (filterGrandTotalOp === '<' && total >= val) return false;
      }
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilterOrderId('');
    setFilterCustomerName('');
    setFilterCustomerPhone('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterOrderType('All');
    setFilterPaymentType('All');
    setFilterOrderStatus('All');
    setFilterGrandTotalOp('=');
    setFilterGrandTotalVal('');
  };

  const handlePrint = (id) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/invoice/${id}`, '_blank');
  };

  const handleBulkInvoice = () => {
    selectedRowIds.forEach(id => handlePrint(id));
  };

  const handleExport = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/excel`, '_blank');
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleRowSelect = (id) => {
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const formatOrderDate = (dateStr) => {
    if (!dateStr) return '';
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + '+05:30';
    return new Date(isoStr).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  };

  const totalFilteredAmount = filteredOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0).toFixed(2);
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-900 rounded-xl shadow-sm border border-surface-700 overflow-hidden">
      {/* Header Tools */}
      <div className="p-4 border-b border-surface-700 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2 bg-blue-500/20 text-blue-600 px-3 py-2 rounded-md font-medium text-sm border border-blue-100">
          <TrendingUpIcon /> <span>Last 15 Days Orders (View Chart)</span>
        </div>
        
        <div className="flex space-x-2">
           <button onClick={handleBulkInvoice} disabled={selectedRowIds.length === 0} className="px-4 py-2 text-rose-500 font-medium text-sm border border-rose-500 rounded hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed">Generate Invoice</button>
           <div className="px-4 py-2 font-bold text-slate-700 text-sm border border-surface-700 rounded">
             Grand Total : <span className="text-rose-500">₹ {totalFilteredAmount}</span>
           </div>
           <select className="px-3 py-2 border border-slate-300 rounded text-sm bg-surface-900">
             <option>Action</option>
           </select>
           <button onClick={handleExport} className="flex items-center px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-surface-900">
             <DownloadCloud className="w-4 h-4 mr-2" /> Export Excel
           </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="p-4 border-b border-surface-700 bg-surface-900 space-y-4">
        <div className="text-sm font-bold flex flex-col">
           <label className="text-surface-300 mb-1 flex items-center">
             <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Search
           </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">Start Date</label>
            <input type="datetime-local" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">End Date</label>
            <input type="datetime-local" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">Order ID</label>
            <input type="text" value={filterOrderId} onChange={e => setFilterOrderId(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Customer Name</label>
            <input type="text" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Customer Phone</label>
            <input type="text" value={filterCustomerPhone} onChange={e => setFilterCustomerPhone(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">All Order Type</label>
             <select value={filterOrderType} onChange={e => setFilterOrderType(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm">
               <option value="All">All</option>
               <option value="Dine In">Dine In</option>
               <option value="Delivery">Delivery</option>
               <option value="Takeaway">Takeaway</option>
             </select>
          </div>
          
          {/* Row 2 */}
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">All Payment Type</label>
             <select value={filterPaymentType} onChange={e => setFilterPaymentType(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm">
               <option value="All">All</option>
               <option value="Cash">Cash</option>
               <option value="UPI">UPI</option>
               <option value="Card">Card</option>
             </select>
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Order Status</label>
             <select value={filterOrderStatus} onChange={e => setFilterOrderStatus(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm">
               <option value="All">All</option>
               <option value="Paid">Paid</option>
               <option value="Cancelled">Cancelled</option>
             </select>
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Other Status</label>
             <select className="w-full border border-slate-300 rounded p-1.5 text-sm"><option value="All">All</option></select>
          </div>
          <div className="flex space-x-2">
            <div className="w-1/3">
              <label className="text-xs font-semibold text-transparent mb-1 block">-</label>
               <select value={filterGrandTotalOp} onChange={e => setFilterGrandTotalOp(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm">
                 <option value="=">=</option>
                 <option value=">">&gt;</option>
                 <option value="<">&lt;</option>
               </select>
            </div>
            <div className="w-2/3">
              <label className="text-xs font-semibold text-surface-300 mb-1 block">Grand Total</label>
              <input type="number" value={filterGrandTotalVal} onChange={e => setFilterGrandTotalVal(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
            </div>
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">GSTIN</label>
             <select className="w-full border border-slate-300 rounded p-1.5 text-sm"><option>All</option></select>
          </div>
          <div className="flex items-end space-x-2">
             <button onClick={clearFilters} className="bg-surface-900 border border-slate-300 text-slate-700 font-medium text-sm px-4 py-1.5 rounded hover:bg-surface-900 flex-1">Clear Filters</button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 border-t border-surface-700 pt-3">
          <div className="text-xs text-surface-400">
            Found {filteredOrders.length} records.
          </div>
           <button onClick={clearFilters} className="bg-surface-900 border border-slate-300 text-slate-700 font-medium text-xs px-3 py-1 rounded hover:bg-surface-900">Clear All</button>
        </div>
      </div>

      {/* Table Data */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-surface-900 text-surface-300 sticky top-0 border-b border-surface-700 shadow-sm z-10">
            <tr>
              <th className="p-3 font-semibold text-center"><input type="checkbox" checked={selectedRowIds.length === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} /></th>
              <th className="p-3 font-semibold">Bill No.</th>
              <th className="p-3 font-semibold">Order Type</th>
              <th className="p-3 font-semibold">Customer</th>
              <th className="p-3 font-semibold">Billed By</th>
              <th className="p-3 font-semibold max-w-xs truncate">Items</th>
              <th className="p-3 font-semibold">My Amount (₹)</th>
              <th className="p-3 font-semibold">Tax (₹)</th>
              <th className="p-3 font-semibold">Discount (₹)</th>
              <th className="p-3 font-semibold">Grand Total (₹)</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Created</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 && (
              <tr><td colSpan="14" className="p-4 text-center text-surface-400">No order history available.</td></tr>
            )}
            {filteredOrders.map((order, i) => (
              <tr key={order.id} className="hover:bg-surface-900 transition-colors">
                <td className="p-3 text-center"><input type="checkbox" checked={selectedRowIds.includes(order.id)} onChange={() => toggleRowSelect(order.id)} /></td>
                <td className="p-3 font-medium text-surface-100">{order.id}</td>
                <td className="p-3 text-slate-700">
                  <div className="font-semibold">
                    {order.order_type === 'dine_in' ? `Dine In (${order.table_number})` : 
                     order.order_type === 'takeaway' ? `Takeaway (Pickup #${order.id})` : 
                     order.order_type === 'delivery' ? `Delivery (#${order.id})` : 'Dine In'}
                  </div>
                  {order.location_name && <div className="text-xs font-bold text-surface-100">({order.location_name})</div>}
                </td>
                <td className="p-3 text-surface-300">
                  <div className="font-medium">{order.customer_name || '-'}</div>
                  {order.customer_phone && <div className="text-xs text-surface-400">{order.customer_phone}</div>}
                </td>
                <td className="p-3 text-indigo-600 font-medium">{order.waiter_name || '-'}</td>
                <td className="p-3 text-surface-300 max-w-xs truncate" title={order.items?.map(i => i.name).join(', ')}>
                  {order.items?.map(i => i.name).join(', ')}
                </td>
                <td className="p-3 text-surface-100">{parseFloat(order.subtotal || 0).toFixed(2)}</td>
                <td className="p-3 text-surface-300">{parseFloat(order.tax_amount || 0).toFixed(2)}</td>
                <td className="p-3 text-surface-300">{parseFloat(order.discount_amount || 0).toFixed(2)}</td>
                <td className="p-3 text-surface-100 font-medium">{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td className="p-3 font-medium text-slate-700">{order.payment_type || 'Cash'}</td>
                <td className={`p-3 font-bold ${order.status === 'paid' ? 'text-emerald-500' : 'text-rose-500'}`}>{order.status.toUpperCase()}</td>
                <td className="p-3 text-surface-300 text-xs whitespace-pre-line">{formatOrderDate(order.created_at)}</td>
                <td className="p-3">
                  <div className="flex items-center space-x-1">
                    <button onClick={() => handlePrint(order.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-500/20"><Printer className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-500/20"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-500/20"><Eye className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-surface-700 flex items-center justify-between text-xs text-surface-300 bg-surface-900 rounded-b-xl">
        <div>Showing {filteredOrders.length} records</div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 bg-rose-600 text-white rounded font-medium">1</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">2</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">3</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">4</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">Next</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">Last</button>
        </div>
      </div>
      <OrderDetailsModal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} order={selectedOrder} />
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
  );
}
