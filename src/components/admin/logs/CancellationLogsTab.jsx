import { useEffect, useState } from 'react';
import { usePosStore } from '../../../store/posStore';
import { Trash2, Search, Calendar, FileText } from 'lucide-react';

export default function CancellationLogsTab() {
  const { cancellationLogs, fetchCancellationLogs } = usePosStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCancellationLogs();
  }, [fetchCancellationLogs]);

  const filteredLogs = (cancellationLogs || []).filter(log => {
    const q = searchTerm.toLowerCase();
    return (
      log.item_name.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      log.cancelled_by_name.toLowerCase().includes(q) ||
      log.order_id.toString().includes(q)
    );
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-2xl shadow-soft border border-surface-700/50 overflow-hidden">
      {/* Header Panel */}
      <div className="p-5 border-b border-surface-700/60 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Food Deletion & Cancellation Logs</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manager Audit Records</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Item, Reason, Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Grid view / table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          <thead className="bg-[#f8fafc] text-slate-700 sticky top-0 border-b border-surface-700 shadow-sm z-10">
            <tr>
              <th className="p-4 font-black">Date/Time</th>
              <th className="p-4 font-black">Order ID</th>
              <th className="p-4 font-black">Item Name</th>
              <th className="p-4 font-black">Quantity</th>
              <th className="p-4 font-black">Amount (₹)</th>
              <th className="p-4 font-black">Cancelled By</th>
              <th className="p-4 font-black">Cancellation Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-600">
                  {new Date(log.created_at.includes('T') ? log.created_at : log.created_at.replace(' ', 'T') + '+05:30').toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </td>
                <td className="p-4 font-bold text-red-600">#{log.order_id}</td>
                <td className="p-4 font-black text-slate-800">{log.item_name}</td>
                <td className="p-4 text-slate-700 font-bold">{log.quantity}</td>
                <td className="p-4 font-black text-slate-800">₹{(log.price * log.quantity).toFixed(2)}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg border border-rose-100 text-[10px] uppercase">
                    {log.cancelled_by_name}
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 font-black rounded-lg text-[10px] uppercase">
                    {log.reason}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 font-black">
                  No cancellation log entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
