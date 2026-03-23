document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabaseClient;
    const app = document.getElementById('app');
    
    let currentUser = null;
    let isAdmin = false;
    let editingUserId = null;
    let editingNoticeId = null;

    // --- Utils ---
    const showLoading = () => {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(loader);
    };

    const hideLoading = () => {
        const loader = document.getElementById('app-loader');
        if (loader) loader.remove();
    };

    // --- Router ---
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
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const id = document.getElementById('college-id').value;
                const pass = document.getElementById('password').value;

                showLoading();
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .eq('password', pass)
                    .single();
                hideLoading();

                if (data) {
                    currentUser = data;
                    isAdmin = false;
                    navigateTo('dashboard');
                } else {
                    alert("Invalid Student Credentials!");
                }
            });
        }
    }

    function initLoginAdmin() {
        document.getElementById('admin-login-back').addEventListener('click', () => navigateTo('landing'));

        const form = document.querySelector('#admin-login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = document.getElementById('admin-user').value;
                const pass = document.getElementById('admin-pass').value;

                showLoading();
                const { data, error } = await supabase
                    .from('admins')
                    .select('*')
                    .eq('username', user)
                    .eq('password', pass)
                    .single();
                hideLoading();

                if (data) {
                    currentUser = data;
                    isAdmin = true;
                    navigateTo('dashboard-admin');
                } else {
                    alert("Invalid Admin Credentials!");
                }
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

    async function initDashboardAdmin() {
        if (!currentUser || !isAdmin) return navigateTo('landing');

        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            if (confirm('Logout?')) {
                currentUser = null;
                navigateTo('landing');
            }
        });

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

        const addNoticeBtn = document.getElementById('admin-add-notice-btn');
        if (addNoticeBtn) addNoticeBtn.addEventListener('click', () => navigateTo('admin-add-notice'));

        const listContainer = document.getElementById('admin-student-list');
        const searchInput = document.getElementById('student-search');
        const addBtn = document.getElementById('add-student-btn');

        addBtn.addEventListener('click', () => navigateTo('admin-add-student'));

        const renderList = async (filter = '') => {
            showLoading();
            let query = supabase.from('users').select('*');
            if (filter) {
                query = query.or(`name.ilike.%${filter}%,id.ilike.%${filter}%`);
            }
            const { data: users, error } = await query;
            hideLoading();

            if (error) return console.error(error);

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

        const renderFeesTab = async () => {
            const depts = ["CSE", "IT", "AIDS", "AIML", "MECH", "ECE", "EEE", "CIVIL"];
            const summaryList = document.getElementById('dept-summary-list');
            const chipBar = document.getElementById('fee-dept-filter-bar');
            const tableContainer = document.getElementById('fee-students-container');

            if (!summaryList || !chipBar || !tableContainer) return;

            summaryList.innerHTML = '<p style="padding:20px; text-align:center; opacity:0.5; width: 100%;">Calculating balances...</p>';
            
            // Render Summary Cards (using Supabase join/group)
            const { data: feeSummary, error: summaryErr } = await supabase
                .from('fees')
                .select('amount, users(dept)')
                .eq('status', 'Due');

            summaryList.innerHTML = '';
            depts.forEach(d => {
                const total = feeSummary
                    ? feeSummary.filter(f => f.users && f.users.dept.includes(d)).reduce((sum, f) => sum + (f.amount || 0), 0)
                    : 0;

                const card = document.createElement('div');
                card.className = 'dept-fee-card';
                card.innerHTML = `<div><h4>${d}</h4><p class="balance">₹ ${total.toLocaleString()}</p></div>`;
                summaryList.appendChild(card);
            });

            // Render Filter Chips
            chipBar.innerHTML = '';
            ['All Depts', ...depts].forEach(d => {
                const chip = document.createElement('div');
                chip.className = `dept-chip ${d === 'All Depts' ? 'active' : ''}`;
                chip.innerText = d;
                chip.addEventListener('click', () => {
                    chipBar.querySelectorAll('.dept-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    renderReport(d === 'All Depts' ? null : d);
                });
                chipBar.appendChild(chip);
            });

            const renderReport = async (filterDept = null) => {
                showLoading();
                let query = supabase.from('users').select('id, name, dept');
                if (filterDept) query = query.ilike('dept', `%${filterDept}%`);
                const { data: users } = await query;

                tableContainer.innerHTML = '';
                for (let u of users) {
                    const { data: userFees } = await supabase.from('fees').select('status, amount').eq('user_id', u.id);
                    let paid = 0, due = 0;
                    userFees?.forEach(f => {
                        if (f.status === 'Paid') paid += f.amount;
                        if (f.status === 'Due') due += f.amount;
                    });

                    const row = document.createElement('div');
                    row.className = 'fee-table-row';
                    row.innerHTML = `
                        <div class="student-name-cell"><strong>${u.name}</strong><small>${u.dept}</small></div>
                        <div class="row-paid">₹ ${paid.toLocaleString()}</div>
                        <div class="row-due">₹ ${due.toLocaleString()}</div>
                        <div class="row-total">₹ ${(paid + due).toLocaleString()}</div>
                    `;
                    tableContainer.appendChild(row);
                }
                hideLoading();
            };
            renderReport();

            // Activity List
            const activityList = document.getElementById('fee-activity-list');
            const { data: recentFees } = await supabase.from('fees').select('*, users(name)').order('payment_date', { ascending: false }).limit(10);
            activityList.innerHTML = '';
            recentFees?.forEach(f => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div><div style="font-weight:600">${f.users?.name || 'Unknown'}</div><div style="font-size:12px; color:var(--text-muted)">${f.semester} - ₹ ${f.amount.toLocaleString()}</div></div>
                    <div class="tag ${f.status === 'Paid' ? 'success' : 'unpaid'}" style="background:rgba(255,255,255,0.1)">${f.status}</div>
                `;
                activityList.appendChild(item);
            });
        };

        const renderAdminNoticesTab = async () => {
            showLoading();
            const { data: notices } = await supabase.from('notices').select('*').order('date', { ascending: false });
            hideLoading();
            const container = document.getElementById('admin-notice-list');
            container.innerHTML = notices?.length ? '' : '<p style="text-align:center; padding:40px; opacity:0.5;">No active notices found.</p>';
            notices?.forEach(n => {
                const div = document.createElement('div');
                div.className = 'student-list-item';
                div.innerHTML = `
                    <div style="flex:1"><span class="notice-category ${n.category.toLowerCase()}" style="font-size:10px">${n.category}</span><h4 style="margin-top:6px">${n.title}</h4><p style="font-size:11px">${n.date}</p></div>
                    <div style="display:flex; gap:12px;">
                        <button class="icon-btn edit-notice" style="color:var(--accent)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="icon-btn delete-notice" style="color:var(--danger)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                `;
                div.querySelector('.edit-notice').onclick = (e) => { e.stopPropagation(); editingNoticeId = n.id; navigateTo('admin-edit-notice'); };
                div.querySelector('.delete-notice').onclick = async (e) => { e.stopPropagation(); if (confirm('Delete?')) { await supabase.from('notices').delete().eq('id', n.id); renderAdminNoticesTab(); }};
                container.appendChild(div);
            });
        };

        renderList();
        searchInput.oninput = (e) => renderList(e.target.value);
    }

    async function initAdminEditUser() {
        if (!editingUserId) return navigateTo('dashboard-admin');

        showLoading();
        const { data: user } = await supabase.from('users').select('*').eq('id', editingUserId).single();
        const { data: fees } = await supabase.from('fees').select('*').eq('user_id', editingUserId);
        const { data: busPass } = await supabase.from('bus_pass').select('*').eq('user_id', editingUserId).single();
        hideLoading();

        const avatarImg = document.querySelector('#edit-avatar-preview img');
        avatarImg.src = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;

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
        fees?.forEach(fee => {
            const row = document.createElement('div');
            row.className = 'edit-fee-row';
            row.innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
                    <input type="text" class="fee-sem" value="${fee.semester}">
                    <input type="number" class="fee-amount" value="${fee.amount}">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <select class="fee-status"><option value="Paid" ${fee.status === 'Paid' ? 'selected' : ''}>Paid</option><option value="Due" ${fee.status === 'Due' ? 'selected' : ''}>Due</option></select>
                    <input type="date" class="fee-date" value="${fee.payment_date || ''}">
                </div>
                <input type="hidden" class="fee-id" value="${fee.id}">
            `;
            feeContainer.appendChild(row);
        });

        document.getElementById('delete-student-btn').onclick = async () => {
            if (confirm('Delete student?')) { await supabase.from('users').delete().eq('id', editingUserId); navigateTo('dashboard-admin'); }
        };

        document.getElementById('edit-user-form').onsubmit = async (e) => {
            e.preventDefault();
            showLoading();
            await supabase.from('users').update({
                name: document.getElementById('edit-name').value,
                dept: document.getElementById('edit-dept').value,
                year: document.getElementById('edit-year').value,
                password: document.getElementById('edit-password').value
            }).eq('id', editingUserId);

            const busData = { route: document.getElementById('edit-bus-route').value, bus_no: document.getElementById('edit-bus-no').value, valid_till: document.getElementById('edit-bus-valid').value };
            if (busData.route) await supabase.from('bus_pass').upsert({ user_id: editingUserId, ...busData });

            const feeRows = document.querySelectorAll('.edit-fee-row');
            for (let row of feeRows) {
                const feeData = { semester: row.querySelector('.fee-sem').value, amount: parseInt(row.querySelector('.fee-amount').value), status: row.querySelector('.fee-status').value, payment_date: row.querySelector('.fee-date').value };
                const feeId = row.querySelector('.fee-id')?.value;
                if (feeId) await supabase.from('fees').update(feeData).eq('id', feeId);
                else await supabase.from('fees').insert({ user_id: editingUserId, id: Math.floor(Date.now() * Math.random()), ...feeData });
            }
            hideLoading();
            alert("Updated!");
            navigateTo('dashboard-admin');
        };
        bindBackBtn();
    }

    function initAddStudent() {
        document.getElementById('add-student-form').onsubmit = async (e) => {
            e.preventDefault();
            showLoading();
            const newUser = {
                id: document.getElementById('add-id').value,
                name: document.getElementById('add-name').value,
                dept: document.getElementById('add-dept').value,
                year: document.getElementById('add-year').value,
                password: document.getElementById('add-password').value,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${document.getElementById('add-name').value}`
            };
            const { error } = await supabase.from('users').insert(newUser);
            hideLoading();
            if (error) alert("Error: " + error.message);
            else navigateTo('dashboard-admin');
        };
        bindBackBtn();
    }

    async function initProfile() {
        showLoading();
        const { data: user } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
        hideLoading();
        document.querySelector('.profile-header-card h3').innerText = user.name;
        document.querySelector('.profile-header-card p').innerText = user.id;
        document.querySelector('.avatar-large img').src = user.avatar;
        const setVal = (label, val) => {
            document.querySelectorAll('.info-item').forEach(item => {
                if (item.querySelector('label').innerText.includes(label)) item.querySelector('.value').innerText = val || 'N/A';
            });
        };
        setVal('Register Number', user.id);
        setVal('Year', user.year);
        setVal('Department', user.dept);
        setVal('Address', user.address);
        setVal('Mobile', user.mobile);
        setVal('Email', user.email);
        bindBackBtn();
    }

    async function initFees() {
        showLoading();
        const { data: fees } = await supabase.from('fees').select('*').eq('user_id', currentUser.id);
        hideLoading();
        let totalDue = fees?.filter(f => f.status === 'Due').reduce((s, f) => s + f.amount, 0) || 0;
        document.querySelector('.balance-card h2').innerText = `₹ ${totalDue.toLocaleString()}`;
        
        const listContainer = document.querySelector('.fee-list');
        listContainer.innerHTML = fees?.length ? '' : '<p style="text-align:center; opacity:0.6; margin-top:40px;">No fees.</p>';
        fees?.forEach(fee => {
            const isPaid = fee.status === 'Paid';
            listContainer.innerHTML += `
                <div class="fee-item ${isPaid ? 'success' : ''}">
                    <div class="fee-info"><h4>${fee.semester}</h4><p>Tuition Fee ${isPaid && fee.payment_date ? `(Paid: ${fee.payment_date})` : ''}</p></div>
                    <div class="fee-amount"><span>₹ ${fee.amount.toLocaleString()}</span><small class="${isPaid ? 'status-paid' : 'status-pending'}">${fee.status}</small></div>
                </div>`;
        });
        bindBackBtn();
    }

    async function initBusPass() {
        showLoading();
        const { data: pass } = await supabase.from('bus_pass').select('*').eq('user_id', currentUser.id).single();
        hideLoading();
        const container = document.querySelector('.scroll-content');
        if (!pass) {
            container.innerHTML = '<div style="text-align:center;margin-top:100px;"><h3>No Bus Pass Found</h3></div>';
        } else {
            document.querySelector('.id-text').innerHTML = `
                <p><strong>Bus No:</strong> ${pass.bus_no}</p><p><strong>Name:</strong> ${currentUser.name}</p><p><strong>Dept:</strong> ${currentUser.dept}</p>
                <p><strong>ID:</strong> ${currentUser.id}</p><p><strong>Year:</strong> ${currentUser.year}</p><p><strong>Route:</strong> ${pass.route}</p><p><strong>Valid:</strong> ${pass.valid_till}</p>`;
            document.querySelector('.id-photo img').src = currentUser.avatar;
        }
        bindBackBtn();
    }

    function initAdminAddNotice() {
        document.getElementById('notice-date').valueAsDate = new Date();
        document.getElementById('add-notice-form').onsubmit = async (e) => {
            e.preventDefault();
            showLoading();
            await supabase.from('notices').insert({
                id: Math.floor(Date.now() * Math.random()),
                title: document.getElementById('notice-title').value,
                category: document.getElementById('notice-category').value,
                content: document.getElementById('notice-content').value,
                date: document.getElementById('notice-date').value
            });
            hideLoading();
            navigateTo('dashboard-admin');
        };
        bindBackBtn();
    }

    async function initAdminEditNotice() {
        const { data: n } = await supabase.from('notices').select('*').eq('id', editingNoticeId).single();
        document.getElementById('edit-notice-title').value = n.title;
        document.getElementById('edit-notice-category').value = n.category;
        document.getElementById('edit-notice-content').value = n.content;
        document.getElementById('edit-notice-date').value = n.date;
        document.getElementById('edit-notice-form').onsubmit = async (e) => {
            e.preventDefault();
            await supabase.from('notices').update({
                title: document.getElementById('edit-notice-title').value,
                category: document.getElementById('edit-notice-category').value,
                content: document.getElementById('edit-notice-content').value,
                date: document.getElementById('edit-notice-date').value
            }).eq('id', editingNoticeId);
            navigateTo('dashboard-admin');
        };
        bindBackBtn();
    }

    async function initNoticeboard() {
        showLoading();
        const { data: notices } = await supabase.from('notices').select('*').order('date', { ascending: false });
        hideLoading();
        const container = document.getElementById('notice-list-container');
        container.innerHTML = notices?.length ? '' : '<p style="text-align:center; opacity:0.6; margin-top:40px;">No notices.</p>';
        notices?.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notice-card';
            item.innerHTML = `<div class="notice-header"><span class="notice-category ${n.category.toLowerCase()}">${n.category}</span><span class="notice-date">${n.date}</span></div><h4>${n.title}</h4><p>${n.content}</p>`;
            container.appendChild(item);
        });
        bindBackBtn();
    }

    function initCommon() { bindBackBtn(); }
    function bindBackBtn() {
        const btn = document.querySelector('.back-btn');
        if (btn) btn.onclick = () => navigateTo(isAdmin ? 'dashboard-admin' : 'dashboard');
    }

    navigateTo('landing');
});
