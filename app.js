/**
 * Campus Food Ordering System - Application Controller
 * Handles SPA routing, UI rendering, cart operations, Kanban state updates, 
 * real-time notification events, SVG analytics plotting, and CSV/PDF report downloads.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. CORE APPLICATION STATE ---
  const state = {
    currentRole: 'student', // 'student', 'manager', 'admin'
    currentUser: null,      // Active user details object
    currentCanteenId: null, // If role is manager, active canteen ID
    cart: {
      canteenId: null,
      items: [] // { id, name, price, quantity, prepTime, image }
    },
    paymentMethod: 'UPI',
    pickupTime: 'Immediate',
    activeCategory: 'all',
    searchQuery: '',
    selectedRating: 5,
    lastGeneratedReport: []
  };

  // Sound effects simulation using browser Web Audio API (creates high-end feel!)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playNotificationSound(type) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.15); // F4
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.log('Audio Context wait user gesture: ', e);
    }
  }

  // --- 2. GLOBAL EVENT REGISTRY & MOCK WEBSOCKET SIMULATION ---
  // Broadcast announcement list
  let broadcasts = [
    { id: 'BC001', title: 'Welcome to Campus Food Portal!', message: 'Avoid queue delays by remote pre-ordering during class breaks. Payments can be settled via UPI or cash.', type: 'info', timestamp: Date.now() - 3600000 },
    { id: 'BC002', title: 'Summer Drinks Discount', message: 'Get 10% off on all fresh juices at Healthy & Fresh canteen this week!', type: 'holiday', timestamp: Date.now() - 1800000 }
  ];

  // Inter-role real-time simulator events
  window.addEventListener('campus_new_order', (e) => {
    const order = e.detail;
    showToast(`🔔 New Order Received! Token #${order.token}`, 'info');
    playNotificationSound('alert');
    if (state.currentRole === 'manager' && state.currentCanteenId === order.canteenId) {
      renderManagerOrders();
      renderManagerAnalytics();
    }
  });

  window.addEventListener('campus_order_status_change', (e) => {
    const order = e.detail;
    if (state.currentRole === 'student' && state.currentUser && state.currentUser.id === order.studentId) {
      showToast(`📍 Order #${order.id} status updated to: ${order.status}!`, 'success');
      playNotificationSound('success');
      renderStudentTracking();
      renderStudentHistory();
    }
    // Update public display board if visible
    updateDisplayBoardData();
  });

  // Watch for student block state changes
  window.addEventListener('campus_db_update', (e) => {
    if (e.detail.table === 'students' && state.currentRole === 'student' && state.currentUser) {
      const student = window.db.getStudentById(state.currentUser.id);
      if (student && student.status === 'Blocked') {
        showToast('🛑 Your account has been blocked by Admin.', 'danger');
        handleLogout();
      }
    }
    // Sync other panels
    if (state.currentRole === 'admin') {
      renderAdminDashboard();
      renderAdminCanteens();
      renderAdminStudents();
    } else if (state.currentRole === 'manager') {
      renderManagerOrders();
      renderManagerMenu();
      renderManagerAnalytics();
    }
  });


  // --- 3. TOAST & NOTIFICATION CONTROLS ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let emoji = '💡';
    if (type === 'success') emoji = '✅';
    else if (type === 'warning') emoji = '⚠️';
    else if (type === 'danger') emoji = '🛑';

    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap: 8px;">
        <span>${emoji}</span>
        <span style="font-size:0.85rem; font-weight:500;">${message}</span>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);
    
    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }


  // --- 4. VIEW ROUTING SYSTEM ---
  function switchRoleView(role, userObj = null) {
    state.currentRole = role;
    state.currentUser = userObj;
    
    // UI elements update
    document.getElementById('login-container').classList.remove('active');
    document.getElementById('app-container').classList.add('active');
    
    // Toggle main role views
    document.querySelectorAll('.role-view').forEach(view => view.classList.remove('active'));
    
    const roleBadge = document.getElementById('role-badge');
    const uName = document.getElementById('header-user-name');
    const uDetails = document.getElementById('header-user-details');

    if (role === 'student') {
      document.getElementById('view-student').classList.add('active');
      roleBadge.textContent = 'Student';
      roleBadge.className = 'role-badge';
      uName.textContent = userObj.name;
      uDetails.textContent = `${userObj.department} - Year ${userObj.year}`;
      
      // Load student discovery menu (Canteen selection is shown first)
      switchStudentSubView('student-discover');
      document.getElementById('student-canteen-selection-section').classList.add('active');
      document.getElementById('student-menu-section').classList.remove('active');
      document.getElementById('canteen-filter').value = 'all';

      renderStudentAlertBanner();
      renderStudentDiscovery();
      renderCanteensGrid();
      renderStudentHistory();
      renderStudentTracking();
      updateCartBadge();
    } 
    else if (role === 'manager') {
      document.getElementById('view-manager').classList.add('active');
      roleBadge.textContent = 'Canteen Manager';
      roleBadge.className = 'role-badge success';
      uName.textContent = userObj.manager;
      uDetails.textContent = userObj.name;
      
      state.currentCanteenId = userObj.id;
      
      // Update canteen profile sidebar
      document.getElementById('canteen-mgr-name').textContent = userObj.name;
      document.getElementById('canteen-mgr-loc').textContent = userObj.location;
      
      switchManagerSubView('mgr-orders');
      renderManagerOrders();
      renderManagerMenu();
      renderManagerAnalytics();
      populateScannerDropdowns();
      populatePromoList();
    } 
    else if (role === 'admin') {
      document.getElementById('view-admin').classList.add('active');
      roleBadge.textContent = 'Administrator';
      roleBadge.className = 'role-badge danger';
      uName.textContent = 'Super Admin';
      uDetails.textContent = 'Campus Hub';
      
      switchAdminSubView('admin-kpis');
      renderAdminDashboard();
      renderAdminCanteens();
      renderAdminStudents();
      renderBroadcastLog();
      populateReportCanteenDropdown();
    }

    // Update switcher highlighted tab
    document.querySelectorAll('.switcher-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.targetRole === role);
    });
  }

  function handleLogout() {
    state.currentUser = null;
    state.currentCanteenId = null;
    state.cart = { canteenId: null, items: [] };
    
    document.getElementById('app-container').classList.remove('active');
    document.getElementById('login-container').classList.add('active');
    
    // Clear login input boxes
    document.getElementById('student-id-input').value = '';
    document.getElementById('student-email-input').value = '';
    
    showToast('Signed out successfully.', 'info');
  }

  // Header logout listener
  document.getElementById('btn-logout').addEventListener('click', handleLogout);


  // --- 5. UNIFIED LOGIN CONTROLLER ---
  // Form switching tabs
  const loginTabs = document.querySelectorAll('.login-tab');
  const loginForms = document.querySelectorAll('.login-form');

  loginTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      loginTabs.forEach(t => t.classList.remove('active'));
      loginForms.forEach(f => f.classList.remove('active'));
      
      tab.classList.add('active');
      const role = tab.dataset.role;
      document.getElementById(`${role}-login-form`).classList.add('active');
    });
  });

  // Populate Canteen dropdown (stubbed)
  function populateManagerCanteenDropdown() {
    // Dropdown removed in new design, stubbed out to prevent errors
  }

  // Student manual login/registration submission
  const studentLoginForm = document.getElementById('student-login-form');
  const btnStudentLogin = document.getElementById('btn-student-login');
  const studentToggleModeLink = document.getElementById('student-toggle-mode');

  studentToggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (studentLoginForm.classList.contains('login-mode')) {
      studentLoginForm.classList.remove('login-mode');
      studentLoginForm.classList.add('signup-mode');
      studentToggleModeLink.textContent = 'Log In';
      studentLoginForm.querySelector('.mode-text').textContent = 'Already have an account?';
      btnStudentLogin.textContent = 'Sign Up as Student';
      
      document.getElementById('student-name-input').required = true;
      document.getElementById('student-id-input').required = true;
    } else {
      studentLoginForm.classList.remove('signup-mode');
      studentLoginForm.classList.add('login-mode');
      studentToggleModeLink.textContent = 'Sign Up';
      studentLoginForm.querySelector('.mode-text').textContent = "Don't have an account?";
      btnStudentLogin.textContent = 'Log In as Student';
      
      document.getElementById('student-name-input').required = false;
      document.getElementById('student-id-input').required = false;
    }
  });

  document.getElementById('student-login-inner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const isLoginMode = studentLoginForm.classList.contains('login-mode');
    const email = document.getElementById('student-email-input').value.trim();
    const pass = document.getElementById('student-pass-input').value.trim();
    
    if (isLoginMode) {
      // Login validation
      const students = window.db.getStudents();
      const found = students.find(s => s.email.toLowerCase() === email.toLowerCase());
      
      if (!found) {
        showToast('College Email ID not registered.', 'danger');
        return;
      }

      if (found.status === 'Blocked') {
        showToast('🛑 Access Denied: This student account has been blocked.', 'danger');
        return;
      }

      if (found.password !== pass) {
        showToast('Incorrect password for this student account.', 'danger');
        return;
      }

      switchRoleView('student', found);
      showToast(`Welcome back, ${found.name}!`, 'success');
    } else {
      // Registration/Sign Up
      const name = document.getElementById('student-name-input').value.trim();
      const studentId = document.getElementById('student-id-input').value.trim();
      
      const students = window.db.getStudents();
      const existId = students.find(s => s.id.toLowerCase() === studentId.toLowerCase());
      if (existId) {
        showToast('Student ID Card No already registered.', 'danger');
        return;
      }

      const existEmail = students.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (existEmail) {
        showToast('College Email ID already registered.', 'danger');
        return;
      }

      const newStudent = {
        id: studentId,
        name: name,
        department: 'Computer Science',
        year: 'I',
        mobile: '9' + Math.floor(100000000 + Math.random() * 900000000),
        email: email,
        password: pass,
        status: 'Active'
      };

      window.db.saveStudent(newStudent);
      switchRoleView('student', newStudent);
      showToast(`Registration Success! Welcome, ${name}.`, 'success');
    }
  });

  // Google OAuth Simulator
  const googleModal = document.getElementById('google-auth-modal');
  
  document.getElementById('btn-google-login').addEventListener('click', () => {
    renderGoogleAccountsPicker();
    googleModal.classList.add('active');
  });

  document.getElementById('btn-close-google-modal').addEventListener('click', () => {
    googleModal.classList.remove('active');
  });

  function renderGoogleAccountsPicker() {
    const picker = document.getElementById('google-accounts-picker');
    picker.innerHTML = '';

    const students = window.db.getStudents().filter(s => s.status === 'Active');
    
    students.forEach(s => {
      const item = document.createElement('div');
      item.className = 'google-account-item';
      
      // Google user initials avatar
      const initials = s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      item.innerHTML = `
        <div class="google-avatar">${initials}</div>
        <div class="google-account-details">
          <span class="google-account-name">${s.name}</span>
          <span class="google-account-email">${s.email}</span>
        </div>
      `;
      item.addEventListener('click', () => {
        googleModal.classList.remove('active');
        switchRoleView('student', s);
        showToast(`Signed in with Google as ${s.name}!`, 'success');
      });
      picker.appendChild(item);
    });
  }

  // Google Custom Gmail Account Registration Form Submit
  document.getElementById('google-custom-auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('google-custom-name').value.trim();
    const email = document.getElementById('google-custom-email').value.trim().toLowerCase();

    const students = window.db.getStudents();
    let found = students.find(s => s.email.toLowerCase() === email);

    if (found) {
      if (found.status === 'Blocked') {
        showToast('🛑 This student account has been blocked.', 'danger');
        return;
      }
      googleModal.classList.remove('active');
      switchRoleView('student', found);
      showToast(`Signed in with Google as ${found.name}!`, 'success');
    } else {
      // Register new student automatically representing Google Login
      const randomId = 'STU' + Math.floor(100 + Math.random() * 900); // STU100-999
      const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000); // 10 digit number starting with 9
      
      const newStudent = {
        id: randomId,
        name: name,
        department: 'Computer Science',
        year: 'I',
        mobile: randomMobile,
        email: email,
        password: 'googleUser123',
        status: 'Active'
      };

      window.db.saveStudent(newStudent);
      googleModal.classList.remove('active');
      switchRoleView('student', newStudent);
      showToast(`Google Registration Success! Welcome, ${name}.`, 'success');
    }

    document.getElementById('google-custom-auth-form').reset();
  });

  // Manager/Canteen manual login/registration submission
  const managerLoginForm = document.getElementById('manager-login-form');
  const btnManagerLogin = document.getElementById('btn-manager-login');
  const managerToggleModeLink = document.getElementById('manager-toggle-mode');

  managerToggleModeLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (managerLoginForm.classList.contains('login-mode')) {
      managerLoginForm.classList.remove('login-mode');
      managerLoginForm.classList.add('signup-mode');
      managerToggleModeLink.textContent = 'Log In';
      managerLoginForm.querySelector('.mode-text').textContent = 'Already registered?';
      btnManagerLogin.textContent = 'Register & Open Canteen';
      
      document.getElementById('manager-owner-input').required = true;
      document.getElementById('manager-canteen-input').required = true;
    } else {
      managerLoginForm.classList.remove('signup-mode');
      managerLoginForm.classList.add('login-mode');
      managerToggleModeLink.textContent = 'Register Canteen';
      managerLoginForm.querySelector('.mode-text').textContent = "Don't have a canteen account?";
      btnManagerLogin.textContent = 'Access Vendor Panel';
      
      document.getElementById('manager-owner-input').required = false;
      document.getElementById('manager-canteen-input').required = false;
    }
  });

  document.getElementById('manager-login-inner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const isLoginMode = managerLoginForm.classList.contains('login-mode');
    const email = document.getElementById('manager-email-input').value.trim();
    const pass = document.getElementById('manager-pass-input').value.trim();
    
    if (isLoginMode) {
      // Login validation
      const canteens = window.db.getCanteens();
      const found = canteens.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
      
      if (!found) {
        showToast('Canteen Email ID not registered.', 'danger');
        return;
      }

      if (found.status === 'Inactive') {
        showToast('🛑 Canteen is currently inactive. Contact Admin.', 'danger');
        return;
      }

      if (found.password !== pass) {
        showToast('Incorrect password.', 'danger');
        return;
      }

      switchRoleView('manager', found);
      showToast(`Welcome, ${found.manager} (${found.name})`, 'success');
    } else {
      // Registration/Sign Up
      const owner = document.getElementById('manager-owner-input').value.trim();
      const canteenName = document.getElementById('manager-canteen-input').value.trim();
      
      const canteens = window.db.getCanteens();
      const existEmail = canteens.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
      if (existEmail) {
        showToast('Email ID already registered to a canteen.', 'danger');
        return;
      }

      let newCanteen = {
        name: canteenName,
        location: 'Main Block - Ground Floor',
        manager: owner,
        phone: '944321' + Math.floor(1000 + Math.random() * 9000),
        email: email,
        password: pass,
        status: 'Active'
      };

      newCanteen = window.db.saveCanteen(newCanteen);
      
      // Seed default items
      const defaultItems = [
        { canteenId: newCanteen.id, name: 'Filter Coffee', category: 'Drinks', price: 20, prepTime: 3, image: window.db.getFoodItems()[2].image, status: 'Available', isSpecial: true, description: 'Freshly brewed campus filter coffee.' },
        { canteenId: newCanteen.id, name: 'Veg Sandwich', category: 'Snacks', price: 45, prepTime: 6, image: window.db.getFoodItems()[3].image, status: 'Available', isSpecial: false, description: 'Grilled vegetable sandwich.' }
      ];
      defaultItems.forEach(item => window.db.saveFoodItem(item));

      switchRoleView('manager', newCanteen);
      showToast(`Canteen registered successfully! Welcome, ${owner}.`, 'success');
    }
  });

  // Admin manual login submission
  document.getElementById('admin-login-inner-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email-input').value;
    const pass = document.getElementById('admin-pass-input').value;

    if (email === 'admin@campus.edu' && pass === 'admin123') {
      switchRoleView('admin');
      showToast('Global Administrator Session Initialized.', 'success');
    } else {
      showToast('Invalid Admin Credentials.', 'danger');
    }
  });

  // Password Show/Hide Toggle Listener
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });

  // Autofill button click handlers
  document.getElementById('btn-autofill-student').addEventListener('click', () => {
    document.getElementById('tab-student').click();
    studentLoginForm.classList.remove('signup-mode');
    studentLoginForm.classList.add('login-mode');
    studentToggleModeLink.textContent = 'Sign Up';
    studentLoginForm.querySelector('.mode-text').textContent = "Don't have an account?";
    btnStudentLogin.textContent = 'Log In as Student';
    
    document.getElementById('student-email-input').value = 'arun.cse@campus.edu';
    document.getElementById('student-pass-input').value = 'student123';
  });

  document.getElementById('btn-autofill-canteen').addEventListener('click', () => {
    document.getElementById('tab-manager').click();
    managerLoginForm.classList.remove('signup-mode');
    managerLoginForm.classList.add('login-mode');
    managerToggleModeLink.textContent = 'Register Canteen';
    managerLoginForm.querySelector('.mode-text').textContent = "Don't have a canteen account?";
    btnManagerLogin.textContent = 'Access Vendor Panel';

    document.getElementById('manager-email-input').value = 'ramesh@canteen.edu';
    document.getElementById('manager-pass-input').value = 'canteen123';
  });

  // Back button for Canteen Selection view in Student discover view
  document.getElementById('btn-back-to-canteens').addEventListener('click', () => {
    document.getElementById('student-menu-section').classList.remove('active');
    document.getElementById('student-canteen-selection-section').classList.add('active');
    document.getElementById('canteen-filter').value = 'all';
  });
    const email = document.getElementById('admin-email-input').value;
    const pass = document.getElementById('admin-pass-input').value;

    if (email === 'admin@campus.edu' && pass === 'admin123') {
      switchRoleView('admin');
      showToast('Global Administrator Session Initialized.', 'success');
    } else {
      showToast('Invalid Admin Credentials.', 'danger');
    }
  });
  // --- 6. STUDENT PORTAL LOGIC ---
  // Sub-view Tab Switcher
  const studentSubtabs = document.querySelectorAll('.student-tab');
  studentSubtabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchStudentSubView(tab.dataset.subview);
    });
  });

  function switchStudentSubView(viewId) {
    document.querySelectorAll('.student-subview').forEach(v => v.classList.remove('active'));
    document.getElementById(`subview-${viewId}`).classList.add('active');

    studentSubtabs.forEach(t => {
      t.classList.toggle('active', t.dataset.subview === viewId);
    });

    if (viewId === 'student-cart') {
      renderStudentCart();
    } else if (viewId === 'student-track') {
      renderStudentTracking();
    } else if (viewId === 'student-history') {
      renderStudentHistory();
    }
  }

  // Render Admin alert announcements
  function renderStudentAlertBanner() {
    const banner = document.getElementById('student-alert-banner');
    const text = document.getElementById('student-alert-text');
    if (broadcasts.length > 0) {
      const latest = broadcasts[broadcasts.length - 1];
      text.textContent = `[${latest.title}] ${latest.message}`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // Render specials slider (Today's specials)
  function renderStudentDiscovery() {
    const slider = document.getElementById('specials-slider');
    slider.innerHTML = '';
    
    const foodItems = window.db.getFoodItems();
    const canteens = window.db.getCanteens();
    const specials = foodItems.filter(f => f.isSpecial && f.status === 'Available');

    if (specials.length === 0) {
      slider.innerHTML = '<p class="text-muted" style="padding: 10px;">No specials active today.</p>';
    } else {
      specials.forEach(item => {
        const canteen = canteens.find(c => c.id === item.canteenId);
        const card = document.createElement('div');
        card.className = 'special-card';
        card.innerHTML = `
          <span class="special-badge">Special ✨</span>
          <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
            <div class="row-img" style="width: 50px; height: 50px;">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div>
              <h4 style="font-size:0.95rem;">${item.name}</h4>
              <p style="font-size:0.75rem; color:var(--text-secondary);">${canteen ? canteen.name : 'Canteen'}</p>
            </div>
          </div>
          <p style="font-size:0.75rem; color:var(--text-secondary); flex: 1; margin-bottom: 10px;">${item.description || 'Tasty fresh dish'}</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:1.1rem;">₹${item.price}</span>
            <button class="btn btn-sm btn-primary add-to-cart-btn" data-item-id="${item.id}">+ Add</button>
          </div>
        `;
        slider.appendChild(card);
      });
    }

    renderMenuGrid();
  }

  // Render canteens shortcut cards
  function renderCanteensGrid() {
    const grid = document.getElementById('canteens-grid');
    grid.innerHTML = '';
    const list = window.db.getCanteens().filter(c => c.status === 'Active');
    
    list.forEach(c => {
      const card = document.createElement('div');
      card.className = 'canteen-card';
      // Calculate rating
      const reviews = window.db.getCanteenReviews(c.id);
      const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'New';
      
      card.innerHTML = `
        <h4>🏪 ${c.name}</h4>
        <p>${c.location}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="font-size:0.7rem; color:var(--text-muted);">Manager: ${c.manager}</span>
          <span style="font-size:0.8rem; color:var(--warning); font-weight:bold;">★ ${avg}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        document.getElementById('canteen-filter').value = c.id;
        document.getElementById('active-selected-canteen-name').textContent = `🏪 ${c.name}`;
        
        // Switch section visibility
        document.getElementById('student-canteen-selection-section').classList.remove('active');
        document.getElementById('student-menu-section').classList.add('active');

        // Reset search states
        state.searchQuery = '';
        document.getElementById('search-food').value = '';
        state.activeCategory = 'all';
        document.querySelectorAll('.category-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.category === 'all');
        });

        renderStudentDiscovery();
      });
      grid.appendChild(card);
    });
  }

  // Render main menu grid (with filtering)
  function renderMenuGrid() {
    const grid = document.getElementById('menu-items-grid');
    grid.innerHTML = '';

    const canteenFilterVal = document.getElementById('canteen-filter').value;
    
    let items = window.db.getFoodItems();

    // Filter by canteen
    if (canteenFilterVal !== 'all') {
      items = items.filter(i => i.canteenId === canteenFilterVal);
    }
    // Filter by category
    if (state.activeCategory !== 'all') {
      items = items.filter(i => i.category === state.activeCategory);
    }
    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }

    if (items.length === 0) {
      grid.innerHTML = '<div class="cart-empty-state">No matching food items available.</div>';
      return;
    }

    const canteens = window.db.getCanteens();

    items.forEach(item => {
      const canteen = canteens.find(c => c.id === item.canteenId);
      const card = document.createElement('div');
      card.className = 'food-card';
      
      // Stock label
      let stockBtnHTML = '';
      if (item.status === 'Available') {
        stockBtnHTML = `<button class="btn btn-sm btn-primary add-to-cart-btn" data-item-id="${item.id}">Add to Cart 🛒</button>`;
      } else if (item.status === 'OutOfStock') {
        stockBtnHTML = `<span class="badge" style="background-color:var(--danger); color:white; font-size:0.75rem;">OUT OF STOCK</span>`;
      } else {
        stockBtnHTML = `<span class="badge" style="background-color:var(--text-muted); color:white; font-size:0.75rem;">TEMP UNAVAILABLE</span>`;
      }

      card.innerHTML = `
        <div class="food-card-img">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="food-card-details">
          <h4 class="food-card-name">${item.name}</h4>
          <p class="food-card-canteen">🏪 ${canteen ? canteen.name : 'Unknown'}</p>
          <div class="food-card-meta">
            <span>⏱️ ${item.prepTime} mins</span>
            <span>🔥 Popularity: ${item.popularityScore || 50}%</span>
          </div>
          <div class="food-card-price-row">
            <span class="food-card-price">₹${item.price}</span>
            ${stockBtnHTML}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Rebind cart add buttons
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.itemId);
      });
    });
  }

  // Populate filter dropdowns
  function populateStudentFilters() {
    const filter = document.getElementById('canteen-filter');
    filter.innerHTML = '<option value="all">All Canteens</option>';
    window.db.getCanteens().forEach(c => {
      if (c.status === 'Active') {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filter.appendChild(opt);
      }
    });
  }
  populateStudentFilters();

  // Search input listeners
  document.getElementById('search-food').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderMenuGrid();
  });

  document.getElementById('canteen-filter').addEventListener('change', () => {
    renderMenuGrid();
  });

  // Category buttons
  const catBtns = document.querySelectorAll('.category-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      renderMenuGrid();
    });
  });

  // Re-bind click event for special-cards after rendering
  document.getElementById('specials-slider').addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
      addToCart(e.target.dataset.itemId);
    }
  });


  // --- 6.1 CART OPERATIONS ---
  function addToCart(itemId) {
    const item = window.db.getFoodItemById(itemId);
    if (!item) return;

    // Check if adding from a different canteen
    if (state.cart.canteenId && state.cart.canteenId !== item.canteenId) {
      const canteenPrev = window.db.getCanteenById(state.cart.canteenId);
      const canteenNew = window.db.getCanteenById(item.canteenId);
      
      const confirmSwitch = confirm(`Your cart contains items from "${canteenPrev.name}". Switch to "${canteenNew.name}" and clear previous cart?`);
      if (confirmSwitch) {
        state.cart.canteenId = item.canteenId;
        state.cart.items = [];
      } else {
        return; // Decline switch
      }
    }

    if (!state.cart.canteenId) {
      state.cart.canteenId = item.canteenId;
    }

    const existing = state.cart.items.find(i => i.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      state.cart.items.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        prepTime: item.prepTime,
        image: item.image
      });
    }

    showToast(`Added ${item.name} to cart!`, 'success');
    updateCartBadge();
    renderStudentCart();
  }

  function updateCartBadge() {
    const count = state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('cart-badge').textContent = count;
  }

  function renderStudentCart() {
    const wrapper = document.getElementById('cart-container');
    wrapper.innerHTML = '';

    if (state.cart.items.length === 0) {
      wrapper.innerHTML = `
        <div class="cart-empty-state">
          <span class="cart-empty-state-icon">🛒</span>
          <p>Your cart is empty.</p>
          <p style="font-size:0.8rem; margin-top:5px; color:var(--text-muted)">Go to Menu feed to choose items.</p>
        </div>
      `;
      return;
    }

    const cartList = document.createElement('div');
    cartList.className = 'cart-list-items';
    
    let subtotal = 0;
    state.cart.items.forEach(item => {
      subtotal += item.price * item.quantity;
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>₹${item.price} each</p>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn btn-minus" data-item-id="${item.id}">-</button>
          <span style="font-weight:bold; font-size:1rem;">${item.quantity}</span>
          <button class="qty-btn btn-plus" data-item-id="${item.id}">+</button>
          <span style="margin-left: 10px; font-weight:700; width:60px; text-align:right;">₹${item.price * item.quantity}</span>
        </div>
      `;
      cartList.appendChild(itemEl);
    });

    // Actions event mapping
    cartList.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, -1));
    });
    cartList.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', () => updateCartQuantity(btn.dataset.itemId, 1));
    });

    wrapper.appendChild(cartList);

    // Options (pickup & payment)
    const optionsCard = document.createElement('div');
    optionsCard.className = 'checkout-options-card';
    optionsCard.innerHTML = `
      <div class="form-group" style="margin-bottom:1rem;">
        <label for="pickup-time-select">⏱️ Schedule Pickup Time</label>
        <select id="pickup-time-select">
          <option value="Immediate" ${state.pickupTime === 'Immediate' ? 'selected' : ''}>Immediate (Prep Time: ~10m)</option>
          <option value="11:00 AM" ${state.pickupTime === '11:00 AM' ? 'selected' : ''}>11:00 AM (Morning Break)</option>
          <option value="12:30 PM" ${state.pickupTime === '12:30 PM' ? 'selected' : ''}>12:30 PM (Lunch Break)</option>
          <option value="01:15 PM" ${state.pickupTime === '01:15 PM' ? 'selected' : ''}>01:15 PM (Lunch Break B)</option>
          <option value="03:30 PM" ${state.pickupTime === '03:30 PM' ? 'selected' : ''}>03:30 PM (Evening Break)</option>
        </select>
      </div>
      <div class="form-group">
        <label>💵 Settlement Payment Method</label>
        <div class="payment-toggle">
          <button type="button" class="pay-option ${state.paymentMethod === 'UPI' ? 'active' : ''}" id="pay-upi">Online UPI</button>
          <button type="button" class="pay-option ${state.paymentMethod === 'Cash' ? 'active' : ''}" id="pay-cash">Cash on Pickup</button>
        </div>
      </div>
    `;

    optionsCard.querySelector('#pay-upi').addEventListener('click', () => {
      state.paymentMethod = 'UPI';
      renderStudentCart();
    });
    optionsCard.querySelector('#pay-cash').addEventListener('click', () => {
      state.paymentMethod = 'Cash';
      renderStudentCart();
    });
    optionsCard.querySelector('#pickup-time-select').addEventListener('change', (e) => {
      state.pickupTime = e.target.value;
    });

    wrapper.appendChild(optionsCard);

    // Render totals card
    const summary = document.createElement('div');
    summary.className = 'cart-summary';
    
    // Simple mock promo combo calculations
    let discount = 0;
    let totalText = 'Order Total';
    if (subtotal >= 150) {
      discount = 15; // flat 15 discount on student meal
      totalText = 'Order Total (Combo Discount Applied)';
    }

    const netTotal = subtotal - discount;

    summary.innerHTML = `
      <div class="summary-row">
        <span>Cart Items Total</span>
        <span>₹${subtotal}</span>
      </div>
      <div class="summary-row text-success">
        <span>Student Offer Combo Saving</span>
        <span>-₹${discount}</span>
      </div>
      <div class="summary-row total">
        <span>${totalText}</span>
        <span>₹${netTotal}</span>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.25rem;" id="btn-checkout-place">🚀 Place Digital Order</button>
    `;

    summary.querySelector('#btn-checkout-place').addEventListener('click', () => {
      handleCheckoutPlace();
    });

    wrapper.appendChild(summary);
  }

  function updateCartQuantity(itemId, delta) {
    const existing = state.cart.items.find(i => i.id === itemId);
    if (!existing) return;

    existing.quantity += delta;
    if (existing.quantity <= 0) {
      state.cart.items = state.cart.items.filter(i => i.id !== itemId);
    }
    
    if (state.cart.items.length === 0) {
      state.cart.canteenId = null;
    }

    updateCartBadge();
    renderStudentCart();
  }

  document.getElementById('btn-clear-cart').addEventListener('click', () => {
    state.cart = { canteenId: null, items: [] };
    updateCartBadge();
    renderStudentCart();
    showToast('Shopping cart cleared.', 'warning');
  });

  // Handle Placing Checkout Order
  function handleCheckoutPlace() {
    if (state.cart.items.length === 0) return;

    const newOrder = window.db.createOrder(
      state.currentUser.id,
      state.cart.canteenId,
      state.cart.items,
      state.pickupTime,
      state.paymentMethod
    );

    // Show success alert
    showToast(`Order Placed Successfully! Token: #${newOrder.token}`, 'success');
    
    // Clear cart state
    state.cart = { canteenId: null, items: [] };
    updateCartBadge();
    
    // Switch to status tracking screen
    switchStudentSubView('student-track');
  }


  // --- 6.2 ORDER TRACKING SYSTEM (Student side) ---
  function renderStudentTracking() {
    const container = document.getElementById('tracker-container');
    container.innerHTML = '';

    const orders = window.db.getOrders().filter(
      o => o.studentId === state.currentUser.id && 
      ['Placed', 'Accepted', 'Preparing', 'Ready'].includes(o.status)
    );

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <span class="cart-empty-state-icon">🛵</span>
          <p>No active live orders.</p>
          <p style="font-size:0.8rem; margin-top:5px; color:var(--text-muted)">Place an order or check your order History.</p>
        </div>
      `;
      return;
    }

    // Sort showing newest orders first
    orders.sort((a,b) => b.timestamp - a.timestamp).forEach(order => {
      const canteen = window.db.getCanteenById(order.canteenId);
      
      const card = document.createElement('div');
      card.className = 'tracker-card';

      // Define visual steppers
      const statuses = ['Placed', 'Accepted', 'Preparing', 'Ready'];
      const currentIdx = statuses.indexOf(order.status);
      
      let stepsHTML = '';
      const stepDescriptions = {
        Placed: 'Waiting for canteen validation',
        Accepted: 'Order received and slotted in schedule',
        Preparing: 'Kitchen staff preparing your hot meal',
        Ready: 'Food packaged! Present QR at counter'
      };

      statuses.forEach((s, idx) => {
        let statusClass = '';
        if (idx < currentIdx) statusClass = 'completed';
        else if (idx === currentIdx) statusClass = 'active';

        stepsHTML += `
          <div class="step ${statusClass}">
            <div class="step-dot"></div>
            <div class="step-label">${s}</div>
            <div class="step-desc">${stepDescriptions[s]}</div>
          </div>
        `;
      });

      // Generate a mock SVG QR Code to scan (cool premium vector design!)
      const qrSVG = `
        <svg viewBox="0 0 100 100" width="100" height="100" style="shape-rendering: crispedges;">
          <rect width="100" height="100" fill="white"/>
          <!-- Position Detection Patterns -->
          <rect x="5" y="5" width="25" height="25" fill="black"/>
          <rect x="10" y="10" width="15" height="15" fill="white"/>
          <rect x="13" y="13" width="9" height="9" fill="black"/>

          <rect x="70" y="5" width="25" height="25" fill="black"/>
          <rect x="75" y="10" width="15" height="15" fill="white"/>
          <rect x="78" y="13" width="9" height="9" fill="black"/>

          <rect x="5" y="70" width="25" height="25" fill="black"/>
          <rect x="10" y="75" width="15" height="15" fill="white"/>
          <rect x="13" y="78" width="9" height="9" fill="black"/>

          <!-- Random Noise Data Modules representing Order ID -->
          <rect x="40" y="10" width="10" height="10" fill="black"/>
          <rect x="55" y="5" width="5" height="15" fill="black"/>
          <rect x="45" y="25" width="15" height="5" fill="black"/>
          <rect x="5" y="40" width="10" height="10" fill="black"/>
          <rect x="25" y="45" width="20" height="10" fill="black"/>
          <rect x="50" y="40" width="10" height="25" fill="black"/>
          <rect x="70" y="40" width="25" height="10" fill="black"/>
          <rect x="80" y="55" width="15" height="15" fill="black"/>
          <rect x="40" y="70" width="15" height="25" fill="black"/>
          <rect x="75" y="75" width="20" height="5" fill="black"/>
          <rect x="65" y="85" width="10" height="10" fill="black"/>
          <rect x="90" y="90" width="5" height="5" fill="black"/>
          <text x="50" y="52" font-size="8" font-weight="bold" fill="black" text-anchor="middle">ORD</text>
        </svg>
      `;

      let actionHTML = '';
      if (order.status === 'Ready') {
        actionHTML = `
          <div class="qr-verification-zone">
            <div class="qr-code-holder">
              ${qrSVG}
            </div>
            <p style="font-weight:600; font-size:0.85rem; margin-top:5px;">Present this Secure QR Code at counter</p>
            <p style="font-size:0.75rem; color:var(--text-secondary)">Or verify using Token ID below</p>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="tracker-header">
          <div>
            <h3 style="font-weight:800; font-size:1.15rem;">🏪 ${canteen ? canteen.name : 'Canteen'}</h3>
            <p style="font-size:0.75rem; color:var(--text-secondary);">Order #${order.id} | ${order.paymentMethod} Payment</p>
          </div>
          <span class="token-badge">Token #${order.token}</span>
        </div>
        <div class="stepper">
          ${stepsHTML}
        </div>
        ${actionHTML}
        <div style="display:flex; justify-content:space-between; margin-top:1rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:0.75rem; font-size:0.85rem;">
          <span style="color:var(--text-secondary)">Scheduled Pickup:</span>
          <span style="font-weight:bold; color:var(--warning);">${order.pickupTime}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }


  // --- 6.3 STUDENT ORDER HISTORY & FEEDBACK ---
  function renderStudentHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';

    const orders = window.db.getOrders().filter(
      o => o.studentId === state.currentUser.id && 
      ['Completed', 'Cancelled'].includes(o.status)
    ).sort((a,b) => b.timestamp - a.timestamp);

    if (orders.length === 0) {
      list.innerHTML = `
        <div class="cart-empty-state">
          <span class="cart-empty-state-icon">📋</span>
          <p>No past orders recorded.</p>
        </div>
      `;
      return;
    }

    const canteens = window.db.getCanteens();
    const reviews = window.db.getReviews();

    orders.forEach(order => {
      const canteen = canteens.find(c => c.id === order.canteenId);
      const itemsList = window.db.getOrderDetailsByOrderId(order.id);
      const menuItems = window.db.getFoodItems();

      // Gather item name summary
      const summaryItems = itemsList.map(detail => {
        const item = menuItems.find(f => f.id === detail.itemId);
        return `${detail.quantity}x ${item ? item.name : 'Food Item'}`;
      }).join(', ');

      const dateStr = new Date(order.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      
      const card = document.createElement('div');
      card.className = 'history-card';
      
      const statusBadge = order.status === 'Completed' 
        ? `<span class="badge badge-success" style="background-color:rgba(16,185,129,0.15); color:var(--success)">Completed</span>`
        : `<span class="badge" style="background-color:rgba(239,68,68,0.15); color:var(--danger)">Cancelled</span>`;

      // Check if review already exists
      const reviewed = reviews.find(r => r.orderId === order.id);
      let reviewBtnHTML = '';
      if (order.status === 'Completed') {
        if (reviewed) {
          reviewBtnHTML = `<span style="font-size:0.75rem; color:var(--warning); font-weight:bold;">★ Rated ${reviewed.rating}</span>`;
        } else {
          reviewBtnHTML = `<button class="btn btn-sm btn-outline btn-review-trigger" data-order-id="${order.id}">⭐ Leave Review</button>`;
        }
      }

      card.innerHTML = `
        <div class="history-header">
          <span>${dateStr}</span>
          ${statusBadge}
        </div>
        <h4 style="font-size:0.95rem; font-weight:700;">🏪 ${canteen ? canteen.name : 'Canteen Facility'}</h4>
        <p class="history-items" style="color:var(--text-secondary); font-size:0.8rem; margin:4px 0;">${summaryItems}</p>
        <div class="history-footer">
          <div class="history-total">₹${order.totalAmount}</div>
          <div style="display:flex; gap: 8px;">
            <button class="btn btn-sm btn-outline btn-receipt-trigger" data-order-id="${order.id}">📋 Invoice</button>
            ${reviewBtnHTML}
          </div>
        </div>
      `;
      list.appendChild(card);
    });

    // Receipt click logic
    list.querySelectorAll('.btn-receipt-trigger').forEach(btn => {
      btn.addEventListener('click', () => showDigitalReceipt(btn.dataset.orderId));
    });

    // Rating Review click logic
    list.querySelectorAll('.btn-review-trigger').forEach(btn => {
      btn.addEventListener('click', () => showRatingModal(btn.dataset.orderId));
    });
  }

  // Generate and display print invoice receipt modal
  function showDigitalReceipt(orderId) {
    const order = window.db.getOrderById(orderId);
    if (!order) return;
    
    const canteen = window.db.getCanteenById(order.canteenId);
    const student = window.db.getStudentById(order.studentId);
    const details = window.db.getOrderDetailsByOrderId(orderId);
    const foodItems = window.db.getFoodItems();

    const dateStr = new Date(order.timestamp).toLocaleString('en-IN');
    
    let itemsHTML = '';
    details.forEach(det => {
      const item = foodItems.find(f => f.id === det.itemId);
      itemsHTML += `
        <div class="receipt-row">
          <span>${item ? item.name : 'Food item'} (x${det.quantity})</span>
          <span>₹${det.priceAtPurchase * det.quantity}</span>
        </div>
      `;
    });

    const receiptContent = document.getElementById('receipt-modal-content');
    receiptContent.innerHTML = `
      <div class="receipt-title">CAMPUS FOOD COURT</div>
      <div style="text-align:center; font-size:0.75rem; color:var(--text-secondary); margin-bottom:1rem;">
        ${canteen ? canteen.name : 'Vendor'}<br>
        ${canteen ? canteen.location : ''}<br>
        Phone: ${canteen ? canteen.phone : ''}
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Order ID:</span><span>${order.id}</span></div>
      <div class="receipt-row"><span>Token Number:</span><span style="font-weight:bold;">#${order.token}</span></div>
      <div class="receipt-row"><span>Date:</span><span>${dateStr}</span></div>
      <div class="receipt-row"><span>Customer:</span><span>${student ? student.name : 'Student'}</span></div>
      <div class="receipt-row"><span>Department:</span><span>${student ? student.department : ''}</span></div>
      <div class="receipt-divider"></div>
      ${itemsHTML}
      <div class="receipt-divider"></div>
      <div class="receipt-row" style="font-weight:bold; font-size:0.95rem;">
        <span>Grand Total:</span>
        <span>₹${order.totalAmount}</span>
      </div>
      <div class="receipt-row">
        <span>Payment Method:</span>
        <span>${order.paymentMethod}</span>
      </div>
      <div class="receipt-divider"></div>
      <div style="text-align:center; font-size:0.75rem; color:var(--text-secondary); margin-top:1rem;">
        Thank you for ordering digital!<br>
        Powered by Campus Systems
      </div>
    `;

    document.getElementById('receipt-modal').classList.add('active');
  }

  // Modal receipt close buttons
  document.getElementById('btn-close-receipt-modal').addEventListener('click', () => {
    document.getElementById('receipt-modal').classList.remove('active');
  });

  // RATING MODAL CONTROLLER
  function showRatingModal(orderId) {
    document.getElementById('rating-order-id').value = orderId;
    
    // Reset stars
    state.selectedRating = 5;
    document.getElementById('selected-rating-val').value = 5;
    
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(s => {
      s.classList.add('selected');
    });

    document.getElementById('rating-modal').classList.add('active');
  }

  // Stars picking event listeners
  const ratingStars = document.querySelectorAll('.rating-star');
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const currentRating = parseInt(star.dataset.rating);
      state.selectedRating = currentRating;
      document.getElementById('selected-rating-val').value = currentRating;

      ratingStars.forEach(s => {
        const starVal = parseInt(s.dataset.rating);
        s.classList.toggle('selected', starVal <= currentRating);
      });
    });
  });

  document.getElementById('rating-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = document.getElementById('rating-order-id').value;
    const rating = document.getElementById('selected-rating-val').value;
    const comment = document.getElementById('rating-comment').value.trim();

    window.db.addReview(orderId, rating, comment);
    
    document.getElementById('rating-modal').classList.remove('active');
    document.getElementById('rating-comment').value = '';
    
    showToast('Feedback submitted! Thank you.', 'success');
    renderStudentHistory(); // Reload
  });

  document.getElementById('btn-close-rating-modal').addEventListener('click', () => {
    document.getElementById('rating-modal').classList.remove('active');
  });
  document.getElementById('btn-cancel-rating-modal').addEventListener('click', () => {
    document.getElementById('rating-modal').classList.remove('active');
  });


  // --- 7. CANTEEN MANAGER PORTAL CONTROLLER ---
  const managerTabs = document.querySelectorAll('.manager-tab');
  managerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchManagerSubView(tab.dataset.subview);
    });
  });

  function switchManagerSubView(viewId) {
    document.querySelectorAll('.manager-subview').forEach(v => v.classList.remove('active'));
    document.getElementById(`subview-${viewId}`).classList.add('active');

    managerTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.subview === viewId);
    });

    if (viewId === 'mgr-orders') {
      renderManagerOrders();
    } else if (viewId === 'mgr-menu') {
      renderManagerMenu();
    } else if (viewId === 'mgr-promos') {
      populatePromoList();
    } else if (viewId === 'mgr-analytics') {
      renderManagerAnalytics();
    } else if (viewId === 'mgr-scanner') {
      populateScannerDropdowns();
    }
  }

  // 7.1 Kanban Live Order Render
  function renderManagerOrders() {
    // Columns containers
    const cardsPlaced = document.getElementById('cards-placed');
    const cardsPreparing = document.getElementById('cards-preparing');
    const cardsReady = document.getElementById('cards-ready');
    const cardsCompleted = document.getElementById('cards-completed');

    cardsPlaced.innerHTML = '';
    cardsPreparing.innerHTML = '';
    cardsReady.innerHTML = '';
    cardsCompleted.innerHTML = '';

    const orders = window.db.getOrders().filter(o => o.canteenId === state.currentCanteenId);
    const students = window.db.getStudents();
    const details = window.db.get('orderDetails');
    const menuItems = window.db.getFoodItems();

    let cntPlaced = 0;
    let cntPreparing = 0;
    let cntReady = 0;
    let cntCompleted = 0;

    orders.forEach(order => {
      const student = students.find(s => s.id === order.studentId);
      const itemsList = details.filter(d => d.orderId === order.id);
      
      const itemsTextHTML = itemsList.map(det => {
        const item = menuItems.find(i => i.id === det.itemId);
        return `• ${det.quantity}x ${item ? item.name : 'Food Item'}`;
      }).join('<br>');

      const orderCard = document.createElement('div');
      orderCard.className = 'kanban-card';
      
      const dateStr = new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // Action Button depends on column
      let actionsHTML = '';
      if (order.status === 'Placed') {
        actionsHTML = `<button class="btn btn-sm btn-primary btn-block btn-accept" data-order-id="${order.id}">Accept Order</button>`;
      } else if (order.status === 'Accepted' || order.status === 'Preparing') {
        actionsHTML = `
          <button class="btn btn-sm btn-success btn-block btn-ready-collect" data-order-id="${order.id}">Mark Ready 🛎️</button>
          <button class="btn btn-sm btn-outline btn-block btn-cancel" data-order-id="${order.id}" style="margin-top:4px; font-size:0.75rem; padding: 2px;">Cancel</button>
        `;
      } else if (order.status === 'Ready') {
        actionsHTML = `
          <div style="font-size:0.75rem; text-align:center; color:var(--text-secondary); margin-bottom:5px;">Awaiting Pickup</div>
          <button class="btn btn-sm btn-success btn-block btn-handover-fast" data-order-id="${order.id}">Delivered Counter</button>
        `;
      } else if (order.status === 'Completed') {
        actionsHTML = `<div style="font-size:0.75rem; text-align:center; color:var(--success); font-weight:bold;">Collected ✓</div>`;
      }

      orderCard.innerHTML = `
        <div class="kanban-card-header">
          <span class="kanban-card-token">Token #${order.token}</span>
          <span class="kanban-card-time">${dateStr}</span>
        </div>
        <div class="kanban-card-items">
          <div style="font-weight:700; font-size:0.8rem; color:var(--text-primary);">${student ? student.name : 'Student'} (${student ? student.department : ''})</div>
          <div style="color:var(--text-secondary); font-size:0.8rem; line-height:1.3; margin-top:4px;">${itemsTextHTML}</div>
        </div>
        <div class="kanban-card-total">
          <span>Amount:</span>
          <span>₹${order.totalAmount}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--warning); margin-bottom:8px;">Schedule: <b>${order.pickupTime}</b></div>
        ${actionsHTML}
      `;

      // Distribute to columns
      if (order.status === 'Placed') {
        cardsPlaced.appendChild(orderCard);
        cntPlaced++;
      } else if (order.status === 'Accepted' || order.status === 'Preparing') {
        cardsPreparing.appendChild(orderCard);
        cntPreparing++;
      } else if (order.status === 'Ready') {
        cardsReady.appendChild(orderCard);
        cntReady++;
      } else if (order.status === 'Completed') {
        // Only show completed today (recent first)
        cardsCompleted.appendChild(orderCard);
        cntCompleted++;
      }
    });

    // Update Kanban Badges
    document.getElementById('count-placed').textContent = cntPlaced;
    document.getElementById('count-preparing').textContent = cntPreparing;
    document.getElementById('count-ready').textContent = cntReady;
    document.getElementById('count-completed').textContent = cntCompleted;

    // Bind event handlers
    document.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', () => {
        window.db.updateOrderStatus(btn.dataset.orderId, 'Preparing');
        renderManagerOrders();
      });
    });

    document.querySelectorAll('.btn-ready-collect').forEach(btn => {
      btn.addEventListener('click', () => {
        window.db.updateOrderStatus(btn.dataset.orderId, 'Ready');
        renderManagerOrders();
      });
    });

    document.querySelectorAll('.btn-handover-fast').forEach(btn => {
      btn.addEventListener('click', () => {
        window.db.updateOrderStatus(btn.dataset.orderId, 'Completed');
        renderManagerOrders();
        showToast('Order delivered successfully!', 'success');
      });
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Cancel this student order?')) {
          window.db.updateOrderStatus(btn.dataset.orderId, 'Cancelled');
          renderManagerOrders();
          showToast('Order cancelled.', 'warning');
        }
      });
    });
  }

  // 7.2 Menu and inventory control table
  function renderManagerMenu() {
    const tbody = document.getElementById('mgr-menu-tbody');
    tbody.innerHTML = '';

    const items = window.db.getFoodItemsByCanteen(state.currentCanteenId);
    
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No menu items listed. Click Add New Item.</td></tr>';
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      
      const stockSelected = (item.status === 'Available') 
        ? `<option value="Available" selected>🟢 Available</option><option value="OutOfStock">🔴 Out of Stock</option><option value="TempUnavailable">⚪ Temp Closed</option>`
        : (item.status === 'OutOfStock')
          ? `<option value="Available">🟢 Available</option><option value="OutOfStock" selected>🔴 Out of Stock</option><option value="TempUnavailable">⚪ Temp Closed</option>`
          : `<option value="Available">🟢 Available</option><option value="OutOfStock">🔴 Out of Stock</option><option value="TempUnavailable" selected>⚪ Temp Closed</option>`;

      tr.innerHTML = `
        <td>
          <div class="row-img">
            <img src="${item.image}" alt="${item.name}">
          </div>
        </td>
        <td style="font-weight:600;">${item.name}</td>
        <td>${item.category}</td>
        <td style="font-weight:700;">₹${item.price}</td>
        <td>${item.prepTime} Mins</td>
        <td>
          <select class="stock-select" data-food-id="${item.id}">
            ${stockSelected}
          </select>
        </td>
        <td>${item.isSpecial ? '⭐ Today\'s Special' : 'Standard Menu'}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline btn-edit-food" data-food-id="${item.id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger btn-delete-food" data-food-id="${item.id}">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Table Select listener
    tbody.querySelectorAll('.stock-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        window.db.updateFoodItemStatus(sel.dataset.foodId, e.target.value);
        showToast('Stock availability status modified.', 'success');
      });
    });

    tbody.querySelectorAll('.btn-edit-food').forEach(btn => {
      btn.addEventListener('click', () => showFoodItemModal(btn.dataset.foodId));
    });

    tbody.querySelectorAll('.btn-delete-food').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this menu item?')) {
          window.db.deleteFoodItem(btn.dataset.foodId);
          renderManagerMenu();
          showToast('Food item removed.', 'warning');
        }
      });
    });
  }

  // FOOD ITEM EDIT MODAL LOGIC
  const foodModal = document.getElementById('food-modal');
  
  document.getElementById('btn-add-food-modal').addEventListener('click', () => {
    showFoodItemModal(); // Add mode
  });

  function showFoodItemModal(foodId = null) {
    const title = document.getElementById('food-modal-title');
    const form = document.getElementById('food-item-form');
    
    // Clear fields
    form.reset();
    document.getElementById('food-item-id').value = '';

    if (foodId) {
      title.textContent = 'Edit Food Item Details';
      const item = window.db.getFoodItemById(foodId);
      if (item) {
        document.getElementById('food-item-id').value = item.id;
        document.getElementById('food-name-input').value = item.name;
        document.getElementById('food-category-select').value = item.category;
        document.getElementById('food-price-input').value = item.price;
        document.getElementById('food-prep-input').value = item.prepTime;
        document.getElementById('food-desc-input').value = item.description || '';
        
        // Find matching image category key
        const svgKeys = Object.keys(FOOD_SVGS);
        const matchedKey = svgKeys.find(key => FOOD_SVGS[key] === item.image) || 'meals';
        document.getElementById('food-image-select').value = matchedKey;
      }
    } else {
      title.textContent = 'Add New Menu Dish';
    }

    foodModal.classList.add('active');
  }

  // Cancel buttons
  document.getElementById('btn-close-food-modal').addEventListener('click', () => foodModal.classList.remove('active'));
  document.getElementById('btn-cancel-food-modal').addEventListener('click', () => foodModal.classList.remove('active'));

  // Form Submit
  document.getElementById('food-item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('food-item-id').value;
    const name = document.getElementById('food-name-input').value.trim();
    const category = document.getElementById('food-category-select').value;
    const price = parseInt(document.getElementById('food-price-input').value);
    const prepTime = parseInt(document.getElementById('food-prep-input').value);
    const desc = document.getElementById('food-desc-input').value.trim();
    const imgKey = document.getElementById('food-image-select').value;

    const dataObj = {
      name,
      category,
      price,
      prepTime,
      description: desc,
      image: FOOD_SVGS[imgKey] || FOOD_SVGS.meals,
      canteenId: state.currentCanteenId,
      status: 'Available',
      isSpecial: (category === 'Meals' || name.toLowerCase().includes('special') || Math.random() > 0.7)
    };

    if (id) {
      dataObj.id = id;
    }

    window.db.saveFoodItem(dataObj);
    foodModal.classList.remove('active');
    renderManagerMenu();
    showToast('Menu item updated successfully!', 'success');
  });

  // 7.3 Store promotions deals
  const seededPromos = [
    { id: 'PR001', title: 'Summer Fresh Combo Offer', desc: 'Buy any protein fruit salad + fresh juice and get flat ₹15 off.', type: 'flat', val: 15 },
    { id: 'PR002', title: 'Weekend Dosa Festival', desc: '10% off on all South Indian special meals and side dishes.', type: 'percentage', val: 10 }
  ];

  function populatePromoList() {
    const list = document.getElementById('active-promos-list');
    list.innerHTML = '';
    
    seededPromos.forEach(p => {
      const card = document.createElement('div');
      card.className = 'promo-item-card';
      
      const badge = p.type === 'percentage' ? `${p.val}% OFF` : `₹${p.val} OFF`;
      
      card.innerHTML = `
        <button class="delete-promo-btn" data-promo-id="${p.id}">&times;</button>
        <div style="font-weight:bold; font-size:1rem; color:var(--warning); margin-bottom:4px;">${p.title}</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${p.desc}</p>
        <span class="badge badge-success" style="background-color:rgba(16,185,129,0.15); color:var(--success); font-size:0.7rem; margin-top:8px; display:inline-block;">${badge}</span>
      `;
      card.querySelector('.delete-promo-btn').addEventListener('click', () => {
        const idx = seededPromos.findIndex(pr => pr.id === p.id);
        if (idx !== -1) {
          seededPromos.splice(idx, 1);
          populatePromoList();
          showToast('Promotion discontinued.', 'warning');
        }
      });
      list.appendChild(card);
    });
  }

  // Handle new promo submit
  document.getElementById('promo-creation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('promo-title').value.trim();
    const type = document.getElementById('promo-type').value;
    const val = parseInt(document.getElementById('promo-val').value);
    const desc = document.getElementById('promo-desc').value.trim();

    const newPromo = {
      id: 'PR00' + (seededPromos.length + 1),
      title,
      type,
      val,
      desc
    };

    seededPromos.push(newPromo);
    document.getElementById('promo-creation-form').reset();
    populatePromoList();
    showToast('New promotion launched successfully!', 'success');
  });

  // 7.4 Canteen Store Analytics
  function renderManagerAnalytics() {
    const orders = window.db.getOrders().filter(o => o.canteenId === state.currentCanteenId && o.status === 'Completed');
    const reviews = window.db.getCanteenReviews(state.currentCanteenId);
    
    // Revenue calculations
    const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    document.getElementById('mgr-stat-revenue').textContent = `₹${revenue}`;
    document.getElementById('mgr-stat-volume').textContent = orders.length;

    // Avg preparation target
    const items = window.db.getFoodItemsByCanteen(state.currentCanteenId);
    const avgPrep = items.length > 0 ? (items.reduce((sum, i) => sum + i.prepTime, 0) / items.length).toFixed(0) : '10';
    document.getElementById('mgr-stat-time').textContent = `${avgPrep}m`;

    // Trending Items Sold
    const trendingList = document.getElementById('mgr-trending-items');
    trendingList.innerHTML = '';
    const sorted = [...items].sort((a,b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 3);
    
    sorted.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'trend-item';
      el.innerHTML = `
        <div class="trend-item-left">
          <span class="trend-rank">#${idx+1}</span>
          <span style="font-size:0.85rem; font-weight:600;">${item.name}</span>
        </div>
        <span style="font-size:0.75rem; color:var(--text-secondary);">Score: ${item.popularityScore || 50}%</span>
      `;
      trendingList.appendChild(el);
    });

    // Recent reviews
    const reviewsFeed = document.getElementById('mgr-reviews-feed');
    reviewsFeed.innerHTML = '';
    
    if (reviews.length === 0) {
      reviewsFeed.innerHTML = '<p class="text-muted" style="font-size:0.8rem; text-align:center; padding:10px;">No reviews left yet.</p>';
      return;
    }

    const students = window.db.getStudents();

    reviews.sort((a,b) => b.timestamp - a.timestamp).slice(0, 3).forEach(rev => {
      const student = students.find(s => s.id === rev.studentId);
      const starsHTML = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      
      const el = document.createElement('div');
      el.className = 'review-item';
      el.innerHTML = `
        <div class="review-header-row">
          <span style="font-weight:bold;">${student ? student.name : 'Anonymous'}</span>
          <span class="review-stars">${starsHTML}</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">"${rev.comment || 'Tasty experience!'}"</p>
      `;
      reviewsFeed.appendChild(el);
    });
  }

  // 7.5 Handover verification logic
  function populateScannerDropdowns() {
    const select = document.getElementById('scanner-order-select');
    select.innerHTML = '<option value="">No ready orders currently</option>';

    const readyOrders = window.db.getOrders().filter(o => o.canteenId === state.currentCanteenId && o.status === 'Ready');
    
    if (readyOrders.length > 0) {
      select.innerHTML = '<option value="" disabled selected>Choose active order...</option>';
      readyOrders.forEach(o => {
        const student = window.db.getStudentById(o.studentId);
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `Token #${o.token} - ${student ? student.name : 'Student'} (₹${o.totalAmount})`;
        select.appendChild(opt);
      });
    }
  }

  // Scanner manual token verify
  document.getElementById('btn-scanner-verify-token').addEventListener('click', () => {
    const tokenVal = parseInt(document.getElementById('scanner-token-input').value);
    
    if (isNaN(tokenVal)) {
      showToast('Please enter a valid numeric token number.', 'danger');
      return;
    }

    const order = window.db.getOrders().find(
      o => o.canteenId === state.currentCanteenId && o.token === tokenVal && o.status === 'Ready'
    );

    handleScanFulfillment(order);
  });

  // Scanner select option verify
  document.getElementById('btn-scanner-verify-order').addEventListener('click', () => {
    const orderId = document.getElementById('scanner-order-select').value;
    
    if (!orderId) {
      showToast('Please select a ready order to scan.', 'danger');
      return;
    }

    const order = window.db.getOrderById(orderId);
    handleScanFulfillment(order);
  });

  // Process order verification & complete handover
  function handleScanFulfillment(order) {
    const resultBox = document.getElementById('scan-result-content');
    
    if (!order) {
      resultBox.innerHTML = `
        <div class="verification-success" style="border-color:var(--danger); background:rgba(239,68,68,0.05);">
          <span style="font-size:3rem; display:block; margin-bottom:10px;">❌</span>
          <h4 style="color:var(--danger); font-size:1.1rem; margin-bottom:5px;">Verification Failed</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary)">No active "Ready for Pickup" order matching this token/QR was found for this canteen. Please re-check the token badge.</p>
        </div>
      `;
      playNotificationSound('alert');
      return;
    }

    // Complete order
    window.db.updateOrderStatus(order.id, 'Completed');
    playNotificationSound('success');
    
    const student = window.db.getStudentById(order.studentId);
    const details = window.db.getOrderDetailsByOrderId(order.id);
    const foodItems = window.db.getFoodItems();

    const itemsTextHTML = details.map(det => {
      const item = foodItems.find(i => i.id === det.itemId);
      return `• ${det.quantity}x ${item ? item.name : 'Food Item'}`;
    }).join('<br>');

    resultBox.innerHTML = `
      <div class="verification-success">
        <span style="font-size:3rem; display:block; margin-bottom:10px;">✅</span>
        <h4 style="color:var(--success); font-size:1.1rem; margin-bottom:5px;">Access Verified</h4>
        <p style="font-weight:bold; font-size:0.9rem; margin-bottom:10px;">Release Food to: ${student ? student.name : 'Student'}</p>
        
        <div style="text-align:left; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; font-size:0.8rem; line-height:1.4;">
          <strong>Order details:</strong><br>
          Token: #${order.token} | Order ID: ${order.id}<br>
          ${itemsTextHTML}<br>
          Payment: <b>${order.paymentMethod}</b> | Total: <b>₹${order.totalAmount}</b>
        </div>
      </div>
    `;

    document.getElementById('scanner-token-input').value = '';
    showToast(`Token #${order.token} handover complete.`, 'success');
    
    // Refresh manager tabs
    renderManagerOrders();
    populateScannerDropdowns();
    renderManagerAnalytics();
  }


  // --- 8. GLOBAL ADMINISTRATOR MODULE CONTROLLER ---
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchAdminSubView(tab.dataset.subview);
    });
  });

  function switchAdminSubView(viewId) {
    document.querySelectorAll('.admin-subview').forEach(v => v.classList.remove('active'));
    document.getElementById(`subview-${viewId}`).classList.add('active');

    adminTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.subview === viewId);
    });

    if (viewId === 'admin-kpis') {
      renderAdminDashboard();
    } else if (viewId === 'admin-canteens') {
      renderAdminCanteens();
    } else if (viewId === 'admin-students') {
      renderAdminStudents();
    } else if (viewId === 'admin-broadcasts') {
      renderBroadcastLog();
    } else if (viewId === 'admin-reports') {
      resetReportForm();
    }
  }

  // 8.1 KPI Dashboard Rendering & SVG Chart Plotter
  function renderAdminDashboard() {
    const stats = window.db.getAnalytics();
    
    // Set text values
    document.getElementById('adm-kpi-gmv').textContent = `₹${stats.gmv.toLocaleString('en-IN')}`;
    document.getElementById('adm-kpi-orders').textContent = stats.totalOrdersCount;
    document.getElementById('adm-kpi-adoption').textContent = `${stats.adoptionRate.toFixed(0)}%`;
    document.getElementById('adm-kpi-student-counts').textContent = `${stats.activeStudents} / ${stats.totalStudents} active students`;
    document.getElementById('adm-kpi-aov').textContent = `₹${stats.aov.toFixed(1)}`;
    document.getElementById('admin-analytics-date').textContent = `Updated: ${new Date().toLocaleTimeString()}`;

    // Render side-by-side comparative bar chart of canteens
    const compContainer = document.getElementById('canteen-comparison-container');
    compContainer.innerHTML = '';

    const maxRev = Math.max(...stats.canteenPerformance.map(c => c.revenue), 1);

    stats.canteenPerformance.forEach(c => {
      const percentage = (c.revenue / maxRev) * 100;
      const row = document.createElement('div');
      row.className = 'comparison-bar-row';
      row.innerHTML = `
        <div class="comparison-bar-info">
          <span style="font-weight:600;">🏪 ${c.name} (★ ${c.rating})</span>
          <span style="font-weight:bold;">₹${c.revenue} | ${c.orderCount} orders</span>
        </div>
        <div class="comparison-bar-bg">
          <div class="comparison-bar-fill" style="width: ${percentage}%"></div>
        </div>
      `;
      compContainer.appendChild(row);
    });

    // Render top 5 selling items
    const topItemsContainer = document.getElementById('adm-top-items-container');
    topItemsContainer.innerHTML = '';
    
    if (stats.mostOrderedItems.length === 0) {
      topItemsContainer.innerHTML = '<p class="text-muted" style="font-size:0.8rem;">No completed sales records.</p>';
    } else {
      stats.mostOrderedItems.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'trend-item';
        row.innerHTML = `
          <div class="trend-item-left">
            <span class="trend-rank" style="color:var(--warning);">#${idx+1}</span>
            <span style="font-size:0.85rem; font-weight:600;">${item.name}</span>
          </div>
          <span style="font-size:0.8rem; font-weight:bold;">Qty: ${item.quantity} (₹${item.totalSales})</span>
        `;
        topItemsContainer.appendChild(row);
      });
    }

    // Render Peak Ordering Hours
    const peakContainer = document.getElementById('peak-hours-container');
    peakContainer.innerHTML = '';
    
    // We only display from 8 AM to 6 PM (campus hours)
    const peakMax = Math.max(...stats.hourlyTrends.slice(8, 19), 1);
    
    for (let hr = 8; hr <= 18; hr++) {
      const count = stats.hourlyTrends[hr] || 0;
      const heightPercent = (count / peakMax) * 100;
      
      const hrFormatted = hr > 12 ? `${hr-12} PM` : hr === 12 ? '12 PM' : `${hr} AM`;
      const isPeak = count === peakMax && count > 0;

      const col = document.createElement('div');
      col.className = `peak-hour-column ${isPeak ? 'active-peak' : ''}`;
      col.innerHTML = `
        <div class="peak-hour-fill" style="height:${heightPercent}%;"></div>
        <span class="peak-hour-tooltip">${count} orders at ${hrFormatted}</span>
        <span style="font-size:0.6rem; margin-top:4px; color:var(--text-muted); transform: rotate(-45deg); display:inline-block; margin-bottom: 2px;">${hrFormatted}</span>
      `;
      peakContainer.appendChild(col);
    }

    // Render SVG Line Chart representing Revenue Trend (Last 7 Days)
    renderRevenueLineChart(stats.dailyTrend);
  }

  // Draw a responsive SVG Line Chart dynamically
  function renderRevenueLineChart(trendData) {
    const container = document.getElementById('revenue-trend-chart-container');
    container.innerHTML = '';

    if (trendData.length === 0) return;

    // Calculate max value for scaling
    const maxVal = Math.max(...trendData.map(d => d.revenue), 100);
    
    // SVG Dimensions
    const width = 500;
    const height = 220;
    const padding = 35;
    
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Map data to coordinates
    const points = trendData.map((d, index) => {
      const x = padding + (index * (chartWidth / (trendData.length - 1)));
      const y = padding + chartHeight - (d.revenue / maxVal * chartHeight);
      return { x, y, val: d.revenue, label: d.date };
    });

    // Create Path definitions
    let dPath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      dPath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Create Gradient fill path (for modern area look)
    let dAreaPath = `${dPath} L ${points[points.length-1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    // Render SVG elements string
    let svgContent = `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        <line x1="${padding}" y1="${padding + chartHeight/2}" x2="${width - padding}" y2="${padding + chartHeight/2}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>

        <!-- Y Axis Markers -->
        <text x="${padding - 8}" y="${padding + 4}" fill="#6b7280" font-size="9" text-anchor="end">₹${maxVal}</text>
        <text x="${padding - 8}" y="${padding + chartHeight/2 + 4}" fill="#6b7280" font-size="9" text-anchor="end">₹${Math.round(maxVal/2)}</text>
        <text x="${padding - 8}" y="${height - padding + 4}" fill="#6b7280" font-size="9" text-anchor="end">₹0</text>

        <!-- Area Gradient Fill -->
        <path d="${dAreaPath}" fill="url(#areaGrad)"/>

        <!-- Stroke Trend Line -->
        <path d="${dPath}" fill="none" stroke="url(#strokeGrad)" stroke-width="3" stroke-linecap="round"/>

        <!-- Points Dots & Hover Labels -->
    `;

    points.forEach(pt => {
      svgContent += `
        <!-- Dot -->
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="#a855f7" stroke="white" stroke-width="1.5"/>
        <!-- Value text above dot -->
        <text x="${pt.x}" y="${pt.y - 8}" fill="#f3f4f6" font-size="9" font-weight="700" text-anchor="middle">₹${pt.val}</text>
        <!-- X Axis Label -->
        <text x="${pt.x}" y="${height - padding + 16}" fill="#9ca3af" font-size="9" font-weight="500" text-anchor="middle">${pt.label}</text>
      `;
    });

    svgContent += `</svg>`;
    container.innerHTML = svgContent;
  }

  // 8.2 Admin Canteens list CRUD
  function renderAdminCanteens() {
    const tbody = document.getElementById('adm-canteens-tbody');
    tbody.innerHTML = '';

    const list = window.db.getCanteens();
    list.forEach(c => {
      const tr = document.createElement('tr');
      
      const toggleLabel = c.status === 'Active' ? 'Deactivate 🛑' : 'Reactivate 🟢';
      const statusBadge = c.status === 'Active'
        ? `<span class="badge" style="background-color:rgba(16,185,129,0.15); color:var(--success); font-weight:bold;">Active</span>`
        : `<span class="badge" style="background-color:rgba(239,68,68,0.15); color:var(--danger); font-weight:bold;">Inactive</span>`;

      tr.innerHTML = `
        <td style="font-weight:700;">${c.id}</td>
        <td style="font-weight:600;">${c.name}</td>
        <td>${c.location}</td>
        <td>${c.manager}</td>
        <td>${c.phone}</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline btn-edit-canteen" data-canteen-id="${c.id}">Edit</button>
            <button class="btn btn-sm btn-outline btn-toggle-canteen" data-canteen-id="${c.id}">${toggleLabel}</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit-canteen').forEach(btn => {
      btn.addEventListener('click', () => showCanteenModal(btn.dataset.canteenId));
    });

    tbody.querySelectorAll('.btn-toggle-canteen').forEach(btn => {
      btn.addEventListener('click', () => {
        window.db.toggleCanteenStatus(btn.dataset.canteenId);
        showToast('Canteen operational status toggled.', 'success');
        renderAdminCanteens();
        populateManagerCanteenDropdown(); // Re-sync login select
      });
    });
  }

  // CANTEEN ADD/EDIT MODAL
  const canteenModal = document.getElementById('canteen-modal');
  
  document.getElementById('btn-add-canteen-modal').addEventListener('click', () => {
    showCanteenModal(); // Add Mode
  });

  function showCanteenModal(canteenId = null) {
    const title = document.getElementById('canteen-modal-title');
    const form = document.getElementById('canteen-item-form');
    
    form.reset();
    document.getElementById('canteen-id-field').value = '';

    if (canteenId) {
      title.textContent = 'Edit Canteen Facility Details';
      const c = window.db.getCanteenById(canteenId);
      if (c) {
        document.getElementById('canteen-id-field').value = c.id;
        document.getElementById('canteen-name-input').value = c.name;
        document.getElementById('canteen-location-input').value = c.location;
        document.getElementById('canteen-manager-input').value = c.manager;
        document.getElementById('canteen-phone-input').value = c.phone;
      }
    } else {
      title.textContent = 'Register New Campus Canteen';
    }
    canteenModal.classList.add('active');
  }

  document.getElementById('btn-close-canteen-modal').addEventListener('click', () => canteenModal.classList.remove('active'));
  document.getElementById('btn-cancel-canteen-modal').addEventListener('click', () => canteenModal.classList.remove('active'));

  document.getElementById('canteen-item-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('canteen-id-field').value;
    const name = document.getElementById('canteen-name-input').value.trim();
    const location = document.getElementById('canteen-location-input').value.trim();
    const manager = document.getElementById('canteen-manager-input').value.trim();
    const phone = document.getElementById('canteen-phone-input').value.trim();

    const data = { name, location, manager, phone };
    if (id) data.id = id;

    window.db.saveCanteen(data);
    canteenModal.classList.remove('active');
    renderAdminCanteens();
    populateManagerCanteenDropdown(); // Sync login
    showToast('Canteen configuration saved.', 'success');
  });

  // 8.3 Student list directory
  function renderAdminStudents() {
    const tbody = document.getElementById('adm-students-tbody');
    tbody.innerHTML = '';

    const list = window.db.getStudents();
    list.forEach(s => {
      const tr = document.createElement('tr');
      
      const toggleLabel = s.status === 'Active' ? 'Block Account 🛑' : 'Unblock Account 🟢';
      const statusBadge = s.status === 'Active'
        ? `<span class="badge" style="background-color:rgba(16,185,129,0.15); color:var(--success); font-weight:bold;">Active</span>`
        : `<span class="badge" style="background-color:rgba(239,68,68,0.15); color:var(--danger); font-weight:bold;">Blocked</span>`;

      tr.innerHTML = `
        <td style="font-weight:700;">${s.id}</td>
        <td style="font-weight:600;">${s.name}</td>
        <td>${s.department} (${s.year} Year)</td>
        <td>${s.mobile}</td>
        <td>${s.email}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline btn-block btn-toggle-student" data-student-id="${s.id}">${toggleLabel}</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-toggle-student').forEach(btn => {
      btn.addEventListener('click', () => {
        window.db.toggleStudentStatus(btn.dataset.studentId);
        showToast('Student account security permissions toggled.', 'warning');
        renderAdminStudents();
      });
    });
  }

  // 8.4 Broadcast Global Alert announcements
  function renderBroadcastLog() {
    const container = document.getElementById('broadcast-log-list');
    container.innerHTML = '';

    broadcasts.sort((a,b) => b.timestamp - a.timestamp).forEach(b => {
      const card = document.createElement('div');
      card.className = `broadcast-log-card border-${b.type}`;
      
      const timeStr = new Date(b.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <button class="delete-broadcast-btn" data-broadcast-id="${b.id}" style="position:absolute; top:8px; right:8px;">&times;</button>
        <div class="broadcast-log-header">
          <span style="text-transform:uppercase; font-size:0.7rem; font-weight:bold;">Badge: ${b.type}</span>
          <span>${timeStr}</span>
        </div>
        <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary); margin-bottom:4px;">${b.title}</div>
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${b.message}</p>
      `;
      
      card.querySelector('.delete-broadcast-btn').addEventListener('click', () => {
        broadcasts = broadcasts.filter(item => item.id !== b.id);
        renderBroadcastLog();
        showToast('Broadcast deleted.', 'warning');
      });

      container.appendChild(card);
    });
  }

  document.getElementById('admin-broadcast-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('broadcast-title').value.trim();
    const message = document.getElementById('broadcast-message').value.trim();
    const type = document.getElementById('broadcast-type').value;

    const bc = {
      id: 'BC00' + (broadcasts.length + 1),
      title,
      message,
      type,
      timestamp: Date.now()
    };

    broadcasts.push(bc);
    document.getElementById('admin-broadcast-form').reset();
    renderBroadcastLog();
    
    // Fire global toast & sound
    showToast(`📢 Announcement: ${title}`, 'info');
    playNotificationSound('alert');
    
    // If student active, trigger banner reload
    if (state.currentRole === 'student') {
      renderStudentAlertBanner();
    }
  });

  // 8.5 Admin Report Center
  function populateReportCanteenDropdown() {
    const dropdown = document.getElementById('report-canteen');
    dropdown.innerHTML = '<option value="all">All Canteens</option>';
    window.db.getCanteens().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      dropdown.appendChild(opt);
    });
  }

  function resetReportForm() {
    document.getElementById('report-range').value = 'today';
    document.getElementById('report-canteen').value = 'all';
    document.getElementById('report-preview-section').classList.add('hidden');
    document.getElementById('btn-export-csv').disabled = true;
    document.getElementById('btn-export-pdf').disabled = true;
  }

  // Generate report list
  document.getElementById('btn-generate-report').addEventListener('click', () => {
    const timeline = document.getElementById('report-range').value;
    const canteenId = document.getElementById('report-canteen').value;

    let orders = window.db.getOrders().filter(o => o.status === 'Completed');
    
    // Filter by canteen
    if (canteenId !== 'all') {
      orders = orders.filter(o => o.canteenId === canteenId);
    }

    // Filter by date
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (timeline === 'today') {
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      orders = orders.filter(o => o.timestamp >= startOfToday);
    } else if (timeline === 'week') {
      orders = orders.filter(o => o.timestamp >= (now - 7 * oneDay));
    } else if (timeline === 'month') {
      orders = orders.filter(o => o.timestamp >= (now - 30 * oneDay));
    }

    const canteens = window.db.getCanteens();
    const students = window.db.getStudents();
    const details = window.db.get('orderDetails');
    const menuItems = window.db.getFoodItems();

    // Map fields
    const records = orders.map(o => {
      const canteen = canteens.find(c => c.id === o.canteenId);
      const student = students.find(s => s.id === o.studentId);
      const detailsList = details.filter(d => d.orderId === o.id);
      
      const itemsStr = detailsList.map(d => {
        const item = menuItems.find(mi => mi.id === d.itemId);
        return `${item ? item.name : 'Food'} (x${d.quantity})`;
      }).join('; ');

      return {
        id: o.id,
        timestamp: o.timestamp,
        canteen: canteen ? canteen.name : 'Unknown Canteen',
        studentName: student ? student.name : 'Student',
        payment: o.paymentMethod,
        items: itemsStr,
        total: o.totalAmount
      };
    });

    state.lastGeneratedReport = records;

    // Render Preview
    const tbody = document.getElementById('report-preview-tbody');
    tbody.innerHTML = '';

    document.getElementById('report-preview-count').textContent = `${records.length} Records Found`;

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No completed sales transactions found for selected filter criteria.</td></tr>';
      document.getElementById('btn-export-csv').disabled = true;
      document.getElementById('btn-export-pdf').disabled = true;
    } else {
      records.forEach(r => {
        const tr = document.createElement('tr');
        const dt = new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        tr.innerHTML = `
          <td style="font-weight:700;">${r.id}</td>
          <td>${dt}</td>
          <td>${r.canteen}</td>
          <td>${r.studentName}</td>
          <td>${r.payment}</td>
          <td style="font-size:0.75rem; color:var(--text-secondary); max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.items}</td>
          <td style="font-weight:700;">₹${r.total}</td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('btn-export-csv').disabled = false;
      document.getElementById('btn-export-pdf').disabled = false;
    }

    document.getElementById('report-preview-section').classList.remove('hidden');
    showToast(`Generated report with ${records.length} records.`, 'success');
  });

  // Client Side CSV Export helper
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    if (state.lastGeneratedReport.length === 0) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'Order ID,Date/Time,Canteen Facility,Student Customer,Payment,Items list,Total Amount (INR)\n';

    state.lastGeneratedReport.forEach(r => {
      const dt = new Date(r.timestamp).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      csvContent += `${r.id},${dt},"${r.canteen}","${r.studentName}",${r.payment},"${r.items.replace(/"/g, '""')}",${r.total}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `campus_canteen_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Excel/CSV Sheet downloaded.', 'success');
  });

  // Client Side PDF Report Download helper
  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    if (state.lastGeneratedReport.length === 0) return;

    let txtContent = '==========================================================\n';
    txtContent += '       CAMPUS SYSTEM - FINANCIAL REVENUE LEDGER      \n';
    txtContent += `       Report Range: Generated at ${new Date().toLocaleString()}\n`;
    txtContent += '==========================================================\n\n';
    
    txtContent += 'Order ID  | Timestamp            | Canteen Name         | Student Name | Pay | Total\n';
    txtContent += '------------------------------------------------------------------------------------------\n';
    
    let grandTotal = 0;
    state.lastGeneratedReport.forEach(r => {
      grandTotal += r.total;
      const idStr = r.id.padEnd(9);
      const dt = new Date(r.timestamp).toLocaleDateString().padEnd(20);
      const canteen = r.canteen.substring(0, 20).padEnd(20);
      const name = r.studentName.substring(0, 12).padEnd(12);
      const pay = r.payment.padEnd(3);
      const total = ('₹' + r.total).padEnd(5);
      txtContent += `${idStr} | ${dt} | ${canteen} | ${name} | ${pay} | ${total}\n`;
      txtContent += `  Items: ${r.items}\n`;
      txtContent += '------------------------------------------------------------------------------------------\n';
    });

    txtContent += `\nSUMMARY TOTAL VALUE FULFILLED: ₹${grandTotal}\n`;
    txtContent += '==========================================================\n';
    txtContent += 'End of Campus Revenue Ledger Sheet.\n';

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `campus_ledger_report_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Formated text PDF Ledger downloaded.', 'success');
  });


  // --- 9. PUBLIC TOKEN BOARD DISPLAY VIEW CONTROLS ---
  const boardModal = document.getElementById('display-board-overlay');
  
  document.getElementById('header-btn-display').addEventListener('click', () => {
    updateDisplayBoardData();
    boardModal.classList.add('active');
    
    // Start live clock
    state.boardClockTimer = setInterval(() => {
      const clock = document.getElementById('display-board-time');
      if (clock) {
        clock.textContent = new Date().toLocaleTimeString();
      }
    }, 1000);
  });

  document.getElementById('btn-close-display').addEventListener('click', () => {
    boardModal.classList.remove('active');
    clearInterval(state.boardClockTimer);
  });

  function updateDisplayBoardData() {
    const containerPrep = document.getElementById('display-preparing-tokens');
    const containerReady = document.getElementById('display-ready-tokens');

    containerPrep.innerHTML = '';
    containerReady.innerHTML = '';

    const orders = window.db.getOrders();
    
    const preparing = orders.filter(o => ['Placed', 'Accepted', 'Preparing'].includes(o.status));
    const ready = orders.filter(o => o.status === 'Ready');

    if (preparing.length === 0) {
      containerPrep.innerHTML = '<div style="font-size:1.15rem; color:var(--text-muted); margin-top:20px;">No pending items.</div>';
    } else {
      preparing.forEach(o => {
        const card = document.createElement('div');
        card.className = 'display-token-card';
        card.textContent = o.token;
        containerPrep.appendChild(card);
      });
    }

    if (ready.length === 0) {
      containerReady.innerHTML = '<div style="font-size:1.15rem; color:var(--text-muted); margin-top:20px;">Counter clear.</div>';
    } else {
      ready.forEach(o => {
        const card = document.createElement('div');
        card.className = 'display-token-card';
        card.textContent = o.token;
        containerReady.appendChild(card);
      });
    }
  }


  // --- 10. DEVELOPER FLOATING BYPASS SWITCHER ---
  const switcherBtn = document.getElementById('switcher-toggle-btn');
  const switcherMenu = document.getElementById('switcher-menu');

  switcherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    switcherMenu.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    switcherMenu.classList.remove('active');
  });

  switcherMenu.querySelectorAll('.switcher-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      switcherMenu.classList.remove('active');
      const targetRole = btn.dataset.targetRole;
      
      // Seed default profiles for bypass
      if (targetRole === 'student') {
        const student = window.db.getStudentById('STU001');
        switchRoleView('student', student);
      } else if (targetRole === 'manager') {
        const canteen = window.db.getCanteenById('CAN001');
        switchRoleView('manager', canteen);
      } else if (targetRole === 'admin') {
        switchRoleView('admin');
      }
    });
  });


  // --- 11. INITIAL APP RENDERING SEED BOOTSTRAP ---
  // Default initialization - show login card tab student
  document.getElementById('tab-student').click();
  showToast('Digital Food Court Loaded.', 'info');
});
