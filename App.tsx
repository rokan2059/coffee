
import React, { useState, useEffect, useRef } from 'react';
import { 
  Coffee, ShoppingBag, X, Plus, Trash2, ArrowRight, Sparkles, 
  CheckCircle, Clock, LogOut, Settings, ShieldCheck, ChevronLeft,
  LayoutDashboard, ClipboardList, Store, Menu as MenuIcon, ChevronRight,
  Lock, Key, Package, Loader2, Check, Timer, CreditCard, Banknote, AlertCircle,
  ChevronDown, Minus, Cloud, CloudOff, RefreshCw, Link2, ExternalLink, Database, 
  Server, Smartphone, Monitor, Globe, Info
} from 'lucide-react';
import { MenuItem, Category, CartItem, Order, View, AdminSubView, CATEGORIES, PaymentMethod, PaymentStatus, CloudConfig } from './types';
import { generateDescription } from './services/geminiService';

const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Caramel Macchiato', description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso.', price: 5.50, category: 'Hot Coffee', image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Cold Brew', description: 'Handcrafted in small batches daily, slow-steeped in cool water for 20 hours.', price: 4.75, category: 'Ice Coffee', image: 'https://images.unsplash.com/photo-1517701604599-bb29b56509d1?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Earl Grey Tea', description: 'A bright blend of fine black teas, fragrant with citrusy bergamot.', price: 3.50, category: 'Tea', image: 'https://images.unsplash.com/photo-1544787210-2211d4d70404?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Iced Matcha Latte', description: 'Smooth and creamy matcha sweetened just right and served over ice.', price: 6.25, category: 'Ice Coffee', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&q=80&w=400' },
];

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
};

const getStatusStyles = (status?: Order['status']) => {
  switch (status) {
    case 'preparing': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'ready': return 'bg-green-100 text-green-700 border-green-200';
    case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-amber-100 text-amber-700 border-amber-200';
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('brew_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('brew_order_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    const saved = localStorage.getItem('brew_cloud_config');
    return saved ? JSON.parse(saved) : { enabled: false, apiKey: '', projectUrl: '' };
  });
  
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [toast, setToast] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('is_admin') === 'true';
  });
  
  const logoClickRef = useRef<{ count: number; lastClick: number }>({ count: 0, lastClick: 0 });

  useEffect(() => {
    localStorage.setItem('brew_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('brew_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('brew_cloud_config', JSON.stringify(cloudConfig));
  }, [cloudConfig]);

  useEffect(() => {
    if (!cloudConfig.enabled || !isAdmin) return;
    const syncInterval = setInterval(() => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 800);
    }, 15000);
    return () => clearInterval(syncInterval);
  }, [cloudConfig.enabled, isAdmin]);

  const handleAdminAuth = () => {
    if (isAdmin) setView('admin');
    else setIsLoginModalOpen(true);
  };

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - logoClickRef.current.lastClick < 500) logoClickRef.current.count++;
    else logoClickRef.current.count = 1;
    logoClickRef.current.lastClick = now;
    if (logoClickRef.current.count === 2) {
      handleAdminAuth();
      logoClickRef.current.count = 0;
    }
  };

  const attemptLogin = (password: string) => {
    if (password === 'admin') {
      setIsAdmin(true);
      sessionStorage.setItem('is_admin', 'true');
      showToast("Staff Access Granted");
      setIsLoginModalOpen(false);
      setView('admin');
    } else {
      showToast("Invalid Access Key");
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('is_admin');
    setView('home');
    showToast("Staff Session Ended");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    showToast(`Added ${item.name}`);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const confirmOrder = () => {
    const now = Date.now();
    const newOrder: Order = {
      id: `ORD-${now}`,
      date: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
      items: [...cart],
      total: cartTotal,
      status: 'pending',
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'unpaid',
      source: 'local'
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    showToast("Order Placed Successfully!");
    setView('history');
  };

  const filteredMenu = activeCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === activeCategory);

  const showStandardUI = view !== 'admin' || !isAdmin;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FDFBF7]">
      {showStandardUI && (
        <nav className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E6D5B8]">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 cursor-pointer select-none group" onClick={() => setView('home')}>
              <div className="w-10 h-10 bg-[#2A1810] rounded-full flex items-center justify-center text-[#E6D5B8] active:scale-90 transition-transform hover:bg-[#3D2B1F] shadow-lg" onClick={(e) => { e.stopPropagation(); handleLogoClick(); }}>
                <Coffee size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#2A1810] font-serif">Brew & Bean</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => setView('home')} className={`text-sm font-semibold transition-colors ${view === 'home' ? 'text-[#8B4513]' : 'text-[#3D2B1F]/60'}`}>Home</button>
              <button onClick={() => setView('menu')} className={`text-sm font-semibold transition-colors ${view === 'menu' ? 'text-[#8B4513]' : 'text-[#3D2B1F]/60'}`}>Menu</button>
              <button onClick={() => setView('history')} className={`text-sm font-semibold transition-colors ${view === 'history' ? 'text-[#8B4513]' : 'text-[#3D2B1F]/60'}`}>Orders</button>
              <button onClick={handleAdminAuth} className="flex items-center gap-1 text-sm font-bold opacity-30 hover:opacity-100 transition-opacity"><ShieldCheck size={16} /> Admin</button>
            </div>

            <button onClick={() => setView('cart')} className="relative p-2 text-[#2A1810]">
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-[#8B4513] text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </nav>
      )}

      <main className="flex-grow flex flex-col">
        {view === 'home' && <HeroSection onStart={() => setView('menu')} onTrack={() => setView('history')} />}
        {view === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-4xl font-bold mb-8 text-center text-[#2A1810] font-serif">Our Collections</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <button onClick={() => setActiveCategory('All')} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'All' ? 'bg-[#2A1810] text-[#E6D5B8]' : 'bg-[#FCF9F2] border border-[#E6D5B8]'}`}>All</button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[#2A1810] text-[#E6D5B8]' : 'bg-[#FCF9F2] border border-[#E6D5B8]'}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredMenu.map(item => (
                <div key={item.id} className="group bg-[#FCF9F2] rounded-2xl overflow-hidden border border-[#E6D5B8] hover:shadow-xl transition-all">
                  <div className="h-56 overflow-hidden"><img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2"><h3 className="text-xl font-bold text-[#2A1810]">{item.name}</h3><span className="text-[#8B4513] font-bold">${item.price.toFixed(2)}</span></div>
                    <p className="text-[#3D2B1F]/60 text-sm mb-6 h-10 line-clamp-2">{item.description}</p>
                    <button onClick={() => addToCart(item)} className="w-full py-3 bg-[#3D2B1F] text-[#FDFBF7] rounded-xl font-semibold hover:bg-[#2A1810] transition-colors">Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'history' && <HistoryView history={orderHistory} />}
        {view === 'cart' && <CartView cart={cart} updateQuantity={updateCartQuantity} removeFromCart={removeFromCart} total={cartTotal} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onConfirm={confirmOrder} onBack={() => setView('menu')} />}
        {view === 'admin' && isAdmin && (
          <AdminDashboard 
            menu={menu} setMenu={setMenu} orders={orderHistory} setOrders={setOrderHistory} 
            cloudConfig={cloudConfig} setCloudConfig={setCloudConfig} isSyncing={isSyncing}
            showToast={showToast} onClose={() => setView('home')} onLogout={logoutAdmin}
          />
        )}
      </main>

      {isLoginModalOpen && <AdminLoginModal onClose={() => setIsLoginModalOpen(false)} onLogin={attemptLogin} />}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#2A1810] text-[#E6D5B8] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-[#8B4513]/50">
          <CheckCircle className="text-[#8B4513]" size={20} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
};

// --- View Components ---

const HeroSection: React.FC<{ onStart: () => void; onTrack: () => void }> = ({ onStart, onTrack }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center text-center px-4">
    <div className="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover brightness-[0.3]" alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FDFBF7]" />
    </div>
    <div className="relative z-10 max-w-4xl text-[#E6D5B8]">
      <h1 className="text-6xl md:text-8xl font-bold mb-8 font-serif">Brew <span className="text-[#8B4513]">&</span> Bean</h1>
      <p className="text-xl md:text-2xl mb-14 font-light italic opacity-80">Experience coffee as high art, delivered to your hand.</p>
      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <button onClick={onStart} className="px-14 py-6 bg-[#8B4513] text-[#FDFBF7] rounded-2xl text-xl font-bold hover:scale-105 transition-all shadow-2xl">ORDER NOW</button>
        <button onClick={onTrack} className="px-14 py-6 bg-white/10 backdrop-blur-md border border-white/20 text-[#FDFBF7] rounded-2xl text-xl font-bold">TRACK ORDER</button>
      </div>
    </div>
  </div>
);

const CartView: React.FC<{ 
  cart: CartItem[], updateQuantity: (id: string, d: number) => void, removeFromCart: (id: string) => void, 
  total: number, paymentMethod: PaymentMethod, setPaymentMethod: (m: PaymentMethod) => void,
  onConfirm: () => void, onBack: () => void
}> = ({ cart, updateQuantity, removeFromCart, total, paymentMethod, setPaymentMethod, onConfirm, onBack }) => (
  <div className="max-w-6xl mx-auto px-4 py-20 w-full animate-in fade-in slide-in-from-bottom-8">
    <button onClick={onBack} className="flex items-center gap-2 text-[#3D2B1F]/40 hover:text-[#8B4513] font-bold uppercase tracking-widest text-xs mb-10"><ChevronLeft size={16} /> Menu</button>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div className="lg:col-span-2 space-y-10">
        <h2 className="text-5xl font-bold text-[#2A1810] font-serif">Checkout</h2>
        {cart.length === 0 ? (
          <div className="bg-[#FCF9F2] rounded-[3rem] p-24 text-center border border-[#E6D5B8]">
            <ShoppingBag size={80} className="mx-auto text-[#E6D5B8] mb-8 opacity-30" />
            <h3 className="text-2xl font-bold text-[#2A1810] mb-4">Cart is Empty</h3>
            <button onClick={onBack} className="px-10 py-4 bg-[#2A1810] text-[#E6D5B8] rounded-2xl font-bold">Go Back</button>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-6 p-6 bg-[#FCF9F2] rounded-[2rem] border border-[#E6D5B8]">
                <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" alt="" />
                <div className="flex-grow">
                  <div className="flex justify-between items-start"><h3 className="text-xl font-bold text-[#2A1810]">{item.name}</h3><button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button></div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center bg-[#FDFBF7] rounded-xl border border-[#E6D5B8]"><button onClick={() => updateQuantity(item.id, -1)} className="p-2 px-3">-</button><span className="px-4 font-bold">{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} className="p-2 px-3">+</button></div>
                    <span className="font-bold text-xl">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <div className="bg-[#2A1810] text-[#E6D5B8] p-10 rounded-[3rem] shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-10 opacity-40">Summary</h3>
          <div className="flex justify-between items-center text-3xl font-bold mb-10"><span>Total</span><span className="text-white">${total.toFixed(2)}</span></div>
          <div className="space-y-4 mb-10">
            <button onClick={() => setPaymentMethod('online')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 font-bold transition-all ${paymentMethod === 'online' ? 'bg-[#8B4513] border-[#8B4513] text-white' : 'bg-[#3D2B1F] border-transparent opacity-40'}`}><CreditCard size={20}/> Card</button>
            <button onClick={() => setPaymentMethod('cash')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 font-bold transition-all ${paymentMethod === 'cash' ? 'bg-[#8B4513] border-[#8B4513] text-white' : 'bg-[#3D2B1F] border-transparent opacity-40'}`}><Banknote size={20}/> Cash</button>
          </div>
          <button onClick={onConfirm} disabled={cart.length === 0} className="w-full py-6 bg-[#E6D5B8] text-[#2A1810] rounded-2xl font-bold uppercase tracking-widest disabled:opacity-20 hover:scale-105 transition-all">Order Now</button>
        </div>
      </div>
    </div>
  </div>
);

const HistoryView: React.FC<{ history: Order[] }> = ({ history }) => (
  <div className="max-w-4xl mx-auto px-4 py-24">
    <h2 className="text-5xl font-bold text-center text-[#2A1810] font-serif mb-16">Order Status</h2>
    <div className="space-y-6">
      {history.length === 0 ? (
        <div className="text-center opacity-40 py-20"><Clock size={48} className="mx-auto mb-4" /><p>No orders yet</p></div>
      ) : (
        history.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-[#E6D5B8] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold ${getStatusStyles(order.status)}`}>#{order.id.slice(-4)}</div>
              <div><div className="text-2xl font-bold text-[#2A1810]">${order.total.toFixed(2)}</div><div className="text-sm opacity-40">{order.date} • {order.items.length} Items</div></div>
            </div>
            <div className="flex items-center gap-3">
              {order.source === 'cloud' && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Cloud size={10}/> Cloud</span>}
              <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase border ${getStatusStyles(order.status)}`}>{order.status}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const AdminLoginModal: React.FC<{ onClose: () => void; onLogin: (pw: string) => void }> = ({ onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A1810]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#FDFBF7] w-full max-w-md rounded-[2.5rem] p-10 border border-[#E6D5B8] shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-8 font-serif">Staff Access</h2>
        <form onSubmit={e => { e.preventDefault(); onLogin(password); }} className="space-y-4">
          <input type="password" placeholder="Passkey" className="w-full px-6 py-4 bg-[#FCF9F2] border border-[#E6D5B8] rounded-xl text-center tracking-[0.3em]" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-[#2A1810] text-[#E6D5B8] rounded-xl font-bold">Verify</button>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ 
  menu: MenuItem[], setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>,
  orders: Order[], setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  cloudConfig: CloudConfig, setCloudConfig: React.Dispatch<React.SetStateAction<CloudConfig>>,
  isSyncing: boolean, showToast: (m: string) => void, onClose: () => void, onLogout: () => void
}> = ({ menu, setMenu, orders, setOrders, cloudConfig, setCloudConfig, isSyncing, showToast, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminSubView>('items');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ category: 'Hot Coffee', image: '', price: 0, name: '', description: '' });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.description) return;
    const item: MenuItem = { id: Date.now().toString(), name: newItem.name, description: newItem.description, price: newItem.price || 0, category: newItem.category as Category, image: newItem.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400' };
    setMenu(prev => [item, ...prev]);
    setIsAdding(false);
    showToast(`Published ${item.name}`);
  };

  const simulateRemoteOrder = () => {
    const now = Date.now();
    const remoteOrder: Order = {
      id: `REM-${now}`,
      date: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
      items: [{ ...menu[0], quantity: 1 }],
      total: menu[0].price,
      status: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      source: 'cloud'
    };
    setOrders(prev => [remoteOrder, ...prev]);
    showToast("Incoming Order from Customer App!");
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7]">
      <aside className="w-64 bg-[#2A1810] p-8 space-y-4">
        <h1 className="text-[#E6D5B8] font-bold text-2xl mb-10 font-serif">Admin</h1>
        <button onClick={() => setActiveTab('items')} className={`w-full text-left p-4 rounded-xl font-bold transition-all ${activeTab === 'items' ? 'bg-[#8B4513] text-white' : 'text-[#E6D5B8]/40'}`}>Inventory</button>
        <button onClick={() => setActiveTab('orders')} className={`w-full text-left p-4 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#8B4513] text-white' : 'text-[#E6D5B8]/40'}`}>Queue</button>
        <button onClick={() => setActiveTab('cloud')} className={`w-full text-left p-4 rounded-xl font-bold transition-all ${activeTab === 'cloud' ? 'bg-[#8B4513] text-white' : 'text-[#E6D5B8]/40'}`}>Render & Cloud</button>
        <div className="pt-20 space-y-2">
          <button onClick={onClose} className="w-full text-left p-4 text-[#E6D5B8]/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Shop Front</button>
          <button onClick={onLogout} className="w-full text-left p-4 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><LogOut size={14}/> Sign Out</button>
        </div>
      </aside>
      <main className="flex-grow overflow-y-auto">
        <header className="p-8 border-b border-[#E6D5B8] flex justify-between items-center bg-white/50 backdrop-blur">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-[#2A1810]">{activeTab}</h2>
          {isSyncing && <div className="text-green-600 font-bold text-[10px] animate-pulse uppercase tracking-widest flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Live Syncing</div>}
        </header>
        <div className="p-10">
          {activeTab === 'items' && (
            <div className="space-y-8">
              <button onClick={() => setIsAdding(!isAdding)} className="px-8 py-3 bg-[#2A1810] text-[#E6D5B8] rounded-xl font-bold">New Item</button>
              {isAdding && (
                <form onSubmit={handleAddItem} className="bg-white p-8 rounded-[2rem] border border-[#E6D5B8] grid grid-cols-2 gap-6 shadow-sm">
                  <div className="space-y-4">
                    <input placeholder="Name" className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none" value={newItem.name} onChange={e => setNewItem(p => ({...p, name: e.target.value}))} />
                    <input type="number" placeholder="Price" className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none" value={newItem.price} onChange={e => setNewItem(p => ({...p, price: parseFloat(e.target.value)}))} />
                    <select className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none" value={newItem.category} onChange={e => setNewItem(p => ({...p, category: e.target.value as Category}))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <textarea placeholder="Description" rows={4} className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none" value={newItem.description} onChange={e => setNewItem(p => ({...p, description: e.target.value}))} />
                    <button type="submit" className="w-full py-4 bg-[#8B4513] text-white rounded-xl font-bold shadow-lg">Publish</button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menu.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#E6D5B8] flex items-center gap-4">
                    <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                    <div className="flex-grow"><div className="font-bold">{item.name}</div><div className="text-[#8B4513] font-bold">${item.price.toFixed(2)}</div></div>
                    <button onClick={() => setMenu(p => p.filter(i => i.id !== item.id))} className="p-2 text-red-200 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-[#E6D5B8] flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getStatusStyles(order.status)}`}>#{order.id.slice(-4)}</div>
                    <div><div className="font-bold">{order.items.length} Items • ${order.total.toFixed(2)}</div><div className="text-xs opacity-40">{order.date}</div></div>
                  </div>
                  <div className="flex gap-2">
                    {['preparing', 'ready', 'completed'].map(s => (
                      <button key={s} onClick={() => setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: s as any} : o))} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border ${order.status === s ? 'bg-[#2A1810] text-white' : 'border-[#E6D5B8] opacity-30'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="max-w-4xl space-y-12">
              <div className="bg-blue-600 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                <Globe className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10" size={240} />
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3"><Globe size={28}/> Render Deployment Guide</h3>
                <p className="opacity-80 mb-8 leading-relaxed">This app is optimized for Render. To link your laptop dashboard with customer phones, follow these steps:</p>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">1</div><p className="text-sm">Go to **Render Dashboard** &rarr; Select your service &rarr; **Environment** tab.</p></div>
                  <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">2</div><p className="text-sm">Add a new variable: **API_KEY** with your Gemini key from Google AI Studio.</p></div>
                  <div className="flex gap-4 items-start"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">3</div><p className="text-sm">For actual syncing between devices, enter your **Supabase URL** in the credentials section below.</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-10 rounded-[2.5rem] border border-[#E6D5B8] flex flex-col items-center text-center">
                    <Cloud className={`mb-6 ${cloudConfig.enabled ? 'text-green-500' : 'text-gray-300'}`} size={48} />
                    <h4 className="text-xl font-bold text-[#2A1810] mb-2">Supabase Sync</h4>
                    <p className="text-xs text-[#3D2B1F]/40 mb-8">This links multiple devices (laptop/phone) to the same order database.</p>
                    <button onClick={() => setCloudConfig(p => ({...p, enabled: !p.enabled}))} className={`w-full py-4 rounded-xl font-bold transition-all ${cloudConfig.enabled ? 'bg-red-50 text-red-600' : 'bg-[#2A1810] text-[#E6D5B8]'}`}>{cloudConfig.enabled ? 'Disable Sync' : 'Enable Cloud Link'}</button>
                 </div>
                 <div className="bg-white p-10 rounded-[2.5rem] border border-[#E6D5B8]">
                    <Smartphone className="mb-6 text-blue-500" size={48} />
                    <h4 className="text-xl font-bold text-[#2A1810] mb-2">Sync Simulator</h4>
                    <p className="text-xs text-[#3D2B1F]/40 mb-8">Click to simulate a customer placing an order from their phone right now.</p>
                    <button onClick={simulateRemoteOrder} disabled={!cloudConfig.enabled} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-20 transition-all hover:bg-blue-700">Simulate Phone Order</button>
                 </div>
              </div>

              {cloudConfig.enabled && (
                <div className="bg-white p-10 rounded-[3rem] border border-[#E6D5B8] space-y-6">
                  <h4 className="font-bold flex items-center gap-2"><Database size={18}/> Credentials</h4>
                  <input type="text" placeholder="Project URL" className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none font-mono text-sm" value={cloudConfig.projectUrl} onChange={e => setCloudConfig(p => ({...p, projectUrl: e.target.value}))} />
                  <input type="password" placeholder="API Key" className="w-full p-4 rounded-xl bg-[#FCF9F2] border outline-none font-mono text-sm" value={cloudConfig.apiKey} onChange={e => setCloudConfig(p => ({...p, apiKey: e.target.value}))} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
