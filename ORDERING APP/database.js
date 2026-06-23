/**
 * Campus Food Ordering System - Data Layer
 * Handles relational storage, CRUD operations, transactions, seed data, and analytics.
 * Fully backed by localStorage for persistent mock state.
 */

// Helper to generate inline SVGs for food items to avoid broken external links
const FOOD_SVGS = {
  burger: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23FFFAF0"/><path d="M20 50c0-15 10-25 30-25s30 10 30 25H20z" fill="%23D2691E"/><path d="M15 50h70v8H15z" fill="%23FFD700"/><path d="M18 58c3-2 7 2 10 0s7-2 10 0 7 2 10 0 7-2 10 0 7 2 10 0 4-2 7 0v4H18v-4z" fill="%2332CD32"/><path d="M18 64h64c0 10-10 16-32 16S18 74 18 64z" fill="%238B4513"/><path d="M40 32a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm15 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm13-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill="%23FFE4B5"/></svg>`,
  pizza: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23FFF5EE"/><path d="M50 15c20 0 35 15 35 35S70 85 50 85 15 70 15 50 30 15 50 15z" fill="%23CD853F"/><path d="M50 20c17 0 30 13 30 30S67 80 50 80 20 67 20 50 33 20 50 20z" fill="%23FFD700"/><path d="M50 20L50 50 L20 50 A 30 30 0 0 1 50 20" fill="%23FF6347"/><path d="M35 32a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm28 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 23a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-22-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="%238B0000"/><circle cx="50" cy="50" r="3" fill="%23556B2F"/><circle cx="40" cy="45" r="2.5" fill="%23556B2F"/><circle cx="55" cy="35" r="2" fill="%23556B2F"/></svg>`,
  sandwich: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23FDF5E6"/><path d="M15 70L50 20L85 70Z" fill="%23DEB887"/><path d="M18 72L50 25L82 72Z" fill="%23CD853F"/><path d="M22 68L50 32L78 68Z" fill="%23FFA500"/><path d="M20 68h60L50 35z" fill="%23FFD700"/><path d="M16 65c4-2 8 2 12 0s8-2 12 0 8 2 12 0 8-2 12 0 8 2 12 0v4H16v-4z" fill="%23228B22"/><path d="M20 60h60v5H20z" fill="%238B0000"/></svg>`,
  noodles: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23F5F5DC"/><path d="M20 50c0 15 10 25 30 25s30-10 30-25H20z" fill="%23FF6347"/><path d="M25 48c0 0 5-15 15-5s10-20 20-5 15-15 15-15" fill="none" stroke="%23F4A460" stroke-width="4" stroke-linecap="round"/><path d="M30 46c2-8 7-8 12-2s12-12 18-2 10-10 15-6" fill="none" stroke="%23FFA500" stroke-width="3" stroke-linecap="round"/><path d="M35 45c0 0 8-20 15-5s8-12 18-5" fill="none" stroke="%23F4A460" stroke-width="4.5" stroke-linecap="round"/><path d="M28 50h44c0 10-8 18-22 18S28 60 28 50z" fill="%23CD5C5C"/><circle cx="45" cy="35" r="5" fill="%238B0000"/><circle cx="58" cy="40" r="5" fill="%238B0000"/><path d="M12 25l45 10" fill="none" stroke="%23D2691E" stroke-width="4"/><path d="M88 22L48 37" fill="none" stroke="%23D2691E" stroke-width="4"/></svg>`,
  meals: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23FFF8DC"/><circle cx="50" cy="50" r="38" fill="%23B8860B"/><circle cx="50" cy="50" r="35" fill="%23A0522D"/><circle cx="50" cy="50" r="32" fill="%23228B22"/><circle cx="50" cy="50" r="14" fill="%23F5F5F5"/><circle cx="50" cy="50" r="12" fill="%23FFFDD0"/><circle cx="34" cy="36" r="8" fill="%23CD853F"/><circle cx="34" cy="36" r="7" fill="%23FF8C00"/><circle cx="66" cy="36" r="8" fill="%23D2691E"/><circle cx="66" cy="36" r="7" fill="%23FFD700"/><circle cx="32" cy="62" r="8" fill="%238B4513"/><circle cx="32" cy="62" r="7" fill="%23DEB887"/><circle cx="68" cy="62" r="8" fill="%23008080"/><circle cx="68" cy="62" r="7" fill="%2300FFFF"/></svg>`,
  juice: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23F0FFF0"/><path d="M35 30h30l-5 45H40z" fill="none" stroke="%23778899" stroke-width="3"/><path d="M37 35h26l-4 35H41z" fill="%23FF8C00"/><path d="M60 20L45 55" fill="none" stroke="%23FF6347" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="%23FFD700" opacity="0.8"/><path d="M37 32h26v3H37z" fill="%23B0C4DE"/><path d="M42 75h16v4H42z" fill="%23778899"/></svg>`,
  coffee: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23FAF0E6"/><path d="M30 35h32c0 0 3 15 3 20 0 12-10 15-19 15s-19-3-19-15c0-5 3-20 3-20z" fill="%238B4513"/><path d="M62 40h8c5 0 8 3 8 8s-3 8-8 8h-8" fill="none" stroke="%238B4513" stroke-width="5" stroke-linecap="round"/><path d="M26 75h40v4H26z" fill="%23A0522D"/><path d="M38 25c1-3-1-7 1-10m8 10c1-3-1-7 1-10m8 10c1-3-1-7 1-10" fill="none" stroke="%23888" stroke-width="2" stroke-linecap="round"/></svg>`,
  salad: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="15" fill="%23F5FFFA"/><path d="M20 50c0 15 12 25 30 25s30-10 30-25v-3H20v3z" fill="%23D2691E"/><circle cx="35" cy="40" r="10" fill="%2332CD32"/><circle cx="65" cy="42" r="9" fill="%23228B22"/><circle cx="50" cy="36" r="11" fill="%237CFC00"/><circle cx="45" cy="46" r="6" fill="%23FF6347"/><circle cx="56" cy="45" r="7" fill="%23FFD700"/><circle cx="32" cy="48" r="5" fill="%23FF6347"/><path d="M38 35c2-2 5 2 8 0" fill="none" stroke="%238B0000" stroke-width="2"/><circle cx="50" cy="52" r="3.5" fill="%23556B2F"/></svg>`
};

class Database {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('campus_db_seeded')) {
      this.seed();
    }
  }

  // Pre-seed tables with extensive realistic data
  seed() {
    // 1. Students
    const students = [
      { id: 'STU001', name: 'Arun Kumar', department: 'Computer Science', year: 'III', mobile: '9876543210', email: 'arun.cse@campus.edu', status: 'Active' },
      { id: 'STU002', name: 'Priya Dharshini', department: 'Information Technology', year: 'IV', mobile: '9876543211', email: 'priya.it@campus.edu', status: 'Active' },
      { id: 'STU003', name: 'Sanjay Ram', department: 'Electronics & Communication', year: 'II', mobile: '9876543212', email: 'sanjay.ece@campus.edu', status: 'Active' },
      { id: 'STU004', name: 'Divya Bharathi', department: 'Electrical & Electronics', year: 'III', mobile: '9876543213', email: 'divya.eee@campus.edu', status: 'Active' },
      { id: 'STU005', name: 'Rahul R', department: 'Mechanical Engineering', year: 'I', mobile: '9876543214', email: 'rahul.mech@campus.edu', status: 'Blocked' }
    ];

    // 2. Canteens
    const canteens = [
      { id: 'CAN001', name: 'Classic Food Court', location: 'Main Block - Ground Floor', manager: 'Mr. Ramesh', phone: '9443218765', status: 'Active' },
      { id: 'CAN002', name: 'Spicy Corner', location: 'Open Cafeteria - Near Gym', manager: 'Mr. John', phone: '9443218766', status: 'Active' },
      { id: 'CAN003', name: 'Healthy & Fresh', location: 'Sports Complex Annex', manager: 'Mrs. Geetha', phone: '9443218767', status: 'Active' }
    ];

    // 3. Food Items
    const foodItems = [
      // CAN001: Classic Food Court
      { id: 'FOOD101', canteenId: 'CAN001', name: 'South Indian Meals', category: 'Meals', price: 80, prepTime: 5, image: FOOD_SVGS.meals, status: 'Available', isSpecial: true, popularityScore: 92, description: 'Unlimited rice with sambar, rasam, kootu, poriyal, appalam, and buttermilk.' },
      { id: 'FOOD102', canteenId: 'CAN001', name: 'Sambar Vada (2 Pcs)', category: 'Snacks', price: 35, prepTime: 3, image: FOOD_SVGS.meals, status: 'Available', isSpecial: false, popularityScore: 85, description: 'Crispy deep-fried lentil donuts soaked in hot, delicious traditional sambar.' },
      { id: 'FOOD103', canteenId: 'CAN001', name: 'Filter Coffee', category: 'Drinks', price: 20, prepTime: 3, image: FOOD_SVGS.coffee, status: 'Available', isSpecial: true, popularityScore: 95, description: 'Strong, aromatic South Indian filter coffee brewed with fresh milk.' },
      { id: 'FOOD104', canteenId: 'CAN001', name: 'Veg Sandwich', category: 'Snacks', price: 45, prepTime: 6, image: FOOD_SVGS.sandwich, status: 'TempUnavailable', isSpecial: false, popularityScore: 64, description: 'Healthy bread sandwich stuffed with cucumber, tomato, potato and mint chutney.' },

      // CAN002: Spicy Corner
      { id: 'FOOD201', canteenId: 'CAN002', name: 'Crispy Veg Burger', category: 'Fast Food', price: 75, prepTime: 10, image: FOOD_SVGS.burger, status: 'Available', isSpecial: true, popularityScore: 98, description: 'Crunchy potato-pea patty topped with mayonnaise, lettuce, onion, and juicy tomato slices.' },
      { id: 'FOOD202', canteenId: 'CAN002', name: 'Schezwan Noodles', category: 'Fast Food', price: 90, prepTime: 12, image: FOOD_SVGS.noodles, status: 'Available', isSpecial: false, popularityScore: 89, description: 'Spicy and tangy noodles stir-fried with seasonal veggies and hot Schezwan sauce.' },
      { id: 'FOOD203', canteenId: 'CAN002', name: 'Paneer Onion Pizza (7")', category: 'Fast Food', price: 130, prepTime: 15, image: FOOD_SVGS.pizza, status: 'Available', isSpecial: true, popularityScore: 91, description: 'Freshly baked hand-tossed base topped with spiced cottage cheese, onions, and lots of mozzarella.' },
      { id: 'FOOD204', canteenId: 'CAN002', name: 'Cold Chocolate Milkshake', category: 'Drinks', price: 50, prepTime: 5, image: FOOD_SVGS.coffee, status: 'OutOfStock', isSpecial: false, popularityScore: 78, description: 'Chilled milkshake blended with rich cocoa powder, vanilla ice cream, and chocolate syrup.' },

      // CAN003: Healthy & Fresh
      { id: 'FOOD301', canteenId: 'CAN003', name: 'Protein Fruit Salad', category: 'Salad', price: 70, prepTime: 5, image: FOOD_SVGS.salad, status: 'Available', isSpecial: true, popularityScore: 88, description: 'Assorted seasonal fresh fruits tossed with sprouted green grams, honey, and chia seeds.' },
      { id: 'FOOD302', canteenId: 'CAN003', name: 'Fresh Orange Juice', category: 'Drinks', price: 40, prepTime: 4, image: FOOD_SVGS.juice, status: 'Available', isSpecial: false, popularityScore: 90, description: '100% natural, freshly squeezed orange juice rich in Vitamin C, served chilled (No added sugar).' },
      { id: 'FOOD303', canteenId: 'CAN003', name: 'Sprout & Corn Sandwich', category: 'Snacks', price: 60, prepTime: 7, image: FOOD_SVGS.sandwich, status: 'Available', isSpecial: true, popularityScore: 84, description: 'Grilled multigrain sandwich packed with boiled sweet corn, sprouts, and low-fat cheese spread.' }
    ];

    // 4. Past Orders (Seeding 10 mock orders over the last 3 days to populate analytics)
    const baseTime = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    const orders = [
      {
        id: 'ORD1001',
        studentId: 'STU001',
        canteenId: 'CAN001',
        totalAmount: 180, // 2x Meals ($160) + 1x Coffee ($20)
        status: 'Completed',
        timestamp: baseTime - 2 * oneDay - 3 * oneHour,
        pickupTime: 'Immediate',
        paymentMethod: 'UPI',
        token: 101,
        fulfillmentTimeMins: 7
      },
      {
        id: 'ORD1002',
        studentId: 'STU002',
        canteenId: 'CAN002',
        totalAmount: 280, // 2x Pizza ($260) + Promo Discount
        status: 'Completed',
        timestamp: baseTime - 2 * oneDay - 1.5 * oneHour,
        pickupTime: '12:45 PM',
        paymentMethod: 'UPI',
        token: 102,
        fulfillmentTimeMins: 14
      },
      {
        id: 'ORD1003',
        studentId: 'STU003',
        canteenId: 'CAN003',
        totalAmount: 110, // 1x Salad ($70) + 1x Orange Juice ($40)
        status: 'Completed',
        timestamp: baseTime - oneDay - 4 * oneHour,
        pickupTime: 'Immediate',
        paymentMethod: 'Cash',
        token: 103,
        fulfillmentTimeMins: 6
      },
      {
        id: 'ORD1004',
        studentId: 'STU004',
        canteenId: 'CAN001',
        totalAmount: 80, // 1x Meals ($80)
        status: 'Completed',
        timestamp: baseTime - oneDay - 2.5 * oneHour,
        pickupTime: '01:15 PM',
        paymentMethod: 'UPI',
        token: 104,
        fulfillmentTimeMins: 9
      },
      {
        id: 'ORD1005',
        studentId: 'STU001',
        canteenId: 'CAN002',
        totalAmount: 165, // 1x Burger ($75) + 1x Noodles ($90)
        status: 'Completed',
        timestamp: baseTime - oneDay - 0.5 * oneHour,
        pickupTime: 'Immediate',
        paymentMethod: 'Cash',
        token: 105,
        fulfillmentTimeMins: 11
      },
      {
        id: 'ORD1006',
        studentId: 'STU002',
        canteenId: 'CAN003',
        totalAmount: 170, // 2x Salad ($140) + 1x Orange Juice ($40) - $10 Promo
        status: 'Completed',
        timestamp: baseTime - 5 * oneHour,
        pickupTime: 'Immediate',
        paymentMethod: 'UPI',
        token: 106,
        fulfillmentTimeMins: 5
      },
      {
        id: 'ORD1007',
        studentId: 'STU003',
        canteenId: 'CAN001',
        totalAmount: 100, // 5x Filter Coffee ($100)
        status: 'Completed',
        timestamp: baseTime - 3 * oneHour,
        pickupTime: 'Immediate',
        paymentMethod: 'Cash',
        token: 107,
        fulfillmentTimeMins: 4
      },
      {
        id: 'ORD1008',
        studentId: 'STU004',
        canteenId: 'CAN002',
        totalAmount: 150, // 2x Burger ($150)
        status: 'Ready', // Live order ready
        timestamp: baseTime - 25 * 60 * 1000, // 25 mins ago
        pickupTime: 'Immediate',
        paymentMethod: 'UPI',
        token: 108
      },
      {
        id: 'ORD1009',
        studentId: 'STU001',
        canteenId: 'CAN002',
        totalAmount: 90, // 1x Noodles ($90)
        status: 'Preparing', // Live order preparing
        timestamp: baseTime - 15 * 60 * 1000, // 15 mins ago
        pickupTime: '01:30 PM',
        paymentMethod: 'UPI',
        token: 109
      },
      {
        id: 'ORD1010',
        studentId: 'STU002',
        canteenId: 'CAN001',
        totalAmount: 115, // 1x Meals ($80) + 1x Vada ($35)
        status: 'Placed', // Live order newly placed
        timestamp: baseTime - 5 * 60 * 1000, // 5 mins ago
        pickupTime: 'Immediate',
        paymentMethod: 'Cash',
        token: 110
      }
    ];

    // 5. Order Details
    const orderDetails = [
      { id: 'OD1001_1', orderId: 'ORD1001', itemId: 'FOOD101', quantity: 2, priceAtPurchase: 80 },
      { id: 'OD1001_2', orderId: 'ORD1001', itemId: 'FOOD103', quantity: 1, priceAtPurchase: 20 },

      { id: 'OD1002_1', orderId: 'ORD1002', itemId: 'FOOD203', quantity: 2, priceAtPurchase: 130 },
      { id: 'OD1002_2', orderId: 'ORD1002', itemId: 'FOOD204', quantity: 1, priceAtPurchase: 50 }, // Out of stock now but bought in past

      { id: 'OD1003_1', orderId: 'ORD1003', itemId: 'FOOD301', quantity: 1, priceAtPurchase: 70 },
      { id: 'OD1003_2', orderId: 'ORD1003', itemId: 'FOOD302', quantity: 1, priceAtPurchase: 40 },

      { id: 'OD1004_1', orderId: 'ORD1004', itemId: 'FOOD101', quantity: 1, priceAtPurchase: 80 },

      { id: 'OD1005_1', orderId: 'ORD1005', itemId: 'FOOD201', quantity: 1, priceAtPurchase: 75 },
      { id: 'OD1005_2', orderId: 'ORD1005', itemId: 'FOOD202', quantity: 1, priceAtPurchase: 90 },

      { id: 'OD1006_1', orderId: 'ORD1006', itemId: 'FOOD301', quantity: 2, priceAtPurchase: 70 },
      { id: 'OD1006_2', orderId: 'ORD1006', itemId: 'FOOD302', quantity: 1, priceAtPurchase: 40 },

      { id: 'OD1007_1', orderId: 'ORD1007', itemId: 'FOOD103', quantity: 5, priceAtPurchase: 20 },

      { id: 'OD1008_1', orderId: 'ORD1008', itemId: 'FOOD201', quantity: 2, priceAtPurchase: 75 },

      { id: 'OD1009_1', orderId: 'ORD1009', itemId: 'FOOD202', quantity: 1, priceAtPurchase: 90 },

      { id: 'OD1010_1', orderId: 'ORD1010', itemId: 'FOOD101', quantity: 1, priceAtPurchase: 80 },
      { id: 'OD1010_2', orderId: 'ORD1010', itemId: 'FOOD102', quantity: 1, priceAtPurchase: 35 }
    ];

    // 6. Reviews
    const reviews = [
      { id: 'REV001', orderId: 'ORD1001', studentId: 'STU001', canteenId: 'CAN001', rating: 5, comment: 'Sambar and rasam tasted like home. Truly amazing filter coffee!', timestamp: baseTime - 2 * oneDay },
      { id: 'REV002', orderId: 'ORD1002', studentId: 'STU002', canteenId: 'CAN002', rating: 4, comment: 'Pizza was cheesy and fresh. Cold cocoa could have been thicker.', timestamp: baseTime - 2 * oneDay },
      { id: 'REV003', orderId: 'ORD1003', studentId: 'STU003', canteenId: 'CAN003', rating: 5, comment: 'Perfect healthy break option. Orange juice was extremely fresh.', timestamp: baseTime - oneDay },
      { id: 'REV004', orderId: 'ORD1005', studentId: 'STU001', canteenId: 'CAN002', rating: 5, comment: 'Love the Schezwan noodles! Crispy veg burger is highly recommended.', timestamp: baseTime - 12 * oneHour }
    ];

    // Save to localStorage
    localStorage.setItem('campus_students', JSON.stringify(students));
    localStorage.setItem('campus_canteens', JSON.stringify(canteens));
    localStorage.setItem('campus_foodItems', JSON.stringify(foodItems));
    localStorage.setItem('campus_orders', JSON.stringify(orders));
    localStorage.setItem('campus_orderDetails', JSON.stringify(orderDetails));
    localStorage.setItem('campus_reviews', JSON.stringify(reviews));
    localStorage.setItem('campus_token_counter', '110'); // Last token used
    localStorage.setItem('campus_db_seeded', 'true');
  }

  // Generic localStorage Getters & Setters
  get(key) {
    return JSON.parse(localStorage.getItem(`campus_${key}`)) || [];
  }

  set(key, data) {
    localStorage.setItem(`campus_${key}`, JSON.stringify(data));
    // Trigger custom window event to notify active view routers of change
    window.dispatchEvent(new CustomEvent('campus_db_update', { detail: { table: key } }));
  }

  // STUDENTS METHODS
  getStudents() { return this.get('students'); }
  getStudentById(id) { return this.getStudents().find(s => s.id === id); }
  saveStudent(student) {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === student.id);
    if (idx !== -1) list[idx] = student;
    else list.push(student);
    this.set('students', list);
  }
  toggleStudentStatus(id) {
    const student = this.getStudentById(id);
    if (student) {
      student.status = student.status === 'Active' ? 'Blocked' : 'Active';
      this.saveStudent(student);
    }
  }

  // CANTEENS METHODS
  getCanteens() { return this.get('canteens'); }
  getCanteenById(id) { return this.getCanteens().find(c => c.id === id); }
  saveCanteen(canteen) {
    const list = this.getCanteens();
    const idx = list.findIndex(c => c.id === canteen.id);
    if (idx !== -1) list[idx] = canteen;
    else {
      canteen.id = 'CAN' + String(list.length + 1).padStart(3, '0');
      canteen.status = 'Active';
      list.push(canteen);
    }
    this.set('canteens', list);
    return canteen;
  }
  toggleCanteenStatus(id) {
    const canteen = this.getCanteenById(id);
    if (canteen) {
      canteen.status = canteen.status === 'Active' ? 'Inactive' : 'Active';
      this.saveCanteen(canteen);
    }
  }

  // FOOD ITEMS METHODS
  getFoodItems() { return this.get('foodItems'); }
  getFoodItemById(id) { return this.getFoodItems().find(f => f.id === id); }
  getFoodItemsByCanteen(canteenId) {
    return this.getFoodItems().filter(f => f.canteenId === canteenId);
  }
  saveFoodItem(item) {
    const list = this.getFoodItems();
    const idx = list.findIndex(f => f.id === item.id);
    if (idx !== -1) list[idx] = item;
    else {
      item.id = 'FOOD' + String(list.length + 1).padStart(3, '0');
      item.popularityScore = 50; // Initial score
      list.push(item);
    }
    this.set('foodItems', list);
    return item;
  }
  deleteFoodItem(id) {
    const list = this.getFoodItems().filter(f => f.id !== id);
    this.set('foodItems', list);
  }
  updateFoodItemStatus(id, status) {
    const item = this.getFoodItemById(id);
    if (item) {
      item.status = status; // 'Available', 'OutOfStock', 'TempUnavailable'
      this.saveFoodItem(item);
    }
  }

  // ORDERS METHODS
  getOrders() { return this.get('orders'); }
  getOrderById(id) { return this.getOrders().find(o => o.id === id); }
  getOrderDetailsByOrderId(orderId) {
    return this.get('orderDetails').filter(od => od.orderId === orderId);
  }
  createOrder(studentId, canteenId, cartItems, pickupTime, paymentMethod) {
    const orders = this.getOrders();
    const details = this.get('orderDetails');
    
    // Increment Token Counter
    let counter = parseInt(localStorage.getItem('campus_token_counter') || '110') + 1;
    if (counter > 999) counter = 101; // Wrap around standard tokens
    localStorage.setItem('campus_token_counter', String(counter));

    const orderId = 'ORD' + String(orders.length + 1001);
    
    let total = 0;
    cartItems.forEach(item => {
      total += item.price * item.quantity;
      details.push({
        id: `OD${orderId}_${item.id}`,
        orderId: orderId,
        itemId: item.id,
        quantity: item.quantity,
        priceAtPurchase: item.price
      });
    });

    const newOrder = {
      id: orderId,
      studentId: studentId,
      canteenId: canteenId,
      totalAmount: total,
      status: 'Placed',
      timestamp: Date.now(),
      pickupTime: pickupTime, // 'Immediate' or custom HH:MM
      paymentMethod: paymentMethod, // 'Cash' or 'UPI'
      token: counter
    };

    orders.push(newOrder);
    this.set('orders', orders);
    this.set('orderDetails', details);

    // Increment popularity of purchased items
    const foodList = this.getFoodItems();
    cartItems.forEach(item => {
      const food = foodList.find(f => f.id === item.id);
      if (food) {
        food.popularityScore = Math.min(100, (food.popularityScore || 50) + item.quantity * 2);
      }
    });
    this.set('foodItems', foodList);

    // Dispatch global toast notice for the canteen manager
    window.dispatchEvent(new CustomEvent('campus_new_order', { detail: newOrder }));

    return newOrder;
  }

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const prevStatus = order.status;
      order.status = status; // Placed, Accepted, Preparing, Ready, Completed, Cancelled
      
      // Calculate fulfillment time on completion
      if (status === 'Completed' && prevStatus === 'Ready') {
        const timeDiff = Math.round((Date.now() - order.timestamp) / (60 * 1000));
        order.fulfillmentTimeMins = Math.max(2, timeDiff);
      }
      
      this.set('orders', orders);
      
      // Dispatch status update event
      window.dispatchEvent(new CustomEvent('campus_order_status_change', { detail: order }));
    }
  }

  // REVIEWS & RATINGS
  getReviews() { return this.get('reviews'); }
  getCanteenReviews(canteenId) {
    return this.getReviews().filter(r => r.canteenId === canteenId);
  }
  addReview(orderId, rating, comment) {
    const order = this.getOrderById(orderId);
    if (!order) return;

    const reviews = this.getReviews();
    const id = 'REV' + String(reviews.length + 1).padStart(3, '0');
    
    const newReview = {
      id: id,
      orderId: orderId,
      studentId: order.studentId,
      canteenId: order.canteenId,
      rating: parseInt(rating),
      comment: comment,
      timestamp: Date.now()
    };
    
    reviews.push(newReview);
    this.set('reviews', reviews);
    return newReview;
  }

  // ANALYTICS & STATS ENGINE
  getAnalytics() {
    const orders = this.getOrders();
    const students = this.getStudents();
    const canteens = this.getCanteens();
    const foodItems = this.getFoodItems();
    const details = this.get('orderDetails');

    // Total Completed & Active Orders
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const pendingOrders = orders.filter(o => ['Placed', 'Accepted', 'Preparing', 'Ready'].includes(o.status));
    
    // 1. Gross Merchandise Value (GMV) - Total revenue from completed orders
    const gmv = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 2. Order Volume
    const totalOrdersCount = orders.length;

    // 3. User Adoption
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const totalStudents = students.length;
    const adoptionRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0;

    // 4. Average Order Value (AOV)
    const aov = completedOrders.length > 0 ? gmv / completedOrders.length : 0;

    // 5. Canteen-wise breakdown (Revenue and Volume)
    const canteenPerformance = canteens.map(c => {
      const canteenOrders = completedOrders.filter(o => o.canteenId === c.id);
      const revenue = canteenOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const count = canteenOrders.length;
      
      // Calculate average rating
      const canteenReviews = this.getCanteenReviews(c.id);
      const avgRating = canteenReviews.length > 0 
        ? canteenReviews.reduce((sum, r) => sum + r.rating, 0) / canteenReviews.length 
        : 0;

      return {
        id: c.id,
        name: c.name,
        revenue: revenue,
        orderCount: count,
        rating: parseFloat(avgRating.toFixed(1))
      };
    });

    // 6. Most Ordered Items (Join OrderDetails with FoodItems)
    const itemCounts = {};
    details.forEach(d => {
      const order = orders.find(o => o.id === d.orderId);
      if (order && order.status === 'Completed') {
        itemCounts[d.itemId] = (itemCounts[d.itemId] || 0) + d.quantity;
      }
    });

    const mostOrderedItems = Object.keys(itemCounts).map(itemId => {
      const food = foodItems.find(f => f.id === itemId);
      return {
        id: itemId,
        name: food ? food.name : 'Unknown Item',
        quantity: itemCounts[itemId],
        price: food ? food.price : 0,
        totalSales: itemCounts[itemId] * (food ? food.price : 0)
      };
    }).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    // 7. Hourly Ordering Trends (Peak Hours)
    const hourlyCounts = Array(24).fill(0);
    orders.forEach(o => {
      const hr = new Date(o.timestamp).getHours();
      hourlyCounts[hr]++;
    });

    // 8. Daily Revenue Trend for Charts (Last 7 Days)
    const dailyTrend = {};
    const oneDay = 24 * 60 * 60 * 1000;
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * oneDay).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      dailyTrend[dateStr] = 0;
    }

    completedOrders.forEach(o => {
      const dateStr = new Date(o.timestamp).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
      if (dateStr in dailyTrend) {
        dailyTrend[dateStr] += o.totalAmount;
      }
    });

    // 9. Operational Efficiency (Average Fulfillment Time in minutes)
    const ordersWithFulfillmentTime = completedOrders.filter(o => o.fulfillmentTimeMins);
    const avgFulfillmentTime = ordersWithFulfillmentTime.length > 0
      ? ordersWithFulfillmentTime.reduce((sum, o) => sum + o.fulfillmentTimeMins, 0) / ordersWithFulfillmentTime.length
      : 10; // Default estimate

    return {
      gmv,
      totalOrdersCount,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: pendingOrders.length,
      activeStudents,
      totalStudents,
      adoptionRate,
      aov,
      canteenPerformance,
      mostOrderedItems,
      hourlyTrends: hourlyCounts,
      dailyTrend: Object.keys(dailyTrend).map(date => ({ date, revenue: dailyTrend[date] })),
      avgFulfillmentTime: parseFloat(avgFulfillmentTime.toFixed(1))
    };
  }

  // Clean wipe and reseed helper
  resetDatabase() {
    localStorage.removeItem('campus_students');
    localStorage.removeItem('campus_canteens');
    localStorage.removeItem('campus_foodItems');
    localStorage.removeItem('campus_orders');
    localStorage.removeItem('campus_orderDetails');
    localStorage.removeItem('campus_reviews');
    localStorage.removeItem('campus_token_counter');
    localStorage.removeItem('campus_db_seeded');
    this.seed();
    window.dispatchEvent(new CustomEvent('campus_db_update', { detail: { table: 'all' } }));
  }
}

// Export singleton database instance
window.db = new Database();
