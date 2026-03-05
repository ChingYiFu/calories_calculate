// ── STORAGE ──────────────────────────────────
const Storage = {
  getProfile()             { return JSON.parse(localStorage.getItem('profile') || '{}'); },
  saveProfile(p)           { localStorage.setItem('profile', JSON.stringify(p)); },
  getFoodLogs(date)        { return JSON.parse(localStorage.getItem(`food_${date}`) || '[]'); },
  saveFoodLogs(d, arr)     { localStorage.setItem(`food_${d}`, JSON.stringify(arr)); },
  getExerciseLogs(d)       { return JSON.parse(localStorage.getItem(`ex_${d}`) || '[]'); },
  saveExerciseLogs(d, arr) { localStorage.setItem(`ex_${d}`, JSON.stringify(arr)); },
  addFoodLog(entry) {
    const arr = Storage.getFoodLogs(entry.date);
    arr.push(entry);
    Storage.saveFoodLogs(entry.date, arr);
  },
  addExerciseLog(entry) {
    const arr = Storage.getExerciseLogs(entry.date);
    arr.push(entry);
    Storage.saveExerciseLogs(entry.date, arr);
  }
};

// ── UTILS ────────────────────────────────────
const Utils = {
  today() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  },
  last7Days() {
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    });
  },
  last30Days() {
    return Array.from({length: 30}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    });
  }
};

// ── TOAST ────────────────────────────────────
const Toast = {
  show(msg, type = 'info') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'toast';
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2500);
  }
};

// ── ROUTER ───────────────────────────────────
const SCREENS = {
  dashboard: { component: Dashboard,        navId: 'nav-dash'     },
  food:      { component: FoodLogger,       navId: 'nav-food'     },
  exercise:  { component: ExerciseLogger,   navId: 'nav-exercise' },
  history:   { component: History,          navId: 'nav-history'  },
  profile:   { component: ProfileComponent, navId: 'nav-profile'  },
};

const App = {
  currentScreen: 'dashboard',

  init() {
    App.navigate('dashboard');
    document.getElementById('nav-dash')    .addEventListener('click', () => App.navigate('dashboard'));
    document.getElementById('nav-food')    .addEventListener('click', () => App.navigate('food'));
    document.getElementById('nav-exercise').addEventListener('click', () => App.navigate('exercise'));
    document.getElementById('nav-history') .addEventListener('click', () => App.navigate('history'));
    document.getElementById('nav-profile') .addEventListener('click', () => App.navigate('profile'));
  },

  navigate(screen) {
    App.currentScreen = screen;
    const { component, navId } = SCREENS[screen];
    const main = document.getElementById('main-content');
    main.innerHTML = component.render();
    if (component.bindEvents) component.bindEvents();
    if (component.afterRender) component.afterRender();
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(navId)?.classList.add('active');
    main.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
