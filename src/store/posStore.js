import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Initialize Socket.io
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL);

export const usePosStore = create((set, get) => ({
  orders: [],
  orderHistory: [],
  tables: [],
  menuItems: [],
  categories: [],
  locations: [],
  staff: [],
  expenses: [],
  vehicles: [],
  trips: [],
  inventoryItems: [],
  vendorPayments: [],
  staffAdvances: [],

  // UI state for Waiter App
  activeTableId: null,
  cart: [],

  restaurantDetails: null,

  // Notifications
  notifications: [],
  unreadNotificationsCount: 0,
  addNotification: (message, type, audioType) => set(state => {
    playSound(audioType);
    const newNotif = { id: Date.now(), message, type, time: Date.now(), read: false };
    return { 
      notifications: [newNotif, ...state.notifications],
      unreadNotificationsCount: state.unreadNotificationsCount + 1
    };
  }),
  markNotificationsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadNotificationsCount: 0
  })),

  // INITIALIZATION
  fetchData: async () => {
    try {
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        if (Capacitor.isNativePlatform()) {
          LocalNotifications.requestPermissions();
        }
      } catch (permErr) {
        console.warn('Notification permissions request failed:', permErr);
      }

      const [catRes, menuRes, locRes, tableRes, orderRes, restRes] = await Promise.all([
        axios.get(`${API_URL}/config/categories`),
        axios.get(`${API_URL}/config/menu-items`),
        axios.get(`${API_URL}/config/locations`),
        axios.get(`${API_URL}/config/tables`),
        axios.get(`${API_URL}/orders`),
        axios.get(`${API_URL}/restaurant`)
      ]);
      set({
        categories: catRes.data,
        menuItems: menuRes.data,
        locations: locRes.data,
        tables: tableRes.data,
        orders: orderRes.data,
        restaurantDetails: restRes.data
      });
      // also fetch history, expenses, and inventory data
      get().fetchOrderHistory();
      get().fetchExpensesData();
      get().fetchInventoryData();
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load POS data');
    }
  },

  fetchOrderHistory: async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/history`);
      set({ orderHistory: res.data });
    } catch (err) {
      console.error('Failed to fetch order history', err);
    }
  },

  setActiveTableId: (id) => set({ activeTableId: id }),
  
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.menu_item_id === item.id);
    if (existing) {
      return { cart: state.cart.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { cart: [...state.cart, { id: Date.now(), menu_item_id: item.id, quantity: 1, name: item.name, price: item.price, status: 'pending' }] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(i => i.menu_item_id !== itemId)
  })),

  updateCartQuantity: (itemId, quantity) => set((state) => ({
    cart: state.cart.map(i => i.menu_item_id === itemId ? { ...i, quantity } : i)
  })),

  clearCart: () => set({ cart: [] }),

  // Actions
  placeOrder: async (userId = null, orderType = 'dine_in', customerName = '', customerPhone = '') => {
    const state = get();
    if (orderType === 'dine_in' && !state.activeTableId) return;
    if (state.cart.length === 0) return;

    const cartSubtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      await axios.post(`${API_URL}/orders`, {
        table_id: orderType === 'dine_in' ? state.activeTableId : null,
        items: state.cart,
        subtotal: cartSubtotal,
        user_id: userId,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone
      });
      
      toast.success(`Order placed and sent to kitchen!`, { position: 'bottom-center' });
      set({ cart: [] });
      // We don't manually update local state; we wait for the socket event to trigger fetchData()
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order');
    }
  },

  checkoutOrder: async (orderId, paymentType = 'Cash', customerName = '', customerPhone = '', userId = null, discountAmount = 0) => {
    try {
      await axios.post(`${API_URL}/orders/${orderId}/checkout`, { 
        payment_type: paymentType,
        customer_name: customerName,
        customer_phone: customerPhone,
        user_id: userId,
        discount_amount: discountAmount
      });
      toast.success(`Bill closed successfully! (${paymentType})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to checkout');
    }
  },

  quickBillOrder: async (orderType = 'takeaway', paymentType = 'Cash', customerName = '', customerPhone = '', discountAmount = 0, userId = null) => {
    const state = get();
    if (state.cart.length === 0) return null;

    const cartSubtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      const res = await axios.post(`${API_URL}/orders/quick-bill`, {
        items: state.cart,
        subtotal: cartSubtotal,
        user_id: userId,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_type: paymentType,
        discount_amount: discountAmount
      });
      
      toast.success(`Quick Bill generated successfully!`);
      set({ cart: [] });
      return res.data.orderId;
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate quick bill');
      return null;
    }
  },

  // KDS actions
  updateItemStatus: async (orderId, itemId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/items/${itemId}`, { status: newStatus });
      if (newStatus === 'ready') toast.success(`Item is Ready!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  },

  updateKotStatus: async (orderId, kotId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/kot/${kotId}`, { status: newStatus });
      if (newStatus === 'ready') toast.success(`KOT ${kotId} is Ready!`, { duration: 5000, icon: '🍲' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update KOT status');
    }
  },

  deleteActiveOrderItem: async (orderId, itemId) => {
    try {
      await axios.delete(`${API_URL}/orders/${orderId}/items/${itemId}`);
      toast.success('Item deleted from KOT');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item from KOT');
    }
  },

  updateActiveOrderItemQuantity: async (orderId, itemId, quantity) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/items/${itemId}/quantity`, { quantity });
      toast.success('Quantity updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update quantity');
    }
  },

  // Admin Configuration CRUD
  addCategory: async (category) => {
    try {
      const res = await axios.post(`${API_URL}/config/categories`, category);
      set((state) => ({ categories: [...state.categories, res.data] }));
    } catch (err) { console.error(err); }
  },
  
  addMenuItem: async (item) => {
    try {
      const res = await axios.post(`${API_URL}/config/menu-items`, item);
      set((state) => ({ menuItems: [...state.menuItems, res.data] }));
    } catch (err) { console.error(err); }
  },
  
  addLocation: async (loc) => {
    try {
      const res = await axios.post(`${API_URL}/config/locations`, loc);
      set((state) => ({ locations: [...state.locations, res.data] }));
    } catch (err) { console.error(err); }
  },
  
  addTable: async (table) => {
    try {
      const res = await axios.post(`${API_URL}/config/tables`, table);
      set((state) => ({ tables: [...state.tables, res.data] }));
    } catch (err) { console.error(err); }
  },

  fetchExpensesData: async () => {
    try {
      const [staffRes, expRes, vehRes, tripRes] = await Promise.all([
        axios.get(`${API_URL}/expenses/staff`),
        axios.get(`${API_URL}/expenses`),
        axios.get(`${API_URL}/expenses/vehicles`),
        axios.get(`${API_URL}/expenses/trips`)
      ]);
      set({
        staff: staffRes.data,
        expenses: expRes.data,
        vehicles: vehRes.data,
        trips: tripRes.data
      });
    } catch (err) {
      console.error('Failed to fetch expenses/staff data', err);
    }
  },

  addStaff: async (staffMember) => {
    try {
      await axios.post(`${API_URL}/expenses/staff`, staffMember);
      get().fetchExpensesData();
      toast.success('Staff member added');
    } catch (err) { console.error(err); toast.error('Failed to add staff'); }
  },
  updateStaff: async (id, staffMember) => {
    try {
      await axios.put(`${API_URL}/expenses/staff/${id}`, staffMember);
      get().fetchExpensesData();
      toast.success('Staff member updated');
    } catch (err) { console.error(err); toast.error('Failed to update staff'); }
  },
  deleteStaff: async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/staff/${id}`);
      get().fetchExpensesData();
      toast.success('Staff member deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete staff'); }
  },

  addExpense: async (expense) => {
    try {
      await axios.post(`${API_URL}/expenses`, expense);
      get().fetchExpensesData();
      toast.success('Expense log saved');
    } catch (err) { console.error(err); toast.error('Failed to save expense'); }
  },
  updateExpense: async (id, expense) => {
    try {
      await axios.put(`${API_URL}/expenses/${id}`, expense);
      get().fetchExpensesData();
      toast.success('Expense log updated');
    } catch (err) { console.error(err); toast.error('Failed to update expense'); }
  },
  deleteExpense: async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/${id}`);
      get().fetchExpensesData();
      toast.success('Expense log deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete expense'); }
  },

  addVehicle: async (vehicle) => {
    try {
      await axios.post(`${API_URL}/expenses/vehicles`, vehicle);
      get().fetchExpensesData();
      toast.success('Vehicle registered');
    } catch (err) { console.error(err); toast.error('Failed to register vehicle'); }
  },
  updateVehicle: async (id, vehicle) => {
    try {
      await axios.put(`${API_URL}/expenses/vehicles/${id}`, vehicle);
      get().fetchExpensesData();
      toast.success('Vehicle updated');
    } catch (err) { console.error(err); toast.error('Failed to update vehicle'); }
  },
  deleteVehicle: async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/vehicles/${id}`);
      get().fetchExpensesData();
      toast.success('Vehicle deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete vehicle'); }
  },

  addTrip: async (trip) => {
    try {
      await axios.post(`${API_URL}/expenses/trips`, trip);
      get().fetchExpensesData();
      toast.success('Trip log saved');
    } catch (err) { console.error(err); toast.error('Failed to save trip log'); }
  },
  updateTrip: async (id, trip) => {
    try {
      await axios.put(`${API_URL}/expenses/trips/${id}`, trip);
      get().fetchExpensesData();
      toast.success('Trip log updated');
    } catch (err) { console.error(err); toast.error('Failed to update trip log'); }
  },
  deleteTrip: async (id) => {
    try {
      await axios.delete(`${API_URL}/expenses/trips/${id}`);
      get().fetchExpensesData();
      toast.success('Trip log deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete trip log'); }
  },

  fetchInventoryData: async () => {
    try {
      const [invRes, vpRes, saRes] = await Promise.all([
        axios.get(`${API_URL}/inventory/items`),
        axios.get(`${API_URL}/inventory/vendor-payments`),
        axios.get(`${API_URL}/inventory/staff-advances`)
      ]);
      set({
        inventoryItems: invRes.data,
        vendorPayments: vpRes.data,
        staffAdvances: saRes.data
      });
    } catch (err) {
      console.error('Failed to fetch inventory/advances data', err);
    }
  },

  addInventoryItem: async (item) => {
    try {
      await axios.post(`${API_URL}/inventory/items`, item);
      get().fetchInventoryData();
      toast.success('Inventory item added');
    } catch (err) { console.error(err); toast.error('Failed to add inventory item'); }
  },
  updateInventoryItem: async (id, item) => {
    try {
      await axios.put(`${API_URL}/inventory/items/${id}`, item);
      get().fetchInventoryData();
      toast.success('Inventory item updated');
    } catch (err) { console.error(err); toast.error('Failed to update inventory item'); }
  },
  deleteInventoryItem: async (id) => {
    try {
      await axios.delete(`${API_URL}/inventory/items/${id}`);
      get().fetchInventoryData();
      toast.success('Inventory item deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete inventory item'); }
  },
  logInventoryUsage: async (id, logData) => {
    try {
      const res = await axios.post(`${API_URL}/inventory/items/${id}/log`, logData);
      get().fetchInventoryData();
      if (logData.type === 'consumption') {
        toast.success(`Used ${logData.quantity} of stock`);
      } else {
        toast.success('Stock level adjusted successfully');
      }
      return res.data;
    } catch (err) { console.error(err); toast.error('Failed to log stock change'); }
  },

  addVendorPayment: async (vp) => {
    try {
      await axios.post(`${API_URL}/inventory/vendor-payments`, vp);
      get().fetchInventoryData();
      toast.success('Vendor payment added');
    } catch (err) { console.error(err); toast.error('Failed to add vendor payment'); }
  },
  updateVendorPayment: async (id, vp) => {
    try {
      await axios.put(`${API_URL}/inventory/vendor-payments/${id}`, vp);
      get().fetchInventoryData();
      toast.success('Vendor payment updated');
    } catch (err) { console.error(err); toast.error('Failed to update vendor payment'); }
  },
  deleteVendorPayment: async (id) => {
    try {
      await axios.delete(`${API_URL}/inventory/vendor-payments/${id}`);
      get().fetchInventoryData();
      toast.success('Vendor payment deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete vendor payment'); }
  },

  addStaffAdvance: async (sa) => {
    try {
      await axios.post(`${API_URL}/inventory/staff-advances`, sa);
      get().fetchInventoryData();
      toast.success('Staff advance logged');
    } catch (err) { console.error(err); toast.error('Failed to log staff advance'); }
  },
  updateStaffAdvance: async (id, sa) => {
    try {
      await axios.put(`${API_URL}/inventory/staff-advances/${id}`, sa);
      get().fetchInventoryData();
      toast.success('Staff advance updated');
    } catch (err) { console.error(err); toast.error('Failed to update staff advance'); }
  },
  deleteStaffAdvance: async (id) => {
    try {
      await axios.delete(`${API_URL}/inventory/staff-advances/${id}`);
      get().fetchInventoryData();
      toast.success('Staff advance deleted');
    } catch (err) { console.error(err); toast.error('Failed to delete staff advance'); }
  },
  
  // Notice: For brevity, updates and deletes would be implemented similarly using axios.put and axios.delete.
  // The local state should be updated to reflect changes immediately or wait for a fetch.
  updateCategory: () => {}, deleteCategory: () => {},
  updateMenuItem: () => {}, deleteMenuItem: () => {},
  updateLocation: () => {}, deleteLocation: () => {},
  updateTable: () => {}, deleteTable: () => {},
  callWaiter: (tableId, tableNumber, locationId) => {
    socket.emit('call_waiter', { tableId, tableNumber, locationId });
  }
}));

// Helper to play synthesized sounds
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'new_order') {
      // Loud double beep for kitchen
      const playBeep = (delay) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }, delay);
      };
      playBeep(0);
      playBeep(250);
    } else if (type === 'ready_order') {
      // Pleasant ding for waiter
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    }
  } catch (err) {
    console.error("Audio play failed:", err);
  }
};

// Helper to display system-level alerts (Web Notification / Capacitor local notification)
const showSystemNotification = async (title, body) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 500) }
            }
          ]
        });
      }
    } else {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.svg'
        });
      }
    }
  } catch (err) {
    console.error('Failed to trigger system notification:', err);
  }
};

// Real-Time Socket Synchronization
socket.on('order_updated', (data) => {
  console.log('Socket event received:', data);
  const store = usePosStore.getState();
  
  if (data.action === 'new_kot') {
    const msg = `New KOT Received for Table ${data.table_id || '?'}`;
    store.addNotification(msg, 'info', 'new_order');
    showSystemNotification('New KOT Order', msg);
  } else if (data.action === 'item_status' || data.action === 'kot_status') {
    if (data.status === 'ready') {
      const msg = `Order items are Ready to Serve!`;
      store.addNotification(msg, 'success', 'ready_order');
      toast.success('🛎️ Order Ready to Serve!', { id: 'order-update-toast', icon: '🍲' });
      showSystemNotification('Order Ready', msg);
    } else {
      const msg = `Order status updated to ${data.status}`;
      store.addNotification(msg, 'info', null);
      showSystemNotification('Order Update', msg);
    }
  }

  // Re-fetch all data to ensure synchronization
  store.fetchData();
});

socket.on('waiter_called', (data) => {
  console.log('waiter_called event received:', data);
  const store = usePosStore.getState();
  const authStore = useAuthStore.getState();
  
  // Verify mapping: if user is waiter and has specific location assigned, check it.
  const currentUser = authStore.user;
  const isRelated = !currentUser || currentUser.role !== 'waiter' || !currentUser.location_id || currentUser.location_id === parseInt(data.locationId, 10);
  
  if (isRelated) {
    const msg = `Table ${data.tableNumber} needs a waiter!`;
    store.addNotification(`🛎️ Table ${data.tableNumber} is calling!`, 'success', 'ready_order');
    toast(msg, {
      icon: '🔔',
      duration: 6000,
      style: {
        background: '#ffedd5',
        color: '#c2410c',
        border: '1px solid #fed7aa',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    });
    showSystemNotification('🛎️ Waiter Assistance Called', msg);
  }
});
