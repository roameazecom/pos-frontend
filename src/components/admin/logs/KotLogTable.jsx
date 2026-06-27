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
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl shadow-soft border border-surface-700/50 overflow-hidden">
      <div className="p-4 lg:p-5 border-b border-surface-700/60 flex items-center justify-between shrink-0 bg-surface-800">
        <h2 className="text-base font-black text-slate-800">KOT Logs Viewer</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-white border border-surface-700 hover:border-slate-300 rounded-xl text-xs font-black text-slate-700 hover:text-slate-900 transition-all shadow-sm">
           Export Excel <span className="text-[10px] text-slate-400">▼</span>
        </button>
      </div>

      <div className="p-5 border-b border-surface-700/60 bg-surface-900/50 space-y-4">
        <div className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Search & Filter Panel
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Start Date</label>
            <input type="datetime-local" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">End Date</label>
            <input type="datetime-local" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Kot ID</label>
            <input type="text" placeholder="Search ID" value={filterKotId} onChange={e => setFilterKotId(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white" />
          </div>
          <div>
             <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Customer Name</label>
            <input type="text" placeholder="Name" value={filterCustomerName} onChange={e => setFilterCustomerName(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white" />
          </div>
          <div>
             <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Table No.</label>
            <input type="text" placeholder="Table Number" value={filterTableNo} onChange={e => setFilterTableNo(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white" />
          </div>
          <div>
             <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">All Order Type</label>
             <select value={filterOrderType} onChange={e => setFilterOrderType(e.target.value)} className="w-full border border-surface-700 rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-brand-400 bg-white">
               <option value="All">All</option>
               <option value="Dine In">Dine In</option>
               <option value="Delivery">Delivery</option>
               <option value="Pickup">Pickup</option>
             </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 border-t border-surface-700/60 pt-3">
          <div className="text-xs text-slate-400 font-semibold">
            Found {kotsList.length} KOT records.
          </div>
          <div className="flex gap-2">
            <button onClick={clearFilters} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-200">Clear All Filters</button>
          </div>
        </div>
      </div>

       {/* KOT Data */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="bg-[#f8fafc] text-slate-700 sticky top-0 border-b border-surface-700 shadow-sm z-10">
            <tr>
              <th className="p-4 font-black">KOT ID</th>
              <th className="p-4 font-black">Order Source / Table</th>
              <th className="p-4 font-black">Customer Name</th>
              <th className="p-4 font-black">Customer Phone</th>
              <th className="p-4 font-black text-center">Items Count</th>
              <th className="p-4 font-black max-w-xs truncate">KOT Items Details</th>
              <th className="p-4 font-black text-center">KOT Status</th>
              <th className="p-4 font-black text-center">Billed Timestamp</th>
              <th className="p-4 font-black text-center">Prep Duration</th>
              <th className="p-4 font-black">Created At</th>
              <th className="p-4 font-black text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {kotsList.map((kot, i) => (
              <tr key={i} className="hover:bg-slate-50/70 transition-colors group">
                <td className="p-4 font-extrabold text-slate-900">{kot.id}</td>
                <td className="p-4 font-bold text-slate-800">{kot.type}</td>
                <td className="p-4 text-slate-700 font-medium">{kot.name}</td>
                <td className="p-4 text-slate-400 font-semibold">{kot.phone}</td>
                <td className="p-4 text-center">
                  <span className="px-2 py-0.5 bg-orange-550/10 text-orange-655 text-[10px] font-black rounded border border-orange-550/20">
                    {kot.itemsCount}
                  </span>
                </td>
                <td className="p-4 text-slate-600 max-w-xs truncate font-medium" title={kot.itemNames.join(', ')}>{kot.itemNames.join(', ')}</td>
                <td className="p-4 text-center whitespace-nowrap">
                   <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                     kot.status === 'Billed'
                       ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                       : 'bg-amber-50 border-amber-200 text-amber-700'
                   }`}>
                     {kot.status}
                   </span>
                </td>
                <td className="p-4 text-center text-slate-500 font-medium text-[11px] leading-snug">{kot.print}</td>
                <td className="p-4 text-center text-slate-800 font-bold whitespace-nowrap">
                    {kot.duration} <span className="ml-1 text-slate-400 opacity-60 cursor-help" title="Preparation tracking metadata">ℹ️</span>
                </td>
                <td className="p-4 text-slate-500 font-medium text-[11px] leading-snug">{kot.created}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <button onClick={() => setSelectedKot(kot)} title="View Details" className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all border border-transparent hover:border-brand-100"><Eye className="w-3.5 h-3.5" /></button>
                    <button title="Print KOT" className="p-2 text-slate-500 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100"><Printer className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {kotsList.length === 0 && (
              <tr><td colSpan="11" className="p-12 text-center text-slate-400 font-medium">No KOT logs matched search query.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
       <div className="p-4 border-t border-surface-700/60 flex items-center justify-between text-xs text-slate-500 bg-surface-800/80 rounded-b-2xl">
        <div className="font-bold">Showing {kotsList.length} records</div>
        <div className="flex space-x-1">
          <button className="px-3 py-1.5 bg-brand-600 text-white rounded-lg font-black text-xs shadow-sm">1</button>
        </div>
      </div>
      <KotDetailsModal isOpen={!!selectedKot} onClose={() => setSelectedKot(null)} kot={selectedKot} />
    </div>
  );
}
