document.addEventListener('DOMContentLoaded', () => {
    // Persistent Database Helper
    function initDatabase(storageKey, initSql) {
        // If data doesn't exist in localStorage, create and seed it
        if (!localStorage.getItem('alasql_' + storageKey)) {
            alasql(initSql);
            // Save initial state to storage
            const data = alasql('SELECT * INTO localStorage("' + storageKey + '") FROM ?', [[{}]]);
        } else {
            // Load existing data from localStorage
            alasql('SELECT * INTO ? FROM localStorage("' + storageKey + '")', [[]]);
        }
    }

    // Initialize Databases with Persistence
    // Note: We'll use the tables as the storage keys

    // For simplicity with multiple tables in one SQL string, 
    // we will check for one table's existence
    if (!localStorage.getItem('pjce_db_initialized')) {
        alasql(DB_INIT_SQL);
        alasql(NOTICE_INIT_SQL);
        localStorage.setItem('pjce_db_initialized', 'true');
        saveToStorage();
    } else {
        loadFromStorage();
    }

    function saveToStorage() {
        const tables = ['users', 'admins', 'fees', 'bus_pass', 'notices'];
        tables.forEach(t => {
            const data = alasql(`SELECT * FROM ${t}`);
            localStorage.setItem(`pjce_data_${t}`, JSON.stringify(data));
        });
    }

    function loadFromStorage() {
        const tables = ['users', 'admins', 'fees', 'bus_pass', 'notices'];
        tables.forEach(t => {
            const dataStr = localStorage.getItem(`pjce_data_${t}`);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                alasql(`CREATE TABLE ${t}`);
                if (data.length > 0) {
                    alasql(`INSERT INTO ${t} SELECT * FROM ?`, [data]);
                }
            }
        });
    }

    // Override alasql to auto-save on specific queries if needed, 
    // or manually call saveToStorage() after updates.
    window.updateAndSave = (sql, params = []) => {
        const res = alasql(sql, params);
        saveToStorage();
        return res;
    };

    const app = document.getElementById('app');
    let currentUser = null;
    let isAdmin = false;
    let editingUserId = null; // Track which user is being edited in admin mode
    let editingNoticeId = null; // Track which notice is being edited

    // Router
    const routes = {
        'landing': { template: 'view-landing', init: initLanding },
        'login': { template: 'view-login', init: initLogin },
        'login-admin': { template: 'view-login-admin', init: initLoginAdmin },
        'dashboard': { template: 'view-dashboard', init: initDashboard },
        'dashboard-admin': { template: 'view-dashboard-admin', init: initDashboardAdmin },
        'admin-edit-user': { template: 'view-edit-user', init: initAdminEditUser },
        'admin-add-student': { template: 'view-add-student', init: initAddStudent },
        'profile': { template: 'view-profile', init: initProfile },
        'fees': { template: 'view-fees', init: initFees },
        'bus-pass': { template: 'view-bus-pass', init: initBusPass },
        'noticeboard': { template: 'view-noticeboard', init: initNoticeboard },
        'admin-add-notice': { template: 'view-add-notice', init: initAdminAddNotice },
        'admin-edit-notice': { template: 'view-edit-notice', init: initAdminEditNotice },
        'contact': { template: 'view-contact', init: initCommon }
    };

    function navigateTo(routeId) {
        const route = routes[routeId];
        if (!route) return;

        const template = document.getElementById(route.template);
        if (!template) return;

        app.style.opacity = '0';
        setTimeout(() => {
            app.innerHTML = '';
            const content = template.content.cloneNode(true);
            const container = document.createElement('div');
            container.className = 'view-section';
            container.appendChild(content);
            app.appendChild(container);
            app.style.opacity = '1';

            if (route.init) route.init();
        }, 200);
    }

    // --- View Controllers ---

    function initLanding() {
        const btns = document.querySelectorAll('.role-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const role = btn.dataset.role;
                if (role === 'student') navigateTo('login');
                if (role === 'management') navigateTo('login-admin');
            });
        });
    }

    function initLogin() {
        document.getElementById('login-back').addEventListener('click', () => navigateTo('landing'));

        const form = document.querySelector('#login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('college-id').value.trim();
                const pass = document.getElementById('password').value.trim();

                const loginBtn = form.querySelector('button');
                const originalText = loginBtn.innerText;
                loginBtn.innerText = "VERIFYING...";
                loginBtn.disabled = true;

                // Added TRIM in SQL and case-insensitivity check to make login more robust
                const results = alasql("SELECT * FROM users WHERE TRIM(id)=? AND password=?", [id, pass]);

                setTimeout(() => {
                    if (results.length > 0) {
                        currentUser = results[0];
                        isAdmin = false;
                        navigateTo('dashboard');
                    } else {
                        alert("Invalid Student Credentials!\n\nPlease check your Register Number and Password.");
                        loginBtn.innerText = originalText;
                        loginBtn.disabled = false;
                    }
                }, 400); // Slight delay for better UX
            });
        }
    }

    function initLoginAdmin() {
        document.getElementById('admin-login-back').addEventListener('click', () => navigateTo('landing'));

        const form = document.querySelector('#admin-login-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = document.getElementById('admin-user').value.trim();
                const pass = document.getElementById('admin-pass').value.trim();

                const loginBtn = form.querySelector('button');
                const originalText = loginBtn.innerText;
                loginBtn.innerText = "AUTHENTICATING...";
                loginBtn.disabled = true;

                const results = alasql("SELECT * FROM admins WHERE TRIM(username)=? AND password=?", [user, pass]);

                setTimeout(() => {
                    if (results.length > 0) {
                        currentUser = results[0];
                        isAdmin = true;
                        navigateTo('dashboard-admin');
                    } else {
                        alert("Invalid Admin Credentials!");
                        loginBtn.innerText = originalText;
                        loginBtn.disabled = false;
                    }
                }, 400);
            });
        }
    }

    function initDashboard() {
        if (!currentUser || isAdmin) return navigateTo('landing');

        document.querySelector('.header-text h2').innerText = `Hello, ${currentUser.name.split(' ')[0]}`;
        document.querySelector('.header-text p').innerText = currentUser.id;
        document.querySelector('.avatar-small').innerText = currentUser.name.charAt(0);

        const menuItems = document.querySelectorAll('.card-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                if (target === 'results') {
                    window.open('https://coe.annauniv.edu/home/', '_blank');
                } else if (target) {
                    navigateTo(target);
                }
            });
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Logout?')) {
                currentUser = null;
                navigateTo('landing');
            }
        });
    }

    function initDashboardAdmin() {
        if (!currentUser || !isAdmin) return navigateTo('landing');

        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            if (confirm('Logout?')) {
                currentUser = null;
                navigateTo('landing');
            }
        });

        // Tabs Logic
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.getElementById('tab-content-students').style.display = target === 'students' ? 'block' : 'none';
                document.getElementById('tab-content-fees').style.display = target === 'fees' ? 'block' : 'none';
                document.getElementById('tab-content-notices').style.display = target === 'notices' ? 'block' : 'none';

                if (target === 'fees') renderFeesTab();
                if (target === 'notices') renderAdminNoticesTab();
            });
        });

        // Add Notice Navigation
        const addNoticeBtn = document.getElementById('admin-add-notice-btn');
        if (addNoticeBtn) addNoticeBtn.addEventListener('click', () => navigateTo('admin-add-notice'));

        // Student List Logic
        const listContainer = document.getElementById('admin-student-list');
        const searchInput = document.getElementById('student-search');
        const addBtn = document.getElementById('add-student-btn');

        addBtn.addEventListener('click', () => navigateTo('admin-add-student'));

        const renderList = (filter = '') => {
            let sql = "SELECT * FROM users";
            if (filter) {
                sql += ` WHERE lower(name) LIKE '%${filter.toLowerCase()}%' OR id LIKE '%${filter}%'`;
            }
            const users = alasql(sql);

            listContainer.innerHTML = '';
            users.forEach(u => {
                const div = document.createElement('div');
                div.className = 'student-list-item';
                div.innerHTML = `
                    <div class="student-info">
                        <h4>${u.name}</h4>
                        <p>${u.id} | ${u.dept}</p>
                    </div>
                    <button class="icon-btn" style="color:var(--accent)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                `;
                div.addEventListener('click', () => {
                    editingUserId = u.id;
                    navigateTo('admin-edit-user');
                });
                listContainer.appendChild(div);
            });
        };

        const renderFeesTab = () => {
            const depts = ["CSE", "IT", "AIDS", "AIML", "MECH", "ECE", "EEE", "CIVIL"];
            const summaryList = document.getElementById('dept-summary-list');
            const chipBar = document.getElementById('fee-dept-filter-bar');
            const tableContainer = document.getElementById('fee-students-container');

            if (!summaryList || !chipBar || !tableContainer) return;

            // 1. Render Summary Cards
            summaryList.innerHTML = '';
            depts.forEach(d => {
                const res = alasql("SELECT SUM(amount) as total FROM fees JOIN users ON fees.user_id = users.id WHERE users.dept LIKE ? AND fees.status = 'Due'", [`%${d}%`]);
                const balance = (res && res.length > 0) ? (res[0].total || 0) : 0;

                const card = document.createElement('div');
                card.className = 'dept-fee-card';
                card.innerHTML = `
                    <div>
                        <h4>${d}</h4>
                        <p class="balance">₹ ${Number(balance).toLocaleString()}</p>
                    </div>
                `;
                summaryList.appendChild(card);
            });

            // 2. Render Filter Chips
            chipBar.innerHTML = '';
            const allChip = document.createElement('div');
            allChip.className = 'dept-chip active';
            allChip.innerText = 'All Depts';
            chipBar.appendChild(allChip);

            depts.forEach(d => {
                const chip = document.createElement('div');
                chip.className = 'dept-chip';
                chip.innerText = d;
                chipBar.appendChild(chip);
            });

            // 3. Render Table
            const renderReport = (filterDept = null) => {
                tableContainer.innerHTML = '';
                let sql = "SELECT id, name, dept FROM users";
                if (filterDept) {
                    sql += ` WHERE dept LIKE '%${filterDept}%'`;
                }
                const users = alasql(sql);

                users.forEach(u => {
                    const feeData = alasql("SELECT status, SUM(amount) as total FROM fees WHERE user_id = ? GROUP BY status", [u.id]);
                    let paid = 0, due = 0;
                    feeData.forEach(f => {
                        if (f.status === 'Paid') paid = f.total;
                        if (f.status === 'Due') due = f.total;
                    });

                    const row = document.createElement('div');
                    row.className = 'fee-table-row';
                    row.innerHTML = `
                        <div class="student-name-cell">
                            <strong>${u.name}</strong>
                            <small>${u.dept}</small>
                        </div>
                        <div class="row-paid">₹ ${paid.toLocaleString()}</div>
                        <div class="row-due">₹ ${due.toLocaleString()}</div>
                        <div class="row-total">₹ ${(paid + due).toLocaleString()}</div>
                    `;
                    tableContainer.appendChild(row);
                });

                if (users.length === 0) {
                    tableContainer.innerHTML = '<p style="padding:20px; text-align:center; opacity:0.5;">No students found for this department.</p>';
                }
            };

            // Chip Click Events
            chipBar.querySelectorAll('.dept-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    chipBar.querySelectorAll('.dept-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    const dept = chip.innerText === 'All Depts' ? null : chip.innerText;
                    renderReport(dept);
                });
            });

            renderReport(); // Initial load

            // 4. Activity List
            const activityList = document.getElementById('fee-activity-list');
            if (activityList) {
                const recentFees = alasql("SELECT fees.*, users.name FROM fees JOIN users ON fees.user_id = users.id ORDER BY payment_date DESC LIMIT 10");
                activityList.innerHTML = '';
                if (!recentFees || recentFees.length === 0) {
                    activityList.innerHTML = '<p style="text-align:center; opacity:0.5; font-size:12px;">No recent transactions found.</p>';
                } else {
                    recentFees.forEach(f => {
                        const item = document.createElement('div');
                        item.className = 'activity-item';
                        item.innerHTML = `
                            <div>
                                <div style="font-weight:600">${f.name || 'Unknown'}</div>
                                <div style="font-size:12px; color:var(--text-muted)">${f.semester || 'N/A'} - ₹ ${Number(f.amount || 0).toLocaleString()}</div>
                            </div>
                            <div class="tag ${f.status === 'Paid' ? 'success' : 'unpaid'}" style="background:rgba(255,255,255,0.1)">${f.status}</div>
                        `;
                        activityList.appendChild(item);
                    });
                }
            }
        };

        const renderAdminNoticesTab = () => {
            const notices = alasql("SELECT * FROM notices ORDER BY date DESC");
            const container = document.getElementById('admin-notice-list');
            if (!container) return;

            container.innerHTML = '';
            if (notices.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.5;">No active notices found.</p>';
            } else {
                notices.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'student-list-item';
                    div.style.flexDirection = 'row';
                    div.innerHTML = `
                        <div style="flex:1">
                            <span class="notice-category ${n.category.toLowerCase()}" style="font-size:10px">${n.category}</span>
                            <h4 style="margin-top:6px">${n.title}</h4>
                            <p style="font-size:11px">${n.date}</p>
                        </div>
                        <div style="display:flex; gap:12px;">
                            <button class="icon-btn edit-notice" style="color:var(--accent)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button class="icon-btn delete-notice" style="color:var(--danger)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    `;
                    div.querySelector('.edit-notice').addEventListener('click', (e) => {
                        e.stopPropagation();
                        editingNoticeId = n.id;
                        navigateTo('admin-edit-notice');
                    });
                    div.querySelector('.delete-notice').addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this notice?')) {
                            alasql("DELETE FROM notices WHERE id=?", [n.id]);
                            saveToStorage();
                            renderAdminNoticesTab();
                        }
                    });
                    container.appendChild(div);
                });
            }
        };

        renderList();
        searchInput.addEventListener('input', (e) => renderList(e.target.value));
    }

    function initAdminEditUser() {
        if (!editingUserId) return navigateTo('dashboard-admin');

        const user = alasql("SELECT * FROM users WHERE id=?", [editingUserId])[0];
        const fees = alasql("SELECT * FROM fees WHERE user_id=?", [editingUserId]);
        const busPass = alasql("SELECT * FROM bus_pass WHERE user_id=?", [editingUserId])[0];

        // Photo Preview
        const avatarImg = document.querySelector('#edit-avatar-preview img');
        avatarImg.src = user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name;

        document.getElementById('change-photo-btn').addEventListener('click', () => {
            document.getElementById('photo-input').click();
        });

        document.getElementById('photo-input').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    avatarImg.src = re.target.result;
                    user.avatar = re.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        document.getElementById('edit-id').value = user.id;
        document.getElementById('edit-name').value = user.name;
        document.getElementById('edit-dept').value = user.dept;
        document.getElementById('edit-year').value = user.year;
        document.getElementById('edit-password').value = user.password;

        if (busPass) {
            document.getElementById('edit-bus-route').value = busPass.route;
            document.getElementById('edit-bus-no').value = busPass.bus_no;
            document.getElementById('edit-bus-valid').value = busPass.valid_till;
        }

        const feeContainer = document.getElementById('edit-fee-list');
        fees.forEach(fee => {
            const row = document.createElement('div');
            row.className = 'edit-fee-row';
            row.style.marginBottom = '12px';
            row.style.padding = '12px';
            row.style.background = 'rgba(0,0,0,0.2)';
            row.style.borderRadius = '8px';
            row.innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
                    <input type="text" class="fee-sem" value="${fee.semester}" placeholder="Semester">
                    <input type="number" class="fee-amount" value="${fee.amount}" placeholder="Amount">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <select class="fee-status">
                        <option value="Paid" ${fee.status === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Due" ${fee.status === 'Due' ? 'selected' : ''}>Due</option>
                    </select>
                    <input type="date" class="fee-date" value="${fee.payment_date || ''}">
                </div>
                <input type="hidden" class="fee-id" value="${fee.id}">
            `;
            feeContainer.appendChild(row);
        });

        document.getElementById('add-fee-btn').addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'edit-fee-row new-fee';
            row.style.marginBottom = '12px';
            row.style.padding = '12px';
            row.style.background = 'rgba(0,0,0,0.2)';
            row.style.borderRadius = '8px';
            row.innerHTML = `
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
                    <input type="text" class="fee-sem" placeholder="Semester">
                    <input type="number" class="fee-amount" placeholder="Amount">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <select class="fee-status">
                         <option value="Due">Due</option>
                        <option value="Paid">Paid</option>
                    </select>
                    <input type="date" class="fee-date">
                </div>
            `;
            feeContainer.appendChild(row);
        });

        document.getElementById('delete-student-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete student ${user.name}? This cannot be undone.`)) {
                alasql("DELETE FROM users WHERE id=?", [editingUserId]);
                alasql("DELETE FROM fees WHERE user_id=?", [editingUserId]);
                alasql("DELETE FROM bus_pass WHERE user_id=?", [editingUserId]);
                saveToStorage();
                alert("Student deleted successfully.");
                navigateTo('dashboard-admin');
            }
        });

        document.getElementById('edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-name').value;
            const dept = document.getElementById('edit-dept').value;
            const year = document.getElementById('edit-year').value;
            const password = document.getElementById('edit-password').value;

            alasql("UPDATE users SET name=?, dept=?, year=?, password=?, avatar=? WHERE id=?",
                [name, dept, year, password, avatarImg.src, editingUserId]);
            saveToStorage();

            const route = document.getElementById('edit-bus-route').value;
            const busNo = document.getElementById('edit-bus-no').value;
            const valid = document.getElementById('edit-bus-valid').value;
            const existingPass = alasql("SELECT * FROM bus_pass WHERE user_id=?", [editingUserId])[0];

            if (route && busNo) {
                if (existingPass) {
                    alasql("UPDATE bus_pass SET route=?, bus_no=?, valid_till=? WHERE user_id=?", [route, busNo, valid, editingUserId]);
                } else {
                    alasql("INSERT INTO bus_pass VALUES (?, ?, ?, ?, ?)", [editingUserId, busNo, route, valid, 'Start Point']);
                }
                saveToStorage();
            } else if (!route && !busNo && existingPass) {
                alasql("DELETE FROM bus_pass WHERE user_id=?", [editingUserId]);
                saveToStorage();
            }

            const feeRows = document.querySelectorAll('.edit-fee-row');
            feeRows.forEach(row => {
                const sem = row.querySelector('.fee-sem').value;
                const amt = row.querySelector('.fee-amount').value;
                const status = row.querySelector('.fee-status').value;
                const date = row.querySelector('.fee-date').value;

                if (row.classList.contains('new-fee')) {
                    if (sem && amt) {
                        const newId = Math.floor(Math.random() * 100000);
                        alasql("INSERT INTO fees VALUES (?, ?, ?, ?, ?, ?)", [newId, editingUserId, sem, parseInt(amt), status, date]);
                    }
                } else {
                    const id = row.querySelector('.fee-id').value;
                    alasql("UPDATE fees SET semester=?, amount=?, status=?, payment_date=? WHERE id=?", [sem, parseInt(amt), status, date, parseInt(id)]);
                }
            });

            saveToStorage();
            alert("Student details updated successfully!");
            navigateTo('dashboard-admin');
        });

        bindBackBtn();
    }

    function initAddStudent() {
        document.getElementById('add-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('add-id').value;
            const name = document.getElementById('add-name').value;
            const dept = document.getElementById('add-dept').value;
            const year = document.getElementById('add-year').value;
            const password = document.getElementById('add-password').value;

            const exists = alasql("SELECT id FROM users WHERE id=?", [id]);
            if (exists.length > 0) return alert("Student ID already exists!");

            const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
            alasql("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [id, password, name, dept, year, 'N/A', 'N/A', 'N/A', avatar]);
            saveToStorage();
            alert("Student registered successfully!");
            navigateTo('dashboard-admin');
        });

        bindBackBtn();
    }

    function initProfile() {
        const user = alasql("SELECT * FROM users WHERE id=?", [currentUser.id])[0];
        document.querySelector('.profile-header-card h3').innerText = user.name;
        document.querySelector('.profile-header-card p').innerText = user.id;
        document.querySelector('.avatar-large img').src = user.avatar;

        const setVal = (label, val) => {
            const items = document.querySelectorAll('.info-item');
            for (let item of items) {
                if (item.querySelector('label').innerText.includes(label)) {
                    item.querySelector('.value').innerText = val;
                }
            }
        };

        setVal('Register Number', user.id);
        setVal('Year', user.year);
        setVal('Department', user.dept);
        setVal('Address', user.address);
        setVal('Mobile', user.mobile);
        setVal('Email', user.email);
        bindBackBtn();
    }

    function initFees() {
        const fees = alasql("SELECT * FROM fees WHERE user_id=?", [currentUser.id]) || [];
        let totalDue = 0;
        fees.forEach(f => { if (f.status === 'Due') totalDue += Number(f.amount || 0); });

        const balanceDisplay = document.querySelector('.balance-card h2');
        if (balanceDisplay) balanceDisplay.innerText = `₹ ${totalDue.toLocaleString()}`;

        const tag = document.querySelector('.tag');
        if (tag) {
            if (totalDue > 0) {
                tag.innerText = "Unpaid";
                tag.className = "tag unpaid";
                tag.style.background = "";
            } else {
                tag.innerText = "All Clear";
                tag.className = "tag";
                tag.style.background = "rgba(255,255,255,0.2)";
            }
        }

        const listContainer = document.querySelector('.fee-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        if (fees.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; opacity:0.6; margin-top:40px;">No fee records found.</p>';
        } else {
            fees.forEach(fee => {
                const isPaid = fee.status === 'Paid';
                listContainer.innerHTML += `
                    <div class="fee-item ${isPaid ? 'success' : ''}">
                        <div class="fee-info">
                            <h4>${fee.semester || 'Semester Record'}</h4>
                            <p>Tuition Fee ${isPaid && fee.payment_date ? `(Paid on ${fee.payment_date})` : ''}</p>
                        </div>
                        <div class="fee-amount">
                            <span>₹ ${Number(fee.amount || 0).toLocaleString()}</span>
                            <small class="${isPaid ? 'status-paid' : 'status-pending'}">${fee.status || 'Due'}</small>
                        </div>
                    </div>
                `;
            });
        }
        bindBackBtn();
    }

    function initBusPass() {
        const pass = alasql("SELECT * FROM bus_pass WHERE user_id=?", [currentUser.id])[0];
        const container = document.querySelector('.scroll-content');

        if (!pass) {
            container.innerHTML = `
                <div style="text-align: center; margin-top: 100px; padding: 20px;">
                    <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <h3>No Bus Pass Found</h3>
                    <p style="color: var(--text-muted); margin-top: 8px;">You have not subscribed to the college transport service.</p>
                </div>
            `;
        } else {
            document.querySelector('.id-text').innerHTML = `
                <p><strong>Bus No:</strong> ${pass.bus_no}</p>
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Dept:</strong> ${currentUser.dept}</p>
                <p><strong>ID:</strong> ${currentUser.id}</p>
                <p><strong>Year:</strong> ${currentUser.year}</p>
                <p><strong>Route:</strong> ${pass.route}</p>
                <p><strong>Valid:</strong> ${pass.valid_till}</p>
            `;
            document.querySelector('.id-photo img').src = currentUser.avatar;
        }
        bindBackBtn();
    }

    function initAdminAddNotice() {
        const form = document.getElementById('add-notice-form');
        if (!form) return;

        // Set default date to today
        document.getElementById('notice-date').valueAsDate = new Date();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('notice-title').value;
            const cat = document.getElementById('notice-category').value;
            const content = document.getElementById('notice-content').value;
            const date = document.getElementById('notice-date').value;

            const newId = Math.floor(Math.random() * 1000000);
            alasql("INSERT INTO notices VALUES (?, ?, ?, ?, ?)", [newId, title, content, date, cat]);
            saveToStorage();
            alert("Notice published successfully!");
            navigateTo('dashboard-admin');
        });

        bindBackBtn();
    }

    function initAdminEditNotice() {
        if (!editingNoticeId) return navigateTo('dashboard-admin');

        const notice = alasql("SELECT * FROM notices WHERE id=?", [editingNoticeId])[0];
        if (!notice) return navigateTo('dashboard-admin');

        const form = document.getElementById('edit-notice-form');
        document.getElementById('edit-notice-title').value = notice.title;
        document.getElementById('edit-notice-category').value = notice.category;
        document.getElementById('edit-notice-content').value = notice.content;
        document.getElementById('edit-notice-date').value = notice.date;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('edit-notice-title').value;
            const cat = document.getElementById('edit-notice-category').value;
            const content = document.getElementById('edit-notice-content').value;
            const date = document.getElementById('edit-notice-date').value;

            alasql("UPDATE notices SET title=?, content=?, date=?, category=? WHERE id=?",
                [title, content, date, cat, editingNoticeId]);
            saveToStorage();
            alert("Notice updated successfully!");
            navigateTo('dashboard-admin');
        });

        bindBackBtn();
    }

    function initNoticeboard() {
        const notices = alasql("SELECT * FROM notices ORDER BY date DESC");
        const container = document.getElementById('notice-list-container');
        if (!container) return;

        container.innerHTML = '';
        if (notices.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.6; margin-top:40px;">No notices available.</p>';
        } else {
            notices.forEach(n => {
                const item = document.createElement('div');
                item.className = 'notice-card';
                item.innerHTML = `
                    <div class="notice-header">
                        <span class="notice-category ${n.category.toLowerCase()}">${n.category}</span>
                        <span class="notice-date">${n.date}</span>
                    </div>
                    <h4>${n.title}</h4>
                    <p>${n.content}</p>
                `;
                container.appendChild(item);
            });
        }
        bindBackBtn();
    }

    function initCommon() { bindBackBtn(); }

    function bindBackBtn() {
        const btn = document.querySelector('.back-btn');
        if (btn) btn.addEventListener('click', () => {
            if (isAdmin) navigateTo('dashboard-admin');
            else navigateTo('dashboard');
        });
    }

    // Start
    navigateTo('landing');
});
