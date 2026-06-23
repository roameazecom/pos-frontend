import { useState, useEffect } from 'react';
import { Utensils, LayoutDashboard, Truck, ShoppingBag, TrendingUp } from 'lucide-react';
import { usePosStore } from '../../../store/posStore';

export default function RunningStatusViews() {
  const [activeTab, setActiveTab] = useState('orders');
  const { orders, tables } = usePosStore();

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter(o => o.status === 'open');
  let totalAmount = 0;
  let dineInCount = 0; let dineInAmount = 0;
  let takeawayCount = 0; let takeawayAmount = 0;
  let deliveryCount = 0; let deliveryAmount = 0;

  activeOrders.forEach(o => {
    const amt = parseFloat(o.subtotal || 0);
    totalAmount += amt;
    if (o.order_type === 'takeaway') {
      takeawayCount++; takeawayAmount += amt;
    } else if (o.order_type === 'delivery') {
      deliveryCount++; deliveryAmount += amt;
    } else {
      dineInCount++; dineInAmount += amt;
    }
  });

  return (
    <div className="bg-surface-900/80 backdrop-blur-md border border-surface-700 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex px-6 pt-4 pb-0 space-x-6 border-b border-surface-700 bg-surface-950/50">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-2 font-bold text-sm border-b-4 transition-all duration-300 ${
            activeTab === 'orders' 
              ? 'border-brand-600 text-brand-700' 
              : 'border-transparent text-surface-500 hover:text-surface-100'
          }`}
        >
          Running Orders
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`py-3 px-2 font-bold text-sm border-b-4 transition-all duration-300 ${
            activeTab === 'tables' 
              ? 'border-brand-600 text-brand-700' 
              : 'border-transparent text-surface-500 hover:text-surface-100'
          }`}
        >
          Running Tables
        </button>
      </div>

      <div className="p-6 lg:p-8">
        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <div className="flex items-center mb-6">
               <span className="w-3 h-3 rounded-full bg-brand-500 mr-3 shadow-[0_0_0_4px_var(--color-brand-100)] animate-pulse"></span>
               <h3 className="font-extrabold text-surface-100 text-lg">Running Orders</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-8">
              <div className="bg-surface-950 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-surface-750 shadow-sm hover:shadow-md transition-all">
                <span className="text-surface-500 font-bold text-sm mb-1 uppercase tracking-widest">Total Orders</span>
                <span className="text-4xl font-black text-brand-600">{activeOrders.length}</span>
              </div>
              <div className="bg-surface-950 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-surface-750 shadow-sm hover:shadow-md transition-all">
                <span className="text-surface-500 font-bold text-sm mb-1 uppercase tracking-widest">Total Amount</span>
                <span className="text-3xl font-black text-brand-600">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-5 bg-surface-900 border border-surface-750 rounded-2xl shadow-sm hover:shadow-glass hover:-translate-y-1 transition-all group">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600 mr-4 group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-surface-100 text-lg">Dine in</h4>
                    <p className="text-sm font-semibold text-surface-500">{dineInCount} active orders</p>
                  </div>
                </div>
                <div className="font-black text-xl text-surface-100">₹ {dineInAmount.toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between p-5 bg-surface-900 border border-surface-750 rounded-2xl shadow-sm hover:shadow-glass hover:-translate-y-1 transition-all group">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4 group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-surface-100 text-lg">Delivery</h4>
                    <p className="text-sm font-semibold text-surface-500">{deliveryCount} active orders</p>
                  </div>
                </div>
                <div className="font-black text-xl text-surface-400">₹ {deliveryAmount.toFixed(2)}</div>
              </div>

              <div className="flex items-center justify-between p-5 bg-surface-900 border border-surface-750 rounded-2xl shadow-sm hover:shadow-glass hover:-translate-y-1 transition-all group">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 mr-4 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-surface-100 text-lg">Takeaway</h4>
                    <p className="text-sm font-semibold text-surface-500">{takeawayCount} active orders</p>
                  </div>
                </div>
                <div className="font-black text-xl text-surface-400">₹ {takeawayAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 gap-4 lg:gap-6 mb-8 lg:max-w-xl">
              <div className="bg-surface-950 rounded-2xl p-5 flex items-center border border-surface-750 shadow-sm">
                <div className="p-3 rounded-xl bg-surface-900 border border-surface-700 mr-4 shadow-sm">
                  <Utensils className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <span className="text-2xl font-black text-surface-100 block leading-none">{activeOrders.length}</span>
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-widest block mt-1.5">Active Tables</span>
                </div>
              </div>
              <div className="bg-surface-950 rounded-2xl p-5 flex items-center border border-surface-750 shadow-sm">
                <div className="p-3 rounded-xl bg-surface-900 border border-surface-700 mr-4 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <span className="text-2xl font-black text-brand-600 block leading-none">₹ {totalAmount.toFixed(2)}</span>
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-widest block mt-1.5">Revenue</span>
                </div>
              </div>
            </div>

            <div className="flex overflow-x-auto pb-6 space-x-6 custom-scrollbar pt-2">
              {activeOrders.map((order, i) => {
                const table = tables.find(t => t.id === order.table_id);
                const orderTime = new Date(order.created_at.includes('T') ? order.created_at : order.created_at.replace(' ', 'T') + '+05:30').getTime();
                const diffMins = Math.floor((currentTime - orderTime) / 60000);
                const isOvertime = diffMins > 45; // Just a visual cue
                return (
                <div key={order.id} className="min-w-[160px] flex-shrink-0 flex flex-col items-center group">
                  <div className={`w-full border rounded-3xl h-32 flex flex-col items-center justify-center mb-2 shadow-sm transition-transform group-hover:-translate-y-2 ${isOvertime ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-surface-900 border-surface-700'}`}>
                    <span className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-1">{order.order_type === 'dine_in' ? 'Table' : order.order_type === 'takeaway' ? 'Pickup' : 'Delivery'}</span>
                    <span className={`text-3xl font-black ${isOvertime ? 'text-red-600' : 'text-surface-100'}`}>
                      {order.order_type === 'dine_in' ? (table?.table_number || '?') : `#${order.id}`}
                    </span>
                  </div>
                  <div className="bg-surface-900 text-white rounded-full px-4 py-1.5 text-sm font-bold shadow-md relative -top-6">
                    ₹ {(order.subtotal || 0).toFixed(2)}
                  </div>
                  <div className="text-center -mt-3">
                    <span className={`text-lg font-black block ${isOvertime ? 'text-red-500' : 'text-brand-600'}`}>{diffMins} <span className="text-sm font-bold">Min</span></span>
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Time Lapsed</span>
                  </div>
                </div>
              )})}
              {activeOrders.length === 0 && (
                <div className="w-full text-center text-surface-400 p-8 font-medium bg-surface-950 rounded-2xl border border-dashed border-surface-700">
                  No active tables currently running.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
