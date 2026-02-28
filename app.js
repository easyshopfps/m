// ===== togglePw =====
function togglePw(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else { input.type = 'password'; icon.className = 'fas fa-eye'; }
}

// ===== slideAnimate =====
    // ===== SLIDE ANIMATE — ต้องกำหนดก่อน app ทุกอย่าง =====
    function slideAnimate(selector) {
        const items = typeof selector === 'string'
            ? document.querySelectorAll(selector)
            : selector;
        if(!items || !items.length) return;
        // Reset: ซ่อนทั้งหมดก่อน ให้ animation เริ่มใหม่
        items.forEach(el => el.classList.remove('visible'));
        let globalIdx = 0;
        const obs = new IntersectionObserver((entries, o) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const delay = globalIdx * 100; // stagger 100ms
                    globalIdx++;
                    setTimeout(() => entry.target.classList.add('visible'), delay);
                    o.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
        items.forEach(el => obs.observe(el));
        // Fallback 3s
        setTimeout(() => {
            items.forEach((el, i) => {
                if (!el.classList.contains('visible')) {
                    setTimeout(() => el.classList.add('visible'), i * 100);
                }
            });
        }, 3000);
    }

// ===== Main App =====
        /*
        =========================================
        🔥 คำแนะนำการตั้งค่า API & DATABASE 🔥
        =========================================
        
        📌 ขั้นตอนการตั้งค่า Supabase:
        
        1. สร้างโปรเจค Supabase ใหม่ที่ https://supabase.com
        2. ไปที่ Project Settings > API
        3. คัดลอก URL และ anon/public key
        4. แทนที่ค่า SUPABASE_URL และ SUPABASE_KEY ด้านล่าง
        
        📋 ตารางที่ต้องสร้างใน Supabase (Table Editor):
        
        ✅ 1. categories (ໝວດໝູ່ສິນຄ້າ)
           CREATE TABLE categories (
             id BIGSERIAL PRIMARY KEY,
             name TEXT NOT NULL,
             image_url TEXT,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 2. products (ສິນຄ້າ)
           CREATE TABLE products (
             id BIGSERIAL PRIMARY KEY,
             name TEXT NOT NULL,
             price NUMERIC NOT NULL,
             description TEXT,
             image_url TEXT,
             category_id BIGINT REFERENCES categories(id),
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 3. site_users (ສະມາຊິກ)
           CREATE TABLE site_users (
             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
             username TEXT UNIQUE NOT NULL,
             password TEXT NOT NULL,
             pin TEXT,
             avatar_url TEXT,
             balance NUMERIC DEFAULT 0,
             total_spent NUMERIC DEFAULT 0,
             status TEXT DEFAULT 'active',
             created_at TIMESTAMPTZ DEFAULT NOW(),
             last_login TIMESTAMPTZ
           );
        
        ✅ 4. admins (ຜູ້ດູແລລະບົບ)
           CREATE TABLE admins (
             id BIGSERIAL PRIMARY KEY,
             username TEXT UNIQUE NOT NULL,
             password TEXT NOT NULL,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 5. topup_requests (ລາຍການເຕີມເງິນ)
           CREATE TABLE topup_requests (
             id BIGSERIAL PRIMARY KEY,
             user_id UUID REFERENCES site_users(id),
             amount NUMERIC NOT NULL,
             slip_url TEXT,
             status TEXT DEFAULT 'pending',
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 6. redeem_codes (ໂຄດເຕີມເງິນ)
           CREATE TABLE redeem_codes (
             id BIGSERIAL PRIMARY KEY,
             code TEXT UNIQUE NOT NULL,
             amount NUMERIC NOT NULL,
             used_by UUID REFERENCES site_users(id),
             used_at TIMESTAMPTZ,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 7. orders (ປະຫວັດການສັ່ງຊື້)
           CREATE TABLE orders (
             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
             user_id UUID REFERENCES site_users(id),
             product_name TEXT,
             product_price NUMERIC,
             quantity INT DEFAULT 1,
             total_amount NUMERIC,
             status TEXT DEFAULT 'pending',
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ NEW: spin_prizes (ລາງວັນວົງລໍ້)
           CREATE TABLE spin_prizes (
             id BIGSERIAL PRIMARY KEY,
             type TEXT NOT NULL DEFAULT 'cash', -- cash | product | custom | miss
             display_name TEXT NOT NULL,
             amount NUMERIC DEFAULT 0,
             product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
             img_url TEXT,
             pct NUMERIC DEFAULT 10,
             stock INTEGER DEFAULT 0,
             stock_used INTEGER DEFAULT 0,
             color TEXT DEFAULT '#ff4444',
             emoji TEXT,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
           
        ✅ NEW: spin_history (ປະຫວັດວົງລໍ້)
           CREATE TABLE spin_history (
             id BIGSERIAL PRIMARY KEY,
             user_id BIGINT REFERENCES site_users(id) ON DELETE CASCADE,
             username TEXT,
             prize_id BIGINT,
             prize_name TEXT,
             prize_type TEXT,
             prize_amount NUMERIC DEFAULT 0,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );

        ✅ NEW: spin_config (ຕັ້ງຄ່າວົງລໍ້)
           CREATE TABLE spin_config (
             id BIGSERIAL PRIMARY KEY,
             description TEXT,
             how_to TEXT,
             threshold NUMERIC DEFAULT 200000,
             updated_at TIMESTAMPTZ DEFAULT NOW()
           );

        ✅ NEW: columns ໃນ site_users:
           ALTER TABLE site_users ADD COLUMN IF NOT EXISTS spin_tickets INTEGER DEFAULT 0;
           ALTER TABLE site_users ADD COLUMN IF NOT EXISTS spin_progress NUMERIC DEFAULT 0;

        ✅ NEW: RLS ສຳລັບ tables ໃໝ່:
           ALTER TABLE spin_prizes ENABLE ROW LEVEL SECURITY;
           ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;
           ALTER TABLE spin_config ENABLE ROW LEVEL SECURITY;
           CREATE POLICY "read_spin_prizes" ON spin_prizes FOR SELECT USING (true);
           CREATE POLICY "read_spin_history" ON spin_history FOR SELECT USING (true);
           CREATE POLICY "read_spin_config" ON spin_config FOR SELECT USING (true);

        ✅ 8. popup_ads (ໂຄສະນາ Popup)
           CREATE TABLE popup_ads (
             id BIGSERIAL PRIMARY KEY,
             image_url TEXT NOT NULL,
             active BOOLEAN DEFAULT true,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 9. hot_products (ສິນຄ້າຂາຍດີ)
           CREATE TABLE hot_products (
             id BIGSERIAL PRIMARY KEY,
             product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
             active BOOLEAN DEFAULT true,
             created_at TIMESTAMPTZ DEFAULT NOW()
           );
        
        ✅ 10. settings (ການຕັ້ງຄ່າລະບົບ)
           CREATE TABLE settings (
             id BIGSERIAL PRIMARY KEY,
             key TEXT UNIQUE NOT NULL,
             value JSONB,
             updated_at TIMESTAMPTZ DEFAULT NOW()
           );
           
           -- ຂໍ້ມູນເລີ່ມຕົ້ນສຳລັບ settings:
           INSERT INTO settings (id, key, value) VALUES
           (1, 'contact', '{"wa":"8562012345678","tt":"https://tiktok.com/@yourshop","fb":"https://facebook.com/yourshop"}');
        
        🔒 การตั້งค่า RLS (Row Level Security):
        
        -- ເປີດ RLS ສຳລັບທຸກຕາລາງ:
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE hot_products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE popup_ads ENABLE ROW LEVEL SECURITY;
        ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
        
        -- ອະນຸຍາດໃຫ້ທຸກຄົນອ່ານຂໍ້ມູນສາທາລະນະໄດ້:
        CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
        CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
        CREATE POLICY "Enable read access for all users" ON hot_products FOR SELECT USING (true);
        CREATE POLICY "Enable read access for all users" ON popup_ads FOR SELECT USING (true);
        CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);
        
        💾 Storage (ເກັບຮູບພາບສລິບ):
        
        1. ໄປທີ່ Storage > Create a new bucket
        2. ຊື່: "slips"
        3. ເລືອກ Public bucket (ຖ້າຕ້ອງການໃຫ້ເຂົ້າເຖິງໄດ້)
        4. ຕັ້ງຄ່າ CORS ຖ້າຈຳເປັນ
        
        📝 ຄຳແນະນຳເພີ່ມເຕີມ:
        - ສ້າງ admin ຄົນທຳອິດໂດຍໃສ່ຂໍ້ມູນໂດຍກົງໃນຕາລາງ admins
        - ທົດສອບການເຊື່ອມຕໍ່ຫຼັງຈາກຕັ້ງຄ່າ API keys
        - ກວດສອບ Console ຖ້າມີຂໍ້ຜິດພາດ
        
        =========================================
        */
        
        // Configuration - ⚠️ ແກ້ໄຂຄ່າເຫຼົ່ານີ້ເປັນຂອງທ່ານເອງ
        const SUPABASE_URL = 'https://qdzurrtniagbkfbcougk.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkenVycnRuaWFnYmtmYmNvdWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mzg0OTksImV4cCI6MjA4NjExNDQ5OX0.psyh10Xm4cOQKt0z7NiObHImWYJ4_5lu-ZU3UhUmrLs';
        const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        let activeProduct = null;
        let currentUser = null;
        let selectedAmount = null;

        // ========================================
        // NOTIFICATION SYSTEM (แทน alert)
        // ========================================
        const NotificationManager = {
            container: null,
            
            init() {
                this.container = document.getElementById('notification-container');
            },
            
            show(message, type = 'success', title = null, duration = 4000) {
                const icons = {
                    success: 'fa-check-circle',
                    error: 'fa-exclamation-circle',
                    warning: 'fa-exclamation-triangle',
                    info: 'fa-info-circle'
                };
                
                const titles = {
                    success: 'ສຳເລັດ!',
                    error: 'ຜິດພາດ!',
                    warning: 'ແຈ້ງເຕືອນ!',
                    info: 'ຂໍ້ມູນ'
                };
                
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `
                    <div class="notification-icon">
                        <i class="fas ${icons[type]}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${title || titles[type]}</div>
                        <div class="notification-message">${message}</div>
                    </div>
                    <div class="notification-close">
                        <i class="fas fa-times"></i>
                    </div>
                `;
                
                this.container.appendChild(notification);
                
                notification.querySelector('.notification-close').onclick = () => {
                    this.remove(notification);
                };
                
                if (duration > 0) {
                    setTimeout(() => this.remove(notification), duration);
                }
                
                return notification;
            },
            
            remove(notification) {
                notification.classList.add('removing');
                setTimeout(() => notification.remove(), 300);
            },
            
            success(message, title) {
                return this.show(message, 'success', title);
            },
            
            error(message, title) {
                return this.show(message, 'error', title);
            },
            
            warning(message, title) {
                return this.show(message, 'warning', title);
            },
            
            info(message, title) {
                return this.show(message, 'info', title);
            }
        };

        // เริ่มต้น Notification System
        NotificationManager.init();


        // Snow removed

        // ===== HERO SLIDESHOW =====
        const heroSlider = {
            _timer: null,
            _current: 0,
            _total: 0,
            start: function(total) {
                this._total = total;
                this._current = 0;
                clearInterval(this._timer);
                if(total <= 1) return;
                this._timer = setInterval(() => {
                    this._current = (this._current + 1) % this._total;
                    this.goTo(this._current);
                }, 4000);
            },
            goTo: function(idx) {
                this._current = idx;
                const slides = document.querySelectorAll('#hero .hero-slide');
                const dots = document.querySelectorAll('#hero .hero-dot');
                slides.forEach((s, i) => s.classList.toggle('active', i === idx));
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            },
            stop: function() { clearInterval(this._timer); }
        };

        // ===== POPUP SYSTEM =====
        const popupSystem = {
            popups: [],
            currentIndex: 0,

            init: function(popupList) {
                this.popups = popupList.sort((a, b) => a.order - b.order);
                this.currentIndex = 0;
                if (this.popups.length > 0) {
                    this.show();
                }
            },

            show: function() {
                if (this.currentIndex >= this.popups.length) return;

                const popup = this.popups[this.currentIndex];
                const container = document.getElementById('popup-system');
                const overlay = document.createElement('div');
                overlay.className = 'popup-overlay';

                // custom image/link popup
                if (popup.custom_img) {
                    const linkOpen = popup.custom_link 
                        ? `window.open('${popup.custom_link}', '_blank')` 
                        : 'popupSystem.close()';
                    overlay.innerHTML = `
                        <div class="popup-container">
                            <button class="popup-close" onclick="popupSystem.close()">✕</button>
                            <img src="${popup.custom_img}" class="popup-image" onclick="${linkOpen}" alt="Popup" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'"
                                style="cursor:${popup.custom_link ? 'pointer' : 'default'}">
                            ${popup.custom_link ? `<div style="text-align:center; padding:8px 0 4px; font-size:12px; color:#aaa;">ກົດຮູບເພື່ອເບິ່ງຕື່ມ</div>` : ''}
                        </div>
                    `;
                } else {
                    // product popup
                    const product = app.db.products.find(p => p.id === popup.product_id);
                    if (!product) {
                        this.currentIndex++;
                        if (this.currentIndex < this.popups.length) { this.show(); }
                        return;
                    }
                    overlay.innerHTML = `
                        <div class="popup-container">
                            <button class="popup-close" onclick="popupSystem.close()">✕</button>
                            <img src="${product.img}" class="popup-image" onclick="popupSystem.navigate(${product.id})" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                        </div>
                    `;
                }
                
                container.innerHTML = '';
                container.appendChild(overlay);
                document.body.style.overflow = 'hidden';
            },

            close: function() {
                document.getElementById('popup-system').innerHTML = '';
                document.body.style.overflow = 'auto';
                
                this.currentIndex++;
                if (this.currentIndex < this.popups.length) {
                    setTimeout(() => this.show(), 200);
                }
            },

            navigate: function(productId) {
                this.close();
                setTimeout(() => {
                    router.detail(productId);
                }, 300);
            }
        };

        const router = {
            history: [],
            home: () => { 
                router.show('view-home'); 
                app.renderHome();
                app.setActiveNav('home');
            },
            all: () => {
                document.getElementById('list-title').innerText = "ສິນຄ້າທັງໝົດ";
                const hotIds = app.db.hot_deals.products || [];
                const sorted = [...app.db.products].sort((a,b) => {
                    return (hotIds.includes(a.id)?0:1) - (hotIds.includes(b.id)?0:1);
                });
                app.renderProds(sorted, 'list-prods');
                router.show('view-list');
                app.setActiveNav('shop');
            },
            cat: (id) => {
                const c = app.db.categories.find(x => x.id == id);
                document.getElementById('list-title').innerText = "ໝວດ: " + (c ? c.name : "");
                const hotIds = app.db.hot_deals.products || [];
                const catProds = app.db.products.filter(p => p.catid == id);
                const sorted = [...catProds].sort((a,b) => {
                    return (hotIds.includes(a.id)?0:1) - (hotIds.includes(b.id)?0:1);
                });
                app.renderProds(sorted, 'list-prods');
                router.show('view-list');
            },
            detail: (id) => {
                const p = app.db.products.find(x => x.id == id);
                if(!p) return;
                activeProduct = p;
                document.getElementById('det-img').src = p.img;
                document.getElementById('det-title').innerText = p.name;
                document.getElementById('det-price').innerText = Number(p.price).toLocaleString() + " ₭";
                document.getElementById('det-desc').innerText = p.desc;
                
                // แสดง Stock ใต้ราคาทันที
                app._updateDetailStockUI(p);
                
                router.show('view-detail');
            },
            admin: () => { 
                router.show('view-admin'); 
                app.renderAdmin(); 
            },
            show: (id) => {
                // เฉพาะหน้าหลักที่ควรมี page transition
                const MAIN_VIEWS = ['view-home', 'view-list', 'view-detail'];
                const active = document.querySelector('.page-view:not(.hidden)');
                const useTransition = MAIN_VIEWS.includes(id) && active && active.id !== id && MAIN_VIEWS.includes(active.id);

                const doShow = () => {
                    if(active && active.id !== id) router.history.push(active.id);
                    document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
                    document.getElementById(id).classList.remove('hidden');
                    window.scrollTo(0, 0);
                };

                const mask = document.getElementById('page-transition-mask');
                if(mask && useTransition) {
                    mask.classList.add('fading-in');
                    mask.classList.remove('fading-out');
                    setTimeout(() => {
                        doShow();
                        mask.classList.remove('fading-in');
                        mask.classList.add('fading-out');
                    }, 220);
                } else {
                    doShow();
                }
            },
            back: () => {
                const prev = router.history.pop() || 'view-home';
                // กดกลับไม่ต้องมี transition — ให้รู้สึก instant
                const active = document.querySelector('.page-view:not(.hidden)');
                document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
                document.getElementById(prev).classList.remove('hidden');
                window.scrollTo(0, 0);
            }
        };

        const app = {
            db: { 
                settings: { banner: "", contact: { wa: "", tt: "", fb: "" } }, 
                categories: [], 
                products: [], 
                users: [],
                site_users: [],
                popups: [],
                hot_deals: { categories: [], products: [] },
                redeem_codes: [],
                topup_requests: [],
                orders: []
            },
            
            init: async function() {
                this.loading(true);

                // PHASE 1: โหลดเฉพาะที่จำเป็น ยิงพร้อมกันทีเดียว
                const [popRes, stRes, ctRes, pdRes, hotRes] = await Promise.all([
                    _supabase.from('popups').select('*').order('order', { ascending: true }),
                    _supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
                    _supabase.from('categories').select('*'),
                    _supabase.from('products').select('*').order('created_at', { ascending: false }),
                    _supabase.from('hot_deals').select('*'),
                ]);

                if(stRes.data && stRes.data.data) this.db.settings = stRes.data.data;
                if(ctRes.data) this.db.categories = ctRes.data;
                if(pdRes.data) this.db.products = pdRes.data;
                if(popRes.data) this.db.popups = popRes.data;
                if(hotRes.data) {
                    this.db.hot_deals = {
                        categories: hotRes.data.filter(d => d.type === 'category').map(d => d.item_id),
                        products: hotRes.data.filter(d => d.type === 'product').map(d => d.item_id)
                    };
                }

                await this.loadUserSession();
                this.renderHome();

                this.loading(false);
                localStorage.removeItem('adminLogin');

                // รอรูป category แรกโหลดเสร็จก่อน แล้วค่อยปิด loading
                const _hideLoading = () => {
                    const ls = document.getElementById('loading-screen');
                    if(ls && !ls.classList.contains('hide')) {
                        ls.classList.add('hide');
                        // หลัง fade out เสร็จ ค่อยเปิด popup (ถ้ามี) — popup จะ preload รูปก่อน show เอง
                        setTimeout(() => {
                            ls.style.display = 'none';
                            if(this.db.popups && this.db.popups.length > 0) {
                                // preload popup images before init
                                const firstPopup = this.db.popups[0];
                                const firstImgSrc = firstPopup.custom_img || (() => {
                                    const p = this.db.products.find(x => x.id === firstPopup.product_id);
                                    return p ? p.img : null;
                                })();
                                if(firstImgSrc) {
                                    const pre = new Image();
                                    pre.onload = pre.onerror = () => popupSystem.init(this.db.popups);
                                    pre.src = firstImgSrc;
                                    setTimeout(() => popupSystem.init(this.db.popups), 5000); // safety
                                } else {
                                    popupSystem.init(this.db.popups);
                                }
                            }
                        }, 550);
                    }
                };
                const _firstImg = document.querySelector('#cat-list-home img:not(.hot-badge)');
                if(_firstImg && !_firstImg.complete) {
                    _firstImg.addEventListener('load', _hideLoading, { once: true });
                    _firstImg.addEventListener('error', _hideLoading, { once: true });
                    setTimeout(_hideLoading, 3500); // fallback
                } else {
                    requestAnimationFrame(() => requestAnimationFrame(_hideLoading));
                }

                // PHASE 2: โหลดส่วนที่เหลือ background ไม่บล็อก UI
                Promise.all([
                    _supabase.from('users').select('*'),
                    _supabase.from('site_users').select('*').order('created_at', { ascending: false }),
                    _supabase.from('redeem_codes').select('*'),
                    _supabase.from('topup_requests').select('*').order('created_at', { ascending: false }),
                    _supabase.from('orders').select('*').order('created_at', { ascending: false }),
                ]).then(([usRes, suRes, codeRes, topupRes, orderRes]) => {
                    if(usRes.data) this.db.users = usRes.data;
                    if(suRes.data) this.db.site_users = suRes.data;
                    if(codeRes.data) this.db.redeem_codes = codeRes.data;
                    if(topupRes.data) this.db.topup_requests = topupRes.data;
                    if(orderRes.data) this.db.orders = orderRes.data;
                });

                this.loadAnnouncement();
            },

            loading: (show) => document.getElementById('loader').style.display = show ? 'block' : 'none',

            fetchData: async function() {
                // โหลดทุกอย่างพร้อมกัน (parallel) แทน sequential
                const [stR, ctR, pdR, usR, suR, popR, codeR, topupR, orderR, hotR] = await Promise.all([
                    _supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
                    _supabase.from('categories').select('*'),
                    _supabase.from('products').select('*').order('created_at', { ascending: false }),
                    _supabase.from('users').select('*'),
                    _supabase.from('site_users').select('*').order('created_at', { ascending: false }),
                    _supabase.from('popups').select('*').order('order', { ascending: true }),
                    _supabase.from('redeem_codes').select('*'),
                    _supabase.from('topup_requests').select('*').order('created_at', { ascending: false }),
                    _supabase.from('orders').select('*').order('created_at', { ascending: false }),
                    _supabase.from('hot_deals').select('*'),
                ]);
                if(stR.data && stR.data.data) this.db.settings = stR.data.data;
                if(ctR.data) this.db.categories = ctR.data;
                if(pdR.data) this.db.products = pdR.data;
                if(usR.data) this.db.users = usR.data;
                if(suR.data) this.db.site_users = suR.data;
                if(popR.data) this.db.popups = popR.data;
                if(codeR.data) this.db.redeem_codes = codeR.data;
                if(topupR.data) this.db.topup_requests = topupR.data;
                if(orderR.data) this.db.orders = orderR.data;
                if(hotR.data) {
                    this.db.hot_deals = {
                        categories: hotR.data.filter(d => d.type === 'category').map(d => d.item_id),
                        products: hotR.data.filter(d => d.type === 'product').map(d => d.item_id)
                    };
                }
            },

            setActiveNav: function(page) {
                document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
                const navEl = document.getElementById('nav-' + page);
                if(navEl) navEl.classList.add('active');
            },


            renderFooter: function() {
                const s = this.db.settings || {};
                const c = s.contact || {};
                // logo
                const logoImg = document.getElementById('footer-logo-img');
                if(logoImg) {
                    if(s.footer_logo) { logoImg.src = s.footer_logo; logoImg.style.display = 'block'; }
                    else logoImg.style.display = 'none';
                }
                // desc
                const descEl = document.getElementById('footer-desc');
                if(descEl) descEl.textContent = s.footer_desc || 'ຮ້ານຄ້າເກມມິ່ງທີ່ດີທີ່ສຸດ';
                // ซ่อน social links section (ไม่ใช้แล้ว)
                const socialsEl = document.getElementById('footer-socials');
                if(socialsEl) socialsEl.innerHTML = '';
                const secTitle = document.querySelector('.footer-section-title');
                if(secTitle) secTitle.style.display = 'none';
                // Facebook Page Widget
                const fbWidget = document.getElementById('footer-fb-widget');
                const fbPageUrl = s.fb_page_url || (c.fb || '');
                const fbPageName = s.fb_page_name || 'Eazy SHOP';
                const fbLogoUrl = s.footer_logo || 'https://img5.pic.in.th/file/secure-sv1/451040865_1553605488920298_8130537799367782724_n4d648c430d775aef.png';
                if(fbWidget && fbPageUrl) {
                    fbWidget.style.display = 'block';
                    const nameEl = document.getElementById('fb-widget-name');
                    if(nameEl) nameEl.textContent = fbPageName;
                    const logoEl = document.getElementById('fb-widget-logo');
                    if(logoEl) logoEl.src = fbLogoUrl;
                    const followBtn = document.getElementById('fb-widget-follow');
                    if(followBtn) followBtn.href = fbPageUrl;
                    const shareBtn = document.getElementById('fb-widget-share');
                    if(shareBtn) shareBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(fbPageUrl);
                } else if(fbWidget) {
                    fbWidget.style.display = 'none';
                }
            },

            renderHome: function() {
                // ===== Banner Slideshow =====
                const hero = document.getElementById('hero');
                const banners = this.db.settings.banners || (this.db.settings.banner ? [this.db.settings.banner] : []);
                if(hero) {
                    if(banners.length === 0) {
                        hero.innerHTML = '';
                        hero.style.backgroundImage = '';
                    } else if(banners.length === 1) {
                        hero.innerHTML = `<div class="hero-slide active" style="background-image:url('${banners[0]}');"></div>`;
                    } else {
                        // Multiple — build slides + dots
                        let slidesHtml = banners.map((b,i) => `<div class="hero-slide${i===0?' active':''}" style="background-image:url('${b}');"></div>`).join('');
                        let dotsHtml = banners.map((_,i) => `<div class="hero-dot${i===0?' active':''}" onclick="heroSlider.goTo(${i})"></div>`).join('');
                        hero.innerHTML = slidesHtml + `<div class="hero-dots">${dotsHtml}</div>`;
                        heroSlider.start(banners.length);
                    }
                }
                
                const hotCatIds = this.db.hot_deals.categories || [];
                const sortedCats = [...this.db.categories].sort((a, b) =>
                    (hotCatIds.includes(a.id) ? 0 : 1) - (hotCatIds.includes(b.id) ? 0 : 1)
                );

                document.getElementById('cat-list-home').innerHTML = sortedCats.map(c => {
                    const catProducts = this.db.products.filter(p => p.catid === c.id);
                    const productCount = catProducts.length;
                    const minPrice = catProducts.length > 0 ? Math.min(...catProducts.map(p => Number(p.price))) : 0;
                    const maxPrice = catProducts.length > 0 ? Math.max(...catProducts.map(p => Number(p.price))) : 0;
                    const isHot = hotCatIds.includes(c.id);
                    
                    return `
                        <div class="cat-item slide-up" onclick="router.cat(${c.id})">
                            <div class="cat-img-box">
                                ${isHot ? '<img src="https://img2.pic.in.th/fire-icon.gif" class="hot-badge" alt="Hot Deal" style="width: 60px; height: 60px;">' : ''}
                                <img src="${c.img}" onerror="this.src='https://via.placeholder.com/500x300?text=${c.name}'" loading="lazy">
                            </div>
                            <div class="cat-header">
                                <span class="cat-name">${c.name}</span>
                                <span class="cat-count">(${productCount} ສິນຄ້າ)</span>
                            </div>
                            <div class="cat-price-row">
                                ${productCount > 0 ? `<div class="cat-price">${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} K</div>` : '<div></div>'}
                                <div class="cat-desc">ຄລິກເພື່ອເບິ່ງສິນຄ້າ</div>
                            </div>
                        </div>
                    `;
                }).join('');

                // ສິນຄ້າຂາຍດີ (hot) ຂຶ້ນກ່ອນ, ທີ່ເຫຼືອຕາມລຳດັບເດີມ
                const hotIds = this.db.hot_deals.products || [];
                const homeProds = [...this.db.products].sort((a, b) => {
                    const aHot = hotIds.includes(a.id) ? 0 : 1;
                    const bHot = hotIds.includes(b.id) ? 0 : 1;
                    return aHot - bHot;
                });
                this.renderProds(homeProds.slice(0, 10), 'home-prods');
                // footer
                this.renderFooter();
                // ===== Trigger slide-in animations =====
                slideAnimate('#cat-list-home .slide-up');
                slideAnimate('#home-prods .slide-up');
            },

            renderProds: function(list, target) {
                const container = document.getElementById(target);
                if(!list.length) { container.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:40px; color:#555;'>ບໍ່ມີສິນຄ້າ</p>"; return; }
                
                container.innerHTML = list.map(p => {
                    const isHot = this.db.hot_deals.products.includes(p.id);
                    const hasStock = p.stock !== undefined && p.stock !== null;
                    const isOutOfStock = hasStock && p.stock <= 0;
                    const isLowStock = hasStock && p.stock > 0 && p.stock <= 5;
                    
                    let stockHTML = '';
                    if (hasStock) {
                        if (isOutOfStock) {
                            stockHTML = '<div class="stock-info out-of-stock"><span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-times stock-badge-x"></i></span> ສິນຄ້າໝົດແລ້ວ</div>';
                        } else if (isLowStock) {
                            stockHTML = `<div class="stock-info low-stock"><span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-check stock-badge-check"></i></span> ຄົງເຫຼືອ ${p.stock} ອັນ</div>`;
                        } else {
                            stockHTML = `<div class="stock-info"><span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-check stock-badge-check"></i></span> ຄົງເຫຼືອ ${p.stock} ອັນ</div>`;
                        }
                    }
                    
                    return `
                    <div class="prod-card slide-up ${isOutOfStock ? 'out-of-stock-card' : ''}" onclick="router.detail(${p.id})">
                        <div class="prod-img-wrapper">
                            ${isHot ? '<img src="https://img2.pic.in.th/fire-icon.gif" class="hot-badge" alt="Hot Deal" style="width: 60px; height: 60px;">' : ''}
                            <img src="${p.img}" class="prod-img" onerror="this.src='https://via.placeholder.com/300?text=No+Image'" loading="lazy">
                        </div>
                        <div class="prod-body">
                            <div class="prod-title" data-pid="${p.id}"></div>
                            <div class="prod-price">${Number(p.price).toLocaleString()} ₭</div>
                            <button class="btn btn-buy-card btn-sm" style="width:100%; margin:0; padding:10px; font-size:15px;">${isOutOfStock ? 'ສິນຄ້າໝົດແລ້ວ' : 'ສັ່ງຊື້ <i class="fas fa-shopping-cart"></i>'}</button>
                            ${stockHTML}
                        </div>
                    </div>
                `}).join('');
                
                // ใช้ textContent เพื่อให้ emoji/อักษรพิเศษแสดงครบ ไม่โดน escape
                container.querySelectorAll('[data-pid]').forEach(el => {
                    const pid = parseInt(el.getAttribute('data-pid'));
                    const prod = list.find(p => p.id === pid);
                    if (prod) el.textContent = prod.name;
                });
                
                slideAnimate('#' + target + ' .slide-up');
            },

            handleSearch: function(e) {
                const val = e.target.value.trim().toLowerCase();
                if(val === "khoudadmin") { e.target.value=""; this.openModal('login-modal'); return; }
                if(e.key === 'Enter' && val) {
                    const hotIds = this.db.hot_deals.products || [];
                    const res = this.db.products.filter(p => p.name.toLowerCase().includes(val));
                    const sorted = [...res].sort((a,b) => (hotIds.includes(a.id)?0:1) - (hotIds.includes(b.id)?0:1));
                    document.getElementById('list-title').innerText = `ຜົນການຄົ້ນຫາ: "${val}"`;
                    this.renderProds(sorted, 'list-prods');
                    router.show('view-list');
                }
            },

            buyProduct: async function() {
                if(!currentUser) {
                    NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ');
                    return;
                }
                if(!activeProduct) return;

                // ===== CHECK LIVE STOCK FROM DATABASE BEFORE PURCHASE =====
                showProcessing('ກຳລັງກວດສອບຂໍ້ມູນ...');
                
                // Fetch latest product data from DB (prevent stale cache issues)
                const { data: liveProduct, error: fetchErr } = await _supabase
                    .from('products')
                    .select('*')
                    .eq('id', activeProduct.id)
                    .single();
                
                if(fetchErr || !liveProduct) {
                    hideProcessing();
                    NotificationManager.error('ບໍ່ສາມາດດຶງຂໍ້ມູນສິນຄ້າໄດ້ ກະລຸນາລອງໃໝ່');
                    return;
                }

                // Update activeProduct with live data
                activeProduct = liveProduct;

                // Check if out of stock (live check)
                if(liveProduct.stock !== null && liveProduct.stock !== undefined && liveProduct.stock <= 0) {
                    hideProcessing();
                    NotificationManager.error('ສິນຄ້ານີ້ໝົດສະຕ໊ອກແລ້ວ! ກະລຸນາລໍຖ້າການ restocking');
                    // Update UI to reflect out-of-stock
                    this._updateDetailStockUI(liveProduct);
                    return;
                }

                // Fetch latest user balance from DB (prevent stale cache)
                const { data: liveUser, error: userFetchErr } = await _supabase
                    .from('site_users')
                    .select('balance')
                    .eq('id', currentUser.id)
                    .single();
                
                const balance = liveUser ? (liveUser.balance || 0) : (currentUser.balance || 0);
                const price = liveProduct.price || 0;
                
                if(balance < price) {
                    hideProcessing();
                    NotificationManager.error(`ຍອດເງິນບໍ່ພຽງພໍ! ຍອດຄົງເຫຼືອ: ${balance.toLocaleString()} ₭ (ຕ້ອງການ: ${price.toLocaleString()} ₭)`);
                    return;
                }
                
                // หักเงิน
                showProcessing('ກຳລັງດຳເນີນການສັ່ງຊື້<br>ກະລຸນາລໍຖ້າ ຢ່າປິດໜ້ານີ້...');
                const newBalance = balance - price;
                const { error: balErr } = await _supabase.from('site_users').update({ balance: newBalance }).eq('id', currentUser.id);
                if(balErr) { hideProcessing(); NotificationManager.error('ເກີດຂໍ້ຜິດພາດ: ' + balErr.message); return; }
                
                // ลด stock ถ้ามี (ใช้ live stock value)
                let newStock = null;
                if(liveProduct.stock !== null && liveProduct.stock !== undefined && liveProduct.stock > 0) {
                    newStock = liveProduct.stock - 1;
                    const { error: stockErr } = await _supabase.from('products').update({ stock: newStock }).eq('id', liveProduct.id);
                    if(stockErr) {
                        // Rollback balance
                        await _supabase.from('site_users').update({ balance: balance }).eq('id', currentUser.id);
                        hideProcessing();
                        NotificationManager.error('ເກີດຂໍ້ຜິດພາດໃນການອັພເດດສະຕ໊ອກ');
                        return;
                    }
                    activeProduct.stock = newStock;
                }
                
                // Generate unique product ID if product has has_product_id=true
                let generatedProductId = null;
                if(liveProduct.has_product_id) {
                    // Generate unique ID: EZ + timestamp base36 + random chars, never repeats
                    const ts = Date.now().toString(36).toUpperCase();
                    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
                    generatedProductId = 'EZ-' + ts + '-' + rand;
                }
                
                // บันทึกคำสั่งซื้อ
                const orderData = {
                    user_id: currentUser.id,
                    product_id: liveProduct.id,
                    product_name: liveProduct.name,
                    product_img: liveProduct.img,
                    product_price: price,
                    total_amount: price,
                    quantity: 1,
                    status: 'completed',
                    product_unique_id: generatedProductId
                };
                const { error: orderErr } = await _supabase.from('orders').insert([orderData]);
                if(orderErr) { 
                    console.error('Order error:', orderErr);
                    // rollback เงิน + stock
                    await _supabase.from('site_users').update({ balance: balance }).eq('id', currentUser.id);
                    if(newStock !== null) {
                        await _supabase.from('products').update({ stock: liveProduct.stock }).eq('id', liveProduct.id);
                    }
                    hideProcessing();
                    NotificationManager.error('ເກີດຂໍ້ຜິດພາດໃນການສັ່ງຊື້: ' + orderErr.message); 
                    return; 
                }
                
                // จำกัด 10 ประวัติต่อ user
                const { data: userOrders } = await _supabase
                    .from('orders')
                    .select('id, created_at')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: true });
                
                if(userOrders && userOrders.length > 10) {
                    const toDelete = userOrders.slice(0, userOrders.length - 10);
                    for(const o of toDelete) {
                        await _supabase.from('orders').delete().eq('id', o.id);
                    }
                }
                
                // อัปเดต balance ใน currentUser
                currentUser.balance = newBalance;
                this.updateUserUI();

                // ===== UPDATE LOCAL CACHE ทันที (ไม่รอ fetchData) =====
                // อัปเดต stock ใน db.products cache ทันทีเลย
                if(newStock !== null) {
                    const cachedProd = this.db.products.find(p => p.id === liveProduct.id);
                    if(cachedProd) cachedProd.stock = newStock;
                }
                
                // Re-render หน้า home แบบ silent (ถ้า home ถูกโหลดอยู่ใน DOM)
                // เพื่อให้ stock card อัปเดตทันทีโดยไม่ต้องรีเฟรช
                this._silentRefreshHomeStock(liveProduct.id, newStock);

                await this.fetchData();
                
                
                // ===== UPDATE DETAIL PAGE STOCK UI REAL-TIME (ไม่ต้อง reload) =====
                if(newStock !== null) {
                    this._updateDetailStockUI({ ...liveProduct, stock: newStock });
                }
                
                // Popup สำเร็จ
                hideProcessing();
                NotificationManager.success(`ສັ່ງຊື້ສຳເລັດ! ຫັກເງິນ ${price.toLocaleString()} ₭ | ຍອດຄົງເຫຼືອ: ${newBalance.toLocaleString()} ₭`);
            },

            // ===== BUY CONFIRM POPUP =====
            showBuyConfirm: function() {
                if(!currentUser) { NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ'); return; }
                if(!activeProduct) return;
                // Check stock first
                if(activeProduct.stock !== null && activeProduct.stock !== undefined && activeProduct.stock <= 0) {
                    NotificationManager.error('ສິນຄ້ານີ້ໝົດສະຕ໊ອກແລ້ວ');
                    return;
                }
                // Fill popup info
                document.getElementById('buy-confirm-img').src = activeProduct.img || '';
                document.getElementById('buy-confirm-name').textContent = activeProduct.name || '';
                document.getElementById('buy-confirm-price').textContent = Number(activeProduct.price || 0).toLocaleString() + ' ₭';
                document.getElementById('buy-confirm-balance').textContent = Number(currentUser.balance || 0).toLocaleString() + ' ₭';
                // Show overlay
                const overlay = document.getElementById('buy-confirm-overlay');
                const sheet = document.getElementById('buy-confirm-sheet');
                overlay.style.display = 'flex';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { sheet.style.transform = 'translateY(0)'; });
                });
                // Tap outside to close
                overlay.onclick = (e) => { if(e.target === overlay) this.closeBuyConfirm(); };
            },

            closeBuyConfirm: function() {
                const overlay = document.getElementById('buy-confirm-overlay');
                const sheet = document.getElementById('buy-confirm-sheet');
                sheet.style.transform = 'translateY(100%)';
                setTimeout(() => { overlay.style.display = 'none'; }, 380);
            },

            confirmBuy: function() {
                this.closeBuyConfirm();
                setTimeout(() => { this.buyProduct(); }, 100);
            },

            // ===== HELPER: Update stock UI on detail page in real-time =====
            _updateDetailStockUI: function(p) {
                const stockInfoDiv = document.getElementById('det-stock-info');
                const buyBtn = document.getElementById('det-buy-btn');
                if(!stockInfoDiv || !buyBtn) return;
                
                if(p.stock !== undefined && p.stock !== null) {
                    if(p.stock <= 0) {
                        stockInfoDiv.innerHTML = '<div style="color:rgba(255,68,68,0.7); font-size:12px; margin:6px 0; display:flex; align-items:center; gap:6px;"><span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-times stock-badge-x"></i></span> ສິນຄ້າໝົດສະຕ໊ອກແລ້ວ</div>';
                        buyBtn.disabled = true;
                        buyBtn.style.opacity = '0.5';
                        buyBtn.style.cursor = 'not-allowed';
                    } else {
                        stockInfoDiv.innerHTML = `<div style="color:rgba(200,200,200,0.75); font-size:12px; margin:6px 0; display:flex; align-items:center; gap:6px;"><span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-check stock-badge-check"></i></span> ຄົງເຫຼືອ ${p.stock} ອັນ</div>`;
                        buyBtn.disabled = false;
                        buyBtn.style.opacity = '1';
                        buyBtn.style.cursor = 'pointer';
                    }
                }
            },

            // ===== อัปเดต stock card บนหน้า home ทันทีโดยไม่ต้อง re-render ทั้งหน้า =====
            _silentRefreshHomeStock: function(productId, newStock) {
                // หา prod-card ทั้งหมดใน home-prods และ list-prods
                ['home-prods', 'list-prods'].forEach(containerId => {
                    const container = document.getElementById(containerId);
                    if(!container) return;
                    // หา card ที่ตรงกับ productId โดยดูจาก onclick attribute
                    const cards = container.querySelectorAll('.prod-card');
                    cards.forEach(card => {
                        const onclick = card.getAttribute('onclick') || '';
                        if(onclick.includes('router.detail(' + productId + ')')) {
                            // อัปเดต stock info ใน card นี้
                            const stockDiv = card.querySelector('.stock-info');
                            const buyBtn = card.querySelector('.btn-buy-card');
                            if(newStock !== null) {
                                if(newStock <= 0) {
                                    // หมดสต็อก
                                    card.classList.add('out-of-stock-card');
                                    if(buyBtn) {
                                        buyBtn.disabled = true;
                                        buyBtn.innerHTML = 'ສິນຄ້າໝົດແລ້ວ';
                                        buyBtn.style.opacity = '0.6';
                                    }
                                    if(stockDiv) {
                                        stockDiv.className = 'stock-info out-of-stock';
                                        stockDiv.innerHTML = '<span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-times stock-badge-x"></i></span> ສິນຄ້າໝົດແລ້ວ';
                                    }
                                } else if(newStock <= 5) {
                                    // เหลือน้อย
                                    if(stockDiv) {
                                        stockDiv.className = 'stock-info low-stock';
                                        stockDiv.innerHTML = `<span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-check stock-badge-check"></i></span> ຄົງເຫຼືອ ${newStock} ອັນ`;
                                    }
                                } else {
                                    // ยังมีสต็อก
                                    if(stockDiv) {
                                        stockDiv.className = 'stock-info';
                                        stockDiv.innerHTML = `<span class="stock-icon-wrap"><i class="fas fa-box"></i><i class="fas fa-check stock-badge-check"></i></span> ຄົງເຫຼືອ ${newStock} ອັນ`;
                                    }
                                }
                            }
                        }
                    });
                });
            },

            openTutorial: function() {
                if(activeProduct && activeProduct.tutorial_url) {
                    window.open(activeProduct.tutorial_url, '_blank');
                }
            },

            downloadProductFile: function() {
                if(!activeProduct || !activeProduct.file_content) return;
                window.open(activeProduct.file_content, '_blank');
            },

            openOrderTutorial: function() {
                if(this._viewingOrder && this._viewingOrder.tutorial_url) {
                    window.open(this._viewingOrder.tutorial_url, '_blank');
                }
            },

            downloadOrderFile: function() {
                const o = this._viewingOrder;
                if(!o || !o.file_content) return;
                window.open(o.file_content, '_blank');
            },

            showOrderDetail: async function(orderId) {
                // หาจาก cache ก่อน ถ้าไม่เจอ fetch จาก DB (กรณี order จากวงล้อ)
                let order = (this.db.orders || []).find(o => String(o.id) == String(orderId));
                if(!order) {
                    const { data } = await _supabase.from('orders').select('*').eq('id', orderId).single();
                    if(!data) return;
                    order = data;
                }
                this._viewingOrder = order;
                
                const prod = (this.db.products || []).find(p => p.id == order.product_id);
                if(prod) {
                    this._viewingOrder.tutorial_url = prod.tutorial_url;
                    this._viewingOrder.file_content = prod.file_content;
                }
                
                const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('lo-LA') : '-';
                const fromSpin = order.note === 'ໄດ້ຈາກວົງລໍ້';
                const priceHtml = fromSpin
                    ? `<b style="color:var(--main-red);">0 ₭</b> <span style="color:#f5c518;font-size:11px;"><i class="fas fa-sync-alt" style="margin-right:2px;"></i>ໄດ້ຈາກວົງລໍ້</span>`
                    : `<b style="color:var(--main-red);">${Number(order.total_amount || order.product_price || 0).toLocaleString()} ₭</b>`;

                document.getElementById('order-detail-content').innerHTML = `
                    <div style="text-align:center; margin-bottom:10px;">
                        <img src="${order.product_img || ''}" style="width:72px; height:72px; object-fit:cover; border-radius:8px;">
                    </div>
                    <div style="background:#111; padding:10px 12px; border-radius:10px; font-size:13px;">
                        <div style="margin-bottom:6px;"><span style="color:#aaa;">ສິນຄ້າ:</span> <b>${order.product_name || '-'}</b></div>
                        <div style="margin-bottom:6px;"><span style="color:#aaa;">ລາຄາ:</span> ${priceHtml}</div>
                        <div><span style="color:#aaa;">ເວລາສັ່ງຊື້:</span> ${dateStr}</div>
                    </div>
                    ${order.product_unique_id ? `
                    <div class="product-id-badge">
                        <div class="id-icon"><i class="fas fa-id-badge"></i></div>
                        <div class="id-text">
                            <div class="id-label">🔑 ລະຫັດສິນຄ້າຂອງທ່ານ</div>
                            <div class="id-value">${order.product_unique_id}</div>
                        </div>
                    </div>` : ''}
                `;
                
                const tutBtn = document.getElementById('order-tutorial-btn');
                const dlBtn = document.getElementById('order-download-btn');
                tutBtn.style.display = (prod && prod.tutorial_url) ? 'flex' : 'none';
                dlBtn.style.display = (prod && prod.file_content) ? 'flex' : 'none';
                
                this.openModal('order-detail-modal');
            },

            renderOrderHistory: async function() {
                if(!currentUser) return;
                const el = document.getElementById('order-history-list');
                if(!el) return;
                el.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;"><i class="fas fa-spinner fa-spin"></i> ກຳລັງໂຫຼດ...</div>';
                const { data: myOrders } = await _supabase
                    .from('orders').select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                if(!myOrders || myOrders.length === 0) {
                    el.innerHTML = '<div style="text-align:center; color:#aaa; padding:30px;">ຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້</div>';
                    return;
                }
                // อัปเดต cache ให้ showOrderDetail หาเจอ
                this.db.orders = myOrders;
                el.innerHTML = myOrders.map(o => {
                    const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('lo-LA') : '-';
                    const fromSpin = o.note === 'ໄດ້ຈາກວົງລໍ້';
                    const priceText = fromSpin
                        ? '<span style="color:#f5c518;font-size:11px;"><i class="fas fa-sync-alt" style="margin-right:3px;"></i>ໄດ້ຈາກວົງລໍ້</span>'
                        : `${Number(o.total_amount || o.product_price || 0).toLocaleString()} ₭`;
                    return `
                    <div class="history-item" style="display:flex; align-items:center; gap:12px; padding:12px; background:#111; border-radius:12px; margin-bottom:10px;">
                        <img src="${o.product_img || ''}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; flex-shrink:0;" onerror="this.src='https://via.placeholder.com/60x60?text=No+Img'">
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${o.product_name || '-'}</div>
                            <div style="color:var(--main-red); font-size:13px; margin:3px 0;">${priceText}</div>
                            <div style="color:#888; font-size:11px;">${dateStr}</div>
                        </div>
                        <button class="btn btn-outline btn-sm" style="white-space:nowrap;" onclick="app.showOrderDetail('${o.id}')">
                            ເບິ່ງຂໍ້ມູນ
                        </button>
                    </div>`;
                }).join('');
            },

            handleProductFile: function(input) {
                const file = input.files[0];
                if(!file) return;
                document.getElementById('p-file-name').textContent = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('p-file-content').value = e.target.result;
                };
                reader.readAsText(file);
            },

            orderWhatsApp: function() {
                if(!activeProduct) return;
                const wa = this.db.settings.contact.wa || "8562029268167";
                const msg = `ສະບາຍດີ Eazy SHOP!\nຂ້ອຍສົນໃຈສິນຄ້ານີ້:\n\n📌 ${activeProduct.name}\n💰 ລາຄາ: ${Number(activeProduct.price).toLocaleString()} ₭\n\nກະລຸນາບອກລາຍລະອຽດການຊຳລະເງິນແດ່.`;
                window.open(`https://wa.me/${wa.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
            },

            tab: function(id) {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
                document.getElementById(id).classList.remove('hidden');
                
                // โหลด overview
                if(id === 'tab-overview') {
                    this.loadOverview();
                }
                // โหลดข้อมูลสมาชิกเมื่อเปิด tab สมาชิก
                if(id === 'tab-members') {
                    this.loadAllMembers();
                }
                // โหลด product IDs เมื่อเปิด tab
                if(id === 'tab-product-ids') {
                    this.loadProductIds();
                }
                // โหลดประกาศเมื่อเปิด tab ประกาศ
                if(id === 'tab-announcement') {
                    this.loadAnnouncementAdmin();
                }
                
                this.renderAdmin();
            },

            loadOverview: async function() {
                const loadingEl = document.getElementById('ov-loading');
                const contentEl = document.getElementById('ov-content');
                if(!loadingEl || !contentEl) return;
                loadingEl.style.display = 'block';
                contentEl.style.display = 'none';

                // ດຶງຂໍ້ມູນໃໝ່ທຸກຄັ້ງ
                const { data: siteUsers } = await _supabase.from('site_users').select('id, created_at');
                const { data: topups } = await _supabase.from('topup_requests').select('amount, status, created_at');
                const { data: redeems } = await _supabase.from('redeem_codes').select('amount, used_at, used_by');
                const { data: orders } = await _supabase.from('orders').select('product_name, total_amount, created_at, status');

                const now = new Date();
                const todayStr = now.toISOString().slice(0,10);

                // ===== ຄຳນວນ: ວັນນີ້ =====
                const todayUsers = (siteUsers||[]).filter(u => u.created_at && u.created_at.slice(0,10) === todayStr).length;
                const todayTopups = (topups||[]).filter(t => t.created_at && t.created_at.slice(0,10) === todayStr && t.status === 'approved');
                const todayTopupAmount = todayTopups.reduce((s,t) => s + Number(t.amount||0), 0);
                const todayRedeems = (redeems||[]).filter(r => r.used_at && r.used_at.slice(0,10) === todayStr);
                const todayRedeemAmount = todayRedeems.reduce((s,r) => s + Number(r.amount||0), 0);
                const todayOrders = (orders||[]).filter(o => o.created_at && o.created_at.slice(0,10) === todayStr);
                const todaySales = todayOrders.reduce((s,o) => s + Number(o.total_amount||0), 0);

                // ===== ຄຳນວນ: ລວມ =====
                const totalUsers = (siteUsers||[]).length;
                const approvedTopups = (topups||[]).filter(t => t.status === 'approved');
                const totalTopupAmount = approvedTopups.reduce((s,t) => s + Number(t.amount||0), 0);
                const usedRedeems = (redeems||[]).filter(r => r.used_by);
                const totalRedeemAmount = usedRedeems.reduce((s,r) => s + Number(r.amount||0), 0);
                const totalOrders = (orders||[]).length;
                const totalSales = (orders||[]).reduce((s,o) => s + Number(o.total_amount||0), 0);

                // ===== ຄຳນວນ: ໄລຍະ =====
                const day7 = new Date(now); day7.setDate(day7.getDate()-6); day7.setHours(0,0,0,0);
                const month1 = new Date(now); month1.setDate(1); month1.setHours(0,0,0,0);

                const topup7 = approvedTopups.filter(t => new Date(t.created_at) >= day7);
                const topup7Amount = topup7.reduce((s,t)=>s+Number(t.amount||0),0);
                const redeem7 = usedRedeems.filter(r => new Date(r.used_at) >= day7);
                const redeem7Amount = redeem7.reduce((s,r)=>s+Number(r.amount||0),0);

                const topupMonth = approvedTopups.filter(t => new Date(t.created_at) >= month1);
                const topupMonthAmount = topupMonth.reduce((s,t)=>s+Number(t.amount||0),0);
                const redeemMonth = usedRedeems.filter(r => new Date(r.used_at) >= month1);
                const redeemMonthAmount = redeemMonth.reduce((s,r)=>s+Number(r.amount||0),0);

                const fmt = n => Number(n).toLocaleString();

                // ===== ວັນນີ້ cards =====
                document.getElementById('ov-today-grid').innerHTML = `
                    <div class="ov-card">
                        <div class="ov-card-icon">👤</div>
                        <div class="ov-card-label">ສະໝັກໃໝ່ວັນນີ້</div>
                        <div class="ov-card-value" style="color:#60a5fa;">${todayUsers}</div>
                        <div class="ov-card-sub">ຄົນ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">💳</div>
                        <div class="ov-card-label">ເຕີມເງິນ (ທະນາຄານ)</div>
                        <div class="ov-card-value" style="color:#00ff88;">${fmt(todayTopupAmount)}</div>
                        <div class="ov-card-sub">${todayTopups.length} ລາຍການ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">🎟️</div>
                        <div class="ov-card-label">ເຕີມເງິນ (ໂຄດ)</div>
                        <div class="ov-card-value" style="color:#fbbf24;">${fmt(todayRedeemAmount)}</div>
                        <div class="ov-card-sub">${todayRedeems.length} ລາຍການ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">🛒</div>
                        <div class="ov-card-label">ຍອດຂາຍວັນນີ້</div>
                        <div class="ov-card-value" style="color:#f472b6;">${fmt(todaySales)}</div>
                        <div class="ov-card-sub">${todayOrders.length} ອໍເດີ</div>
                    </div>
                `;

                // ===== ລວມທັງໝົດ cards =====
                document.getElementById('ov-total-grid').innerHTML = `
                    <div class="ov-card">
                        <div class="ov-card-icon">👥</div>
                        <div class="ov-card-label">ສະມາຊິກທັງໝົດ</div>
                        <div class="ov-card-value" style="color:#60a5fa;">${fmt(totalUsers)}</div>
                        <div class="ov-card-sub">ຄົນ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">📦</div>
                        <div class="ov-card-label">ອໍເດີທັງໝົດ</div>
                        <div class="ov-card-value" style="color:#f472b6;">${fmt(totalOrders)}</div>
                        <div class="ov-card-sub">ລາຍການ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">💰</div>
                        <div class="ov-card-label">ຍອດຂາຍລວມ</div>
                        <div class="ov-card-value" style="color:#f472b6; font-size:16px;">${fmt(totalSales)} ₭</div>
                        <div class="ov-card-sub">ທຸກອໍເດີ</div>
                    </div>
                    <div class="ov-card">
                        <div class="ov-card-icon">🔁</div>
                        <div class="ov-card-label">ເຕີມລວມ (ທະນາຄານ+ໂຄດ)</div>
                        <div class="ov-card-value" style="color:#a78bfa; font-size:16px;">${fmt(totalTopupAmount + totalRedeemAmount)} ₭</div>
                        <div class="ov-card-sub">ທຸກຊ່ອງທາງ</div>
                    </div>
                `;

                // ===== ຍອດເຕີມ breakdown =====
                document.getElementById('ov-topup-grid').innerHTML = `
                    <div class="ov-topup-card">
                        <div class="label">💳 ທະນາຄານ</div>
                        <div style="font-size:10px; color:#555; margin-bottom:8px;">ທີ່ອະນຸມັດແລ້ວ</div>
                        <div class="label">ວັນນີ້</div>
                        <div class="val green">${fmt(todayTopupAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">7 ວັນ</div>
                        <div class="val blue">${fmt(topup7Amount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ເດືອນນີ້</div>
                        <div class="val yellow">${fmt(topupMonthAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ທັງໝົດ</div>
                        <div class="val purple">${fmt(totalTopupAmount)} ₭</div>
                    </div>
                    <div class="ov-topup-card">
                        <div class="label">🎟️ ໂຄດເຕີມເງິນ</div>
                        <div style="font-size:10px; color:#555; margin-bottom:8px;">ທີ່ໃຊ້ແລ້ວ</div>
                        <div class="label">ວັນນີ້</div>
                        <div class="val green">${fmt(todayRedeemAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">7 ວັນ</div>
                        <div class="val blue">${fmt(redeem7Amount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ເດືອນນີ້</div>
                        <div class="val yellow">${fmt(redeemMonthAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ທັງໝົດ</div>
                        <div class="val purple">${fmt(totalRedeemAmount)} ₭</div>
                    </div>
                    <div class="ov-topup-card">
                        <div class="label">🔁 ລວມທຸກຊ່ອງທາງ</div>
                        <div style="font-size:10px; color:#555; margin-bottom:8px;">&nbsp;</div>
                        <div class="label">ວັນນີ້</div>
                        <div class="val green">${fmt(todayTopupAmount+todayRedeemAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">7 ວັນ</div>
                        <div class="val blue">${fmt(topup7Amount+redeem7Amount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ເດືອນນີ້</div>
                        <div class="val yellow">${fmt(topupMonthAmount+redeemMonthAmount)} ₭</div>
                        <div class="label" style="margin-top:8px;">ທັງໝົດ</div>
                        <div class="val purple">${fmt(totalTopupAmount+totalRedeemAmount)} ₭</div>
                    </div>
                `;

                // ===== ກຣາຟ 7 ວັນ =====
                const days7Data = [];
                for(let i=6; i>=0; i--) {
                    const d = new Date(now);
                    d.setDate(d.getDate()-i);
                    const ds = d.toISOString().slice(0,10);
                    const label = (i===0) ? 'ວັນນີ້' : `${d.getDate()}/${d.getMonth()+1}`;
                    const bank = approvedTopups.filter(t=>t.created_at&&t.created_at.slice(0,10)===ds).reduce((s,t)=>s+Number(t.amount||0),0);
                    const code = usedRedeems.filter(r=>r.used_at&&r.used_at.slice(0,10)===ds).reduce((s,r)=>s+Number(r.amount||0),0);
                    days7Data.push({ label, bank, code, total: bank+code });
                }
                const maxVal7 = Math.max(...days7Data.map(d=>d.total), 1);
                document.getElementById('ov-chart-7days').innerHTML = days7Data.map(d => `
                    <div class="ov-bar-row">
                        <div class="ov-bar-label">${d.label}</div>
                        <div class="ov-bar-track">
                            <div class="ov-bar-fill" style="width:${Math.max(d.total/maxVal7*100,2)}%; background:linear-gradient(90deg,#7c3aed,#a78bfa);">
                                ${d.total > 0 ? '' : ''}
                            </div>
                        </div>
                        <div class="ov-bar-val">${d.total > 0 ? fmt(d.total)+' ₭' : '-'}</div>
                    </div>
                `).join('');

                // ===== ກຣາຟ ສິນຄ້າຂາຍດີ =====
                const prodCount = {};
                (orders||[]).forEach(o => {
                    if(o.product_name) prodCount[o.product_name] = (prodCount[o.product_name]||0) + 1;
                });
                const top5 = Object.entries(prodCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
                const maxProd = Math.max(...top5.map(p=>p[1]),1);
                const colors = ['#ff6b6b','#fbbf24','#34d399','#60a5fa','#a78bfa'];
                document.getElementById('ov-chart-products').innerHTML = top5.length === 0
                    ? '<div style="color:#555; text-align:center; padding:20px; font-size:13px;">ຍັງບໍ່ມີຂໍ້ມູນ</div>'
                    : top5.map(([name,count],i) => `
                        <div class="ov-bar-row">
                            <div class="ov-bar-label" style="font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${name}">${name.length>8?name.slice(0,8)+'…':name}</div>
                            <div class="ov-bar-track">
                                <div class="ov-bar-fill" style="width:${Math.max(count/maxProd*100,4)}%; background:${colors[i]};">${count}</div>
                            </div>
                            <div class="ov-bar-val">${count} ອັນ</div>
                        </div>
                    `).join('');

                loadingEl.style.display = 'none';
                contentEl.style.display = 'block';
            },

            renderAdmin: function() {
                document.getElementById('t-prods').innerHTML = this.db.products.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${Number(p.price).toLocaleString()}</td>
                        <td>${p.stock !== undefined ? p.stock : '-'}</td>
                        <td>
                            <i class="fas fa-edit" style="color:cyan; margin-right:10px; cursor:pointer;" onclick="app.editP(${p.id})"></i>
                            <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.delP(${p.id})"></i>
                        </td>
                    </tr>
                `).join('');

                document.getElementById('p-cat').innerHTML = this.db.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                
                document.getElementById('t-cats').innerHTML = this.db.categories.map(c => `
                    <tr>
                        <td><img src="${c.img}" width="30" height="30" style="object-fit:cover; border-radius:4px"></td>
                        <td>${c.name}</td>
                        <td>
                            <i class="fas fa-edit" style="color:cyan; margin-right:10px; cursor:pointer;" onclick="app.editC(${c.id})"></i>
                            <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.delC(${c.id})"></i>
                        </td>
                    </tr>
                `).join('');

                document.getElementById('t-users').innerHTML = this.db.users.map(u => `
                    <tr><td>${u.username}</td><td>${u.password}</td><td><i class="fas fa-trash" style="cursor:pointer;" onclick="app.delU(${u.id})"></i></td></tr>
                `).join('');

                // Members tab
                document.getElementById('t-members').innerHTML = (this.db.site_users || []).map(u => `
                    <tr onclick="app.selectMember(${u.id})" style="cursor:pointer;">
                        <td>${u.id}</td>
                        <td>${u.username}</td>
                        <td>${Number(u.balance || 0).toLocaleString()} ₭</td>
                        <td>${u.status === 'active' ? '<span style="color:#00cc88">ເປີດໃຊ້</span>' : '<span style="color:#ff4444">ລະງັບ</span>'}</td>
                        <td>${new Date(u.created_at).toLocaleDateString('lo-LA')}</td>
                    </tr>
                `).join('');

                // Popup tab — init product list (show all on load)
                this.filterPopupProducts();
                // Hot deals — init list
                this.filterHotItems();

                document.getElementById('t-popups').innerHTML = this.db.popups.map(pop => {
                    if (pop.custom_img) {
                        // custom image popup
                        return `
                            <tr>
                                <td>${pop.order}</td>
                                <td><span style="font-size:11px; background:rgba(60,130,255,0.2); color:#60a5fa; padding:2px 8px; border-radius:20px;">ຮູບຈາກນອກ</span></td>
                                <td><img src="${pop.custom_img}" width="60" height="60" style="object-fit:cover; border-radius:5px;" onerror="this.style.display='none'"></td>
                                <td style="font-size:11px; max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#aaa;">${pop.custom_link || '-'}</td>
                                <td>
                                    <i class="fas fa-edit" style="color:cyan; margin-right:10px; cursor:pointer;" onclick="app.editPopup(${pop.id})"></i>
                                    <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.delPopup(${pop.id})"></i>
                                </td>
                            </tr>
                        `;
                    } else {
                        const product = this.db.products.find(p => p.id === pop.product_id);
                        if (!product) return '';
                        return `
                            <tr>
                                <td>${pop.order}</td>
                                <td><span style="font-size:11px; background:rgba(255,0,0,0.15); color:#ff6666; padding:2px 8px; border-radius:20px;">ສິນຄ້າ</span></td>
                                <td><img src="${product.img}" width="60" height="60" style="object-fit:cover; border-radius:5px; cursor:pointer;" onclick="router.detail(${product.id})"><br><span style="font-size:11px; color:#ccc;">${product.name}</span></td>
                                <td style="font-size:11px; color:#666;">-</td>
                                <td>
                                    <i class="fas fa-edit" style="color:cyan; margin-right:10px; cursor:pointer;" onclick="app.editPopup(${pop.id})"></i>
                                    <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.delPopup(${pop.id})"></i>
                                </td>
                            </tr>
                        `;
                    }
                }).filter(Boolean).join('');

                // Redeem Codes
                document.getElementById('t-codes').innerHTML = (this.db.redeem_codes || []).map(code => `
                    <tr>
                        <td>${code.code}</td>
                        <td>${Number(code.amount).toLocaleString()} ₭</td>
                        <td>${code.current_uses || 0}/${code.max_uses || 1}</td>
                        <td>${code.expiry ? new Date(code.expiry).toLocaleDateString('lo-LA') : 'ບໍ່ມີ'}</td>
                        <td>${((code.current_uses || 0) >= (code.max_uses || 1)) ? '<span style="color:#ff4444">ໃຊ້ຄົບແລ້ວ</span>' : '<span style="color:#00cc88">ຍັງໃຊ້ໄດ້</span>'}</td>
                        <td>
                            <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.deleteRedeemCode(${code.id})"></i>
                        </td>
                    </tr>
                `).join('');

                // Topup Requests
                document.getElementById('t-topups').innerHTML = (this.db.topup_requests || []).map(req => {
                    const user = this.db.site_users?.find(u => u.id === req.user_id);
                    return `
                    <tr>
                        <td>${user?.username || 'N/A'}</td>
                        <td>${Number(req.amount).toLocaleString()} ₭</td>
                        <td>
                            ${req.slip_url ? `<img src="${req.slip_url}" style="width:50px; height:50px; object-fit:cover; border-radius:5px; cursor:pointer;" onclick="window.open('${req.slip_url}')">` : '-'}
                        </td>
                        <td>
                            ${req.status === 'pending' ? '<span style="color:#ffaa00">ລໍຖ້າ</span>' : 
                              req.status === 'approved' ? '<span style="color:#00cc88">ອະນຸມັດແລ້ວ</span>' : 
                              '<span style="color:#ff4444">ປະຕິເສດ</span>'}
                        </td>
                        <td>${new Date(req.created_at).toLocaleString('lo-LA')}</td>
                        <td>
                            ${req.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="app.approveTopup(${req.id})">ອະນຸມັດ</button>
                                <button class="btn btn-red btn-sm" onclick="app.rejectTopup(${req.id})">ປະຕິເສດ</button>
                            ` : '-'}
                        </td>
                    </tr>
                `}).join('');

                const s = this.db.settings;
                // banner list
                if(!s.banners && s.banner) s.banners = [s.banner];
                this.renderBannerAdmin();
                document.getElementById('s-wa').value = s.contact?.wa || "";
                document.getElementById('s-tt').value = s.contact?.tt || "";
                document.getElementById('s-fb').value = s.contact?.fb || "";
                if(document.getElementById('s-footer-logo')) document.getElementById('s-footer-logo').value = s.footer_logo || "";
                if(document.getElementById('s-footer-desc')) document.getElementById('s-footer-desc').value = s.footer_desc || "";
                if(document.getElementById('s-fb-page')) document.getElementById('s-fb-page').value = s.fb_page_url || "";
                if(document.getElementById('s-fb-page-name')) document.getElementById('s-fb-page-name').value = s.fb_page_name || "";
                
                // Load Hot Deals
                this.loadHotItems();
                this.renderHotDeals();
            },

            selectMember: function(id) {
                const member = this.db.site_users.find(u => u.id === id);
                if(member) {
                    document.getElementById('member-edit-form').style.display = 'block';
                    document.getElementById('member-id').value = member.id;
                    document.getElementById('member-username').value = member.username;
                    document.getElementById('member-balance').value = member.balance || 0;
                    document.getElementById('member-spent').value = member.total_spent || 0;
                    document.getElementById('member-status').value = member.status || 'active';
                }
            },

            searchMembers: async function() {
                const keyword = document.getElementById('member-search').value.trim();
                const resultsDiv = document.getElementById('member-search-results');
                
                if(keyword.length < 1) { 
                    resultsDiv.innerHTML = ''; 
                    resultsDiv.style.display = 'none';
                    return;
                }
                
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<div style="padding:15px; color:#999; text-align:center; font-size:13px;"><i class="fas fa-spinner fa-spin"></i> ກຳລັງຄົ້ນຫາ...</div>';
                
                try {
                    const searchPattern = `%${keyword.toLowerCase()}%`;
                    const { data, error } = await _supabase
                        .from('site_users')
                        .select('*')
                        .or(`username.ilike.${searchPattern}`)
                        .order('created_at', { ascending: false })
                        .limit(50);
                    
                    if(error) {
                        console.error('Search error:', error);
                        resultsDiv.innerHTML = `<div style="padding:15px; color:#ff6b6b; text-align:center; font-size:13px;"><i class="fas fa-exclamation-triangle"></i> ເກີດຂໍ້ຜິດພາດ: ${error.message}</div>`;
                        return;
                    }
                    
                    if(data && data.length > 0) {
                        resultsDiv.innerHTML = data.map(u => `
                            <div onclick="app.selectMember('${u.id}')" style="padding:12px; background:#1a1a1a; margin:5px 0; border-radius:8px; cursor:pointer; border:1px solid #333; transition:all 0.2s;" onmouseover="this.style.background='#252525'; this.style.borderColor='var(--main-red)';" onmouseout="this.style.background='#1a1a1a'; this.style.borderColor='#333';">
                                <div style="font-weight:600; color:#fff; margin-bottom:4px; font-size:14px;">${u.username}</div>
                                <div style="font-size:11px; color:#888; display:flex; justify-content:space-between;">
                                    <span>ID: ${u.id}</span>
                                    <span style="color:var(--success);">${(u.balance || 0).toLocaleString()} ₭</span>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        resultsDiv.innerHTML = '<div style="padding:20px; color:#999; text-align:center; font-size:13px;"><i class="fas fa-search"></i> ບໍ່ພົບຂໍ້ມູນສະມາຊິກ</div>';
                    }
                } catch(err) {
                    console.error('Search exception:', err);
                    resultsDiv.innerHTML = `<div style="padding:15px; color:#ff6b6b; text-align:center; font-size:13px;"><i class="fas fa-times-circle"></i> ເກີດຂໍ້ຜິດພາດ: ${err.message || 'ກະລຸນາລອງໃໝ່'}</div>`;
                }
            },

            updateMember: async function() {
                const id = document.getElementById('member-id').value;
                const data = {
                    balance: parseInt(document.getElementById('member-balance').value) || 0,
                    total_spent: parseInt(document.getElementById('member-spent').value) || 0,
                    status: document.getElementById('member-status').value
                };
                
                const { error } = await _supabase.from('site_users').update(data).eq('id', id);
                if(error) NotificationManager.error(error.message);
                else {
                    NotificationManager.success('ອັບເດດຂໍ້ມູນສຳເລັດ');
                    this.loadAllMembers();
                    document.getElementById('member-edit-form').style.display = 'none';
                }
            },

            adjustBalance: async function(type) {
                const currentBalance = parseInt(document.getElementById('member-balance').value) || 0;
                const amount = prompt(type === 'add' ? 'ຈຳນວນເງິນທີ່ຕ້ອງການເພີ່ມ (ກີບ):' : 'ຈຳນວນເງິນທີ່ຕ້ອງການຫັກ (ກີບ):');
                
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    NotificationManager.warning('ກະລຸນາໃສ່ຈຳນວນເງິນທີ່ຖືກຕ້ອງ');
                    return;
                }
                
                const amountNum = parseFloat(amount);
                let newBalance;
                
                if (type === 'add') {
                    newBalance = currentBalance + amountNum;
                } else {
                    if (currentBalance < amountNum) {
                        NotificationManager.error('ຍອດເງິນບໍ່ພຽງພໍ! ປັດຈຸບັນມີ ' + currentBalance.toLocaleString() + ' ກີບ');
                        return;
                    }
                    newBalance = currentBalance - amountNum;
                }
                
                document.getElementById('member-balance').value = newBalance;
                NotificationManager.info(type === 'add' ? 'ເພີ່ມເງິນ ' + amountNum.toLocaleString() + ' ກີບ (ກົດບັນທຶກເພື່ອຢືນຢັນ)' : 'ຫັກເງິນ ' + amountNum.toLocaleString() + ' ກີບ (ກົດບັນທຶກເພື່ອຢືນຢັນ)');
            },

            closeMemberEdit: function() {
                document.getElementById('member-edit-form').style.display = 'none';
            },

            selectMember: async function(id) {
                const { data } = await _supabase.from('site_users').select('*').eq('id', id).single();
                if(data) {
                    document.getElementById('member-id').value = data.id;
                    document.getElementById('member-id-short').textContent = 'ID: ' + data.id;
                    document.getElementById('member-username').value = data.username;
                    document.getElementById('member-balance').value = data.balance || 0;
                    document.getElementById('member-spent').value = data.total_spent || 0;
                    document.getElementById('member-status').value = data.status || 'active';
                    document.getElementById('member-edit-form').style.display = 'block';
                }
            },

            loadAllMembers: async function() {
                const { data } = await _supabase.from('site_users').select('*').order('created_at', { ascending: false });
                const tbody = document.getElementById('t-members');
                if(data && data.length > 0) {
                    tbody.innerHTML = data.map(m => `
                        <tr>
                            <td><span style="font-family:monospace; font-size:11px; color:var(--text-dim);">${m.id}</span></td>
                            <td><strong>${m.username}</strong></td>
                            <td><span style="color:var(--success); font-weight:600;">${(m.balance || 0).toLocaleString()} ₭</span></td>
                            <td><span style="color:var(--text-dim);">${(m.total_spent || 0).toLocaleString()} ₭</span></td>
                            <td><span style="padding:4px 8px; border-radius:4px; font-size:11px; ${m.status === 'active' ? 'background:#00ff8820; color:#00ff88;' : 'background:#ff444420; color:#ff4444;'}">${m.status === 'active' ? '✅ ປົກກະຕິ' : '🚫 ລະງັບ'}</span></td>
                            <td>${new Date(m.created_at).toLocaleDateString('lo-LA')}</td>
                            <td>
                                <button class="btn btn-sm" style="background:var(--main-red); color:#fff; padding:6px 12px;" onclick="app.selectMember('${m.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-dim);">ຍັງບໍ່ມີສະມາຊິກ</td></tr>';
                }
            },

            resetMemberPassword: async function() {
                if(!await CustomConfirm.show('ແນ່ໃຈບໍ່ວ່າຕ້ອງການຣີເຊັດລະຫັດຜ່ານ?', {title:'ຣີເຊັດລະຫັດຜ່ານ', icon:'fa-key'})) return;
                
                const id = document.getElementById('member-id').value;
                const newPassword = '123456';
                // ສ້າງ token ໃໝ່ force logout ທຸກ device
                const newToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
                
                const { error } = await _supabase.from('site_users').update({ 
                    password: newPassword,
                    session_token: newToken
                }).eq('id', id);
                if(error) NotificationManager.error(error.message);
                else NotificationManager.success('ຣີເຊັດລະຫັດຜ່ານສຳເລັດ! ລະຫັດໃໝ່: 123456 (User ຈະຖືກ Logout ອັດຕະໂນມັດ)');
            },

            saveProduct: async function() {
                const id = document.getElementById('edit-p-id').value;
                const stockValue = document.getElementById('p-stock').value;
                const fileContent = document.getElementById('p-file-content').value;
                const tutorialUrl = document.getElementById('p-tutorial').value.trim();
                const hasProductId = document.getElementById('p-has-id').checked;
                const data = {
                    name: document.getElementById('p-name').value,
                    price: parseInt(document.getElementById('p-price').value),
                    img: document.getElementById('p-img').value,
                    catid: parseInt(document.getElementById('p-cat').value),
                    desc: document.getElementById('p-desc').value,
                    stock: stockValue ? parseInt(stockValue) : null,
                    tutorial_url: tutorialUrl || null,
                    has_product_id: hasProductId
                };
                // ถ้าเป็น update และไม่ได้เลือกไฟล์ใหม่ → ไม่บันทึก file_content ทับของเดิม
                if(fileContent) {
                    data.file_content = fileContent;
                }
                this.loading(true);
                const res = id ? await _supabase.from('products').update(data).eq('id', id) : await _supabase.from('products').insert([data]);
                this.loading(false);
                if(res.error) { NotificationManager.error(res.error.message); return; }
                NotificationManager.success(id ? 'ແກ້ໄຂສິນຄ້າສຳເລັດ!' : 'ເພີ່ມສິນຄ້າສຳເລັດ!');
                // reset form
                document.getElementById('edit-p-id').value = '';
                document.getElementById('p-name').value = '';
                document.getElementById('p-price').value = '';
                document.getElementById('p-img').value = '';
                document.getElementById('p-desc').value = '';
                document.getElementById('p-stock').value = '';
                await this.fetchData();
                this.renderAdmin();
                this.tab('tab-p');
            },

            saveCategory: async function() {
                const id = document.getElementById('edit-c-id').value;
                const data = { name: document.getElementById('c-name').value, img: document.getElementById('c-img').value };
                this.loading(true);
                const res = id ? await _supabase.from('categories').update(data).eq('id', id) : await _supabase.from('categories').insert([data]);
                this.loading(false);
                if(res.error) { NotificationManager.error(res.error.message); return; }
                NotificationManager.success(id ? 'ແກ້ໄຂໝວດໝູ່ສຳເລັດ!' : 'ເພີ່ມໝວດໝູ່ສຳເລັດ!');
                document.getElementById('edit-c-id').value = '';
                document.getElementById('c-name').value = '';
                document.getElementById('c-img').value = '';
                await this.fetchData();
                this.renderAdmin();
                this.tab('tab-c');
            },

            filterPopupProducts: function() {
                const q = (document.getElementById('pop-search').value || '').toLowerCase().trim();
                const list = document.getElementById('pop-product-list');
                let items = this.db.products || [];
                if(q) items = items.filter(p => p.name.toLowerCase().includes(q));
                
                if(items.length === 0) {
                    list.innerHTML = '<div style="text-align:center; color:#555; font-size:12px; padding:15px;">ບໍ່ພົບສິນຄ້າ</div>';
                    return;
                }
                
                list.innerHTML = items.map(p => `
                    <div onclick="app.selectPopupProduct(${p.id}, '${p.name.replace(/'/g,"\'")}', '${p.img}', ${p.price})"
                         style="display:flex; align-items:center; gap:10px; background:#1a1a1a; border-radius:10px; padding:8px 10px; cursor:pointer; border:1.5px solid transparent; transition:all 0.15s;"
                         onmouseover="this.style.borderColor='rgba(255,0,0,0.4)'; this.style.background='#221010';"
                         onmouseout="this.style.borderColor='transparent'; this.style.background='#1a1a1a';">
                        <img src="${p.img}" style="width:44px; height:44px; object-fit:cover; border-radius:8px; flex-shrink:0;" onerror="this.src='https://via.placeholder.com/44?text=?'">
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; color:#fff; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                            <div style="font-size:11px; color:var(--main-red);">${Number(p.price).toLocaleString()} ₭</div>
                        </div>
                        <i class="fas fa-plus-circle" style="color:#555; font-size:16px; flex-shrink:0;"></i>
                    </div>
                `).join('');
            },

            selectPopupProduct: function(id, name, img, price) {
                document.getElementById('pop-product').value = id;
                const card = document.getElementById('pop-selected-card');
                card.style.display = 'flex';
                document.getElementById('pop-preview-img').src = img;
                document.getElementById('pop-preview-name').textContent = name;
                document.getElementById('pop-preview-price').textContent = Number(price).toLocaleString() + ' ₭';
                document.getElementById('pop-product-list').innerHTML = '';
                document.getElementById('pop-search').value = '';
            },

            switchPopupType: function(type) {
                document.getElementById('pop-type').value = type;
                const isProduct = type === 'product';
                document.getElementById('pop-section-product').style.display = isProduct ? 'block' : 'none';
                document.getElementById('pop-section-custom').style.display = isProduct ? 'none' : 'block';
                document.getElementById('pop-type-product-btn').className = 'btn btn-sm ' + (isProduct ? 'btn-red' : 'btn-outline');
                document.getElementById('pop-type-custom-btn').className = 'btn btn-sm ' + (!isProduct ? 'btn-red' : 'btn-outline');
                if (isProduct) {
                    // reset & show all products
                    document.getElementById('pop-product').value = '';
                    document.getElementById('pop-selected-card').style.display = 'none';
                    document.getElementById('pop-search').value = '';
                    this.filterPopupProducts();
                }
            },

            previewCustomPopupImg: function() {
                const url = document.getElementById('pop-custom-img').value.trim();
                const preview = document.getElementById('pop-custom-preview');
                const img = document.getElementById('pop-custom-preview-img');
                if (url) {
                    img.src = url;
                    img.style.display = 'block';
                    preview.style.display = 'block';
                } else {
                    preview.style.display = 'none';
                }
            },

            savePopup: async function() {
                const id = document.getElementById('edit-pop-id').value;
                const type = document.getElementById('pop-type').value;
                const order = parseInt(document.getElementById('pop-order').value) || 1;
                
                let data = { order };

                if (type === 'product') {
                    const productId = parseInt(document.getElementById('pop-product').value);
                    if (!productId) {
                        NotificationManager.warning('ກະລຸນາເລືອກສິນຄ້າ');
                        return;
                    }
                    data.product_id = productId;
                    data.custom_img = null;
                    data.custom_link = null;
                } else {
                    const customImg = document.getElementById('pop-custom-img').value.trim();
                    if (!customImg) {
                        NotificationManager.warning('ກະລຸນາໃສ່ URL ຮູບພາບ');
                        return;
                    }
                    data.product_id = null;
                    data.custom_img = customImg;
                    data.custom_link = document.getElementById('pop-custom-link').value.trim() || null;
                }
                
                this.loading(true);
                const res = id ?
                    await _supabase.from('popups').update(data).eq('id', id) :
                    await _supabase.from('popups').insert([data]);
                this.loading(false);
                if(res.error) { NotificationManager.error(res.error.message); return; }
                NotificationManager.success(id ? 'ອັບເດດ Popup ສຳເລັດ!' : 'ເພີ່ມ Popup ສຳເລັດ!');
                document.getElementById('edit-pop-id').value = '';
                document.getElementById('pop-product').value = '';
                document.getElementById('pop-order').value = '1';
                document.getElementById('pop-selected-card').style.display = 'none';
                document.getElementById('btn-save-pop').innerHTML = 'ບັນທຶກ Popup';
                await this.fetchData();
                this.renderAdmin();
            },

            editPopup: function(id) {
                const pop = this.db.popups.find(x => x.id == id);
                document.getElementById('edit-pop-id').value = pop.id;
                document.getElementById('pop-order').value = pop.order;
                
                if (pop.custom_img) {
                    this.switchPopupType('custom');
                    document.getElementById('pop-custom-img').value = pop.custom_img;
                    document.getElementById('pop-custom-link').value = pop.custom_link || '';
                    this.previewCustomPopupImg();
                } else {
                    this.switchPopupType('product');
                    const product = this.db.products.find(p => p.id === pop.product_id);
                    if (product) {
                        this.selectPopupProduct(product.id, product.name, product.img, product.price);
                    }
                }
                
                document.getElementById('btn-save-pop').innerHTML = '<i class="fas fa-save"></i> ອັບເດດ Popup';
                window.scrollTo(0,0);
            },

            delPopup: async function(id) {
                if(await CustomConfirm.show('ລົບ Popup ນີ້?', {title:'ລົບ Popup', icon:'fa-trash'})) {
                    await _supabase.from('popups').delete().eq('id', id);
                    NotificationManager.success('ລົບ Popup ສຳເລັດ!');
                    await this.fetchData();
                    this.renderAdmin();
                }
            },

            saveSettings: async function() {
                const data = {
                    banners: this.db.settings.banners || [],
                    banner: (this.db.settings.banners || [])[0] || '', // backward compat
                    contact: {
                        wa: document.getElementById('s-wa').value,
                        tt: document.getElementById('s-tt').value,
                        fb: document.getElementById('s-fb').value
                    },
                    footer_logo: (document.getElementById('s-footer-logo') || {}).value || (this.db.settings.footer_logo || ''),
                    footer_desc: (document.getElementById('s-footer-desc') || {}).value || (this.db.settings.footer_desc || ''),
                    fb_page_url: (document.getElementById('s-fb-page') || {}).value || (this.db.settings.fb_page_url || ''),
                    fb_page_name: (document.getElementById('s-fb-page-name') || {}).value || (this.db.settings.fb_page_name || '')
                };
                this.loading(true);
                const { error } = await _supabase.from('settings').update({ data }).eq('id', 1);
                this.loading(false);
                if(error) { NotificationManager.error(error.message); return; }
                NotificationManager.success('ບັນທຶກການຕັ້ງຄ່າສຳເລັດ!');
                await this.fetchData();
            },

            // ===== BANNER MANAGEMENT =====
            addBanner: async function() {
                const url = (document.getElementById('s-banner-new').value || '').trim();
                if(!url) return;
                if(!this.db.settings.banners) this.db.settings.banners = this.db.settings.banner ? [this.db.settings.banner] : [];
                this.db.settings.banners.push(url);
                document.getElementById('s-banner-new').value = '';
                this.renderBannerAdmin();
                await this.saveSettings();
            },
            removeBanner: async function(idx) {
                if(!this.db.settings.banners) return;
                this.db.settings.banners.splice(idx, 1);
                this.renderBannerAdmin();
                await this.saveSettings();
            },
            renderBannerAdmin: function() {
                const el = document.getElementById('banner-list-admin');
                if(!el) return;
                const banners = this.db.settings.banners || (this.db.settings.banner ? [this.db.settings.banner] : []);
                if(!banners.length) { el.innerHTML = '<p style="color:#555;font-size:12px;text-align:center;padding:8px;">ຍັງບໍ່ມີ banner</p>'; return; }
                el.innerHTML = banners.map((b,i) => `
                    <div style="display:flex;align-items:center;gap:8px;background:#1a1a1a;border-radius:8px;padding:8px 10px;border:1px solid #2a2a2a;">
                        <img src="${b}" style="width:56px;height:36px;object-fit:cover;border-radius:5px;flex-shrink:0;" onerror="this.src='https://via.placeholder.com/56x36?text=?'">
                        <div style="flex:1;font-size:11px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b}</div>
                        <i class="fas fa-trash" style="color:#ff4444;cursor:pointer;font-size:14px;flex-shrink:0;" onclick="app.removeBanner(${i})"></i>
                    </div>
                `).join('');
            },

            saveUser: async function() {
                const username = document.getElementById('u-user').value;
                const password = document.getElementById('u-pass').value;
                if(!username || !password) return;
                const { error } = await _supabase.from('users').insert([{ username, password }]);
                if(error) { NotificationManager.error(error.message); return; }
                NotificationManager.success('ເພີ່ມ Admin ສຳເລັດ!');
                document.getElementById('u-user').value = '';
                document.getElementById('u-pass').value = '';
                await this.fetchData();
                this.renderAdmin();
            },

            delP: async function(id) { if(await CustomConfirm.show('ລົບສິນຄ້ານີ້?', {title:'ລົບສິນຄ້າ', icon:'fa-trash'})) { await _supabase.from('products').delete().eq('id', id); NotificationManager.success('ລົບສິນຄ້າສຳເລັດ!'); await this.fetchData(); this.renderAdmin(); } },
            delC: async function(id) { if(await CustomConfirm.show('ລົບໝວດໝູ່ນີ້?', {title:'ລົບໝວດໝູ່', icon:'fa-trash'})) { await _supabase.from('categories').delete().eq('id', id); NotificationManager.success('ລົບໝວດໝູ່ສຳເລັດ!'); await this.fetchData(); this.renderAdmin(); } },
            delU: async function(id) { if(await CustomConfirm.show('ລົບ Admin ນີ້?', {title:'ລົບ Admin', icon:'fa-trash'})) { await _supabase.from('users').delete().eq('id', id); NotificationManager.success('ລົບ Admin ສຳເລັດ!'); await this.fetchData(); this.renderAdmin(); } },

            editP: function(id) {
                const p = this.db.products.find(x => x.id == id);
                document.getElementById('edit-p-id').value = p.id;
                document.getElementById('p-name').value = p.name;
                document.getElementById('p-price').value = p.price;
                document.getElementById('p-img').value = p.img;
                document.getElementById('p-cat').value = p.catid;
                document.getElementById('p-desc').value = p.desc;
                document.getElementById('p-stock').value = p.stock || '';
                // โหลด tutorial และ file กลับมาแสดง
                document.getElementById('p-tutorial').value = p.tutorial_url || '';
                document.getElementById('p-file-content').value = p.file_content || '';
                document.getElementById('p-has-id').checked = p.has_product_id || false;
                document.getElementById('btn-save-p').innerText = "Update Product";
                window.scrollTo(0,0);
            },

            editC: function(id) {
                const c = this.db.categories.find(x => x.id == id);
                document.getElementById('edit-c-id').value = c.id;
                document.getElementById('c-name').value = c.name;
                document.getElementById('c-img').value = c.img;
                document.getElementById('btn-save-c').innerText = "Update Category";
                window.scrollTo(0,0);
            },

            login: function() {
                const u = document.getElementById('log-u').value;
                const p = document.getElementById('log-p').value;
                const admin = this.db.users.find(x => x.username === u && x.password === p);
                if(admin || (u === "khoud" && p === "khoud123@")) {
                    localStorage.setItem('adminLogin','true');
                    this.closeModal('login-modal');
                    router.admin();
                } else { NotificationManager.error('User ຫຼື Pass ຜິດ!'); }
            },

            logout: function() {
                localStorage.removeItem('adminLogin');
                router.home();
            },

            // ===== HOT DEALS FUNCTIONS =====
            loadHotItems: function() {
                // reset selection
                document.getElementById('hot-item').value = '';
                document.getElementById('hot-selected-card').style.display = 'none';
                document.getElementById('hot-search').value = '';
                this.filterHotItems();
            },

            filterHotItems: function() {
                const type = document.getElementById('hot-type').value;
                const q = (document.getElementById('hot-search').value || '').toLowerCase().trim();
                const list = document.getElementById('hot-item-list');
                
                let items = [];
                if(type === 'category') {
                    items = this.db.categories.map(c => ({ id: c.id, name: c.name, img: c.img, sub: '' }));
                } else {
                    items = this.db.products.map(p => ({ id: p.id, name: p.name, img: p.img, sub: Number(p.price).toLocaleString() + ' ₭' }));
                }
                
                if(q) items = items.filter(i => i.name.toLowerCase().includes(q));
                
                if(items.length === 0) {
                    list.innerHTML = '<div style="text-align:center; color:#555; font-size:12px; padding:15px;">ບໍ່ພົບລາຍການ</div>';
                    return;
                }
                
                list.innerHTML = items.map(i => `
                    <div onclick="app.selectHotItem(${i.id}, '${i.name.replace(/'/g,"\'")}', '${i.img}')"
                         style="display:flex; align-items:center; gap:10px; background:#1a1a1a; border-radius:10px; padding:8px 10px; cursor:pointer; border:1.5px solid transparent; transition:all 0.15s;"
                         onmouseover="this.style.borderColor='rgba(255,0,0,0.4)'; this.style.background='#221010';"
                         onmouseout="this.style.borderColor='transparent'; this.style.background='#1a1a1a';">
                        <img src="${i.img}" style="width:44px; height:44px; object-fit:cover; border-radius:8px; flex-shrink:0;" onerror="this.src='https://via.placeholder.com/44?text=?'">
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; color:#fff; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.name}</div>
                            ${i.sub ? `<div style="font-size:11px; color:var(--main-red);">${i.sub}</div>` : ''}
                        </div>
                        <i class="fas fa-plus-circle" style="color:#555; font-size:16px; flex-shrink:0;"></i>
                    </div>
                `).join('');
            },

            selectHotItem: function(id, name, img) {
                document.getElementById('hot-item').value = id;
                const card = document.getElementById('hot-selected-card');
                card.style.display = 'flex';
                document.getElementById('hot-selected-img').src = img;
                document.getElementById('hot-selected-name').textContent = name;
                document.getElementById('hot-item-list').innerHTML = '';
                document.getElementById('hot-search').value = '';
            },

            addHotDeal: async function() {
                const type = document.getElementById('hot-type').value;
                const itemId = parseInt(document.getElementById('hot-item').value);
                
                if(!itemId) {
                    NotificationManager.warning('ກະລຸນາເລືອກລາຍການ');
                    return;
                }
                
                const { error } = await _supabase.from('hot_deals').insert([{
                    type: type,
                    item_id: itemId
                }]);
                
                if(error) { NotificationManager.error(error.message); return; }
                NotificationManager.success('ເພີ່ມ Hot Deal ສຳເລັດ!');
                document.getElementById('hot-item').value = '';
                document.getElementById('hot-selected-card').style.display = 'none';
                await this.fetchData();
                this.renderAdmin();
                this.tab('tab-hot');
            },

            removeHotDeal: async function(type, id) {
                const { error } = await _supabase.from('hot_deals').delete().match({ type: type, item_id: id });
                if(error) { NotificationManager.error(error.message); return; }
                NotificationManager.success('ລົບ Hot Deal ສຳເລັດ!');
                await this.fetchData();
                this.renderAdmin();
            },

            renderHotDeals: function() {
                const hotCatsList = document.getElementById('hot-cats-list');
                const hotCats = this.db.hot_deals.categories || [];
                if(hotCats.length === 0) {
                    hotCatsList.innerHTML = '<p style="color:#999; font-size:12px;">ຍັງບໍ່ມີໝວດໝູ່ຂາຍດີ</p>';
                } else {
                    hotCatsList.innerHTML = hotCats.map(id => {
                        const cat = this.db.categories.find(c => c.id === id);
                        if(!cat) return '';
                        return `
                            <div style="background:#1a1a1a; padding:10px; border-radius:8px; display:flex; align-items:center; gap:10px;">
                                <img src="${cat.img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                                <div style="flex:1;">
                                    <div style="font-size:13px; color:#fff;">${cat.name}</div>
                                </div>
                                <button class="btn btn-red btn-sm" onclick="app.removeHotDeal('category', ${id})" style="padding:4px 8px;">ລົບ</button>
                            </div>
                        `;
                    }).filter(Boolean).join('');
                }
                
                const hotProdsList = document.getElementById('hot-prods-list');
                const hotProds = this.db.hot_deals.products || [];
                if(hotProds.length === 0) {
                    hotProdsList.innerHTML = '<p style="color:#999; font-size:12px;">ຍັງບໍ່ມີສິນຄ້າຂາຍດີ</p>';
                } else {
                    hotProdsList.innerHTML = hotProds.map(id => {
                        const prod = this.db.products.find(p => p.id === id);
                        if(!prod) return '';
                        return `
                            <div style="background:#1a1a1a; padding:10px; border-radius:8px; display:flex; align-items:center; gap:10px;">
                                <img src="${prod.img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                                <div style="flex:1;">
                                    <div style="font-size:13px; color:#fff;">${prod.name}</div>
                                    <div style="font-size:11px; color:var(--main-red);">${Number(prod.price).toLocaleString()} ₭</div>
                                </div>
                                <button class="btn btn-red btn-sm" onclick="app.removeHotDeal('product', ${id})" style="padding:4px 8px;">ລົບ</button>
                            </div>
                        `;
                    }).filter(Boolean).join('');
                }
            },

            // ===== TOPUP FUNCTIONS =====
            switchTopupTab: function(tab) {
                document.getElementById('tab-bank').classList.remove('active');
                document.getElementById('tab-code').classList.remove('active');
                document.getElementById('topup-bank').style.display = 'none';
                document.getElementById('topup-code').style.display = 'none';
                
                if(tab === 'bank') {
                    document.getElementById('tab-bank').classList.add('active');
                    document.getElementById('topup-bank').style.display = 'block';
                } else {
                    document.getElementById('tab-code').classList.add('active');
                    document.getElementById('topup-code').style.display = 'block';
                }
            },

            selectAmount: function(amount, element) {
                document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
                element.classList.add('selected');
                selectedAmount = amount;
                document.getElementById('custom-amount').value = amount;
            },

            copyToClipboard: function(text, btn) {
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> ສຳເນົາແລ້ວ';
                    btn.classList.add('copied');
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.classList.remove('copied');
                    }, 2000);
                });
            },

            previewSlip: function(input) {
                if (input.files && input.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('slip-preview');
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(input.files[0]);
                }
            },

            formatRedeemCode: function(input) {
                let value = input.value.replace(/[^A-Za-z0-9]/g, ''); // ไม่แปลง uppercase แล้ว
                if (value.length > 4) {
                    value = value.substring(0,4) + '-' + value.substring(4,8);
                }
                if (value.length > 9) {
                    value = value.substring(0,9) + '-' + value.substring(9,13);
                }
                input.value = value;
            },

            submitTopup: async function() {
                if(!currentUser) {
                    NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ');
                    return;
                }

                const amount = parseInt(document.getElementById('custom-amount').value) || selectedAmount;
                const slipFile = document.getElementById('slip-upload').files[0];

                if(!amount || amount < 10000) {
                    NotificationManager.warning('ກະລຸນາລະບຸຈຳນວນເງິນ (ຂັ້ນຕ່ຳ 10,000 ກີບ)');
                    return;
                }
                if(!slipFile) {
                    NotificationManager.warning('ກະລຸນາອັບໂຫຼດສະລິບ');
                    return;
                }

                // ===== ກວດ Spam Limit =====
                const today = new Date().toISOString().slice(0, 10);
                const { data: todayTopups } = await _supabase
                    .from('topup_requests')
                    .select('amount, created_at')
                    .eq('user_id', currentUser.id)
                    .gte('created_at', today + 'T00:00:00')
                    .lte('created_at', today + 'T23:59:59');

                if(todayTopups) {
                    if(todayTopups.length >= 20) {
                        NotificationManager.error('ທ່ານສົ່ງຄຳຂໍເຕີມເງິນຄົບ 20 ຄັ້ງສຳລັບວັນນີ້ແລ້ວ ກະລຸນາລໍຖ້າວັນໃໝ່');
                        return;
                    }
                    const sameAmountCount = todayTopups.filter(t => parseInt(t.amount) === parseInt(amount)).length;
                    if(sameAmountCount >= 3) {
                        NotificationManager.error('ຍອດ ' + Number(amount).toLocaleString() + ' ກີບ ສົ່ງຄົບ 3 ຄັ້ງສຳລັບວັນນີ້ແລ້ວ ກະລຸນາໃຊ້ຍອດອື່ນ');
                        return;
                    }
                }
                
                // อัปโหลดรูปไปยัง Supabase Storage
                showProcessing('ກຳລັງສົ່ງຂໍ້ມູນ<br>ກະລຸນາລໍຖ້າ ຢ່າປິດໜ້ານີ້...');
                const fileName = `slip_${currentUser.id}_${Date.now()}.jpg`;
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('slips')
                    .upload(fileName, slipFile);
                    
                if(uploadError) {
                    hideProcessing();
                    NotificationManager.error('ອັບໂຫຼດຮູບບໍ່ສຳເລັດ');
                    return;
                }
                
                const { data: urlData } = _supabase.storage.from('slips').getPublicUrl(fileName);
                const slipUrl = urlData.publicUrl;
                
                // สร้างคำขอเติมเงิน
                const { error } = await _supabase.from('topup_requests').insert([{
                    user_id: currentUser.id,
                    username: currentUser.username,
                    amount: amount,
                    slip_url: slipUrl,
                    status: 'pending'
                }]);
                
                if(error) {
                    hideProcessing();
                    NotificationManager.error('ເກີດຂໍ້ຜິດພາດ');
                } else {
                    hideProcessing();
                    NotificationManager.success('ສົ່ງຂໍ້ມູນສຳເລັດ! ກະລຸນາລໍຖ້າ Admin ກວດສອບ');
                    // รีเซ็ตฟอร์ม
                    document.getElementById('slip-upload').value = '';
                    document.getElementById('slip-preview').style.display = 'none';
                    document.getElementById('custom-amount').value = '';
                    document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
                }
            },

            redeemCode: async function() {
                if(!currentUser) {
                    NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ');
                    return;
                }
                
                const code = document.getElementById('redeem-code').value.trim();
                if(!code) {
                    NotificationManager.warning('ກະລຸນາໃສ່ໂຄດ');
                    return;
                }
                
                // ตรวจสอบโค้ด (ไม่ใช้ .eq('used', false) แล้ว)
                showProcessing('ກຳລັງກວດສອບໂຄດ<br>ກະລຸນາລໍຖ້າ...');
                const { data: redeemCode } = await _supabase
                    .from('redeem_codes')
                    .select('*')
                    .eq('code', code)
                    .or('is_active.is.null,is_active.eq.true')
                    .single();
                    
                if(!redeemCode) {
                    hideProcessing();
                    NotificationManager.error('ໂຄດບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ');
                    return;
                }
                
                // ตรวจสอบวันหมดอายุ (ถ้ามี)
                if(redeemCode.expiry && new Date(redeemCode.expiry) < new Date()) {
                    // ลบโค้ดที่หมดอายุ
                    await _supabase.from('redeem_codes').delete().eq('id', redeemCode.id);
                    hideProcessing();
                    NotificationManager.error('ໂຄດໝົດອາຍຸແລ້ວ');
                    return;
                }
                
                // ตรวจสอบว่าใช้ครบหรือยัง
                const currentUses = redeemCode.current_uses || 0;
                const maxUses = redeemCode.max_uses || 1;
                if(currentUses >= maxUses) {
                    hideProcessing();
                    NotificationManager.error('ໂຄດນີ້ຖືກໃຊ້ຄົບແລ້ວ');
                    return;
                }
                
                // ตรวจสอบว่าคนนี้เคยใช้แล้วหรือยัง
                const { data: existingUse } = await _supabase
                    .from('code_redemptions')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('code_id', redeemCode.id)
                    .maybeSingle();
                
                if(existingUse) {
                    hideProcessing();
                    NotificationManager.error('ທ່ານເຄີຍໃຊ້ໂຄ້ດນີ້ໄປແລ້ວ');
                    return;
                }
                
                // บันทึกประวัติการใช้โค้ด ก่อนเสมอ (ป้องกัน race condition)
                await _supabase.from('code_redemptions').insert([{
                    user_id: currentUser.id,
                    code_id: redeemCode.id,
                    amount: redeemCode.amount
                }]);

                // เพิ่มเงินให้ผู้ใช้
                const newBalance = (currentUser.balance || 0) + redeemCode.amount;
                await _supabase.from('site_users').update({ balance: newBalance }).eq('id', currentUser.id);
                
                // อัปเดตจำนวนการใช้
                const newCurrentUses = currentUses + 1;
                
                // ถ้าใช้ครบ → อัปเดตเป็น is_active=false แทนการลบ (เพื่อไม่ให้ FK code_redemptions พัง)
                if(newCurrentUses >= maxUses) {
                    await _supabase.from('redeem_codes').update({ current_uses: newCurrentUses, is_active: false }).eq('id', redeemCode.id);
                } else {
                    await _supabase.from('redeem_codes').update({ current_uses: newCurrentUses }).eq('id', redeemCode.id);
                }
                
                await app._updateSpinProgress(redeemCode.amount);
                NotificationManager.success(`ໃຊ້ໂຄດສຳເລັດ! ໄດ້ຮັບເງິນ ${redeemCode.amount.toLocaleString()} ₭`);
                hideProcessing();
                
                // อัปเดต currentUser
                currentUser.balance = newBalance;
                this.updateUserUI();
                
                // รีเซ็ตฟอร์ม
                document.getElementById('redeem-code').value = '';
            },

            addRedeemCode: async function() {
                const code = document.getElementById('code-value').value.trim(); // ไม่แปลง uppercase
                const amount = parseInt(document.getElementById('code-amount').value);
                const maxUses = parseInt(document.getElementById('code-max-uses').value) || 1;
                const expiry = document.getElementById('code-expiry').value;
                
                if(!code || !amount) {
                    NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ');
                    return;
                }
                
                const data = {
                    code: code,
                    amount: amount,
                    max_uses: maxUses,
                    current_uses: 0
                };
                
                // เพิ่ม expiry ถ้ามีค่า
                if(expiry) {
                    data.expiry = expiry;
                }
                
                const { error } = await _supabase.from('redeem_codes').insert([data]);
                if(error) {
                    console.error('Insert error:', error);
                    NotificationManager.error('ເກີດຂໍ້ຜິດພາດ: ' + error.message);
                } else {
                    NotificationManager.success('ເພີ່ມໂຄດສຳເລັດ!');
                    // รีเฟรช data แทนการ reload
                    await this.fetchData();
                    this.renderAdmin();
                    // รีเซ็ตฟอร์ม
                    document.getElementById('code-value').value = '';
                    document.getElementById('code-amount').value = '';
                    document.getElementById('code-max-uses').value = '1';
                    document.getElementById('code-expiry').value = '';
                }
            },

            deleteRedeemCode: async function(id) {
                if(await CustomConfirm.show('ລົບໂຄດນີ້?', {title:'ລົບໂຄດ', icon:'fa-trash'})) {
                    await _supabase.from('redeem_codes').delete().eq('id', id);
                    NotificationManager.success('ລົບໂຄດສຳເລັດ!');
                    await this.fetchData();
                    this.renderAdmin();
                }
            },

            approveTopup: async function(id) {
                const { data: topup } = await _supabase.from('topup_requests').select('*').eq('id', id).single();
                if(topup) {
                    // ดึงข้อมูลผู้ใช้ปัจจุบัน
                    const { data: user } = await _supabase.from('site_users').select('*').eq('id', topup.user_id).single();
                    
                    // อัปเดตยอดเงินผู้ใช้
                    const newBalance = (user.balance || 0) + topup.amount;
                    await _supabase.from('site_users').update({ balance: newBalance }).eq('id', topup.user_id);
                    
                    // ลบรายการเติมเงินทิ้งเลย (ไม่เปลืองพื้นที่ database)
                    await _supabase.from('topup_requests').delete().eq('id', id);
                    
                    await app._updateSpinProgress(topup.amount, topup.user_id);
                    NotificationManager.success('ອະນຸມັດສຳເລັດ! ລຶບລາຍການແລ້ວ');
                    await this.fetchData();
                    this.renderAdmin();
                    this.tab('tab-topup-admin');
                }
            },

            rejectTopup: async function(id) {
                if(await CustomConfirm.show('ຢືນຢັນປະຕິເສດລາຍການນີ້?', {title:'ປະຕິເສດການເຕີມເງິນ', icon:'fa-times-circle'})) {
                    // ລົບລາຍການທິ້ງເລີຍ
                    await _supabase.from('topup_requests').delete().eq('id', id);
                    NotificationManager.warning('ປະຕິເສດແລ້ວ! ລຶບລາຍການແລ້ວ');
                    await this.fetchData();
                    this.renderAdmin();
                    this.tab('tab-topup-admin');
                }
            },

            // ============ USER SYSTEM ============
            
            toggleSecurityMenu: function() {
                const sub = document.getElementById('security-submenu');
                const chevron = document.getElementById('security-chevron');
                const isOpen = sub.style.display !== 'none';
                sub.style.display = isOpen ? 'none' : 'block';
                chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            },

            toggleUserMenu: function() {
                if(!currentUser) {
                    this.openUserAuth();
                    return;
                }
                const menu = document.getElementById('user-menu');
                const isOpening = menu.style.display === 'none' || menu.style.display === '';
                menu.style.display = isOpening ? 'block' : 'none';
                const navProfile = document.getElementById('nav-profile');
                if(isOpening) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    if(navProfile) navProfile.classList.remove('active');
                    // ปิด security submenu ด้วย
                    const sub = document.getElementById('security-submenu');
                    const chevron = document.getElementById('security-chevron');
                    if(sub) sub.style.display = 'none';
                    if(chevron) chevron.style.transform = 'rotate(0deg)';
                }
            },

            openUserAuth: function() {
                router.show('view-login');
                ['register-form','forgot-form','reset-form'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
                document.getElementById('login-form').style.display = 'block';
                this._clearLoginForm();
            },

            switchToRegister: function() {
                router.show('view-register');
                document.getElementById('register-form').style.display = 'block';
                this._clearRegisterForm();
            },

            switchToLogin: function() {
                router.show('view-login');
                ['register-form','forgot-form','reset-form'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
                document.getElementById('login-form').style.display = 'block';
                this._clearLoginForm();
            },

            showForgotPassword: function() {
                document.getElementById('login-form').style.display = 'none';
                document.getElementById('forgot-form').style.display = 'block';
                document.getElementById('forgot-username').value = '';
                document.getElementById('forgot-pin').value = '';
            },

            _forgotUserId: null,

            verifyForgotPin: async function() {
                const username = document.getElementById('forgot-username').value.trim();
                const pin = document.getElementById('forgot-pin').value.trim();
                if(!username || !pin) { NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ'); return; }
                showProcessing('ກຳລັງຕິດຕໍ່...');
                try {
                    const { data } = await _supabase.from('site_users').select('id,pin').eq('username', username).maybeSingle();
                    hideProcessing();
                    if(!data) { NotificationManager.error('ບໍ່ພົບຊື່ຜູ້ໃຊ້ນີ້'); return; }
                    if(String(data.pin) !== String(pin)) { NotificationManager.error('PIN ບໍ່ຖືກຕ້ອງ'); return; }
                    this._forgotUserId = data.id;
                    document.getElementById('forgot-form').style.display = 'none';
                    document.getElementById('reset-form').style.display = 'block';
                    document.getElementById('reset-password').value = '';
                    document.getElementById('reset-confirm').value = '';
                } catch(e) { hideProcessing(); NotificationManager.error('ເກີດຂໍ້ຜິດພາດ'); }
            },

            doResetPassword: async function() {
                const pw = document.getElementById('reset-password').value;
                const cf = document.getElementById('reset-confirm').value;
                if(!pw || !cf) { NotificationManager.warning('ກະລຸນາກອກລະຫັດຜ່ານ'); return; }
                if(pw !== cf) { NotificationManager.error('ລະຫັດຜ່ານບໍ່ຕົງກັນ'); return; }
                if(pw.length < 6) { NotificationManager.error('ລະຫັດຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ'); return; }
                showProcessing('ກຳລັງບັນທຶກ...');
                try {
                    const { error } = await _supabase.from('site_users').update({ password: pw }).eq('id', this._forgotUserId);
                    hideProcessing();
                    if(error) throw error;
                    NotificationManager.success('ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
                    this._forgotUserId = null;
                    document.getElementById('reset-form').style.display = 'none';
                    document.getElementById('login-form').style.display = 'block';
                } catch(e) { hideProcessing(); NotificationManager.error('ເກີດຂໍ້ຜິດພາດ'); }
            },

            checkPwStrengthChange: function(pw) {
                this._pwStrength(pw, 'change-strength-fill', 'change-strength-hint');
            },
            checkPwStrengthReg: function(pw) {
                this._pwStrength(pw, 'reg-strength-fill', 'reg-strength-hint');
            },
            checkPwStrengthReset: function(pw) {
                this._pwStrength(pw, 'reset-strength-fill', 'reset-strength-hint');
            },
            _pwStrength: function(pw, fillId, hintId) {
                const fill = document.getElementById(fillId);
                const hint = document.getElementById(hintId);
                if(!fill || !hint) return;
                const checks = {
                    upper: /[A-Z]/.test(pw),
                    lower: /[a-z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw),
                    long: pw.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                const colors = ['#ff2222','#ff6622','#ffaa00','#88dd00','#00ff88'];
                const widths = ['20%','40%','60%','80%','100%'];
                fill.style.background = score > 0 ? colors[score-1] : '#333';
                fill.style.width = score > 0 ? widths[score-1] : '0%';
                let missing = [];
                if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                if(!checks.num) missing.push('ຕົວເລກ 0-9');
                if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                if(score >= 5) { hint.style.color='#00ff88'; hint.textContent='✓ ລະຫັດຜ່ານເຂັ້ມແຂງ'; }
                else if(pw.length === 0) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                else { hint.style.color='#ffaa00'; hint.textContent='ຍັງຂາດ: ' + missing.join(', '); }
            },

            checkPasswordStrength: function(pw) {
                this._pwStrength(pw, 'change-strength-fill', 'change-strength-hint');
            },
                if(!fill) return;
                const checks = {
                    upper: /[A-Z]/.test(pw),
                    lower: /[a-z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw),
                    long: pw.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                const colors = ['#ff2222','#ff6622','#ffaa00','#88dd00','#00ff88'];
                const widths = ['20%','40%','60%','80%','100%'];
                fill.style.background = score > 0 ? colors[score-1] : '#333';
                fill.style.width = score > 0 ? widths[score-1] : '0%';
                let missing = [];
                if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                if(!checks.num) missing.push('ຕົວເລກ 0-9');
                if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                if(score >= 5) { hint.style.color='#00ff88'; hint.textContent='✓ ລະຫັດຜ່ານເຂັ້ມແຂງ'; }
                else if(pw.length === 0) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                else { hint.style.color='#ffaa00'; hint.textContent='ຍັງຂາດ: ' + missing.join(', '); }
            },

            checkPasswordStrengthReg: function(pw) {
                const fill = document.getElementById('reg-strength-fill');
                const hint = document.getElementById('reg-strength-hint');
                if(!fill) return;
                const checks = {
                    upper: /[A-Z]/.test(pw),
                    lower: /[a-z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw),
                    long: pw.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                const colors = ['#ff2222','#ff6622','#ffaa00','#88dd00','#00ff88'];
                const widths = ['20%','40%','60%','80%','100%'];
                fill.style.background = score > 0 ? colors[score-1] : '#333';
                fill.style.width = score > 0 ? widths[score-1] : '0%';
                let missing = [];
                if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                if(!checks.num) missing.push('ຕົວເລກ 0-9');
                if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                if(score >= 5) { hint.style.color='#00ff88'; hint.textContent='✓ ລະຫັດຜ່ານເຂັ້ມແຂງ'; }
                else if(pw.length === 0) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                else { hint.style.color='#ffaa00'; hint.textContent='ຍັງຂາດ: ' + missing.join(', '); }
            },

            checkPasswordStrengthReset: function(pw) {
                const fill = document.getElementById('reset-strength-fill');
                const hint = document.getElementById('reset-strength-hint');
                if(!fill) return;
                const checks = {
                    upper: /[A-Z]/.test(pw),
                    lower: /[a-z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw),
                    long: pw.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                const colors = ['#ff2222','#ff6622','#ffaa00','#88dd00','#00ff88'];
                const widths = ['20%','40%','60%','80%','100%'];
                fill.style.background = score > 0 ? colors[score-1] : '#333';
                fill.style.width = score > 0 ? widths[score-1] : '0%';
                let missing = [];
                if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                if(!checks.num) missing.push('ຕົວເລກ 0-9');
                if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                if(score >= 5) { hint.style.color='#00ff88'; hint.textContent='✓ ລະຫັດຜ່ານເຂັ້ມແຂງ'; }
                else if(pw.length === 0) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                else { hint.style.color='#ffaa00'; hint.textContent='ຍັງຂາດ: ' + missing.join(', '); }
            },

            userRegister: async function() {
                const cfToken = document.querySelector('#cf-register [name="cf-turnstile-response"]');
                if(!cfToken || !cfToken.value) { NotificationManager.warning('ກະລຸນາຢືນຢັນວ່າທ່ານບໍ່ແມ່ນ Bot ກ່ອນ'); return; }
                const username = document.getElementById('reg-username').value.trim();
                const pin = document.getElementById('reg-pin').value.trim();
                const password = document.getElementById('reg-password').value;
                const confirm = document.getElementById('reg-confirm').value;

                if(!username || !pin || !password || !confirm) {
                    NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບທຸກຊ່ອງ');
                    return;
                }
                // ตรวจชื่อผู้ใช้
                if(username.length < 5) {
                    NotificationManager.error('ຊື່ຜູ້ໃຊ້: ຕ້ອງມີຢ່າງໜ້ອຍ 5 ຕົວອັກສອນ');
                    return;
                }
                if(username.length > 20) {
                    NotificationManager.error('ຊື່ຜູ້ໃຊ້: ສູງສຸດ 20 ຕົວອັກສອນ');
                    return;
                }
                // ตรวจ PIN
                if(pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                    NotificationManager.error('PIN: ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກ ເຊັ່ນ: 123456');
                    return;
                }
                // ตรวจรหัสผ่าน 4 เงื่อนไข
                if(!/[A-Z]/.test(password)) {
                    NotificationManager.error('ລະຫັດຜ່ານ: ຕ້ອງມີຕົວພິມໃຫຍ່ (A-Z) ຢ່າງໜ້ອຍ 1 ຕົວ ເຊັ່ນ: A, B, C...');
                    return;
                }
                if(!/[a-z]/.test(password)) {
                    NotificationManager.error('ລະຫັດຜ່ານ: ຕ້ອງມີຕົວພິມນ້ອຍ (a-z) ຢ່າງໜ້ອຍ 1 ຕົວ ເຊັ່ນ: a, b, c...');
                    return;
                }
                if(!/[0-9]/.test(password)) {
                    NotificationManager.error('ລະຫັດຜ່ານ: ຕ້ອງມີຕົວເລກ (0-9) ຢ່າງໜ້ອຍ 1 ຕົວ ເຊັ່ນ: 1, 2, 3...');
                    return;
                }
                if(!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
                    NotificationManager.error('ລະຫັດຜ່ານ: ຕ້ອງມີອັກຂະລະພິເສດ ຢ່າງໜ້ອຍ 1 ຕົວ ເຊັ່ນ: ! @ # $ % ^');
                    return;
                }

                if(pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                    NotificationManager.error('PIN ຕ້ອງເປັນຕົວເລກ 6 ຫຼັກ');
                    return;
                }

                if(password !== confirm) {
                    NotificationManager.error('ລະຫັດຜ່ານບໍ່ຕົງກັນ');
                    return;
                }

                if(password.length < 6) {
                    NotificationManager.error('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວອັກສອນ');
                    return;
                }

                try {
                    showProcessing('ກຳລັງສ້າງບັນຊີ<br>ກະລຸນາລໍຖ້າສັກຄູ່...');
                    const { data: existing } = await _supabase
                        .from('site_users')
                        .select('id')
                        .eq('username', username)
                        .single();

                    if(existing) {
                        hideProcessing();
                        NotificationManager.error('ຊື່ຜູ້ໃຊ້ນີ້ຖືກໃຊ້ແລ້ວ');
                        return;
                    }

                    const { data, error } = await _supabase
                        .from('site_users')
                        .insert([{
                            username: username,
                            pin: pin,
                            password: password,
                            avatar_url: 'https://img5.pic.in.th/file/secure-sv1/17710495907562b12906e5c4d2a54.png',
                            balance: 0,
                            total_spent: 0,
                            status: 'active'
                        }])
                        .select()
                        .single();

                    if(error) throw error;

                    hideProcessing();
                    NotificationManager.success('ສະໝັກສະມາຊິກສຳເລັດ!');
                    // Generate session_token for new user
                    const newToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
                    await _supabase.from('site_users').update({ session_token: newToken }).eq('id', data.id);
                    data.session_token = newToken;
                    currentUser = data;
                    this.updateUserUI();
                    this.saveUserSession();
                    this._clearRegisterForm();
                    router.home();
                    
                } catch(error) {
                    console.error('Register error:', error);
                    hideProcessing();
                    NotificationManager.error('ເກີດຂໍ້ຜິດພາດ: ' + error.message);
                }
            },

            userLogin: async function() {
                const cfToken = document.querySelector('#cf-login [name="cf-turnstile-response"]');
                if(!cfToken || !cfToken.value) { NotificationManager.warning('ກະລຸນາຢືນຢັນວ່າທ່ານບໍ່ແມ່ນ Bot ກ່ອນ'); return; }
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;

                if(!username || !password) {
                    NotificationManager.warning('ກະລຸນາກອກຊື່ຜູ້ໃຊ້ແລະລະຫັດຜ່ານ');
                    return;
                }

                showProcessing('ກຳລັງກວດສອບຂໍ້ມູນ<br>ກະລຸນາລໍຖ້າສັກຄູ່...');
                try {
                    // ลองหาใน site_users ก่อน (User ใหม่)
                    const { data: siteUser, error: siteError } = await _supabase
                        .from('site_users')
                        .select('*')
                        .eq('username', username)
                        .eq('password', password)
                        .maybeSingle();

                    // ถ้าไม่เจอใน site_users ลองหาใน users (Admin เก่า)
                    if(!siteUser) {
                        const { data: adminUser, error: adminError } = await _supabase
                            .from('users')
                            .select('*')
                            .eq('username', username)
                            .eq('password', password)
                            .maybeSingle();
                        
                        if(!adminUser) {
                            hideProcessing();
                            NotificationManager.error('ຊື່ຜູ້ໃຊ້ຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ');
                            return;
                        }
                        
                        // Login สำเร็จด้วย Admin เก่า
                        currentUser = {
                            id: 'admin_' + adminUser.id,
                            username: adminUser.username,
                            password: adminUser.password,
                            is_admin: true,
                            balance: 0,
                            avatar_url: 'https://img5.pic.in.th/file/secure-sv1/17710495907562b12906e5c4d2a54.png',
                            status: 'active'
                        };
                        
                        this.updateUserUI();
                        this.checkAdminAccess();
                        router.home();
                        hideProcessing();
                        NotificationManager.success(`ຍິນດີຕ້ອນຮັບ Admin ${username}!`);
                        return;
                    }

                    if(siteUser.status === 'banned') {
                        hideProcessing();
                        NotificationManager.error('ບັນຊີຖືກລະງັບ');
                        return;
                    }

                    await _supabase
                        .from('site_users')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', siteUser.id);

                    // ສ້າງ session_token ໃໝ່ ແລະ save ໄວ້ໃນ DB
                    const newToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
                    await _supabase.from('site_users').update({ session_token: newToken }).eq('id', siteUser.id);
                    siteUser.session_token = newToken;

                    currentUser = siteUser;
                    this.updateUserUI();
                    this.checkAdminAccess();
                    this.saveUserSession();
                    router.home();
                    hideProcessing();
                    // Clear login form after success
                    this._clearLoginForm();
                    NotificationManager.success(`ຍິນດີຕ້ອນຮັບ ${username}!`);

                } catch(error) {
                    console.error('Login error:', error);
                    hideProcessing();
                    NotificationManager.error('ເກີດຂໍ້ຜິດພາດ');
                }
            },

            userLogout: async function() {
                if(await CustomConfirm.show('ແນ່ໃຈບໍ່ວ່າຕ້ອງການອອກຈາກລະບົບ?', {title:'ອອກຈາກລະບົບ', icon:'fa-sign-out-alt'})) {
                    currentUser = null;
                    localStorage.removeItem('user_session');
                    // Reload ໜ້າເວັບໃໝ່
                    location.reload();
                }
            },

            _clearLoginForm: function() {
                const el = id => document.getElementById(id);
                if(el('login-username')) el('login-username').value = '';
                if(el('login-password')) el('login-password').value = '';
                // Reset Turnstile for login
                try {
                    if(window.turnstile) {
                        const widget = document.querySelector('#cf-login iframe');
                        if(widget) { window.turnstile.reset('#cf-login'); }
                    }
                } catch(e) {}
            },

            _clearRegisterForm: function() {
                const el = id => document.getElementById(id);
                if(el('reg-username')) el('reg-username').value = '';
                if(el('reg-pin')) el('reg-pin').value = '';
                if(el('reg-password')) el('reg-password').value = '';
                if(el('reg-confirm')) el('reg-confirm').value = '';
                // Reset strength bar
                const fill = el('strength-fill');
                const hint = el('strength-hint');
                if(fill) { fill.style.width='0%'; fill.style.background='#333'; }
                if(hint) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                // Reset Turnstile for register
                try {
                    if(window.turnstile) {
                        const widget = document.querySelector('#cf-register iframe');
                        if(widget) { window.turnstile.reset('#cf-register'); }
                    }
                } catch(e) {}
            },

            updateUserUI: function() {
                if(currentUser) {
                    document.getElementById('user-avatar').src = currentUser.avatar_url;
                    document.getElementById('user-avatar').style.display = 'block';
                    document.getElementById('login-btn').style.display = 'none';
                    document.getElementById('user-balance').textContent = 
                        Number(currentUser.balance || 0).toLocaleString() + ' ₭';
                    this.checkAdminAccess();
                    // อัปเดต balance display real-time
                    const balEl = document.getElementById('user-balance');
                    if(balEl) balEl.textContent = Number(currentUser.balance||0).toLocaleString() + ' ₭';
                } else {
                    document.getElementById('user-avatar').style.display = 'none';
                    document.getElementById('login-btn').style.display = 'flex';
                    document.getElementById('admin-menu-btn').style.display = 'none';
                }
            },

            saveUserSession: function() {
                if(currentUser) {
                    localStorage.setItem('user_session', JSON.stringify({
                        id: currentUser.id,
                        username: currentUser.username,
                        session_token: currentUser.session_token || null
                    }));
                }
            },

            loadUserSession: async function() {
                const session = localStorage.getItem('user_session');
                if(session) {
                    try {
                        const { id, session_token } = JSON.parse(session);
                        const { data } = await _supabase
                            .from('site_users')
                            .select('*')
                            .eq('id', id)
                            .single();
                        
                        if(data && data.status === 'active') {
                            // ກວດສອບ session_token — ຖ້າລະຫັດຜ່ານຖືກປ່ຽນ token ຈະບໍ່ຕົງກັນ
                            if(data.session_token && session_token && data.session_token !== session_token) {
                                localStorage.removeItem('user_session');
                                NotificationManager.warning('ລະຫັດຜ່ານຖືກປ່ຽນ, ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່');
                                return;
                            }
                            currentUser = data;
                            this.updateUserUI();
                        } else {
                            localStorage.removeItem('user_session');
                        }
                    } catch(error) {
                        console.error('Session load error:', error);
                    }
                }
            },

            openChangePassword: function() {
                if(!currentUser) {
                    NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບ');
                    return;
                }
                router.show('view-change-password');
            },

            changePassword: async function() {
                const current = document.getElementById('current-password').value;
                const newPass = document.getElementById('new-password').value;
                const confirm = document.getElementById('confirm-password').value;

                if(!current || !newPass || !confirm) {
                    NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນ');
                    return;
                }
                if(current !== currentUser.password) {
                    NotificationManager.error('ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກ');
                    return;
                }
                if(newPass !== confirm) {
                    NotificationManager.error('ລະຫັດໃໝ່ບໍ່ຕົງກັນ');
                    return;
                }

                // ກວດ password strength ເໝືອນຕອນສະໝັກ
                const checks = {
                    upper: /[A-Z]/.test(newPass),
                    lower: /[a-z]/.test(newPass),
                    num: /[0-9]/.test(newPass),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPass),
                    long: newPass.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                if(score < 5) {
                    let missing = [];
                    if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                    if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                    if(!checks.num) missing.push('ຕົວເລກ 0-9');
                    if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                    if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                    NotificationManager.error('ລະຫັດຜ່ານບໍ່ເຂັ້ມແຂງ! ຍັງຂາດ: ' + missing.join(', '));
                    return;
                }

                // ສ້າງ session_token ໃໝ່ ເພື່ອ force logout ທຸກ device
                const newToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
                showProcessing('ກຳລັງປ່ຽນລະຫັດ...');
                await _supabase.from('site_users').update({ 
                    password: newPass,
                    session_token: newToken
                }).eq('id', currentUser.id);
                
                currentUser.password = newPass;
                currentUser.session_token = newToken;
                this.saveUserSession();
                hideProcessing();
                NotificationManager.success('ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
                
                // Reload ໜ້າເວັບໃໝ່
                setTimeout(() => { location.reload(); }, 1500);
            },

            navProfile: function() {
                if(!currentUser) {
                    this.openUserAuth();
                    return;
                }
                this._fillProfilePage();
                router.show('view-profile');
                this.setActiveNav('profile');
            },

            _fillProfilePage: function() {
                if(!currentUser) return;
                // Fill page elements
                const pa = document.getElementById('page-profile-avatar');
                if(pa) pa.src = currentUser.avatar_url || '';
                const pu = document.getElementById('page-profile-username');
                if(pu) pu.textContent = currentUser.username;
                const ps = document.getElementById('page-profile-status');
                if(ps) ps.textContent = currentUser.status === 'active' ? 'ສະຖານະ: ປົກກະຕິ' : 'ສະຖານະ: ຖືກລະງັບ';
                const pb = document.getElementById('page-profile-balance');
                if(pb) pb.textContent = Number(currentUser.balance || 0).toLocaleString() + ' ₭';
                const psp = document.getElementById('page-profile-spent');
                if(psp) psp.textContent = Number(currentUser.total_spent || 0).toLocaleString() + ' ₭';
                const pc = document.getElementById('page-profile-created');
                if(pc) pc.textContent = new Date(currentUser.created_at).toLocaleDateString('lo-LA');
                const pl = document.getElementById('page-profile-lastlogin');
                if(pl) pl.textContent = currentUser.last_login ? new Date(currentUser.last_login).toLocaleString('lo-LA') : '-';
            },

            openOrderHistory: function() {
                router.show('view-order-history');
                this.renderOrderHistory();
            },

            openChangePinPage: function() {
                if(!currentUser) { NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບ'); return; }
                router.show('view-change-pin');
            },

            changePin: async function() {
                const currentPin = document.getElementById('current-pin').value.trim();
                const newPin = document.getElementById('new-pin').value.trim();
                const confirmPin = document.getElementById('confirm-pin').value.trim();

                if(!currentPin || !newPin || !confirmPin) { NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ'); return; }
                if(newPin !== confirmPin) { NotificationManager.error('PIN ໃໝ່ບໍ່ຕົງກັນ'); return; }
                if(newPin.length !== 6 || !/^\d{6}$/.test(newPin)) { NotificationManager.error('PIN ຕ້ອງເປັນຕົວເລກ 6 ຕົວ'); return; }
                if(String(currentUser.pin) !== String(currentPin)) { NotificationManager.error('PIN ປັດຈຸບັນບໍ່ຖືກ'); return; }

                showProcessing('ກຳລັງປ່ຽນ PIN...');
                const { error } = await _supabase.from('site_users').update({ pin: newPin }).eq('id', currentUser.id);
                hideProcessing();
                if(error) { NotificationManager.error('ເກີດຂໍ້ຜິດພາດ: ' + error.message); return; }
                currentUser.pin = newPin;
                NotificationManager.success('ປ່ຽນ PIN ສຳເລັດ!');
                document.getElementById('current-pin').value = '';
                document.getElementById('new-pin').value = '';
                document.getElementById('confirm-pin').value = '';
                router.back();
            },

            openForgotPage: function() {
                const wrap = document.getElementById('forgot2-username-wrap');
                if(wrap) wrap.style.display = currentUser ? 'none' : 'block';
                document.getElementById('forgot2-pin').value = '';
                if(!currentUser && document.getElementById('forgot2-username')) document.getElementById('forgot2-username').value = '';
                router.show('view-forgot');
            },

            openForgotFromProfile: function() {
                const wrap = document.getElementById('forgot2-username-wrap');
                if(wrap) wrap.style.display = 'none'; // login อยู่แล้ว ซ่อน username
                document.getElementById('forgot2-pin').value = '';
                router.show('view-forgot');
            },

            verifyForgotPin2: async function() {
                const pin = document.getElementById('forgot2-pin').value.trim();
                const username = currentUser ? currentUser.username : document.getElementById('forgot2-username').value.trim();
                if(!username || !pin) { NotificationManager.warning('ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ'); return; }
                showProcessing('ກຳລັງກວດສອບ...');
                try {
                    const { data } = await _supabase.from('site_users').select('id,pin').eq('username', username).maybeSingle();
                    hideProcessing();
                    if(!data) { NotificationManager.error('ບໍ່ພົບຊື່ຜູ້ໃຊ້ນີ້'); return; }
                    if(String(data.pin) !== String(pin)) { NotificationManager.error('PIN ບໍ່ຖືກຕ້ອງ'); return; }
                    this._forgotUserId = data.id;
                    document.getElementById('reset2-password').value = '';
                    document.getElementById('reset2-confirm').value = '';
                    const fill = document.getElementById('reset-strength-fill');
                    const hint = document.getElementById('reset-strength-hint');
                    if(fill) { fill.style.width='0%'; fill.style.background='#333'; }
                    if(hint) { hint.style.color='#aaa'; hint.textContent='ລະຫັດຜ່ານຕ້ອງມີ: ຕົວພິມໃຫຍ່ (A-Z) + ຕົວພິມນ້ອຍ (a-z) + ຕົວເລກ (0-9) + ອັກຂະລະພິເສດ (!@#$)'; }
                    router.show('view-reset');
                } catch(e) { hideProcessing(); NotificationManager.error('ເກີດຂໍ້ຜິດພາດ'); }
            },

            doResetPassword2: async function() {
                const pw = document.getElementById('reset2-password').value;
                const cf = document.getElementById('reset2-confirm').value;
                if(!pw || !cf) { NotificationManager.warning('ກະລຸນາກອກລະຫັດຜ່ານ'); return; }
                if(pw !== cf) { NotificationManager.error('ລະຫັດຜ່ານບໍ່ຕົງກັນ'); return; }
                // ກວດ strength
                const checks = {
                    upper: /[A-Z]/.test(pw),
                    lower: /[a-z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw),
                    long: pw.length >= 8
                };
                const score = Object.values(checks).filter(Boolean).length;
                if(score < 5) {
                    let missing = [];
                    if(!checks.upper) missing.push('ຕົວພິມໃຫຍ່ A-Z');
                    if(!checks.lower) missing.push('ຕົວພິມນ້ອຍ a-z');
                    if(!checks.num) missing.push('ຕົວເລກ 0-9');
                    if(!checks.special) missing.push('ອັກຂະລະພິເສດ !@#$');
                    if(!checks.long) missing.push('ຢ່າງໜ້ອຍ 8 ຕົວ');
                    NotificationManager.error('ລະຫັດຜ່ານບໍ່ເຂັ້ມແຂງ! ຍັງຂາດ: ' + missing.join(', '));
                    return;
                }
                showProcessing('ກຳລັງບັນທຶກ...');
                try {
                    const { error } = await _supabase.from('site_users').update({ password: pw }).eq('id', this._forgotUserId);
                    hideProcessing();
                    if(error) throw error;
                    NotificationManager.success('ປ່ຽນລະຫັດຜ່ານສຳເລັດ!');
                    this._forgotUserId = null;
                    setTimeout(() => { location.reload(); }, 1500);
                } catch(e) { hideProcessing(); NotificationManager.error('ເກີດຂໍ້ຜິດພາດ'); }
            },

            openUserProfile: async function() {
                if(!currentUser) return;
                
                document.getElementById('profile-avatar').src = currentUser.avatar_url;
                document.getElementById('profile-username').textContent = currentUser.username;
                document.getElementById('profile-status').textContent = currentUser.status === 'active' ? 'ສະຖານະ: ປົກກະຕິ' : 'ສະຖານະ: ຖືກລະງັບ';
                document.getElementById('profile-balance').textContent = Number(currentUser.balance || 0).toLocaleString() + ' ₭';
                document.getElementById('profile-spent').textContent = Number(currentUser.total_spent || 0).toLocaleString() + ' ₭';
                document.getElementById('profile-created').textContent = new Date(currentUser.created_at).toLocaleDateString('lo-LA');
                document.getElementById('profile-lastlogin').textContent = currentUser.last_login ? new Date(currentUser.last_login).toLocaleString('lo-LA') : '-';
                
                document.getElementById('user-menu').style.display = 'none';
                this.openModal('user-profile-modal');
            },

            openContact: function() {
                const c = this.db.settings.contact;
                document.getElementById('l-wa').href = `https://wa.me/${c.wa.replace(/\D/g,'')}`;
                document.getElementById('l-tt').href = c.tt.includes('http') ? c.tt : `https://tiktok.com/@${c.tt}`;
                document.getElementById('l-fb').href = c.fb;
                this.openModal('contact-modal');
            },
            
            // ========= ANNOUNCEMENT BANNER FUNCTIONS =========
            // ========= ANNOUNCEMENT SYSTEM (ໃໝ່) =========
            _annColors: {
                red:    { accent:'#ff0000', bg:'rgba(255,0,0,0.1)',    icon:'rgba(255,0,0,0.15)',    text:'#ff4444' },
                blue:   { accent:'#3b82f6', bg:'rgba(59,130,246,0.1)', icon:'rgba(59,130,246,0.15)', text:'#60a5fa' },
                green:  { accent:'#00cc88', bg:'rgba(0,204,136,0.1)',  icon:'rgba(0,204,136,0.15)', text:'#00ff88' },
                yellow: { accent:'#fbbf24', bg:'rgba(251,191,36,0.1)', icon:'rgba(251,191,36,0.15)', text:'#fcd34d' },
                purple: { accent:'#a855f7', bg:'rgba(168,85,247,0.1)', icon:'rgba(168,85,247,0.15)', text:'#c084fc' },
                orange: { accent:'#f97316', bg:'rgba(249,115,22,0.1)', icon:'rgba(249,115,22,0.15)', text:'#fb923c' },
            },

            _buildAnnCard: function(ann) {
                const c = this._annColors[ann.color] || this._annColors.red;
                if(ann.type === 'ticker') {
                    const txt = ann.text || '';
                    return `<div class="ann-ticker" data-id="${ann.id||''}">
                        <div class="ann-ticker-inner">
                            ${[...Array(4)].map(()=>`<span class="ann-ticker-item"><i class="fas ${ann.icon||'fa-bullhorn'}"></i>${ann.title ? `<b>${ann.title}</b> – ` : ''}${txt}</span>`).join('')}
                        </div>
                    </div>`;
                }
                return `<div class="ann-card" data-id="${ann.id||''}" style="background:${c.bg};">
                    <div class="ann-card-accent" style="background:${c.accent};"></div>
                    <div class="ann-card-body">
                        <div class="ann-card-icon-wrap" style="background:${c.icon}; color:${c.text};">
                            <i class="fas ${ann.icon||'fa-bullhorn'}"></i>
                        </div>
                        <div class="ann-card-text">
                            ${ann.title ? `<div class="ann-card-title" style="color:${c.text};">${ann.title}</div>` : ''}
                            <div class="ann-card-msg">${ann.text||''}</div>
                        </div>
                    </div>
                    <button class="ann-card-close" onclick="this.closest('.ann-card').remove(); app._checkAnnContainer();" title="ປິດ">✕</button>
                </div>`;
            },

            _checkAnnContainer: function() {
                const wrap = document.getElementById('announcements-container');
                if(wrap && wrap.children.length === 0) wrap.style.display = 'none';
            },

            loadAnnouncement: async function() {
                try {
                    const { data, error } = await _supabase
                        .from('announcements')
                        .select('*')
                        .eq('enabled', true)
                        .order('sort_order', { ascending: true });
                    
                    const wrap = document.getElementById('announcements-container');
                    if(!wrap) return;

                    if(error || !data || data.length === 0) {
                        wrap.style.display = 'none';
                        wrap.innerHTML = '';
                        return;
                    }
                    
                    wrap.innerHTML = data.map(ann => this._buildAnnCard(ann)).join('');
                    wrap.style.display = 'flex';
                } catch (err) {
                    console.log('Announcement load error:', err);
                }
            },

            previewAnnouncement: function() {
                const title = document.getElementById('ann-title').value || 'ຫົວຂໍ້ປະກາດ';
                const text  = document.getElementById('ann-text').value  || 'ຂໍ້ຄວາມປະກາດ';
                const type  = document.getElementById('ann-type').value;
                const color = document.getElementById('ann-color').value;
                const icon  = document.getElementById('ann-icon').value || 'fa-bullhorn';
                const prev  = document.getElementById('ann-preview');
                if(!prev) return;
                prev.innerHTML = this._buildAnnCard({ title, text, type, color, icon });
            },

            resetAnnouncementForm: function() {
                document.getElementById('ann-edit-id').value = '';
                document.getElementById('ann-title').value = '';
                document.getElementById('ann-text').value = '';
                document.getElementById('ann-type').value = 'card';
                document.getElementById('ann-color').value = 'red';
                document.getElementById('ann-icon').value = 'fa-bullhorn';
                document.getElementById('ann-preview').innerHTML = '';
            },

            saveAnnouncement: async function() {
                const id    = document.getElementById('ann-edit-id').value;
                const title = document.getElementById('ann-title').value.trim();
                const text  = document.getElementById('ann-text').value.trim();
                const type  = document.getElementById('ann-type').value;
                const color = document.getElementById('ann-color').value;
                const icon  = document.getElementById('ann-icon').value.trim() || 'fa-bullhorn';

                if(!text) { NotificationManager.warning('ກະລຸນາໃສ່ຂໍ້ຄວາມ'); return; }

                const payload = { title, text, type, color, icon, enabled: true, sort_order: Date.now() };

                showProcessing('ກຳລັງບັນທຶກ...');
                let err;
                if(id) {
                    ({ error: err } = await _supabase.from('announcements').update(payload).eq('id', id));
                } else {
                    ({ error: err } = await _supabase.from('announcements').insert([payload]));
                }
                hideProcessing();

                if(err) { NotificationManager.error('ເກີດຂໍ້ຜິດພາດ: ' + err.message); return; }
                NotificationManager.success(id ? 'ອັບເດດປະກາດສຳເລັດ!' : 'ເພີ່ມປະກາດສຳເລັດ!');
                this.resetAnnouncementForm();
                this.loadAnnouncement();
                this.loadAnnouncementAdmin();
            },

            loadAnnouncementAdmin: async function() {
                const el = document.getElementById('t-announcements');
                if(!el) return;
                const { data } = await _supabase.from('announcements').select('*').order('sort_order', { ascending: true });
                if(!data || data.length === 0) {
                    el.innerHTML = '<p style="color:#aaa; font-size:13px; text-align:center; padding:20px;">ຍັງບໍ່ມີປະກາດ</p>';
                    return;
                }
                el.innerHTML = data.map(ann => {
                    const c = this._annColors[ann.color] || this._annColors.red;
                    return `<div style="background:#0a0a0a; border:1px solid ${c.accent}40; border-left:4px solid ${c.accent}; border-radius:10px; padding:12px; margin-bottom:10px; display:flex; align-items:center; gap:12px;">
                        <div style="width:38px; height:38px; background:${c.icon}; border-radius:8px; display:flex; align-items:center; justify-content:center; color:${c.text}; font-size:18px; flex-shrink:0;">
                            <i class="fas ${ann.icon||'fa-bullhorn'}"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            ${ann.title ? `<div style="font-size:13px; font-weight:700; color:${c.text}; margin-bottom:2px;">${ann.title}</div>` : ''}
                            <div style="font-size:12px; color:#aaa; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ann.text}</div>
                            <div style="font-size:10px; color:#555; margin-top:3px;">ປະເພດ: ${ann.type} | ສີ: ${ann.color}</div>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            <button class="btn btn-sm" style="background:${ann.enabled?'#00cc88':'#555'}; color:#fff; padding:5px 10px;" onclick="app.toggleAnnouncement(${ann.id}, ${!ann.enabled})">
                                <i class="fas ${ann.enabled?'fa-eye':'fa-eye-slash'}"></i>
                            </button>
                            <button class="btn btn-sm" style="background:#1d4ed8; color:#fff; padding:5px 10px;" onclick="app.editAnnouncement(${ann.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-red btn-sm" style="padding:5px 10px;" onclick="app.deleteAnnouncement(${ann.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('');
            },

            editAnnouncement: async function(id) {
                const { data } = await _supabase.from('announcements').select('*').eq('id', id).single();
                if(!data) return;
                document.getElementById('ann-edit-id').value = data.id;
                document.getElementById('ann-title').value = data.title || '';
                document.getElementById('ann-text').value  = data.text  || '';
                document.getElementById('ann-type').value  = data.type  || 'card';
                document.getElementById('ann-color').value = data.color || 'red';
                document.getElementById('ann-icon').value  = data.icon  || 'fa-bullhorn';
                this.previewAnnouncement();
                window.scrollTo(0, 0);
                NotificationManager.info('ກຳລັງແກ້ໄຂປະກາດ – ແກ້ໄຂແລ້ວກົດ "ບັນທຶກ"');
            },

            toggleAnnouncement: async function(id, enabled) {
                await _supabase.from('announcements').update({ enabled }).eq('id', id);
                NotificationManager.info(enabled ? 'ເປີດໃຊ້ງານແລ້ວ' : 'ປິດການໃຊ້ງານແລ້ວ');
                this.loadAnnouncement();
                this.loadAnnouncementAdmin();
            },

            deleteAnnouncement: async function(id) {
                if(!await CustomConfirm.show('ລົບປະກາດນີ້?', { title: 'ລົບປະກາດ', icon: 'fa-trash' })) return;
                await _supabase.from('announcements').delete().eq('id', id);
                NotificationManager.success('ລົບສຳເລັດ');
                this.loadAnnouncement();
                this.loadAnnouncementAdmin();
            },

            // ========= LEGACY COMPAT (ໃຊ້ຕ້ານ error) =========
            loadAnnouncementSettings: async function() {
                // ໂຫຼດລາຍການ admin
                this.loadAnnouncementAdmin();
            },

            // ========= ADMIN PANEL FUNCTIONS =========
            isAdmin: function() {
                return currentUser && currentUser.is_admin === true;
            },

            checkAdminAccess: function() {
                if (currentUser && currentUser.is_admin === true) {
                    document.getElementById('admin-menu-btn').style.display = 'block';
                } else {
                    document.getElementById('admin-menu-btn').style.display = 'none';
                }
            },

            openAdminPanel: function() {
                if (!this.isAdmin()) {
                    NotificationManager.error('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງແຜງຄວບຄຸມ Admin');
                    return;
                }
                router.show('view-admin');
                this.loadAdminData();
                document.getElementById('user-menu').style.display = 'none';
                // ເປີດ tab ພາບລວມກ່ອນ
                setTimeout(() => { this.tab('tab-overview'); }, 300);
            },

            loadAdminData: async function() {
                await this.fetchData();
                await this.loadAnnouncementSettings();
                this.renderAdmin();
            },

            openModal: (id) => {
                const el = document.getElementById(id);
                el.classList.remove('hidden');
                el.style.opacity = '0';
                el.classList.add('active');
                requestAnimationFrame(() => { el.style.transition = 'opacity 0.25s ease'; el.style.opacity = '1'; });
            },
            closeModal: (id) => {
                const el = document.getElementById(id);
                el.style.transition = 'opacity 0.22s ease';
                el.style.opacity = '0';
                setTimeout(() => { el.classList.remove('active'); el.classList.add('hidden'); el.style.opacity = ''; el.style.transition = ''; }, 230);
            },

            loadProductIds: async function() {
                const tbody = document.getElementById('t-product-ids');
                if(!tbody) return;
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#aaa; padding:20px;"><i class="fas fa-spinner fa-spin"></i> ກຳລັງໂຫຼດ...</td></tr>';
                const searchInput = document.getElementById('product-id-search');
                if(searchInput) searchInput.value = '';
                
                const { data: orders } = await _supabase
                    .from('orders')
                    .select('*')
                    .not('product_unique_id', 'is', null)
                    .order('created_at', { ascending: false });
                if(!orders || orders.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#aaa; padding:20px;">ຍັງບໍ່ມີລະຫັດສິນຄ້າ</td></tr>';
                    const countEl = document.getElementById('product-id-count');
                    if(countEl) countEl.textContent = '';
                    return;
                }
                // Get user info
                const userIds = [...new Set(orders.map(o => o.user_id))];
                const { data: users } = await _supabase.from('site_users').select('id,username').in('id', userIds);
                const userMap = {};
                if(users) users.forEach(u => userMap[u.id] = u.username);
                
                // Store all data for search filtering
                this._allProductIds = orders.map(o => ({
                    id: o.id,
                    uid: o.product_unique_id,
                    product: o.product_name || '-',
                    buyer: userMap[o.user_id] || String(o.user_id),
                    date: o.created_at ? new Date(o.created_at).toLocaleDateString('lo-LA') : '-'
                }));
                
                this._renderProductIdsTable(this._allProductIds);
            },

            _renderProductIdsTable: function(list) {
                const tbody = document.getElementById('t-product-ids');
                const countEl = document.getElementById('product-id-count');
                if(!tbody) return;
                if(list.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#aaa; padding:20px;">ບໍ່ພົບຂໍ້ມູນ</td></tr>';
                    if(countEl) countEl.textContent = '';
                    return;
                }
                tbody.innerHTML = list.map(o => `
                    <tr>
                        <td><span style="font-family:monospace; color:#60a5fa; font-weight:700; font-size:12px;">${o.uid}</span></td>
                        <td style="font-size:12px; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${o.product}">${o.product}</td>
                        <td style="font-size:12px; color:#ccc;">${o.buyer}</td>
                        <td style="font-size:11px; color:#aaa;">${o.date}</td>
                        <td><button class="btn btn-red btn-sm" style="padding:4px 10px;" onclick="app.deleteProductId('${o.id}')"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('');
                if(countEl) countEl.textContent = `ທັງໝົດ: ${list.length} ລາຍການ`;
            },

            filterProductIds: function(query) {
                if(!this._allProductIds) return;
                const q = query.toLowerCase().trim();
                if(!q) {
                    this._renderProductIdsTable(this._allProductIds);
                    return;
                }
                const filtered = this._allProductIds.filter(o =>
                    o.uid.toLowerCase().includes(q) ||
                    o.product.toLowerCase().includes(q) ||
                    o.buyer.toLowerCase().includes(q)
                );
                this._renderProductIdsTable(filtered);
            },

            deleteProductId: async function(orderId) {
                if(!await CustomConfirm.show('ລົບລະຫັດ ID ນີ້ອອກ? ລູກຄ້າຈະບໍ່ເຫັນ ID ນີ້ອີກ.', {title:'ລົບ Product ID', icon:'fa-id-badge'})) return;
                await _supabase.from('orders').update({ product_unique_id: null }).eq('id', orderId);
                NotificationManager.success('ລົບ ID ສຳເລັດ');
                this.loadProductIds();
            },
        };


        // =============================================
        // ===== SPIN WHEEL SYSTEM =====================
        // =============================================
        const spinWheel = {
            prizes: [],
            isSpinning: false,
            currentAngle: 0,

            // วาดวงล้อ — HiDPI + ข้อความชัด อ่านออกจากกึ่งกลาง
            draw: function() {
                const canvas = document.getElementById('spin-canvas');
                if(!canvas) return;

                // HiDPI: ทำ canvas ชัดบน mobile
                const dpr = window.devicePixelRatio || 1;
                const size = Math.min(window.innerWidth - 32, 320);
                canvas.style.width = size + 'px';
                canvas.style.height = size + 'px';
                canvas.width = size * dpr;
                canvas.height = size * dpr;

                const ctx = canvas.getContext('2d');
                ctx.scale(dpr, dpr);

                const W = size, H = size;
                const cx = W/2, cy = H/2;
                const R = cx - 10; // รัศมีวงล้อ
                ctx.clearRect(0,0,W,H);

                if(!this.prizes || this.prizes.length === 0) {
                    ctx.fillStyle = '#333';
                    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle='#888'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
                    ctx.fillText('ຍັງບໍ່ມີລາງວັນ', cx, cy);
                    return;
                }

                const n = this.prizes.length;
                const arc = (Math.PI*2)/n;

                // outer glow ring
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(this.currentAngle);

                // ring
                ctx.beginPath(); ctx.arc(0,0,R+7,0,Math.PI*2);
                const grad = ctx.createRadialGradient(0,0,R-2,0,0,R+7);
                grad.addColorStop(0,'#e6a800'); grad.addColorStop(0.5,'#f5c518'); grad.addColorStop(1,'#c8930a');
                ctx.fillStyle=grad; ctx.fill();

                // วาดแต่ละช่อง
                this.prizes.forEach((p, i) => {
                    const start = arc*i - Math.PI/2;
                    const end = start + arc;

                    // พื้นช่อง
                    ctx.beginPath();
                    ctx.moveTo(0,0);
                    ctx.arc(0,0,R,start,end);
                    ctx.closePath();
                    ctx.fillStyle = p.color || `hsl(${i*360/n},65%,52%)`;
                    ctx.fill();

                    // เส้นแบ่ง
                    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.5; ctx.stroke();

                    // ===== วาดข้อความ =====
                    ctx.save();
                    const midAngle = start + arc/2;
                    ctx.rotate(midAngle); // หมุนไปยังกึ่งกลางช่อง

                    // ข้อความอ่านออกจากกึ่งกลาง (ตามแนวรัศมี)
                    const textR = R * 0.62; // ตำแหน่งข้อความ 62% ของรัศมี
                    ctx.translate(textR, 0); // เลื่อนไปตำแหน่งข้อความ
                    ctx.rotate(Math.PI/2); // หมุนให้ข้อความตั้งตรง อ่านจากล่างขึ้นบน

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#fff';
                    ctx.shadowColor = 'rgba(0,0,0,0.9)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;

                    // ขนาด font ตามจำนวนช่อง
                    const fontSize = n <= 6 ? 13 : n <= 8 ? 11 : 10;
                    ctx.font = `bold ${fontSize}px "Noto Sans Lao", Kanit, sans-serif`;

                    // ตัดข้อความให้พอดี
                    const maxChars = n <= 6 ? 12 : n <= 8 ? 10 : 8;
                    let text = p.display_name || '';
                    if(text.length > maxChars) text = text.slice(0, maxChars-1) + '…';

                    // ถ้ามี emoji วาดบนสุด แล้วข้อความล่าง
                    const lineH = fontSize + 3;
                    if(p.emoji) {
                        ctx.font = `${fontSize+2}px sans-serif`;
                        ctx.fillText(p.emoji, 0, -lineH/2);
                        ctx.font = `bold ${fontSize}px "Noto Sans Lao", Kanit, sans-serif`;
                        ctx.fillText(text, 0, lineH/2 + 2);
                    } else {
                        ctx.fillText(text, 0, 0);
                    }

                    ctx.restore();
                });

                // center button circle
                const btnR = 40;
                ctx.beginPath(); ctx.arc(0,0,btnR,0,Math.PI*2);
                const cg = ctx.createRadialGradient(-5,-5,0,0,0,btnR);
                cg.addColorStop(0,'#444'); cg.addColorStop(1,'#111');
                ctx.fillStyle=cg; ctx.fill();
                ctx.strokeStyle='#f5c518'; ctx.lineWidth=3; ctx.stroke();
                // inner glow
                ctx.beginPath(); ctx.arc(0,0,btnR-4,0,Math.PI*2);
                ctx.strokeStyle='rgba(245,197,24,0.3)'; ctx.lineWidth=1; ctx.stroke();

                ctx.restore();
            },

            spin: async function(mode) {
                mode = mode || 'ticket';
                if(this.isSpinning) return;
                if(!currentUser) { NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບ'); return; }
                if(!this.prizes || this.prizes.length === 0) { NotificationManager.warning('ຍັງບໍ່ມີລາງວັນ'); return; }

                showProcessing('ກຳລັງກວດສອບ...');
                const { data: liveUser } = await _supabase.from('site_users').select('spin_tickets,balance').eq('id', currentUser.id).single();
                hideProcessing();

                let newTickets = liveUser?.spin_tickets || 0;
                let newBalance = liveUser?.balance || 0;

                if(mode === 'ticket') {
                    if(newTickets <= 0) { NotificationManager.warning('ທ່ານບໍ່ມີສິດໝຸນ'); return; }
                    newTickets--;
                    await _supabase.from('site_users').update({ spin_tickets: newTickets }).eq('id', currentUser.id);
                    currentUser.spin_tickets = newTickets;
                } else {
                    const cost = this._spinCost || 0;
                    if(newBalance < cost) { NotificationManager.warning('ຍອດເງິນບໍ່ພໍ'); return; }
                    newBalance -= cost;
                    await _supabase.from('site_users').update({ balance: newBalance }).eq('id', currentUser.id);
                    currentUser.balance = newBalance;
                    app.updateUserUI();
                }

                // สุ่มรางวัล
                const prize = this.pickPrize();
                if(!prize) { NotificationManager.error('ຜິດພາດ: ໄດ້ລາງວັນບໍ່ສຳເລັດ'); return; }

                // หมุน animation — คำนวณ angle ให้วงล้อหยุดตรงช่องที่สุ่มได้จริงๆ
                this.isSpinning = true;
                document.getElementById('spin-btn').disabled = true;
                document.getElementById('spin-result-box').style.display = 'none';

                const n = this.prizes.length;
                const prizeIdx = this.prizes.indexOf(prize);
                const arc = (Math.PI * 2) / n;

                // draw() วาดช่อง i ที่ start = arc*i - PI/2 (ctx ถูก rotate ด้วย currentAngle แล้ว)
                // pointer อยู่บนสุด = angle 0 ของ canvas = -PI/2 ของวงล้อ
                // เราต้องการให้กึ่งกลางช่อง prizeIdx อยู่ที่ angle -PI/2 (บนสุด)
                // กึ่งกลางช่อง prizeIdx ใน local coords = arc*prizeIdx - PI/2 + arc/2
                // ต้องการให้: currentAngle + (arc*prizeIdx - PI/2 + arc/2) = -PI/2
                // => currentAngle = -arc*prizeIdx - arc/2
                const targetLocalAngle = -(arc * prizeIdx + arc / 2);
                // ปรับให้ currentAngle วิ่งไปข้างหน้าเสมอ (หมุนทวนเข็ม = angle เพิ่มขึ้น)
                const spins = 6 + Math.floor(Math.random() * 4);
                let diff = targetLocalAngle - (this.currentAngle % (Math.PI * 2));
                if(diff > 0) diff -= Math.PI * 2;
                const finalAngle = this.currentAngle + (Math.PI * 2 * spins) + diff;

                const duration = 4500;
                const start = performance.now();
                const startAngle = this.currentAngle;

                const animate = (now) => {
                    const elapsed = now - start;
                    const t = Math.min(elapsed / duration, 1);
                    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
                    this.currentAngle = startAngle + (finalAngle - startAngle) * ease;
                    this.draw();
                    if(t < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.currentAngle = finalAngle;
                        this.draw();
                        this.onSpinEnd(prize, newTickets);
                    }
                };
                requestAnimationFrame(animate);
            },

            pickPrize: function() {
                const available = this.prizes.filter(p => p.stock === 0 || (p.stock_used||0) < p.stock);
                if(!available.length) return this.prizes[Math.floor(Math.random() * this.prizes.length)];
                const total = available.reduce((s, p) => s + (parseFloat(p.pct) || 0), 0);
                if(total <= 0) return available[Math.floor(Math.random() * available.length)];
                let r = Math.random() * total;
                for(const p of available) {
                    r -= parseFloat(p.pct) || 0;
                    if(r <= 0) return p;
                }
                return available[available.length - 1];
            },

            onSpinEnd: async function(prize, newTickets) {
                let resultDesc = '';
                // แสดง processing popup ระหว่างรอผลจาก server
                showProcessing('ກຳລັງຕວດສອບຜົນ...');

                if(prize.type === 'cash') {
                    const newBal = (currentUser.balance||0) + (prize.amount||0);
                    await _supabase.from('site_users').update({ balance: newBal }).eq('id', currentUser.id);
                    currentUser.balance = newBal;
                    resultDesc = `ໄດ້ຮັບເງິນ ${Number(prize.amount).toLocaleString()} ₭ ເຂົ້າກະເປົ໋າແລ້ວ!`;
                    app.updateUserUI();

                } else if(prize.type === 'product' && prize.product_id) {
                    // หา product จาก cache ก่อน ถ้าไม่เจอ fetch จาก DB
                    let prod = app.db.products.find(p => p.id === prize.product_id);
                    if(!prod) {
                        const { data: pd } = await _supabase.from('products').select('*').eq('id', prize.product_id).single();
                        if(pd) { prod = pd; app.db.products.push(pd); }
                    }
                    const prodName = prod ? prod.name : prize.display_name;
                    const prodImg  = prod ? (prod.img || '') : (prize.img_url || '');
                    const prodId   = prod ? prod.id : prize.product_id;

                    // generate ID เหมือนซื้อปกติ
                    let genId = null;
                    if(prod && prod.has_product_id) {
                        const ts = Date.now().toString(36).toUpperCase();
                        const rand = Math.random().toString(36).substring(2,6).toUpperCase();
                        genId = 'EZ-' + ts + '-' + rand;
                    }

                    // insert order เหมือนซื้อปกติทุกอย่าง ราคา 0
                    const { error: spinOrderErr } = await _supabase.from('orders').insert([{
                        user_id: currentUser.id,
                        product_id: prodId,
                        product_name: prodName,
                        product_img: prodImg,
                        product_price: 0,
                        quantity: 1,
                        total_amount: 0,
                        status: 'completed',
                        note: 'ໄດ້ຈາກວົງລໍ້',
                        product_unique_id: genId
                    }]);
                    if(spinOrderErr) console.error('spin order error:', spinOrderErr);

                    resultDesc = genId
                        ? `ໄດ້ຮັບ "${prodName}" — ລະຫັດ: ${genId}`
                        : `ໄດ້ຮັບ "${prodName}"`;

                    // real-time เหมือน buyProduct — fetch ข้อมูลใหม่ทั้งหมดแล้ว render
                    await app.fetchData();
                    await app.renderOrderHistory();

                } else if(prize.type === 'custom') {
                    resultDesc = prize.display_name;
                } else if(prize.type === 'miss') {
                    resultDesc = 'ໂຊກດີຄັ້ງໜ້າ!';
                }

                if(prize.stock > 0) {
                    await _supabase.from('spin_prizes').update({ stock_used: (prize.stock_used||0)+1 }).eq('id', prize.id);
                    prize.stock_used = (prize.stock_used||0)+1;
                }

                await _supabase.from('spin_history').insert([{
                    user_id: currentUser.id,
                    username: currentUser.username,
                    prize_id: prize.id,
                    prize_name: prize.display_name,
                    prize_type: prize.type,
                    prize_amount: prize.amount || 0
                }]);

                // ปิด processing popup แล้วค่อยโชว์ผล
                hideProcessing();
                spinWheel.showWinPopup(prize, resultDesc);
                document.getElementById('spin-result-desc').textContent = resultDesc;
                document.getElementById('spin-win-desc').textContent = resultDesc;

                this.isSpinning = false;
                document.getElementById('spin-btn').disabled = false;
                // refresh spin page ทั้งหมด — tickets, progress bar, history
                await app.loadSpinPage();
            },

            confirmSpin: async function() {
                if(!currentUser) { NotificationManager.warning('ກະລຸນາເຂົ້າສູ່ລະບົບ'); router.show('view-login'); return; }
                // โหลด config ราคา
                const { data: cfg } = await _supabase.from('spin_config').select('spin_cost,threshold').maybeSingle();
                const spinCost = (cfg && cfg.spin_cost) ? cfg.spin_cost : 0;
                const tickets = currentUser.spin_tickets || 0;

                // อัปเดต UI confirm popup
                document.getElementById('sco-ticket-count').textContent = tickets;
                document.getElementById('sco-cost-display').textContent = spinCost > 0 ? `${Number(spinCost).toLocaleString()} ₭` : 'ບໍ່ຮອງຮັບ';
                document.getElementById('sco-warn').style.display = 'none';

                // ถ้าไม่มีต้นทุน ซ่อน option coin
                const coinOpt = document.getElementById('sco-coins');
                coinOpt.style.display = spinCost > 0 ? 'block' : 'none';

                // default: เลือก ticket ถ้ามี, ไม่งั้นเลือก coin
                this._spinMode = tickets > 0 ? 'ticket' : 'coins';
                this.selectMode(this._spinMode);
                this._spinCost = spinCost;

                const overlay = document.getElementById('spin-confirm-overlay');
                overlay.classList.add('show');
            },

            selectMode: function(mode) {
                this._spinMode = mode;
                document.getElementById('sco-ticket').classList.toggle('active', mode==='ticket');
                document.getElementById('sco-coins').classList.toggle('active', mode==='coins');
                document.getElementById('sco-warn').style.display = 'none';
            },

            closeConfirm: function() {
                document.getElementById('spin-confirm-overlay').classList.remove('show');
            },

            doSpin: async function() {
                const mode = this._spinMode;
                const warn = document.getElementById('sco-warn');

                if(mode === 'ticket') {
                    const tickets = currentUser.spin_tickets || 0;
                    if(tickets <= 0) {
                        warn.textContent = 'ທ່ານບໍ່ມີສິດ ກະລຸນາເຕີມເງິນໃຫ້ຄົບ';
                        warn.style.display = 'block'; return;
                    }
                } else {
                    const cost = this._spinCost || 0;
                    if(cost <= 0) { warn.textContent = 'ຮູບແບບນີ້ຍັງບໍ່ຮອງຮັບ'; warn.style.display = 'block'; return; }
                    if((currentUser.balance||0) < cost) {
                        warn.textContent = `ຍອດເງິນບໍ່ພໍ (ຕ້ອງການ ${Number(cost).toLocaleString()} ₭)`;
                        warn.style.display = 'block'; return;
                    }
                }

                this.closeConfirm();
                await this.spin(mode);
            },

            showWinPopup: function(prize, desc) {
                const icon = prize.img_url
                    ? `<img src="${prize.img_url}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
                    : (prize.emoji || (prize.type==='cash' ? '💰' : prize.type==='miss' ? '😅' : '🎁'));
                const iconWrap = document.getElementById('spin-win-icon');
                if(prize.img_url) {
                    iconWrap.innerHTML = `<img src="${prize.img_url}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`;
                } else {
                    const defIcon = prize.type==='cash'
                        ? '<i class="fas fa-coins" style="font-size:38px;color:#1a0a00;"></i>'
                        : prize.type==='miss'
                        ? '<i class="fas fa-face-sad-tear" style="font-size:38px;color:#1a0a00;"></i>'
                        : prize.emoji
                        ? `<span style="font-size:38px;">${prize.emoji}</span>`
                        : '<i class="fas fa-gift" style="font-size:38px;color:#1a0a00;"></i>';
                    iconWrap.innerHTML = defIcon;
                    iconWrap.style.fontSize = '';
                }
                document.getElementById('spin-win-name').textContent = prize.display_name;
                // confetti
                this.launchConfetti();
                const overlay = document.getElementById('spin-win-overlay');
                overlay.style.display = 'flex';
                setTimeout(() => overlay.classList.add('show'), 10);
            },

            closeWinPopup: function() {
                const overlay = document.getElementById('spin-win-overlay');
                overlay.classList.remove('show');
                setTimeout(() => { overlay.style.display = 'none'; }, 300);
                // refresh ประวัติสั่งซื้อ real-time
                app.renderOrderHistory();
            },

            launchConfetti: function() {
                const container = document.getElementById('spin-confetti');
                container.innerHTML = '';
                const colors = ['#f5c518','#ff0000','#00ff88','#ff6600','#fff','#ff69b4','#00bfff'];
                for(let i=0; i<28; i++) {
                    const dot = document.createElement('div');
                    const size = Math.random()*8+4;
                    dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:${Math.random()>0.5?'50%':'2px'};background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;top:-10px;opacity:1;animation:confettiFall ${1.5+Math.random()*1.5}s ${Math.random()*0.5}s ease-in forwards;`;
                    container.appendChild(dot);
                }
                // inject keyframe once
                if(!document.getElementById('confetti-style')) {
                    const s = document.createElement('style');
                    s.id = 'confetti-style';
                    s.textContent = '@keyframes confettiFall{to{top:110%;transform:rotate(720deg);opacity:0;}}';
                    document.head.appendChild(s);
                }
            },

            init: async function() {
                await this.loadPrizes();
                this.draw();
            },

            loadPrizes: async function() {
                const { data } = await _supabase.from('spin_prizes').select('*').order('id');
                this.prizes = data || [];
                return this.prizes;
            }
        };

        // =============================================
        // ===== AVATAR + SPIN APP FUNCTIONS ===========
        // =============================================
        Object.assign(app, {
            navHistory: function() {
                if(!currentUser) { router.show('view-login'); app.setActiveNav('home'); return; }
                app.setActiveNav('shop');
                document.getElementById('user-menu') && (document.getElementById('user-menu').style.display='none');
                router.show('view-order-history');
                app.renderOrderHistory();
            },
            navTopup: function() {
                if(!currentUser) { router.show('view-login'); app.setActiveNav('home'); return; }
                router.show('view-topup');
                app.setActiveNav('topup');
            },
            showChangeAvatarPopup: function() {
                const modal = document.getElementById('change-avatar-modal');
                modal.style.display = 'flex';
                modal.classList.add('active');
                document.getElementById('avatar-url-input').value = '';
                document.getElementById('avatar-preview').src = currentUser?.avatar_url || '';
            },
            closeChangeAvatarPopup: function() {
                const modal = document.getElementById('change-avatar-modal');
                modal.style.display = 'none';
                modal.classList.remove('active');
            },
            previewAvatarUrl: function() {
                const url = document.getElementById('avatar-url-input').value.trim();
                if(url) document.getElementById('avatar-preview').src = url;
            },
            saveAvatar: async function() {
                const url = document.getElementById('avatar-url-input').value.trim();
                if(!url) { NotificationManager.warning('ກະລຸນາໃສ່ URL'); return; }
                showProcessing('ກຳລັງບັນທຶກ...');
                await _supabase.from('site_users').update({ avatar_url: url }).eq('id', currentUser.id);
                currentUser.avatar_url = url;
                document.getElementById('user-avatar').src = url;
                document.getElementById('profile-avatar').src = url;
                hideProcessing();
                this.closeChangeAvatarPopup();
                NotificationManager.success('ປ່ຽນຮູບໂປຣໄຟລ໌ສຳເລັດ!');
            },

            // Spin page init
            loadSpinPage: async function() {
                if(this._spinPageLoading) return;
                this._spinPageLoading = true;
                try {
                    // โหลด config
                    const { data: cfg } = await _supabase.from('spin_config').select('*').maybeSingle();
                    const threshold = (cfg && cfg.threshold) ? cfg.threshold : 200000;
                    if(cfg) {
                        const descEl = document.getElementById('spin-rule-desc');
                        const howtoEl = document.getElementById('spin-how-to');
                        if(descEl) descEl.textContent = cfg.description || '';
                        if(howtoEl) {
                            const txt = cfg.how_to || '';
                            howtoEl.innerHTML = txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
                        }
                    }
                    // prizes list
                    if(!spinWheel.prizes || !spinWheel.prizes.length) await spinWheel.loadPrizes();
                    app.renderSpinPrizesList();

                    if(!currentUser) {
                        document.getElementById('spin-tickets-count').textContent = '-';
                        document.getElementById('spin-progress-bar').style.width = '0%';
                        document.getElementById('spin-progress-text').textContent = 'ກະລຸນາເຂົ້າສູ່ລະບົບ';
                        return;
                    }

                    // fetch fresh จาก DB โดยตรง
                    const { data: freshUser } = await _supabase
                        .from('site_users')
                        .select('spin_tickets,spin_progress,balance')
                        .eq('id', currentUser.id)
                        .single();
                    if(freshUser) {
                        currentUser.spin_tickets = freshUser.spin_tickets || 0;
                        currentUser.spin_progress = freshUser.spin_progress || 0;
                        currentUser.balance = freshUser.balance || currentUser.balance;
                    }
                    const tk = currentUser.spin_tickets || 0;
                    const progress = currentUser.spin_progress || 0;
                    const pct = Math.min((progress / threshold) * 100, 100);
                    document.getElementById('spin-tickets-count').textContent = tk;
                    document.getElementById('spin-progress-bar').style.width = pct + '%';
                    document.getElementById('spin-progress-text').textContent =
                        `${Number(progress).toLocaleString()} / ${Number(threshold).toLocaleString()} ₭`;
                    // balance header
                    document.getElementById('user-balance').textContent = Number(currentUser.balance||0).toLocaleString() + ' ₭';
                    // history
                    await app.loadSpinHistory();
                } finally {
                    this._spinPageLoading = false;
                }
            },

            renderSpinPrizesList: function() {
                const el = document.getElementById('spin-prizes-list');
                if(!el || !spinWheel.prizes) return;
                if(!spinWheel.prizes.length) { el.innerHTML = '<p style="color:#555; font-size:12px; text-align:center;">ຍັງບໍ່ມີລາງວັນ</p>'; return; }
                el.innerHTML = spinWheel.prizes.map(p => {
                    const dot = `<span class="spin-history-dot" style="background:${p.color||'#888'};"></span>`;
                    const nameEl = `<span style="flex:1; font-size:13px;">${p.emoji||''} ${p.display_name}</span>`;
                    // ซ่อน % และ stock จากผู้ใช้ทั่วไป
                    return `<div class="spin-history-item">${dot}${nameEl}</div>`;
                }).join('');
            },

            loadSpinHistory: async function() {
                const el = document.getElementById('spin-history-list');
                if(!el || !currentUser) return;
                const { data } = await _supabase.from('spin_history').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
                if(!data || !data.length) { el.innerHTML = '<p style="color:#555; font-size:12px; text-align:center; padding:10px;">ຍັງບໍ່ມີປະຫວັດ</p>'; return; }
                el.innerHTML = data.map(h => {
                    const d = new Date(h.created_at).toLocaleString('lo-LA');
                    const prize = spinWheel.prizes.find(p => p.id === h.prize_id);
                    const color = prize?.color || '#888';
                    return `<div class="spin-history-item">
                        <span class="spin-history-dot" style="background:${color};"></span>
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:600;">${h.prize_name}</div>
                            <div style="font-size:11px; color:#666;">${d}</div>
                        </div>
                        ${h.prize_amount > 0 ? `<span style="font-size:12px; color:#00cc88;">+${Number(h.prize_amount).toLocaleString()} ₭</span>` : ''}
                    </div>`;
                }).join('');
            },

            // ===== SPIN ADMIN =====
            switchPrizeType: function(type) {
                document.getElementById('spin-prize-type').value = type;
                ['cash','product','custom','miss'].forEach(t => {
                    document.getElementById('spinf-'+t).style.display = t===type ? 'block' : 'none';
                    const btn = document.getElementById('stype-'+t);
                    if(btn) btn.className = 'btn btn-sm ' + (t===type ? 'btn-red' : 'btn-outline');
                });
                if(type==='product') app.filterSpinProducts();
            },

            filterSpinProducts: function() {
                const q = (document.getElementById('spin-product-search')?.value||'').toLowerCase().trim();
                const list = document.getElementById('spin-product-list');
                if(!list) return;
                let items = app.db.products || [];
                if(q) items = items.filter(p => p.name.toLowerCase().includes(q));
                list.innerHTML = items.slice(0,30).map(p => `
                    <div onclick="app.selectSpinProduct(${p.id},'${p.name.replace(/'/g,"\'")}','${p.img}')"
                         style="display:flex; align-items:center; gap:8px; background:#222; border-radius:8px; padding:8px; cursor:pointer; border:1px solid transparent; transition:0.15s;"
                         onmouseover="this.style.borderColor='rgba(255,0,0,0.4)'"
                         onmouseout="this.style.borderColor='transparent'">
                        <img src="${p.img}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;" onerror="this.src='https://via.placeholder.com/36'">
                        <span style="font-size:12px; color:#fff;">${p.name}</span>
                    </div>`).join('');
            },

            selectSpinProduct: function(id, name, img) {
                document.getElementById('spin-product-id').value = id;
                const sel = document.getElementById('spin-product-selected');
                sel.style.display = 'flex';
                document.getElementById('spin-product-sel-img').src = img;
                document.getElementById('spin-product-sel-name').textContent = name;
                document.getElementById('spin-product-list').innerHTML = '';
                document.getElementById('spin-product-search').value = '';
            },

            savePrize: async function() {
                const id = document.getElementById('spin-edit-id').value;
                const type = document.getElementById('spin-prize-type').value;
                const pct = parseFloat(document.getElementById('spin-prize-pct').value) || 0;
                const stock = parseInt(document.getElementById('spin-prize-stock').value) || 0;
                const color = document.getElementById('spin-prize-color').value;
                const emoji = document.getElementById('spin-prize-emoji').value.trim();

                let data = { type, pct, stock, color, emoji };

                if(type === 'cash') {
                    const amount = parseInt(document.getElementById('spin-prize-amount').value) || 0;
                    data.display_name = `${Number(amount).toLocaleString()} ₭`;
                    data.amount = amount;
                } else if(type === 'product') {
                    const pid = document.getElementById('spin-product-id').value;
                    if(!pid) { NotificationManager.warning('ກະລຸນາເລືອກສິນຄ້າ'); return; }
                    const prod = app.db.products.find(p => p.id == pid);
                    data.product_id = parseInt(pid);
                    data.display_name = prod?.name || 'ສິນຄ້າ';
                    data.img_url = prod?.img || '';
                    data.amount = 0;
                } else if(type === 'custom') {
                    const name = document.getElementById('spin-custom-name').value.trim();
                    if(!name) { NotificationManager.warning('ກະລຸນາໃສ່ຊື່ລາງວັນ'); return; }
                    data.display_name = name;
                    data.img_url = document.getElementById('spin-custom-img').value.trim();
                    data.amount = 0;
                } else {
                    data.display_name = 'ໂຊກດີຄັ້ງໜ້າ';
                    data.amount = 0;
                }

                const res = id ?
                    await _supabase.from('spin_prizes').update(data).eq('id', id) :
                    await _supabase.from('spin_prizes').insert([data]);
                if(res.error) { NotificationManager.error(res.error.message); return; }
                NotificationManager.success(id ? 'ອັບເດດສຳເລັດ!' : 'ເພີ່ມລາງວັນສຳເລັດ!');
                document.getElementById('spin-edit-id').value = '';
                await spinWheel.loadPrizes();
                spinWheel.draw();
                app.renderSpinAdminPrizes();
                app.renderSpinPrizesList();
            },

            deletePrize: async function(id) {
                if(!await CustomConfirm.show('ລົບລາງວັນນີ້?',{title:'ລົບ',icon:'fa-trash'})) return;
                await _supabase.from('spin_prizes').delete().eq('id', id);
                NotificationManager.success('ລົບສຳເລັດ!');
                await spinWheel.loadPrizes();
                spinWheel.draw();
                app.renderSpinAdminPrizes();
                app.renderSpinPrizesList();
            },

            renderSpinAdminPrizes: function() {
                const el = document.getElementById('spin-prizes-admin-list');
                if(!el) return;
                if(!spinWheel.prizes.length) { el.innerHTML = '<p style="color:#555; font-size:12px; text-align:center;">ຍັງບໍ່ມີລາງວັນ</p>'; return; }
                el.innerHTML = spinWheel.prizes.map(p => `
                    <div class="spin-prize-admin-card">
                        <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${p.color||'#888'}; flex-shrink:0;"></span>
                        ${p.img_url ? `<img src="${p.img_url}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;">` : `<span style="font-size:20px;">${p.emoji||'🎁'}</span>`}
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; color:#fff; font-weight:600;">${p.display_name}</div>
                            <div style="font-size:11px; color:#888;">${p.pct}% · stock: ${p.stock===0?'∞':p.stock-(p.stock_used||0)}</div>
                        </div>
                        <i class="fas fa-edit" style="color:cyan; cursor:pointer; margin-right:10px;" onclick="app.editPrize(${p.id})"></i>
                        <i class="fas fa-trash" style="color:var(--main-red); cursor:pointer;" onclick="app.deletePrize(${p.id})"></i>
                    </div>`).join('');
            },

            editPrize: function(id) {
                const p = spinWheel.prizes.find(x => x.id === id);
                if(!p) return;
                document.getElementById('spin-edit-id').value = p.id;
                app.switchPrizeType(p.type);
                document.getElementById('spin-prize-pct').value = p.pct;
                document.getElementById('spin-prize-stock').value = p.stock;
                document.getElementById('spin-prize-color').value = p.color || '#ff4444';
                document.getElementById('spin-prize-emoji').value = p.emoji || '';
                if(p.type==='cash') document.getElementById('spin-prize-amount').value = p.amount;
                else if(p.type==='custom') {
                    document.getElementById('spin-custom-name').value = p.display_name;
                    document.getElementById('spin-custom-img').value = p.img_url||'';
                } else if(p.type==='product' && p.product_id) {
                    const prod = app.db.products.find(x => x.id===p.product_id);
                    if(prod) app.selectSpinProduct(prod.id, prod.name, prod.img);
                }
                window.scrollTo(0,0);
            },

            saveSpinConfig: async function() {
                const desc = document.getElementById('spin-cfg-desc').value;
                const howto = document.getElementById('spin-cfg-howto').value;
                const threshold = parseInt(document.getElementById('spin-cfg-threshold').value) || 200000;
                const spin_cost = parseInt(document.getElementById('spin-cfg-cost').value) || 0;
                const { error } = await _supabase.from('spin_config').upsert([{ id:1, description:desc, how_to:howto, threshold, spin_cost }]);
                if(error) { NotificationManager.error(error.message); return; }
                NotificationManager.success('ບັນທຶກການຕັ້ງຄ່າສຳເລັດ!');
            },

            loadSpinAdminData: async function() {
                // prizes
                app.renderSpinAdminPrizes();
                // config
                const { data: cfg } = await _supabase.from('spin_config').select('*').single();
                if(cfg) {
                    document.getElementById('spin-cfg-desc').value = cfg.description||'';
                    // แปลง <br> → \n เพื่อแสดงใน textarea
                    document.getElementById('spin-cfg-howto').value = (cfg.how_to||'').replace(/<br\s*\/?>/gi,'\n');
                    document.getElementById('spin-cfg-threshold').value = cfg.threshold||200000;
                    document.getElementById('spin-cfg-cost').value = cfg.spin_cost||0;
                }
                // admin history
                const { data: hist } = await _supabase.from('spin_history').select('*').order('created_at',{ascending:false}).limit(50);
                const el = document.getElementById('spin-admin-history');
                if(!hist || !hist.length) { el.innerHTML='<p style="color:#555;font-size:12px;text-align:center;padding:10px;">ຍັງບໍ່ມີປະຫວັດ</p>'; return; }
                el.innerHTML = hist.map(h => {
                    const d = new Date(h.created_at).toLocaleString('lo-LA');
                    return `<div class="spin-history-item">
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:600; color:#fff;">${h.username} <span style="color:#f5c518;">→</span> ${h.prize_name}</div>
                            <div style="font-size:11px; color:#666;">${d}</div>
                        </div>
                        ${h.prize_amount>0?`<span style="color:#00cc88;font-size:12px;">+${Number(h.prize_amount).toLocaleString()} ₭</span>`:''}
                    </div>`;
                }).join('');
                // init product list for form
                app.filterSpinProducts();
            }
        });

        // Hook spin tab into admin tab system
        const _origTab = app.tab.bind(app);
        app.tab = function(id) {
            _origTab(id);
            if(id === 'tab-spin-admin') app.loadSpinAdminData();
        };

        // Hook fetchData to check spin progress after topup
        const _origFetch = app.fetchData.bind(app);
        app.fetchData = async function() {
            await _origFetch();
            if(currentUser) {
                const { data: u } = await _supabase.from('site_users').select('spin_tickets,spin_progress,balance,avatar_url').eq('id',currentUser.id).single();
                if(u) {
                    currentUser.spin_tickets = u.spin_tickets||0;
                    currentUser.spin_progress = u.spin_progress||0;
                    if(u.avatar_url) currentUser.avatar_url = u.avatar_url;
                }
            }
        };

        // override router.show — เปิดหน้า spin โหลดทุกอย่าง
        const _origRouterShow = router.show.bind(router);
        router.show = function(id) {
            _origRouterShow(id);
            if(id === 'view-spin') {
                (async () => {
                    if(!spinWheel.prizes || !spinWheel.prizes.length) {
                        await spinWheel.loadPrizes();
                    }
                    spinWheel.draw();
                    await app.loadSpinPage();
                })();
            }
        };

        // hook เติมเงินสำเร็จให้อัปเดต spin_progress
        // _updateSpinProgress(amount, userId) — userId คือ user ที่เติมเงิน (อาจไม่ใช่ admin)
        app._updateSpinProgress = async function(amount, userId) {
            const targetId = userId || (currentUser && currentUser.id);
            if(!targetId) return;
            const { data: cfg } = await _supabase.from('spin_config').select('threshold').maybeSingle();
            const threshold = (cfg && cfg.threshold) ? cfg.threshold : 200000;
            const { data: u } = await _supabase.from('site_users').select('spin_progress,spin_tickets').eq('id', targetId).single();
            let progress = (u?.spin_progress||0) + amount;
            let tickets = u?.spin_tickets||0;
            const newTickets = Math.floor(progress / threshold);
            if(newTickets > 0) {
                tickets += newTickets;
                progress = progress % threshold;
            }
            await _supabase.from('site_users').update({ spin_progress: progress, spin_tickets: tickets }).eq('id', targetId);
            // ถ้าเป็น currentUser ให้ update cache และ refresh spin page
            if(currentUser && currentUser.id === targetId) {
                currentUser.spin_progress = progress;
                currentUser.spin_tickets = tickets;
                if(newTickets > 0) {
                    NotificationManager.success(`ໄດ້ຮັບ ${newTickets} ສິດໝຸນວົງລໍ້! (ລວມ: ${tickets} ສິດ)`);
                }
                const spinView = document.getElementById('view-spin');
                if(spinView && !spinView.classList.contains('hidden')) {
                    await app.loadSpinPage();
                }
            }
        };


                app.init();

        // ===== CUSTOM CONFIRM DIALOG =====
        const CustomConfirm = {
            _resolve: null,
            show: function(msg, opts={}) {
                return new Promise(resolve => {
                    this._resolve = resolve;
                    document.getElementById('confirm-msg').textContent = msg;
                    document.getElementById('confirm-title').textContent = opts.title || 'ຢືນຢັນ';
                    const icon = document.getElementById('confirm-icon');
                    icon.innerHTML = opts.icon ? `<i class="fas ${opts.icon}"></i>` : '<i class="fas fa-exclamation-triangle"></i>';
                    const okBtn = document.getElementById('confirm-ok-btn');
                    okBtn.className = 'custom-confirm-ok' + (opts.greenBtn ? ' green-btn' : '');
                    okBtn.innerHTML = (opts.okLabel || '<i class="fas fa-check"></i> ຢືນຢັນ');
                    document.getElementById('custom-confirm-overlay').classList.add('show');
                });
            },
            confirm: function() {
                document.getElementById('custom-confirm-overlay').classList.remove('show');
                if(this._resolve) { this._resolve(true); this._resolve = null; }
            },
            cancel: function() {
                document.getElementById('custom-confirm-overlay').classList.remove('show');
                if(this._resolve) { this._resolve(false); this._resolve = null; }
            }
        };

        // ===== PROCESSING POPUP HELPERS =====
        function showProcessing(msg) {
            const overlay = document.getElementById('processing-overlay');
            const msgEl = document.getElementById('processing-msg');
            if(msg) msgEl.innerHTML = msg;
            else msgEl.innerHTML = 'ລະບົບກຳລັງດຳເນີນການ<br>ກະລຸນາຢ່າກົດອອກ';
            overlay.classList.add('show');
        }
        function hideProcessing() {
            document.getElementById('processing-overlay').classList.remove('show');
        }

// ===== Legacy Scroll =====
// Legacy support for old scroll-animate items on initial load
document.addEventListener("DOMContentLoaded", function() {
    const legacyItems = document.querySelectorAll('.scroll-animate');
    const legacyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) entry.target.classList.add('show');
        });
    }, { threshold: 0.2 });
    legacyItems.forEach(item => legacyObserver.observe(item));
});
