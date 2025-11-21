class NotificationManager {
  constructor() {
    this.notifications = new Map();
    this.nextId = 1;
    this.initStyles();
  }

  initStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('notification-animations')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }

  show(options) {
    const id = this.nextId++;
    const notification = this.createNotificationElement(id, options);
    document.body.appendChild(notification);
    this.notifications.set(id, notification);
    
    if (options.autoClose !== false) {
      const delay = options.autoCloseDelay || 4000;
      setTimeout(() => this.hide(id), delay);
    }
    
    return id;
  }

  createNotificationElement(id, options) {
    const { type = 'info', title, message, position = 'top-right' } = options;
    
    const container = document.createElement('div');
    container.className = `fixed z-50 max-w-sm w-full notification-${id}`;
    container.style.cssText = this.getPositionStyles(position);
    
    const notification = document.createElement('div');
    notification.className = this.getNotificationClasses(type);
    notification.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">${this.getIcon(type)}</div>
        <div class="flex-1 min-w-0">
          ${title ? `<h4 class="font-bold text-white text-sm mb-1">${title}</h4>` : ''}
          ${message ? `<p class="text-white text-sm opacity-90 leading-relaxed">${message}</p>` : ''}
        </div>
        <button class="flex-shrink-0 p-1 rounded-full text-white hover:bg-white/20 transition-colors close-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    notification.querySelector('.close-btn').addEventListener('click', () => this.hide(id));
    container.appendChild(notification);
    
    setTimeout(() => {
      container.style.animation = 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    }, 10);
    
    return container;
  }

  getPositionStyles(position) {
    const positions = {
      'top-right': 'top: 1rem; right: 1rem;',
      'top-left': 'top: 1rem; left: 1rem;',
      'bottom-right': 'bottom: 1rem; right: 1rem;',
      'bottom-left': 'bottom: 1rem; left: 1rem;',
      'top-center': 'top: 1rem; left: 50%; transform: translateX(-50%);'
    };
    return positions[position] || positions['top-right'];
  }

  getNotificationClasses(type) {
    const base = 'p-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105';
    const types = {
      success: 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/25',
      warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/25',
      error: 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25',
      info: 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/25'
    };
    return `${base} ${types[type] || types.info}`;
  }

  getIcon(type) {
    const icons = {
      success: '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      warning: '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
      error: '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
      info: '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };
    return icons[type] || icons.info;
  }

  hide(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  clear() {
    this.notifications.forEach((notification, id) => this.hide(id));
  }

  success(title, message, options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  }

  error(title, message, options = {}) {
    return this.show({ type: 'error', title, message, autoClose: false, ...options });
  }

  warning(title, message, options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  }

  info(title, message, options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
