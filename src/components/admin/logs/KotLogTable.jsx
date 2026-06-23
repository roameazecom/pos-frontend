import { useState, useMemo } from 'react';
import { Eye, Printer } from 'lucide-react';
import { usePosStore } from '../../../store/posStore';
import KotDetailsModal from './KotDetailsModal';

export default function KotLogTable() {
  const { orderHistory, orders } = usePosStore();
  const [selectedKot, setSelectedKot] = useState(null);

  // Search States
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterKotId, setFilterKotId] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterTableNo, setFilterTableNo] = useState('');
  const [filterOrderType, setFilterOrderType] = useState('All');

  // Combine open orders and paid orders
  const allOrders = [...(orders || []).filter(o => o.status === 'open'), ...(orderHistory || [])];

  // Group items by KOT ID
  const kotsMap = new Map();
  allOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const kotId = item.kot_id || `KOT-${order.id}-00`;
      if (!kotsMap.has(kotId)) {
        kotsMap.set(kotId, {
          id: kotId,
          type: `Dine In(${order.table_number || 'Unknown'})`,
          name: order.customer_name || '-',
          phone: order.customer_phone || '-',
          itemsCount: 0,
          itemNames: [],
          items: [],
          status: order.status === 'paid' ? 'Billed' : item.status === 'ready' ? 'Ready' : 'Not Prepared',
          created: new Date(order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30').toLocaleString(),
          raw_date: order.created_at,
          print: order.status === 'paid' ? new Date(order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30').toLocaleString() : '--',
          duration: '--'
        });
      }
      const k = kotsMap.get(kotId);
      k.itemsCount += item.quantity;
      k.itemNames.push(item.name);
      k.items.push(item);
    });
  });

  const kotsList = useMemo(() => {
    return Array.from(kotsMap.values())
      .filter(kot => {
        if (filterKotId && !kot.id.toLowerCase().includes(filterKotId.toLowerCase())) return false;
        if (filterCustomerName && kot.name !== '-' && !kot.name.toLowerCase().includes(filterCustomerName.toLowerCase())) return false;
        if (filterTableNo && !kot.type.includes(filterTableNo)) return false;
        
        if (filterStartDate) {
          const kotDate = new Date(kot.raw_date.includes('T') ? kot.raw_date : kot.raw_date.replace(' ', 'T') + '+05:30');
          if (kotDate < new Date(filterStartDate)) return false;
        }
        if (filterEndDate) {
          const kotDate = new Date(kot.raw_date.includes('T') ? kot.raw_date : kot.raw_date.replace(' ', 'T') + '+05:30');
          if (kotDate > new Date(filterEndDate)) return false;
        }
        
        if (filterOrderType !== 'All') {
          if (filterOrderType === 'Delivery' || filterOrderType === 'Pickup') return false; // Currently all are Dine In
        }
        
        return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [kotsMap, filterStartDate, filterEndDate, filterKotId, filterCustomerName, filterTableNo, filterOrderType]);

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterKotId('');
    setFilterCustomerName('');
    setFilterTableNo('');
    setFilterOrderType('All');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-900 rounded-xl shadow-sm border border-surface-700 overflow-hidden">
      <div className="p-4 border-b border-surface-700 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-surface-100">KOT Logs</h2>
        <button className="flex items-center px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-surface-900">
           Export Excel <span className="ml-2">▼</span>
        </button>
      </div>

      <div className="p-4 border-b border-surface-700 bg-surface-900 space-y-4">
        <div className="text-sm font-bold flex items-center text-surface-300 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Search
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">Start Date</label>
            <input type="datetime-local" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">End Date</label>
            <input type="datetime-local" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-surface-300 mb-1 block">Kot ID</label>
            <input type="text" value={filterKotId} onChange={e => setFilterKotId(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Customer Name</label>
            <input type="text" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">Table No.</label>
            <input type="text" value={filterTableNo} onChange={e => setFilterTableNo(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm" />
          </div>
          <div>
             <label className="text-xs font-semibold text-surface-300 mb-1 block">All Order Type</label>
             <select value={filterOrderType} onChange={e => setFilterOrderType(e.target.value)} className="w-full border border-slate-300 rounded p-1.5 text-sm">
               <option value="All">All</option>
               <option value="Dine In">Dine In</option>
               <option value="Delivery">Delivery</option>
               <option value="Pickup">Pickup</option>
             </select>
          </div>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => {}} className="bg-rose-600 text-white font-medium text-sm px-6 py-2 rounded hover:bg-rose-700">Search</button>
           <button onClick={clearFilters} className="bg-surface-900 border border-slate-300 text-slate-700 font-medium text-sm px-6 py-2 rounded hover:bg-surface-900">Show All</button>
        </div>
      </div>

       {/* KOT Data */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#f1f5f9] text-[#1e293b] sticky top-0 border-b border-surface-700">
            <tr>
              <th className="p-3 font-semibold">KOT ID</th>
              <th className="p-3 font-semibold">Order Type</th>
              <th className="p-3 font-semibold">Customer Name</th>
              <th className="p-3 font-semibold">Customer Phone</th>
              <th className="p-3 font-semibold text-center">No. Of Items</th>
              <th className="p-3 font-semibold">Items</th>
              <th className="p-3 font-semibold text-center">Status</th>
              <th className="p-3 font-semibold text-center">Bill Print Date</th>
              <th className="p-3 font-semibold text-center">Complete Duration</th>
              <th className="p-3 font-semibold">Created</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kotsList.map((kot, i) => (
              <tr key={i} className="hover:bg-surface-900 transition-colors">
                <td className="p-3 font-medium text-surface-100">{kot.id}</td>
                <td className="p-3 font-bold text-surface-100">{kot.type}</td>
                <td className="p-3 text-surface-300">{kot.name}</td>
                <td className="p-3 text-surface-300">{kot.phone}</td>
                <td className="p-3 text-center font-medium text-slate-700">{kot.itemsCount}</td>
                <td className="p-3 text-surface-300 max-w-xs truncate" title={kot.itemNames.join(', ')}>{kot.itemNames.join(', ')}</td>
                <td className="p-3 text-center whitespace-nowrap">
                   <span className="font-semibold text-slate-700">{kot.status}</span>
                </td>
                <td className="p-3 text-center text-surface-300 whitespace-pre-line text-xs">{kot.print}</td>
                 <td className="p-3 text-center text-surface-100 whitespace-nowrap">
                    {kot.duration} <span className="ml-1 opacity-50 cursor-help">ℹ️</span>
                </td>
                <td className="p-3 text-surface-100 font-medium whitespace-pre-line text-xs">{kot.created}</td>
                <td className="p-3">
                  <div className="flex flex-col sm:flex-row items-center justify-center space-x-0 space-y-1 sm:space-y-0 sm:space-x-1">
                    <button onClick={() => setSelectedKot(kot)} className="p-1 border border-surface-700 text-surface-400 rounded hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200"><Eye className="w-4 h-4" /></button>
                    <button className="p-1 border border-surface-700 text-surface-400 rounded hover:bg-slate-100 hover:text-indigo-600 hover:border-indigo-200"><Printer className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {kotsList.length === 0 && (
              <tr><td colSpan="11" className="p-4 text-center text-surface-400">No KOT logs available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
       <div className="p-4 border-t border-surface-700 flex items-center justify-between text-xs text-surface-300 bg-surface-900 rounded-b-xl">
        <div>Showing {kotsList.length > 0 ? 1 : 0} to {kotsList.length} of {kotsList.length} records</div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 bg-rose-600 text-white rounded font-medium">1</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">2</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">Next</button>
          <button className="px-3 py-1 border border-surface-700 rounded hover:bg-surface-900">Last</button>
        </div>
      </div>
      <KotDetailsModal isOpen={!!selectedKot} onClose={() => setSelectedKot(null)} kot={selectedKot} />
    </div>
  );
}
