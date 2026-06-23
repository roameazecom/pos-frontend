import { useState, useEffect } from 'react';
import { usePosStore } from '../store/posStore';
import { Clock, CheckCircle2, ChefHat, History, Flame, Check, Search, ShoppingBag, Bike } from 'lucide-react';
import NotificationPanel from '../components/common/NotificationPanel';

export default function KDS() {
  const { orders, orderHistory, updateItemStatus, updateKotStatus, tables } = usePosStore();
  const [activeTab, setActiveTab] = useState('active');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeTickets = [];
  const historyTickets = [];
  const allOrdersForKDS = [...orders, ...(orderHistory || [])];

  allOrdersForKDS.forEach(order => {
    const table = tables.find(t => t.id === order.table_id);
    const kots = {};
    order.items.forEach(item => {
      const kotId = item.kot_id || `Legacy-${order.id}`;
      const isoStr = order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30';
      const orderTimestamp = new Date(isoStr).getTime();
      if (!kots[kotId]) kots[kotId] = { items: [], timestamp: orderTimestamp };
      kots[kotId].items.push(item);
    });

    Object.entries(kots).forEach(([kotId, data]) => {
      const isHistory = data.items.every(i => i.status === 'ready' || i.status === 'served');
      const orderTypeDisplay = order.order_type === 'takeaway' ? 'Takeaway' :
        order.order_type === 'delivery' ? 'Delivery' : `Table ${table?.table_number || '?'}`;
      const ticket = {
        orderId: order.id, orderType: order.order_type, tableNumber: orderTypeDisplay,
        kotId, items: data.items, timestamp: data.timestamp,
        waiterName: order.waiter_name || 'Admin', customerName: order.customer_name
      };
      if (order.status === 'open' && !isHistory) activeTickets.push(ticket);
      else if (isHistory && data.items.length > 0) historyTickets.push(ticket);
    });
  });

  activeTickets.sort((a, b) => a.timestamp - b.timestamp);
  historyTickets.sort((a, b) => b.timestamp - a.timestamp);

  const filteredHistory = historyTickets.filter(t => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return t.orderId.toString().includes(q) || t.tableNumber.toLowerCase().includes(q) ||
      t.waiterName.toLowerCase().includes(q) || (t.customerName && t.customerName.toLowerCase().includes(q));
  });

  const getElapsedTime = (ts) => {
    const d = Math.floor((currentTime - ts) / 60000);
    if (isNaN(d) || d <= 0) return 'Just now';
    return `${d}m ago`;
  };

  const isWarning = (ts) => Math.floor((currentTime - ts) / 60000) > 15;

  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col overflow-hidden relative font-sans"
         style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* Ambient glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full pointer-events-none animate-blob"
           style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed bottom-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full pointer-events-none animate-blob animation-delay-4000"
           style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.03) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* Header */}
      <header className="mb-4 lg:mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 p-5 rounded-2xl"
              style={panelStyle}>
        <div className="flex items-center gap-4">
          <NotificationPanel align="left" />
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-surface-100 flex items-center gap-2">
              Kitchen Display
              <ChefHat className="w-6 h-6" style={{ color: '#f43f5e', filter: 'drop-shadow(0 0 8px rgba(244,63,94,0.3))' }} />
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(15, 23, 42, 0.5)' }}>
              {activeTickets.length} Active KOTs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tab switcher */}
          <div className="flex p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => setActiveTab('active')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition-all duration-300"
              style={activeTab === 'active' ? {
                background: 'rgba(244,63,94,0.15)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: '#dc2626'
              } : { color: 'rgba(15, 23, 42, 0.5)', border: '1px solid transparent' }}
            >
              <Flame className="w-4 h-4" /> Active
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition-all duration-300"
              style={activeTab === 'history' ? {
                background: 'rgba(5, 150, 105, 0.12)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                color: '#047857'
              } : { color: 'rgba(15, 23, 42, 0.5)', border: '1px solid transparent' }}
            >
              <History className="w-4 h-4" /> History
            </button>
          </div>

          {/* Legend */}
          {activeTab === 'active' && (
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl"
                 style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24', boxShadow: '0 0 8px rgba(251,191,36,0.5)' }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(15, 23, 42, 0.55)' }}>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#818cf8', boxShadow: '0 0 8px rgba(129,140,248,0.5)' }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(15, 23, 42, 0.55)' }}>Cooking</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* History Search */}
      {activeTab === 'history' && (
        <div className="mb-4 shrink-0 p-3 rounded-2xl" style={panelStyle}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(15,23,42,0.35)' }} />
            <input
              type="text"
              placeholder="Search by Order ID, Table, Customer, or Waiter..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="glass-input w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>
        </div>
      )}

      {/* KOT Cards Grid */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'active' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-5 items-start overflow-y-auto custom-scrollbar h-full pb-4">
            {activeTickets.map(ticket => {
              const warn = isWarning(ticket.timestamp);
              const isTakeaway = ticket.orderType === 'takeaway';
              const isDelivery = ticket.orderType === 'delivery';

              return (
                <div
                  key={ticket.kotId}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover-lift"
                  style={{
                    background: warn ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.9)',
                    border: warn ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(0,0,0,0.07)',
                    boxShadow: warn ? '0 0 30px rgba(239,68,68,0.06)' : '0 4px 20px rgba(15,23,42,0.04)',
                  }}
                >
                  {/* Ticket top accent */}
                  <div className="h-1 w-full"
                       style={{ background: warn ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #f97316, #ea580c)' }} />

                  {/* Ticket Header */}
                  <div className="p-4 flex justify-between items-start"
                       style={{ borderBottom: `1px solid ${warn ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.08)'}` }}>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                        {ticket.kotId}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {isTakeaway && <ShoppingBag className="w-4 h-4" style={{ color: '#a78bfa' }} />}
                        {isDelivery && <Bike className="w-4 h-4" style={{ color: '#34d399' }} />}
                        <span className="text-xl font-black text-surface-100">{ticket.tableNumber}</span>
                      </div>
                      {ticket.customerName && (
                        <p className="text-xs font-bold mt-1 text-surface-400">
                          {ticket.customerName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                         style={warn
                           ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626' }
                           : { background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: 'rgba(15, 23, 42, 0.6)' }}>
                      <Clock className="w-3.5 h-3.5" />
                      {getElapsedTime(ticket.timestamp)}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-2.5 flex-1">
                    {ticket.items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.status === 'pending') updateItemStatus(ticket.orderId, item.id, 'cooking');
                          else if (item.status === 'cooking') updateItemStatus(ticket.orderId, item.id, 'ready');
                          else if (item.status === 'ready') updateItemStatus(ticket.orderId, item.id, 'cooking');
                        }}
                        className="p-3 rounded-xl cursor-pointer select-none transition-all duration-300"
                        style={item.status === 'pending' ? {
                          background: 'rgba(251,191,36,0.08)',
                          border: '1px solid rgba(251,191,36,0.25)',
                        } : item.status === 'cooking' ? {
                          background: 'rgba(99,102,241,0.08)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          transform: 'scale(1.01)'
                        } : {
                          background: 'rgba(52,211,153,0.08)',
                          border: '1px solid rgba(52,211,153,0.25)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="font-black text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={item.status === 'ready' ? { background: '#059669', color: 'white' }
                                   : item.status === 'cooking' ? { background: '#4f46e5', color: 'white' }
                                   : { background: 'rgba(217,119,6,0.15)', color: '#b45309' }}>
                              {item.quantity}
                            </span>
                            <span className={`font-bold text-sm ${item.status === 'ready' ? 'line-through' : ''}`}
                              style={{ color: item.status === 'pending' ? 'rgba(15,23,42,0.8)'
                                           : item.status === 'cooking' ? '#4338ca' : '#047857' }}>
                              {item.name}
                            </span>
                          </div>
                          {item.status === 'ready' && <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#059669' }} />}
                          {item.status === 'cooking' && (
                            <Flame className="w-4 h-4 shrink-0 animate-pulse" style={{ color: '#4f46e5' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mark Ready */}
                  <div className="p-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                      onClick={() => updateKotStatus(ticket.orderId, ticket.kotId, 'ready')}
                      className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.2)'
                      }}
                    >
                      <Check className="w-4 h-4" /> Mark KOT Ready
                    </button>
                  </div>
                </div>
              );
            })}

            {activeTickets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                     style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <ChefHat className="w-12 h-12" style={{ color: 'rgba(15, 23, 42, 0.3)' }} />
                </div>
                <h2 className="text-2xl font-black text-surface-100">Kitchen is clear!</h2>
                <p className="text-sm font-bold uppercase tracking-wide text-surface-400">
                  Waiting for new KOTs...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* History Table */
          <div className="h-full overflow-y-auto custom-scrollbar rounded-2xl" style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.06)'
          }}>
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="sticky top-0" style={{
                background: 'rgba(255,255,255,0.95)',
                borderBottom: '1px solid rgba(0,0,0,0.07)'
              }}>
                <tr>
                  {['KOT ID', 'Order ID', 'Table/Type', 'Waiter', 'Time Completed'].map((h, i) => (
                    <th key={h} className={`p-4 font-black uppercase tracking-wider text-xs ${i === 4 ? 'text-right' : ''}`}
                        style={{ color: 'rgba(15,23,42,0.5)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((ticket, i) => (
                  <tr key={`${ticket.kotId}-${i}`} className="transition-colors"
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="p-4 font-black text-xs tracking-widest uppercase"
                        style={{ color: '#ea580c' }}>{ticket.kotId}</td>
                    <td className="p-4 font-bold text-surface-300">#{ticket.orderId}</td>
                    <td className="p-4 font-black text-surface-100">{ticket.tableNumber}</td>
                    <td className="p-4 font-bold" style={{ color: '#ea580c' }}>{ticket.waiterName}</td>
                    <td className="p-4 text-right font-bold text-xs text-surface-400">
                      {new Date(ticket.timestamp).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit', hour12: true
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <History className="w-12 h-12" style={{ color: 'rgba(15, 23, 42, 0.2)' }} />
                <p className="font-bold text-surface-400">No history found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

