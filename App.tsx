
import React, { useState, useEffect, useRef } from 'react';
import { 
  Coffee, ShoppingBag, X, Plus, Trash2, ArrowRight, Sparkles, 
  CheckCircle, Clock, LogOut, Settings, ShieldCheck, ChevronLeft,
  LayoutDashboard, ClipboardList, Store, Menu as MenuIcon, ChevronRight,
  Lock, Key, Package, Loader2, Check, Timer, CreditCard, Banknote, AlertCircle,
  ChevronDown, Minus
} from 'lucide-react';
import { MenuItem, Category, CartItem, Order, View, AdminSubView, CATEGORIES, PaymentMethod, PaymentStatus } from './types';
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [toast, setToast] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  
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

  const handleAdminAuth = () => {
    if (isAdmin) {
      setView('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - logoClickRef.current.lastClick < 500) {
      logoClickRef.current.count++;
    } else {
      logoClickRef.current.count = 1;
    }
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

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

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
      date: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: now,
      items: [...cart],
      total: cartTotal,
      status: 'pending',
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'paid' : 'unpaid'
    };
    setOrderHistory(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCartOpen(false);
    showToast("Order Dispatched at " + newOrder.date);
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
            <div 
              className="flex items-center space-x-2 cursor-pointer select-none group" 
              onClick={() => setView('home')}
            >
              <div 
                className="w-10 h-10 bg-[#2A1810] rounded-full flex items-center justify-center text-[#E6D5B8] active:scale-90 transition-transform hover:bg-[#3D2B1F] shadow-lg"
                onClick={(e) => { e.stopPropagation(); handleLogoClick(); }}
              >
                <Coffee size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#2A1810] font-serif">Brew & Bean</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => setView('home')} className={`text-sm font-semibold tracking-wide transition-colors ${view === 'home' ? 'text-[#8B4513] underline underline-offset-4 decoration-2' : 'text-[#3D2B1F]/60 hover:text-[#8B4513]'}`}>Home</button>
              <button onClick={() => setView('menu')} className={`text-sm font-semibold tracking-wide transition-colors ${view === 'menu' ? 'text-[#8B4513] underline underline-offset-4 decoration-2' : 'text-[#3D2B1F]/60 hover:text-[#8B4513]'}`}>Menu</button>
              <button onClick={() => setView('history')} className={`text-sm font-semibold tracking-wide transition-colors ${view === 'history' ? 'text-[#8B4513] underline underline-offset-4 decoration-2' : 'text-[#3D2B1F]/60 hover:text-[#8B4513]'}`}>Order History</button>
              <button 
                onClick={handleAdminAuth} 
                className={`flex items-center gap-1.5 text-sm font-bold transition-all px-3 py-1.5 rounded-md ${view === 'admin' ? 'bg-[#FCF9F2] text-[#2A1810] border border-[#E6D5B8]' : 'text-[#3D2B1F]/40 hover:text-[#8B4513]'}`}
              >
                <ShieldCheck size={16} />
                Admin
              </button>
            </div>

            <button 
              onClick={() => setView('cart')}
              className="relative p-2 text-[#2A1810] hover:bg-[#FCF9F2] rounded-full transition-colors"
            >
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-[#8B4513] text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-[#FDFBF7]">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </nav>
      )}

      <main className="flex-grow flex flex-col">
        {view === 'home' && (
          <HeroSection 
            onStart={() => setView('menu')} 
            onAdmin={handleAdminAuth}
            onTrack={() => setView('history')}
            isAdmin={isAdmin}
          />
        )}

        {view === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h2 className="text-4xl font-bold mb-8 text-center text-[#2A1810]">Explore Our Collection</h2>
            
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <button 
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'All' ? 'bg-[#2A1810] text-[#E6D5B8] shadow-lg' : 'bg-[#FCF9F2] border border-[#E6D5B8] text-[#3D2B1F] hover:border-[#8B4513]'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-[#2A1810] text-[#E6D5B8] shadow-lg' : 'bg-[#FCF9F2] border border-[#E6D5B8] text-[#3D2B1F] hover:border-[#8B4513]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredMenu.map(item => (
                <div key={item.id} className="group bg-[#FCF9F2] rounded-2xl overflow-hidden border border-[#E6D5B8] shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="h-56 overflow-hidden relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 bg-[#2A1810]/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-[#E6D5B8] shadow-sm">
                      {item.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-[#2A1810] leading-tight">{item.name}</h3>
                      <span className="text-[#8B4513] font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-[#3D2B1F]/60 text-sm mb-6 line-clamp-2 h-10 italic">{item.description}</p>
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-full py-3 bg-[#3D2B1F] text-[#FDFBF7] rounded-xl font-semibold hover:bg-[#2A1810] transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Plus size={18} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'history' && (
          <HistoryView history={orderHistory} />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart} 
            updateQuantity={updateCartQuantity} 
            removeFromCart={removeFromCart} 
            total={cartTotal} 
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onConfirm={confirmOrder}
            onBack={() => setView('menu')}
          />
        )}

        {view === 'admin' && isAdmin && (
          <AdminDashboard 
            menu={menu} 
            setMenu={setMenu} 
            orders={orderHistory}
            setOrders={setOrderHistory}
            showToast={showToast} 
            onClose={() => setView('home')}
            onLogout={logoutAdmin}
          />
        )}
      </main>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <AdminLoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onLogin={attemptLogin} 
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#2A1810] text-[#E6D5B8] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-[#8B4513]/50">
          <CheckCircle className="text-[#8B4513]" size={20} />
          <span className="text-sm font-medium tracking-wide uppercase">{toast}</span>
        </div>
      )}

      {showStandardUI && (
        <footer className="bg-[#2A1810] text-[#E6D5B8]/60 py-16 px-4 border-t border-[#3D2B1F] mt-20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            <div>
              <div className="flex items-center space-x-2 mb-8" onClick={handleLogoClick}>
                <div className="w-10 h-10 bg-[#3D2B1F] rounded-full flex items-center justify-center text-[#E6D5B8]">
                  <Coffee size={22} />
                </div>
                <span className="text-2xl font-bold tracking-tight text-[#FDFBF7] font-serif uppercase">Brew & Bean</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs font-light italic">
                Experience the depth of truly roasted perfection. Every bean tells a story of passion and persistence.
              </p>
            </div>
            <div>
              <h4 className="text-[#FDFBF7] font-bold mb-8 uppercase tracking-widest text-xs">Directory</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li onClick={() => setView('menu')} className="cursor-pointer hover:text-[#8B4513] transition-colors">Our Menu</li>
                <li onClick={() => setView('history')} className="cursor-pointer hover:text-[#8B4513] transition-colors">Your Orders</li>
                <li className="hover:text-[#8B4513] transition-colors cursor-pointer">Bean Origins</li>
                <li className="hover:text-[#8B4513] transition-colors cursor-pointer">Membership</li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FDFBF7] font-bold mb-8 uppercase tracking-widest text-xs">Visit Us</h4>
              <p className="text-sm mb-4 leading-relaxed">Coffee Roasters Row<br/>Ground Central, CA 90210</p>
              <p className="text-sm text-[#8B4513] font-bold">concierge@brewandbean.com</p>
              <div className="flex gap-4 mt-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 bg-[#3D2B1F] rounded-full hover:bg-[#8B4513] transition-all cursor-pointer flex items-center justify-center border border-[#FDFBF7]/10" />
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#FDFBF7]/10 flex flex-wrap justify-center items-center gap-6">
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setView('admin')}
                  className={`flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold transition-all border ${view === 'admin' ? 'bg-[#8B4513] text-white border-[#8B4513] shadow-xl' : 'bg-[#FDFBF7]/5 text-[#E6D5B8] border-[#FDFBF7]/10 hover:bg-[#FDFBF7]/10'}`}
                >
                  <Settings size={20} />
                  Staff Dashboard
                </button>
                <button 
                  onClick={logoutAdmin}
                  className="flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold bg-transparent text-red-400/60 border border-[#FDFBF7]/5 hover:border-red-900 hover:text-red-400 transition-all"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={handleAdminAuth}
                className="flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold bg-white/5 text-amber-200 border border-white/10 hover:bg-white/10 transition-all"
              >
                <ShieldCheck size={20} />
                Staff Access
              </button>
            )}
          </div>

          <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-[#FDFBF7]/5 text-[10px] tracking-[0.3em] text-center flex flex-col sm:flex-row justify-between items-center opacity-40 uppercase font-bold">
            <span>© 2024 BREW & BEAN COFFEE. ALL RIGHTS RESERVED.</span>
          </div>
        </footer>
      )}
    </div>
  );
};

// --- View Components ---

const CartView: React.FC<{ 
  cart: CartItem[], 
  updateQuantity: (id: string, d: number) => void, 
  removeFromCart: (id: string) => void, 
  total: number,
  paymentMethod: PaymentMethod,
  setPaymentMethod: (m: PaymentMethod) => void,
  onConfirm: () => void,
  onBack: () => void
}> = ({ cart, updateQuantity, removeFromCart, total, paymentMethod, setPaymentMethod, onConfirm, onBack }) => (
  <div className="max-w-6xl mx-auto px-4 py-20 w-full animate-in fade-in slide-in-from-bottom-8 duration-500">
    <button 
      onClick={onBack}
      className="flex items-center gap-2 text-[#3D2B1F]/40 hover:text-[#8B4513] font-bold uppercase tracking-widest text-xs mb-10 transition-colors"
    >
      <ChevronLeft size={16} />
      Return to Menu
    </button>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div className="lg:col-span-2 space-y-10">
        <h2 className="text-6xl font-bold text-[#2A1810]">Your Selections</h2>
        
        {cart.length === 0 ? (
          <div className="bg-[#FCF9F2] rounded-[3rem] p-24 text-center border border-[#E6D5B8]">
            <ShoppingBag size={80} strokeWidth={1} className="mx-auto text-[#E6D5B8] mb-8" />
            <h3 className="text-2xl font-bold text-[#2A1810] mb-4">Your basket is resting.</h3>
            <button 
              onClick={onBack}
              className="px-10 py-4 bg-[#2A1810] text-[#E6D5B8] rounded-2xl font-bold hover:bg-[#3D2B1F] transition-all"
            >
              Fill It Now
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.map(item => (
              <div key={item.id} className="group flex flex-col sm:flex-row gap-8 p-8 bg-[#FCF9F2] rounded-[2.5rem] border border-[#E6D5B8] transition-all hover:shadow-xl relative overflow-hidden">
                <div className="w-full sm:w-40 h-40 rounded-3xl overflow-hidden shadow-lg shrink-0">
                  <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                </div>
                <div className="flex-grow flex flex-col justify-between py-2">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-bold text-[#2A1810]">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-[#3D2B1F]/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <p className="text-[#3D2B1F]/40 italic text-sm mt-2 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl overflow-hidden p-1 shadow-inner">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-[#E6D5B8] text-[#2A1810] transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-black text-[#2A1810]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-[#E6D5B8] text-[#2A1810] transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-2xl font-black text-[#2A1810]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-32 space-y-8">
          <div className="bg-[#2A1810] text-[#E6D5B8] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#8B4513]/10 rounded-full blur-3xl" />
            
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-10 opacity-40">Valuation</h3>
            
            <div className="space-y-4 mb-10 border-b border-[#E6D5B8]/10 pb-10">
              <div className="flex justify-between font-medium opacity-60">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium opacity-60">
                <span>House Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between items-center text-3xl font-black mt-4">
                <span>Total</span>
                <span className="text-white">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('online')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'online' ? 'bg-[#8B4513] border-[#8B4513] text-white' : 'bg-[#3D2B1F] border-transparent text-[#E6D5B8]/40'}`}
                >
                  <CreditCard size={20} />
                  <span className="text-[10px] font-bold uppercase">Online</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'cash' ? 'bg-[#8B4513] border-[#8B4513] text-white' : 'bg-[#3D2B1F] border-transparent text-[#E6D5B8]/40'}`}
                >
                  <Banknote size={20} />
                  <span className="text-[10px] font-bold uppercase">Register</span>
                </button>
              </div>
              {paymentMethod === 'cash' && (
                <div className="p-4 bg-[#8B4513]/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={16} className="shrink-0 text-[#8B4513]" />
                  <p className="text-[10px] leading-relaxed font-medium">Please present your order ID at the counter to complete payment upon arrival.</p>
                </div>
              )}
            </div>

            <button 
              onClick={onConfirm}
              disabled={cart.length === 0}
              className="w-full py-6 bg-[#E6D5B8] text-[#2A1810] rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-20 disabled:grayscale"
            >
              Confirm Order
            </button>
          </div>
          
          <div className="bg-[#FCF9F2] p-8 rounded-[2.5rem] border border-[#E6D5B8] text-center">
            <p className="text-[10px] font-bold text-[#3D2B1F]/30 uppercase tracking-[0.2em] leading-relaxed">
              Every bean is small-batch roasted and hand-crafted specifically for your palate.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HistoryView: React.FC<{ history: Order[] }> = ({ history }) => {
  const [now, setNow] = useState(Date.now());
  const activeOrders = history.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = history.filter(o => o.status === 'completed' || o.status === 'cancelled');

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-24">
      <div className="mb-20 text-center">
        <h2 className="text-7xl font-bold text-[#2A1810]">Order History</h2>
        <p className="text-[#3D2B1F]/40 mt-6 italic text-xl">Tracking your artisanal coffee journey</p>
      </div>

      {activeOrders.length > 0 && (
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-3 h-3 bg-[#8B4513] rounded-full animate-ping" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#8B4513]">Current Cravings</h3>
          </div>
          <div className="space-y-10">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} isLive />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-4 mb-10">
          <div className="w-3 h-3 bg-[#3D2B1F]/20 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#3D2B1F]/40">Past Traditions</h3>
        </div>
        
        {pastOrders.length === 0 && activeOrders.length === 0 ? (
          <div className="bg-[#FCF9F2] rounded-[3rem] p-32 text-center border border-[#E6D5B8] shadow-sm">
            <Clock size={80} strokeWidth={1} className="mx-auto text-[#E6D5B8] mb-8 opacity-40" />
            <h3 className="text-2xl font-bold text-[#2A1810] mb-2">No history found.</h3>
            <p className="text-[#3D2B1F]/30 italic">Your brewing story is yet to be written.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pastOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const OrderCard: React.FC<{ order: Order; isLive?: boolean }> = ({ order, isLive }) => {
  const STAGES: Order['status'][] = ['pending', 'preparing', 'ready', 'completed'];
  const currentStageIdx = STAGES.indexOf(order.status || 'pending');

  return (
    <div className={`bg-[#FCF9F2] rounded-[3rem] border border-[#E6D5B8] overflow-hidden transition-all hover:shadow-2xl ${isLive ? 'ring-2 ring-[#8B4513]/20 shadow-xl' : 'shadow-sm grayscale-[0.5]'}`}>
      <div className="bg-white p-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E6D5B8] gap-10">
        <div className="flex items-center gap-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-lg shadow-xl border-4 border-white transition-all ${getStatusStyles(order.status)}`}>
            {order.status === 'completed' ? <Check size={32} /> : `#${order.id.split('-')[1].slice(-4)}`}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3D2B1F]/30">ID: {order.id}</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(order.status)}`}>
                {order.status || 'pending'}
              </span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                {order.paymentMethod === 'online' ? <CreditCard size={12}/> : <Banknote size={12}/>}
                {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-[#2A1810]">${order.total.toFixed(2)}</div>
              <div className="w-px h-6 bg-[#E6D5B8]" />
              <div className="flex items-center gap-2 text-[#8B4513] font-bold text-sm">
                <Clock size={16} />
                {formatRelativeTime(order.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {isLive && (
          <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
             <div className="flex items-center gap-1 w-full md:w-64 px-2">
                {STAGES.map((stage, i) => (
                  <React.Fragment key={stage}>
                    <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${i <= currentStageIdx ? 'bg-[#8B4513] border-[#8B4513] shadow-md' : 'bg-white border-[#E6D5B8]'}`}>
                      {i < currentStageIdx ? <Check size={8} className="text-white" /> : i === currentStageIdx ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> : null}
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`flex-grow h-1 rounded-full transition-all ${i < currentStageIdx ? 'bg-[#8B4513]' : 'bg-[#E6D5B8]'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B4513]">
                {order.status === 'pending' && 'Order Received'}
                {order.status === 'preparing' && 'Brewing Artistry'}
                {order.status === 'ready' && 'Awaiting Your Arrival'}
              </div>
          </div>
        )}
      </div>

      <div className="p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-5 bg-white p-4 rounded-3xl border border-[#E6D5B8] group hover:border-[#8B4513] transition-all">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm shrink-0">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
              </div>
              <div className="text-xs">
                <div className="font-black text-[#2A1810] text-sm mb-1 leading-tight">{item.name}</div>
                <div className="flex items-center gap-2 text-[#3D2B1F]/50 font-bold uppercase tracking-widest text-[10px]">
                  <span className="bg-[#8B4513] text-white px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                  ${item.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminLoginModal: React.FC<{ onClose: () => void; onLogin: (pw: string) => void }> = ({ onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2A1810]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#FDFBF7] w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-[#E6D5B8] animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#E6D5B8]/30 rounded-full transition-all text-[#2A1810]">
          <X size={24} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#2A1810] rounded-2xl flex items-center justify-center text-[#E6D5B8] mb-6 shadow-xl">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-bold text-[#2A1810] mb-2 font-serif">Staff Portal</h2>
          <p className="text-[#3D2B1F]/40 text-sm mb-8 italic">Please enter the secure house access key to manage the collection.</p>
          
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Key size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#3D2B1F]/30" />
              <input 
                ref={inputRef}
                type="password"
                placeholder="Access Key (Hint: admin)"
                className="w-full pl-14 pr-6 py-5 bg-[#FCF9F2] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none font-bold text-[#2A1810] placeholder:text-[#3D2B1F]/20 text-center tracking-[0.3em]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full py-5 bg-[#2A1810] text-[#E6D5B8] rounded-2xl font-bold hover:bg-[#3D2B1F] transition-all shadow-xl uppercase tracking-widest text-sm"
            >
              Verify Identity
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const HeroSection: React.FC<{ onStart: () => void; onAdmin: () => void; onTrack: () => void; isAdmin: boolean }> = ({ onStart, onAdmin, onTrack, isAdmin }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center text-center overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2000" 
        className="w-full h-full object-cover brightness-[0.3]"
        alt="Coffee shop atmosphere"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A1810]/50 via-[#2A1810]/20 to-[#FDFBF7]" />
    </div>
    <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-[#E6D5B8]">
      <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <span className="inline-block px-6 py-2 bg-[#2A1810]/60 backdrop-blur-md border border-[#8B4513]/30 rounded-full text-[#8B4513] text-xs font-bold tracking-[0.4em] uppercase mb-8">
          The Roast Masters
        </span>
        <h1 className="text-6xl md:text-9xl font-bold mb-8 leading-[0.85] text-[#FDFBF7]">
          Drink the <span className="text-[#8B4513] italic block mt-4">Darkness.</span>
        </h1>
        <p className="text-xl md:text-2xl text-[#E6D5B8]/80 mb-14 leading-relaxed font-light max-w-2xl mx-auto italic">
          Indulge in the bold, rich complexities of artisan coffee curated for the true connoisseur.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <button 
            onClick={onStart}
            className="group w-full sm:w-auto px-14 py-6 bg-[#8B4513] text-[#FDFBF7] rounded-2xl text-xl font-bold hover:bg-[#2A1810] hover:text-[#E6D5B8] transition-all flex items-center justify-center gap-3 shadow-[0_25px_50px_rgba(42,24,16,0.4)] border border-[#8B4513]"
          >
            ORDER NOW
            <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
          
          <button 
            onClick={onTrack}
            className="group w-full sm:w-auto px-14 py-6 bg-[#FDFBF7]/5 backdrop-blur-xl text-[#FDFBF7] border border-[#FDFBF7]/20 rounded-2xl text-xl font-bold hover:bg-[#FDFBF7]/10 transition-all flex items-center justify-center gap-3"
          >
            <Timer size={22} className="text-[#8B4513]" />
            ORDER HISTORY
          </button>
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC<{ 
  menu: MenuItem[], 
  setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>,
  orders: Order[],
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
  showToast: (m: string) => void,
  onClose: () => void,
  onLogout: () => void
}> = ({ menu, setMenu, orders, setOrders, showToast, onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminSubView>('items');
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    category: 'Hot Coffee',
    image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400',
    price: 0,
    name: '',
    description: ''
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.description || newItem.price === undefined) return;
    
    const item: MenuItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category as Category,
      image: newItem.image || 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400'
    };
    
    setMenu(prev => [item, ...prev]);
    setIsAdding(false);
    setNewItem({
      category: 'Hot Coffee',
      image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=400',
      price: 0,
      name: '',
      description: ''
    });
    showToast(`Added ${item.name} to menu`);
  };

  const handleAiGenerate = async () => {
    if (!newItem.name) {
      showToast("Title required for AI");
      return;
    }
    setIsGenerating(true);
    const desc = await generateDescription(newItem.name, newItem.category || 'Coffee');
    setNewItem(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const deleteItem = (id: string) => {
    if(confirm("Retire this item?")) {
      setMenu(prev => prev.filter(i => i.id !== id));
      showToast("Item retired");
    }
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast(`Order updated to: ${status}`);
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus: status } : o));
    showToast(`Payment marked as ${status}`);
  };

  const STAGES: Order['status'][] = ['pending', 'preparing', 'ready', 'completed'];

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFBF7] animate-in fade-in duration-500">
      <aside className="w-72 bg-[#2A1810] flex flex-col shadow-2xl z-50">
        <div className="p-8 border-b border-[#3D2B1F] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8B4513] rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-[#FDFBF7] font-bold text-xl tracking-tight">Admin Portal</h1>
            <p className="text-[#8B4513] text-[10px] font-bold tracking-[0.2em] uppercase">Management Mode</p>
          </div>
        </div>

        <nav className="flex-grow py-8 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('items')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'items' ? 'bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20' : 'text-[#E6D5B8]/40 hover:bg-[#3D2B1F] hover:text-[#E6D5B8]'}`}
          >
            <MenuIcon size={20} />
            Menu Items
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'orders' ? 'bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20' : 'text-[#E6D5B8]/40 hover:bg-[#3D2B1F] hover:text-[#E6D5B8]'}`}
          >
            <ClipboardList size={20} />
            Order Queue
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'settings' ? 'bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20' : 'text-[#E6D5B8]/40 hover:bg-[#3D2B1F] hover:text-[#E6D5B8]'}`}
          >
            <Settings size={20} />
            Preferences
          </button>
        </nav>

        <div className="p-8 border-t border-[#3D2B1F] space-y-3">
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FDFBF7]/5 text-[#E6D5B8] border border-[#FDFBF7]/10 rounded-2xl hover:bg-[#FDFBF7]/10 transition-all font-bold text-sm"
          >
            <Store size={18} />
            View Shop
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-400/60 hover:text-red-400 transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <section className="flex-grow overflow-y-auto bg-[#FDFBF7] relative">
        <header className="sticky top-0 z-30 bg-[#FDFBF7]/80 backdrop-blur-md px-10 py-8 border-b border-[#E6D5B8] flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#2A1810] uppercase tracking-tight">
              {activeTab === 'items' && 'Collection Management'}
              {activeTab === 'orders' && 'Live Order Stream'}
              {activeTab === 'settings' && 'Shop Configuration'}
            </h2>
            <p className="text-[#3D2B1F]/40 italic text-sm mt-1">
              {activeTab === 'items' && 'Curating the house specialties and signature blends.'}
              {activeTab === 'orders' && 'Real-time fulfillment and order tracking.'}
              {activeTab === 'settings' && 'Fine-tuning the digital cafe experience.'}
            </p>
          </div>
          
          {activeTab === 'items' && (
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-8 py-4 bg-[#2A1810] text-[#E6D5B8] rounded-2xl font-bold shadow-xl hover:bg-[#3D2B1F] transition-all"
            >
              {isAdding ? <X size={20} /> : <Plus size={20} />}
              {isAdding ? 'Close Editor' : 'Create New Item'}
            </button>
          )}

          {activeTab === 'orders' && (
             <div className="flex items-center gap-4 px-6 py-2 bg-[#FCF9F2] border border-[#E6D5B8] rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3D2B1F]/40 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Stream
                </div>
                <div className="w-px h-4 bg-[#E6D5B8]" />
                <div className="text-xs font-bold text-[#2A1810]">
                  {orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length} Active
                </div>
             </div>
          )}
        </header>

        <div className="p-10">
          {activeTab === 'items' && (
            <div className="animate-in fade-in duration-500">
              {isAdding && (
                <div className="bg-[#FCF9F2] p-10 rounded-[2.5rem] border border-[#E6D5B8] shadow-2xl mb-12 animate-in slide-in-from-top-12">
                  <form onSubmit={handleAddItem} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Signature Name</label>
                        <input 
                          type="text" required placeholder="Item title..."
                          className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none font-bold text-[#2A1810]"
                          value={newItem.name}
                          onChange={e => setNewItem(p => ({...p, name: e.target.value}))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Price Point</label>
                          <input 
                            type="number" step="0.01" required
                            className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none font-bold text-[#2A1810]"
                            value={newItem.price}
                            onChange={e => setNewItem(p => ({...p, price: parseFloat(e.target.value)}))}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Category</label>
                          <select 
                            className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none font-bold text-[#2A1810]"
                            value={newItem.category}
                            onChange={e => setNewItem(p => ({...p, category: e.target.value as Category}))}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Image Source</label>
                        <input 
                          type="text" placeholder="Visual reference URL..."
                          className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none font-bold text-[#2A1810]"
                          value={newItem.image}
                          onChange={e => setNewItem(p => ({...p, image: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em]">Flavor Profile</label>
                          <button 
                            type="button" onClick={handleAiGenerate} disabled={isGenerating}
                            className="text-[9px] flex items-center gap-2 bg-[#FDFBF7] text-[#8B4513] px-3 py-1.5 rounded-full font-bold border border-[#E6D5B8] uppercase tracking-widest hover:bg-[#E6D5B8]/20 transition-all"
                          >
                            <Sparkles size={12} />
                            {isGenerating ? 'Drafting...' : 'AI Compose'}
                          </button>
                        </div>
                        <textarea 
                          required rows={6} placeholder="Describe the aromatic depth..."
                          className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl focus:ring-2 focus:ring-[#8B4513] outline-none resize-none font-medium text-[#2A1810]"
                          value={newItem.description}
                          onChange={e => setNewItem(p => ({...p, description: e.target.value}))}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-5 bg-[#2A1810] text-[#E6D5B8] rounded-[2rem] font-bold hover:bg-[#3D2B1F] shadow-2xl transition-all uppercase tracking-widest"
                      >
                        Publish to Menu
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-[#FCF9F2] rounded-[2.5rem] border border-[#E6D5B8] shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FDFBF7] text-[#3D2B1F]/30 uppercase text-[9px] font-bold tracking-[0.3em]">
                    <tr>
                      <th className="px-10 py-6">Identity</th>
                      <th className="px-10 py-6">Collection</th>
                      <th className="px-10 py-6">Valuation</th>
                      <th className="px-10 py-6 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D5B8]/30">
                    {menu.map(item => (
                      <tr key={item.id} className="hover:bg-[#FDFBF7]/60 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-6">
                            <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-2 ring-[#FDFBF7]" alt={item.name} />
                            <div>
                              <div className="font-bold text-[#2A1810] text-lg mb-0.5">{item.name}</div>
                              <div className="text-[11px] text-[#3D2B1F]/40 max-w-sm truncate italic">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-[9px] font-bold px-3 py-1.5 bg-[#FDFBF7] text-[#8B4513] rounded-full border border-[#E6D5B8] uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-10 py-6 font-bold text-[#2A1810] text-lg">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-3 text-[#E6D5B8] hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              {orders.length === 0 ? (
                <div className="bg-[#FCF9F2] rounded-[2.5rem] p-32 text-center border border-[#E6D5B8]">
                  <ClipboardList size={64} className="mx-auto text-[#E6D5B8] mb-6 opacity-30" />
                  <h3 className="text-2xl font-bold text-[#2A1810]">Order queue is quiet</h3>
                  <p className="text-[#3D2B1F]/30 italic mt-2">New incoming orders will manifest here.</p>
                </div>
              ) : (
                orders.map(order => {
                  const currentStageIdx = STAGES.indexOf(order.status || 'pending');
                  
                  return (
                    <div key={order.id} className="bg-[#FCF9F2] rounded-[2.5rem] border border-[#E6D5B8] shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl">
                      <div className="bg-[#FDFBF7] px-8 py-6 flex justify-between items-center border-b border-[#E6D5B8]">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white shadow-lg transition-all ${getStatusStyles(order.status)}`}>
                            {order.status === 'completed' ? <Check size={24} /> : order.id.split('-')[1].slice(-4)}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-[#3D2B1F]/30 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                              REF: {order.id}
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${getStatusStyles(order.status)}`}>
                                {order.status || 'pending'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {order.paymentMethod === 'online' ? <CreditCard size={10}/> : <Banknote size={10}/>}
                                {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer size={14} className="text-[#8B4513]" />
                              <div className="text-sm font-semibold text-[#8B4513]">{formatRelativeTime(order.createdAt)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            {order.status !== 'completed' && order.status !== 'cancelled' ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1 w-64 px-4">
                                  {STAGES.map((stage, i) => (
                                    <React.Fragment key={stage}>
                                      <div className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${i <= currentStageIdx ? 'bg-[#8B4513] border-[#8B4513] shadow-md' : 'bg-white border-[#E6D5B8]'}`}>
                                        {i < currentStageIdx ? <Check size={8} className="text-white" /> : i === currentStageIdx ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> : null}
                                      </div>
                                      {i < STAGES.length - 1 && (
                                        <div className={`flex-grow h-1 rounded-full transition-all ${i < currentStageIdx ? 'bg-[#8B4513]' : 'bg-[#E6D5B8]'}`} />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                                
                                <div className="flex items-center gap-2 p-1 bg-[#FDFBF7] rounded-2xl border border-[#E6D5B8] shadow-inner">
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                                    disabled={order.status === 'preparing' || order.status === 'ready'}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${order.status === 'preparing' || order.status === 'ready' ? 'bg-[#8B4513] text-white' : 'hover:bg-[#FCF9F2] text-[#3D2B1F]/40'}`}
                                  >
                                    <Loader2 size={14} className={order.status === 'preparing' ? 'animate-spin' : ''} />
                                    Preparing
                                  </button>
                                  <ChevronRight size={14} className="text-[#E6D5B8]" />
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'ready')}
                                    disabled={order.status === 'ready'}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${order.status === 'ready' ? 'bg-green-700 text-white shadow-md' : 'hover:bg-[#FCF9F2] text-[#3D2B1F]/40'}`}
                                  >
                                    <Package size={14} />
                                    Ready
                                  </button>
                                  <ChevronRight size={14} className="text-[#E6D5B8]" />
                                  <button 
                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-gray-100 text-gray-500"
                                  >
                                    <CheckCircle size={14} />
                                    Complete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 px-6 py-3 bg-[#FCF9F2] border border-[#E6D5B8] rounded-2xl">
                                {order.status === 'completed' ? (
                                  <>
                                    <CheckCircle size={20} className="text-green-600" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">Fulfilled</span>
                                  </>
                                ) : (
                                  <>
                                    <X size={20} className="text-red-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Cancelled</span>
                                  </>
                                )}
                              </div>
                            )}

                            <div className="flex flex-col gap-1 ml-4 border-l border-[#E6D5B8] pl-4">
                              {order.paymentStatus === 'unpaid' && (
                                <button 
                                  onClick={() => updatePaymentStatus(order.id, 'paid')}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm"
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                disabled={order.status === 'completed' || order.status === 'cancelled'}
                                className="p-3 text-[#3D2B1F]/20 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                              >
                                <Trash2 size={22} />
                              </button>
                            </div>
                          </div>

                          <div className="text-3xl font-bold text-[#2A1810] ml-6 border-l border-[#E6D5B8] pl-10">${order.total.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="p-8 bg-[#FCF9F2]/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-[#E6D5B8] group/item hover:border-[#8B4513] transition-all shadow-sm">
                              <img src={item.image} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover/item:scale-105 transition-transform" alt="" />
                              <div className="text-xs">
                                <div className="font-black text-[#2A1810] text-sm line-clamp-1 mb-1">{item.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#8B4513] text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">x{item.quantity}</span>
                                  <span className="text-[#3D2B1F]/40 font-medium">${item.price.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 max-w-2xl">
              <div className="bg-[#FCF9F2] p-10 rounded-[2.5rem] border border-[#E6D5B8] space-y-10">
                <section>
                  <h4 className="text-[#2A1810] font-bold mb-6 flex items-center gap-2">
                    <Store size={20} className="text-[#8B4513]" />
                    General Store Info
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Digital Cafe Title</label>
                      <input type="text" defaultValue="Brew & Bean Digital Cafe" className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl outline-none font-bold text-[#2A1810]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#3D2B1F]/40 uppercase tracking-[0.2em] mb-3">Street Address</label>
                      <input type="text" defaultValue="Coffee Roasters Row, Ground Central, CA" className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E6D5B8] rounded-2xl outline-none font-bold text-[#2A1810]" />
                    </div>
                  </div>
                </section>
                <div className="pt-6">
                  <button className="w-full py-5 bg-[#2A1810] text-[#E6D5B8] rounded-[2rem] font-bold shadow-xl transition-all uppercase tracking-widest text-sm">
                    Persist Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default App;
