// Основные переменные и состояние приложения
const app = {
    currentUser: null,
    habits: [],
    logs: {},
    stats: {},
    currentPage: 'dashboard',
    theme: 'light',
    apiBaseUrl: '/api',
    isAuthenticated: false,
    sidebarCollapsed: false,
    
    // Инициализация приложения
    init: function() {
        // Установка обработчиков событий
        this.setupEventListeners();
        
        // Проверка аутентификации
        this.checkAuth();
        
        // Инициализация темы
        this.initTheme();
        
        // Установка текущей даты
        this.updateCurrentDate();
        
        // Инициализация графиков
        this.initCharts();
    },
    
    // Установка обработчиков событий
    setupEventListeners: function() {
        // Переключение боковой панели
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Навигация по страницам
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('href').substring(1);
                this.navigateTo(page);
            });
        });
        
        // Переключение вкладок авторизации
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });
        
        // Кнопки добавления привычки
        document.getElementById('add-habit-btn').addEventListener('click', () => {
            this.openHabitModal();
        });
        
        document.getElementById('add-habit-btn-2').addEventListener('click', () => {
            this.openHabitModal();
        });
        
        // Закрытие модального окна
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal('habit-modal');
        });
        
        document.getElementById('cancel-habit').addEventListener('click', () => {
            this.closeModal('habit-modal');
        });
        
        // Сохранение привычки
        document.getElementById('save-habit').addEventListener('click', () => {
            this.saveHabit();
        });
        
        // Переключение типа частоты
        document.querySelectorAll('.frequency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.getAttribute('data-type');
                this.switchFrequencyType(type);
            });
        });
        
        // Выбор дней недели
        document.querySelectorAll('.weekday').forEach(day => {
            day.addEventListener('click', (e) => {
                e.currentTarget.classList.toggle('active');
            });
        });
        
        // Выбор темы
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-theme');
                this.setTheme(theme);
            });
        });
        
        // Фильтры привычек
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const filter = e.currentTarget.textContent.toLowerCase();
                this.filterHabits(filter);
            });
        });
        
        // Селектор периода статистики
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const period = e.currentTarget.textContent.toLowerCase();
                this.updateStats(period);
            });
        });
        
        // Обработчики для кнопок выполнения привычек
        document.addEventListener('click', (e) => {
            if (e.target.closest('.habit-complete-btn')) {
                const habitCard = e.target.closest('.habit-card');
                const habitId = habitCard.getAttribute('data-id');
                this.toggleHabitCompletion(habitId);
            }
        });
        
        // Обработчики для кнопок изменения значения
        document.addEventListener('click', (e) => {
            if (e.target.closest('.plus-btn')) {
                const input = e.target.closest('.habit-value-input').querySelector('input');
                const step = parseFloat(input.step) || 0.1;
                const max = parseFloat(input.max) || Infinity;
                let value = parseFloat(input.value) || 0;
                value = Math.min(value + step, max);
                input.value = value.toFixed(1);
                
                const habitCard = e.target.closest('.habit-card');
                const habitId = habitCard.getAttribute('data-id');
                this.updateHabitValue(habitId, value);
            } else if (e.target.closest('.minus-btn')) {
                const input = e.target.closest('.habit-value-input').querySelector('input');
                const step = parseFloat(input.step) || 0.1;
                const min = parseFloat(input.min) || 0;
                let value = parseFloat(input.value) || 0;
                value = Math.max(value - step, min);
                input.value = value.toFixed(1);
                
                const habitCard = e.target.closest('.habit-card');
                const habitId = habitCard.getAttribute('data-id');
                this.updateHabitValue(habitId, value);
            }
        });
        
        // Обработчик изменения значения вручную
        document.addEventListener('change', (e) => {
            if (e.target.closest('.habit-value-input input')) {
                const habitCard = e.target.closest('.habit-card');
                const habitId = habitCard.getAttribute('data-id');
                const value = parseFloat(e.target.value) || 0;
                this.updateHabitValue(habitId, value);
            }
        });
        
        // Обработчик поиска привычек
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.searchHabits(query);
            });
        }
        
        // Обработчики для форм авторизации и регистрации
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
            
            // Добавляем обработчик для кнопки входа
            const loginButton = loginForm.querySelector('.btn-primary');
            if (loginButton) {
                loginButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.login();
                });
            }
        }
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
            
            // Добавляем обработчик для кнопки регистрации
            const registerButton = registerForm.querySelector('.btn-primary');
            if (registerButton) {
                registerButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.register();
                });
            }
        }
        
        // Обработчик для кнопки выхода
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },
    
    // Проверка аутентификации
    checkAuth: function() {
        // Проверяем наличие токена в localStorage
        const token = localStorage.getItem('auth_token');
        
        if (token) {
            // Если токен есть, проверяем его валидность
            fetch(`${this.apiBaseUrl}/auth/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    // Если токен невалидный, удаляем его и показываем страницу входа
                    localStorage.removeItem('auth_token');
                    this.isAuthenticated = false;
                    this.showLoginPage();
                    throw new Error('Токен недействителен');
                }
            })
            .then(data => {
                // Если токен валидный, сохраняем данные пользователя и показываем приложение
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.loadUserData();
                this.showApp();
            })
            .catch(error => {
                console.error('Ошибка при проверке аутентификации:', error);
                this.showLoginPage();
            });
        } else {
            // Если токена нет, показываем страницу входа
            this.isAuthenticated = false;
            this.showLoginPage();
        }
    },
    
    // Показать страницу входа
    showLoginPage: function() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('sidebar').style.display = 'none';
        document.querySelectorAll('.page:not(#login-page)').forEach(page => {
            page.classList.remove('active');
        });
    },
    
    // Показать основное приложение
    showApp: function() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('sidebar').style.display = 'flex';
        
        // Обновляем информацию о пользователе в интерфейсе
        const userInfo = document.querySelector('.user-info h3');
        if (userInfo && this.currentUser) {
            userInfo.textContent = this.currentUser.username;
        }
        
        this.navigateTo(this.currentPage);
    },
    
    // Переключение вкладок авторизации
    switchAuthTab: function(tabName) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        document.querySelector(`.auth-tab[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-form`).classList.add('active');
    },
    
    // Авторизация пользователя
    login: function() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        // Отправляем запрос на авторизацию
        fetch(`${this.apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Ошибка авторизации');
            }
        })
        .then(data => {
            // Сохраняем токен и данные пользователя
            localStorage.setItem('auth_token', data.token || 'dummy_token');
            this.currentUser = data.user;
            this.isAuthenticated = true;
            
            this.showApp();
            this.loadUserData();
            this.showNotification('Вы успешно вошли в систему', 'success');
        })
        .catch(error => {
            console.error('Ошибка при авторизации:', error);
            this.showNotification('Неверное имя пользователя или пароль', 'error');
        });
    },
    
    // Регистрация пользователя
    register: function() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        if (!username || !email || !password || !passwordConfirm) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        // Отправляем запрос на регистрацию
        fetch(`${this.apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error || 'Ошибка регистрации');
                });
            }
        })
        .then(data => {
            this.switchAuthTab('login');
            this.showNotification('Регистрация успешна. Теперь вы можете войти в систему', 'success');
            
            // Автоматически заполняем поля для входа
            document.getElementById('login-username').value = username;
        })
        .catch(error => {
            console.error('Ошибка при регистрации:', error);
            this.showNotification(error.message, 'error');
        });
    },
    
    // Выход из системы
    logout: function() {
        // Удаляем токен и данные пользователя
        localStorage.removeItem('auth_token');
        this.isAuthenticated = false;
        this.currentUser = null;
        this.habits = [];
        this.logs = {};
        this.stats = {};
        
        this.showLoginPage();
        this.showNotification('Вы вышли из системы', 'info');
    },
    
    // Загрузка данных пользователя
    loadUserData: function() {
        // Загружаем привычки, логи и статистику
        this.loadHabits()
            .then(() => this.loadLogs())
            .then(() => this.loadStats())
            .catch(error => {
                console.error('Ошибка при загрузке данных пользователя:', error);
                this.showNotification('Не удалось загрузить данные. Пожалуйста, попробуйте позже.', 'error');
            });
    },
    
    // Загрузка привычек
    loadHabits: function() {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('auth_token');
            
            if (!token || !this.currentUser) {
                reject(new Error('Пользователь не авторизован'));
                return;
            }
            
            fetch(`${this.apiBaseUrl}/user/${this.currentUser.id}/habits`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось загрузить привычки');
                }
            })
            .then(data => {
                this.habits = data;
                this.renderHabits();
                this.renderHabitsList();
                resolve();
            })
            .catch(error => {
                console.error('Ошибка при загрузке привычек:', error);
                reject(error);
            });
        });
    },
    
    // Загрузка логов
    loadLogs: function() {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('auth_token');
            
            if (!token || !this.currentUser || this.habits.length === 0) {
                reject(new Error('Нет данных для загрузки логов'));
                return;
            }
            
            // Получаем текущую дату
            const today = new Date().toISOString().split('T')[0];
            
            // Создаем массив промисов для загрузки логов каждой привычки
            const promises = this.habits.map(habit => {
                return fetch(`${this.apiBaseUrl}/habits/${habit.id}/logs?start_date=${today}&end_date=${today}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error(`Не удалось загрузить логи для привычки ${habit.id}`);
                    }
                })
                .then(logs => {
                    this.logs[habit.id] = logs;
                });
            });
            
            // Ждем выполнения всех запросов
            Promise.all(promises)
                .then(() => {
                    this.updateHabitsProgress();
                    resolve();
                })
                .catch(error => {
                    console.error('Ошибка при загрузке логов:', error);
                    reject(error);
                });
        });
    },
    
    // Загрузка статистики
    loadStats: function() {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('auth_token');
            
            if (!token || !this.currentUser) {
                reject(new Error('Пользователь не авторизован'));
                return;
            }
            
            fetch(`${this.apiBaseUrl}/user/${this.currentUser.id}/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось загрузить статистику');
                }
            })
            .then(data => {
                // Преобразуем полученные данные в формат, удобный для отображения
                this.stats = this.processStatsData(data);
                this.updateCharts('week');
                this.updateDashboardSummary();
                resolve();
            })
            .catch(error => {
                console.error('Ошибка при загрузке статистики:', error);
                reject(error);
            });
        });
    },
    
    // Обработка данных статистики
    processStatsData: function(data) {
        // Преобразуем данные с сервера в формат, удобный для отображения в графиках
        const stats = {
            completion: {
                week: [],
                month: [],
                year: []
            },
            habits: {
                week: []
            },
            streak: {
                current: [],
                longest: []
            }
        };
        
        // Обрабатываем данные для каждой привычки
        data.forEach(item => {
            const habit = item.habit;
            const habitStats = item.stats;
            
            // Добавляем данные о сериях
            stats.streak.current.push(habit.streak_current);
            stats.streak.longest.push(habit.streak_longest);
            
            // Добавляем данные о выполнении привычки
            if (habitStats.week) {
                stats.habits.week.push({
                    name: habit.name,
                    value: habitStats.week.completion_rate
                });
            }
            
            // Собираем данные для графиков по периодам
            if (habitStats.week) {
                // Если это первая привычка, инициализируем массивы
                if (stats.completion.week.length === 0) {
                    stats.completion.week = new Array(7).fill(0);
                }
                
                // Добавляем данные о выполнении
                const weekData = habitStats.week;
                if (weekData.completion_rate) {
                    // Распределяем процент выполнения по дням недели
                    for (let i = 0; i < 7; i++) {
                        stats.completion.week[i] += weekData.completion_rate / this.habits.length;
                    }
                }
            }
            
            if (habitStats.month) {
                if (stats.completion.month.length === 0) {
                    stats.completion.month = new Array(4).fill(0);
                }
                
                const monthData = habitStats.month;
                if (monthData.completion_rate) {
                    for (let i = 0; i < 4; i++) {
                        stats.completion.month[i] += monthData.completion_rate / this.habits.length;
                    }
                }
            }
            
            if (habitStats.year) {
                if (stats.completion.year.length === 0) {
                    stats.completion.year = new Array(12).fill(0);
                }
                
                const yearData = habitStats.year;
                if (yearData.completion_rate) {
                    for (let i = 0; i < 12; i++) {
                        stats.completion.year[i] += yearData.completion_rate / this.habits.length;
                    }
                }
            }
        });
        
        return stats;
    },
    
    // Отрисовка привычек на главной странице
    renderHabits: function() {
        const container = document.querySelector('.habits-container');
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const logs = this.logs[habit.id] || [];
            const todayLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
            const completed = todayLog && todayLog.completed;
            const value = todayLog ? todayLog.value : null;
            
            let progressWidth = '0%';
            if (completed) {
                progressWidth = '100%';
            } else if (habit.target_value && value) {
                progressWidth = `${Math.min(100, (value / habit.target_value) * 100)}%`;
            }
            
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.setAttribute('data-id', habit.id);
            
            let footerContent = '';
            if (habit.target_value) {
                footerContent = `
                    <div class="habit-value-input">
                        <button class="value-btn minus-btn">-</button>
                        <input type="number" value="${value || 0}" min="0" max="${habit.target_value}" step="0.1">
                        <button class="value-btn plus-btn">+</button>
                        <span class="value-unit">${habit.unit}</span>
                    </div>
                `;
            } else {
                footerContent = `
                    <button class="btn ${completed ? 'btn-success' : 'btn-outline'} habit-complete-btn">
                        <i class="fas fa-check"></i> ${completed ? 'Выполнено' : 'Отметить выполнение'}
                    </button>
                `;
            }
            
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-icon" style="background-color: ${habit.color};">
                        <i class="fas ${habit.icon}"></i>
                    </div>
                    <div class="habit-info">
                        <h3>${habit.name}</h3>
                        <p>${habit.description ? habit.description.substring(0, 30) : ''}</p>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-action-btn">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
                <div class="habit-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressWidth};"></div>
                    </div>
                    <div class="habit-streak">
                        <i class="fas fa-fire"></i> ${habit.streak_current} дней
                    </div>
                </div>
                <div class="habit-footer">
                    ${footerContent}
                </div>
            `;
            
            container.appendChild(card);
        });
    },
    
    // Отрисовка списка привычек на странице привычек
    renderHabitsList: function() {
        const container = document.querySelector('.habits-list');
        container.innerHTML = '';
        
        this.habits.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'habit-card';
            card.setAttribute('data-id', habit.id);
            
            let frequencyText = 'Ежедневно';
            if (habit.frequency.type === 'weekly') {
                const days = habit.frequency.days || [];
                const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                frequencyText = `По дням: ${days.map(d => dayNames[d]).join(', ')}`;
            } else if (habit.frequency.type === 'custom') {
                frequencyText = `${habit.frequency.times || 1} раз в ${habit.frequency.days || 1} дней`;
            }
            
            card.innerHTML = `
                <div class="habit-header">
                    <div class="habit-icon" style="background-color: ${habit.color};">
                        <i class="fas ${habit.icon}"></i>
                    </div>
                    <div class="habit-info">
                        <h3>${habit.name}</h3>
                        <p>${habit.description || ''}</p>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-action-btn">
                            <i class="fas fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
                <div class="habit-details">
                    <div class="habit-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${frequencyText}</span>
                    </div>
                    ${habit.target_value ? `
                    <div class="habit-detail">
                        <i class="fas fa-bullseye"></i>
                        <span>${habit.target_value} ${habit.unit}</span>
                    </div>
                    ` : ''}
                    <div class="habit-detail">
                        <i class="fas fa-fire"></i>
                        <span>Серия: ${habit.streak_current} дней</span>
                    </div>
                    <div class="habit-detail">
                        <i class="fas fa-trophy"></i>
                        <span>Рекорд: ${habit.streak_longest} дней</span>
                    </div>
                </div>
                <div class="habit-footer">
                    <button class="btn btn-outline habit-edit-btn" data-id="${habit.id}">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="btn btn-outline habit-delete-btn" data-id="${habit.id}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        // Добавляем обработчики для кнопок редактирования и удаления
        document.querySelectorAll('.habit-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.currentTarget.getAttribute('data-id');
                this.editHabit(habitId);
            });
        });
        
        document.querySelectorAll('.habit-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const habitId = e.currentTarget.getAttribute('data-id');
                this.deleteHabit(habitId);
            });
        });
    },
    
    // Обновление прогресса привычек
    updateHabitsProgress: function() {
        this.habits.forEach(habit => {
            const logs = this.logs[habit.id] || [];
            const todayLog = logs.find(log => log.date === new Date().toISOString().split('T')[0]);
            
            if (todayLog) {
                const card = document.querySelector(`.habit-card[data-id="${habit.id}"]`);
                if (card) {
                    const progressFill = card.querySelector('.progress-fill');
                    const completeBtn = card.querySelector('.habit-complete-btn');
                    
                    if (todayLog.completed) {
                        progressFill.style.width = '100%';
                        if (completeBtn) {
                            completeBtn.classList.remove('btn-outline');
                            completeBtn.classList.add('btn-success');
                            completeBtn.innerHTML = '<i class="fas fa-check"></i> Выполнено';
                        }
                    } else if (habit.target_value && todayLog.value) {
                        const progress = Math.min(100, (todayLog.value / habit.target_value) * 100);
                        progressFill.style.width = `${progress}%`;
                        
                        const input = card.querySelector('.habit-value-input input');
                        if (input) {
                            input.value = todayLog.value;
                        }
                    }
                }
            }
        });
    },
    
    // Переключение выполнения привычки
    toggleHabitCompletion: function(habitId) {
        const habit = this.habits.find(h => h.id == habitId);
        if (!habit) return;
        
        const today = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            this.showNotification('Вы не авторизованы', 'error');
            return;
        }
        
        // Проверяем, есть ли уже запись за сегодня
        const logs = this.logs[habitId] || [];
        const todayLog = logs.find(log => log.date === today);
        
        if (todayLog) {
            // Если запись уже есть, обновляем её
            fetch(`${this.apiBaseUrl}/habits/${habitId}/logs/${today}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    completed: !todayLog.completed
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось обновить статус привычки');
                }
            })
            .then(data => {
                // Обновляем данные в приложении
                todayLog.completed = !todayLog.completed;
                
                // Обновляем серию выполнений
                habit.streak_current = data.log.streak_current || habit.streak_current;
                habit.streak_longest = data.log.streak_longest || habit.streak_longest;
                
                this.updateHabitsProgress();
                this.renderHabits();
                this.updateDashboardSummary();
                
                this.showNotification(`Привычка ${todayLog.completed ? 'выполнена' : 'отменена'}`, 'success');
            })
            .catch(error => {
                console.error('Ошибка при обновлении статуса привычки:', error);
                this.showNotification('Не удалось обновить статус привычки', 'error');
            });
        } else {
            // Если записи нет, создаём новую
            fetch(`${this.apiBaseUrl}/habits/${habitId}/logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: today,
                    completed: true,
                    value: null
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось создать запись о выполнении привычки');
                }
            })
            .then(data => {
                // Добавляем новую запись в приложение
                if (!this.logs[habitId]) {
                    this.logs[habitId] = [];
                }
                
                this.logs[habitId].push(data.log);
                
                // Обновляем серию выполнений
                habit.streak_current = data.log.streak_current || habit.streak_current + 1;
                habit.streak_longest = data.log.streak_longest || Math.max(habit.streak_longest, habit.streak_current);
                
                this.updateHabitsProgress();
                this.renderHabits();
                this.updateDashboardSummary();
                
                this.showNotification('Привычка отмечена как выполненная', 'success');
            })
            .catch(error => {
                console.error('Ошибка при создании записи о выполнении привычки:', error);
                this.showNotification('Не удалось отметить привычку как выполненную', 'error');
            });
        }
    },
    
    // Обновление значения привычки
    updateHabitValue: function(habitId, value) {
        const habit = this.habits.find(h => h.id == habitId);
        if (!habit || !habit.target_value) return;
        
        const today = new Date().toISOString().split('T')[0];
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            this.showNotification('Вы не авторизованы', 'error');
            return;
        }
        
        // Проверяем, есть ли уже запись за сегодня
        const logs = this.logs[habitId] || [];
        const todayLog = logs.find(log => log.date === today);
        
        const completed = value >= habit.target_value;
        
        if (todayLog) {
            // Если запись уже есть, обновляем её
            fetch(`${this.apiBaseUrl}/habits/${habitId}/logs/${today}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    value: value,
                    completed: completed
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось обновить значение привычки');
                }
            })
            .then(data => {
                // Обновляем данные в приложении
                todayLog.value = value;
                todayLog.completed = completed;
                
                // Обновляем серию выполнений
                habit.streak_current = data.log.streak_current || habit.streak_current;
                habit.streak_longest = data.log.streak_longest || habit.streak_longest;
                
                this.updateHabitsProgress();
                this.updateDashboardSummary();
                
                this.showNotification(`Значение привычки обновлено: ${value} ${habit.unit}`, 'success');
            })
            .catch(error => {
                console.error('Ошибка при обновлении значения привычки:', error);
                this.showNotification('Не удалось обновить значение привычки', 'error');
            });
        } else {
            // Если записи нет, создаём новую
            fetch(`${this.apiBaseUrl}/habits/${habitId}/logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: today,
                    value: value,
                    completed: completed
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось создать запись о выполнении привычки');
                }
            })
            .then(data => {
                // Добавляем новую запись в приложение
                if (!this.logs[habitId]) {
                    this.logs[habitId] = [];
                }
                
                this.logs[habitId].push(data.log);
                
                // Обновляем серию выполнений
                habit.streak_current = data.log.streak_current || (completed ? habit.streak_current + 1 : 0);
                habit.streak_longest = data.log.streak_longest || Math.max(habit.streak_longest, habit.streak_current);
                
                this.updateHabitsProgress();
                this.updateDashboardSummary();
                
                this.showNotification(`Значение привычки установлено: ${value} ${habit.unit}`, 'success');
            })
            .catch(error => {
                console.error('Ошибка при создании записи о выполнении привычки:', error);
                this.showNotification('Не удалось установить значение привычки', 'error');
            });
        }
    },
    
    // Открытие модального окна для добавления/редактирования привычки
    openHabitModal: function(habitId) {
        const modal = document.getElementById('habit-modal');
        const modalTitle = modal.querySelector('.modal-header h2');
        const form = document.getElementById('habit-form');
        
        // Очистка формы
        form.reset();
        
        if (habitId) {
            // Редактирование существующей привычки
            const habit = this.habits.find(h => h.id == habitId);
            if (!habit) return;
            
            modalTitle.textContent = 'Редактирование привычки';
            
            // Заполнение формы данными привычки
            document.getElementById('habit-name').value = habit.name;
            document.getElementById('habit-description').value = habit.description || '';
            
            // Установка иконки
            const selectedIcon = document.querySelector('.selected-icon i');
            selectedIcon.className = `fas ${habit.icon}`;
            
            // Установка цвета
            const selectedColor = document.querySelector('.selected-color');
            selectedColor.style.backgroundColor = habit.color;
            
            // Установка частоты
            const frequencyType = habit.frequency.type || 'daily';
            this.switchFrequencyType(frequencyType);
            
            if (frequencyType === 'weekly' && habit.frequency.days) {
                habit.frequency.days.forEach(day => {
                    document.querySelector(`.weekday[data-day="${day}"]`).classList.add('active');
                });
            } else if (frequencyType === 'custom' && habit.frequency.times && habit.frequency.days) {
                const inputs = document.querySelectorAll('.custom-frequency-input input');
                inputs[0].value = habit.frequency.times;
                inputs[1].value = habit.frequency.days;
            }
            
            // Установка целевого значения и единицы измерения
            if (habit.target_value) {
                document.getElementById('habit-target').value = habit.target_value;
                document.getElementById('habit-unit').value = habit.unit || '';
            }
            
            // Установка времени напоминания
            if (habit.reminder_time) {
                document.getElementById('habit-reminder').value = habit.reminder_time;
            }
            
            // Установка ID редактируемой привычки
            form.setAttribute('data-edit-id', habitId);
        } else {
            // Добавление новой привычки
            modalTitle.textContent = 'Новая привычка';
            form.removeAttribute('data-edit-id');
            
            // Установка значений по умолчанию
            const selectedIcon = document.querySelector('.selected-icon i');
            selectedIcon.className = 'fas fa-running';
            
            const selectedColor = document.querySelector('.selected-color');
            selectedColor.style.backgroundColor = '#4CAF50';
            
            this.switchFrequencyType('daily');
        }
        
        modal.classList.add('active');
    },
    
    // Закрытие модального окна
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
    },
    
    // Переключение типа частоты
    switchFrequencyType: function(type) {
        document.querySelectorAll('.frequency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.frequency-btn[data-type="${type}"]`).classList.add('active');
        
        document.querySelectorAll('.frequency-daily, .frequency-weekly, .frequency-custom').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector(`.frequency-${type}`).classList.add('active');
    },
    
    // Сохранение привычки
    saveHabit: function() {
        const form = document.getElementById('habit-form');
        const name = document.getElementById('habit-name').value;
        const description = document.getElementById('habit-description').value;
        
        if (!name) {
            this.showNotification('Пожалуйста, введите название привычки', 'error');
            return;
        }
        
        // Получение иконки
        const selectedIcon = document.querySelector('.selected-icon i');
        const icon = selectedIcon.className.replace('fas ', '');
        
        // Получение цвета
        const selectedColor = document.querySelector('.selected-color');
        const color = selectedColor.style.backgroundColor;
        
        // Получение частоты
        const frequencyType = document.querySelector('.frequency-btn.active').getAttribute('data-type');
        let frequency = { type: frequencyType };
        
        if (frequencyType === 'weekly') {
            const activeDays = Array.from(document.querySelectorAll('.weekday.active')).map(day => parseInt(day.getAttribute('data-day')));
            frequency.days = activeDays.length > 0 ? activeDays : [1, 2, 3, 4, 5];
        } else if (frequencyType === 'custom') {
            const inputs = document.querySelectorAll('.custom-frequency-input input');
            frequency.times = parseInt(inputs[0].value) || 1;
            frequency.days = parseInt(inputs[1].value) || 1;
        }
        
        // Получение целевого значения и единицы измерения
        const targetValue = document.getElementById('habit-target').value ? parseFloat(document.getElementById('habit-target').value) : null;
        const unit = document.getElementById('habit-unit').value;
        
        // Получение времени напоминания
        const reminderTime = document.getElementById('habit-reminder').value;
        
        // Создание объекта привычки
        const habitData = {
            name: name,
            description: description,
            icon: icon,
            color: color,
            frequency: frequency,
            target_value: targetValue,
            unit: unit,
            reminder_time: reminderTime
        };
        
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            this.showNotification('Вы не авторизованы', 'error');
            return;
        }
        
        const editId = form.getAttribute('data-edit-id');
        
        if (editId) {
            // Редактирование существующей привычки
            fetch(`${this.apiBaseUrl}/habits/${editId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось обновить привычку');
                }
            })
            .then(data => {
                // Обновляем привычку в приложении
                const index = this.habits.findIndex(h => h.id == editId);
                if (index !== -1) {
                    this.habits[index] = data.habit;
                }
                
                this.closeModal('habit-modal');
                this.renderHabits();
                this.renderHabitsList();
                this.updateDashboardSummary();
                
                this.showNotification('Привычка успешно обновлена', 'success');
            })
            .catch(error => {
                console.error('Ошибка при обновлении привычки:', error);
                this.showNotification('Не удалось обновить привычку', 'error');
            });
        } else {
            // Добавление новой привычки
            fetch(`${this.apiBaseUrl}/user/${this.currentUser.id}/habits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habitData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось создать привычку');
                }
            })
            .then(data => {
                // Добавляем новую привычку в приложение
                this.habits.push(data.habit);
                
                this.closeModal('habit-modal');
                this.renderHabits();
                this.renderHabitsList();
                this.updateDashboardSummary();
                
                this.showNotification('Привычка успешно добавлена', 'success');
            })
            .catch(error => {
                console.error('Ошибка при создании привычки:', error);
                this.showNotification('Не удалось создать привычку', 'error');
            });
        }
    },
    
    // Редактирование привычки
    editHabit: function(habitId) {
        this.openHabitModal(habitId);
    },
    
    // Удаление привычки
    deleteHabit: function(habitId) {
        if (confirm('Вы уверены, что хотите удалить эту привычку?')) {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                this.showNotification('Вы не авторизованы', 'error');
                return;
            }
            
            fetch(`${this.apiBaseUrl}/habits/${habitId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Не удалось удалить привычку');
                }
            })
            .then(data => {
                // Удаляем привычку из приложения
                const index = this.habits.findIndex(h => h.id == habitId);
                if (index !== -1) {
                    this.habits.splice(index, 1);
                }
                
                // Удаляем логи привычки
                delete this.logs[habitId];
                
                this.renderHabits();
                this.renderHabitsList();
                this.updateDashboardSummary();
                
                this.showNotification('Привычка успешно удалена', 'success');
            })
            .catch(error => {
                console.error('Ошибка при удалении привычки:', error);
                this.showNotification('Не удалось удалить привычку', 'error');
            });
        }
    },
    
    // Фильтрация привычек
    filterHabits: function(filter) {
        const container = document.querySelector('.habits-list');
        const cards = container.querySelectorAll('.habit-card');
        
        cards.forEach(card => {
            const habitId = card.getAttribute('data-id');
            const habit = this.habits.find(h => h.id == habitId);
            
            if (filter === 'все' || 
                (filter === 'активные' && habit.is_active) || 
                (filter === 'архивные' && !habit.is_active)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },
    
    // Поиск привычек
    searchHabits: function(query) {
        const container = document.querySelector('.habits-list');
        const cards = container.querySelectorAll('.habit-card');
        
        cards.forEach(card => {
            const habitId = card.getAttribute('data-id');
            const habit = this.habits.find(h => h.id == habitId);
            
            if (habit.name.toLowerCase().includes(query) || 
                (habit.description && habit.description.toLowerCase().includes(query))) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },
    
    // Обновление сводки на дашборде
    updateDashboardSummary: function() {
        const today = new Date().toISOString().split('T')[0];
        
        // Количество выполненных привычек сегодня
        let completedToday = 0;
        let totalToday = this.habits.length;
        
        this.habits.forEach(habit => {
            const logs = this.logs[habit.id] || [];
            const todayLog = logs.find(log => log.date === today);
            
            if (todayLog && todayLog.completed) {
                completedToday++;
            }
        });
        
        // Обновление элементов сводки
        const summaryCards = document.querySelectorAll('.summary-card');
        
        // Сегодня выполнено
        summaryCards[0].querySelector('.summary-value').textContent = `${completedToday}/${totalToday}`;
        
        // Текущая серия (максимальная среди всех привычек)
        const maxCurrentStreak = this.habits.length > 0 ? Math.max(...this.habits.map(h => h.streak_current)) : 0;
        summaryCards[1].querySelector('.summary-value').textContent = maxCurrentStreak;
        
        // Лучшая серия (максимальная среди всех привычек)
        const maxLongestStreak = this.habits.length > 0 ? Math.max(...this.habits.map(h => h.streak_longest)) : 0;
        summaryCards[2].querySelector('.summary-value').textContent = maxLongestStreak;
        
        // Всего привычек
        summaryCards[3].querySelector('.summary-value').textContent = this.habits.length;
    },
    
    // Инициализация графиков
    initCharts: function() {
        // Создание графиков с пустыми данными
        this.charts = {
            progress: new Chart(document.getElementById('progressChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Общий прогресс',
                        data: [],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            }),
            
            completion: new Chart(document.getElementById('completionChart'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Выполнение по дням',
                        data: [],
                        backgroundColor: '#6366f1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            }),
            
            habits: new Chart(document.getElementById('habitsChart'), {
                type: 'horizontalBar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Выполнение привычек',
                        data: [],
                        backgroundColor: [
                            '#4CAF50',
                            '#2196F3',
                            '#FF9800',
                            '#9C27B0',
                            '#F44336'
                        ]
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            }),
            
            streak: new Chart(document.getElementById('streakChart'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Текущая серия',
                            data: [],
                            backgroundColor: '#6366f1'
                        },
                        {
                            label: 'Лучшая серия',
                            data: [],
                            backgroundColor: '#F59E0B'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Дни'
                            }
                        }
                    }
                }
            })
        };
    },
    
    // Обновление графиков
    updateCharts: function(period) {
        if (!this.charts) return;
        
        // Обновление графика общего прогресса
        let labels = [];
        let data = [];
        
        if (period === 'week') {
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            data = this.stats.completion.week;
        } else if (period === 'месяц') {
            labels = ['Неделя 1', 'Неделя 2', 'Неделя 3', 'Неделя 4'];
            data = this.stats.completion.month;
        } else if (period === 'год') {
            labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            data = this.stats.completion.year;
        }
        
        this.charts.progress.data.labels = labels;
        this.charts.progress.data.datasets[0].data = data;
        this.charts.progress.update();
        
        // Обновление графика выполнения по дням
        this.charts.completion.data.labels = labels;
        this.charts.completion.data.datasets[0].data = data;
        this.charts.completion.update();
        
        // Обновление графика привычек
        const habitStats = this.stats.habits.week;
        this.charts.habits.data.labels = habitStats.map(h => h.name);
        this.charts.habits.data.datasets[0].data = habitStats.map(h => h.value);
        this.charts.habits.update();
        
        // Обновление графика серий
        this.charts.streak.data.labels = this.habits.map(h => h.name);
        this.charts.streak.data.datasets[0].data = this.stats.streak.current;
        this.charts.streak.data.datasets[1].data = this.stats.streak.longest;
        this.charts.streak.update();
    },
    
    // Переключение боковой панели
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        this.sidebarCollapsed = sidebar.classList.contains('collapsed');
    },
    
    // Навигация по страницам
    navigateTo: function(page) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            item.classList.remove('active');
        });
        
        document.getElementById(`${page}-page`).classList.add('active');
        document.querySelector(`.sidebar-menu a[href="#${page}"]`).parentElement.classList.add('active');
        
        this.currentPage = page;
        
        // Обновление данных при переходе на страницу
        if (page === 'dashboard') {
            this.updateDashboardSummary();
        } else if (page === 'habits') {
            this.renderHabitsList();
        } else if (page === 'statistics') {
            this.updateCharts('week');
        }
    },
    
    // Инициализация темы
    initTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    },
    
    // Установка темы
    setTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.theme = theme;
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`.theme-option[data-theme="${theme}"]`).classList.add('active');
    },
    
    // Обновление текущей даты
    updateCurrentDate: function() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            const date = new Date().toLocaleDateString('ru-RU', options);
            dateElement.textContent = date.charAt(0).toUpperCase() + date.slice(1);
        }
    },
    
    // Показ уведомления
    showNotification: function(message, type = 'info') {
        // Создание элемента уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Добавление уведомления на страницу
        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        container.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            this.hideNotification(notification);
        }, 5000);
        
        // Обработчик для кнопки закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });
    },
    
    // Создание контейнера для уведомлений
    createNotificationContainer: function() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    },
    
    // Скрытие уведомления
    hideNotification: function(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // Удаление элемента после завершения анимации
        setTimeout(() => {
            notification.remove();
        }, 300);
    },
    
    // Получение иконки для уведомления
    getNotificationIcon: function(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    app.init();
});
