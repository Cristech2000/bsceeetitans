// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
    apiKey: "AIzaSyD3oMlsv9C3Qepvkw_Y1JVfhVJiMwZLox4",
    authDomain: "bsceee-webpage.firebaseapp.com",
    databaseURL: "https://bsceee-webpage-default-rtdb.firebaseio.com",
    projectId: "bsceee-webpage",
    storageBucket: "bsceee-webpage.appspot.com",
    messagingSenderId: "281106710079",
    appId: "1:281106710079:web:2c6ab931bc3cab8e4e428a",
    measurementId: "G-B1M7SSEZYP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ==================== GLOBAL VARIABLES ====================
let currentPage = 'home';
let currentEditingSection = '';
let currentUser = null;
let isAdmin = false;

// Announcements
let allAnnouncements = [];
let currentFilter = 'all';

// Practical Hub
let cart = JSON.parse(localStorage.getItem('practicalHubCart')) || [];
let allProducts = [];
let currentImageFile = null;
let currentImageUrl = '';
let currentProductId = null;

// Personnel
let currentSemester = 'year1sem1';

// Timetable
let currentTimetableType = 'regular';

// Custom Sections
let customSectionsLoaded = false;

// ==================== PAGE NAVIGATION ====================
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.style.display = 'block';
        currentPage = pageName;
    }
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    // Load page-specific data
    if (pageName === 'home') {
        loadHomeContent();
        loadCustomSections();
    } else if (pageName === 'studydocs') {
        loadStudyDocuments();
    } else if (pageName === 'announcements') {
        loadPublicAnnouncements();
    } else if (pageName === 'practicalHub') {
        loadProducts();
        updateCartDisplay();
    } else if (pageName === 'personnel') {
        loadClassLeadership();
        loadFacultyLeadership();
        loadLecturers('year1sem1');
    } else if (pageName === 'timetable') {
        loadTimetableData();
    } else if (pageName === 'adminDashboard') {
        if (isAdmin) {
            loadAdminDashboard();
        } else {
            showPage('adminLogin');
        }
    }
    
    updateActiveNav(pageName);
    document.getElementById('currentSection').textContent = getPageTitle(pageName);
}

function updateActiveNav(pageName) {
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${pageName}'`)) {
            link.classList.add('active');
        }
    });
}

function getPageTitle(pageName) {
    const titles = {
        'home': 'Home',
        'timetable': 'Timetable',
        'assignments': 'Assignments',
        'studydocs': 'Study Documents',
        'announcements': 'Announcements',
        'practicalHub': 'Practical Electronics Hub',
        'gallery': 'Gallery',
        'sports': 'Sports',
        'personnel': 'Personnel',
        'registration': 'Registration',
        'support': 'Academic Support',
        'adminLogin': 'Admin Login',
        'adminDashboard': 'Admin Dashboard'
    };
    return titles[pageName] || pageName;
}

// ==================== AUTHENTICATION ====================
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        checkAdminStatus(user.uid);
    } else {
        isAdmin = false;
        hideAdminFeatures();
    }
});

function checkAdminStatus(uid) {
    db.ref('admins/' + uid).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            isAdmin = true;
            showAdminFeatures();
        } else {
            isAdmin = false;
            hideAdminFeatures();
        }
    });
}

function showAdminFeatures() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });
    document.getElementById('adminIndicator').style.display = 'flex';
    document.getElementById('adminDashboardLink').style.display = 'flex';
    document.getElementById('adminLoginLink').style.display = 'none';
    document.getElementById('adminControls').style.display = 'block';
}

function hideAdminFeatures() {
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.style.display = 'none';
    });
    document.getElementById('adminIndicator').style.display = 'none';
    document.getElementById('adminDashboardLink').style.display = 'none';
    document.getElementById('adminLoginLink').style.display = 'flex';
    if (document.getElementById('adminControls')) {
        document.getElementById('adminControls').style.display = 'none';
    }
}

// Admin Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginErrorMessage');
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const snapshot = await db.ref('admins/' + userCredential.user.uid).once('value');
        
        if (snapshot.exists()) {
            showPage('adminDashboard');
        } else {
            await auth.signOut();
            errorDiv.textContent = 'Access denied. You are not authorized as an admin.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        let message = 'Login failed. Please try again.';
        if (error.code === 'auth/invalid-email') message = 'Invalid email address.';
        else if (error.code === 'auth/user-not-found') message = 'No account found with this email.';
        else if (error.code === 'auth/wrong-password') message = 'Incorrect password.';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
});

function logout() {
    auth.signOut().then(() => {
        showPage('home');
        location.reload();
    });
}

// ==================== HOME PAGE CONTENT ====================
function loadHomeContent() {
    // Hero Section
    db.ref('websiteContent/hero').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('heroTitle').textContent = data.title;
            document.getElementById('heroSubtitle').textContent = data.subtitle;
        }
    });
    
    // About Section
    db.ref('websiteContent/about').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('aboutContent').textContent = data.content;
        }
    });
    
    // Features Section
    db.ref('websiteContent/features').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('featuresContent').innerHTML = data.content;
        }
    });
    
    // News Section
    db.ref('websiteContent/news').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('newsContent').innerHTML = data.content;
        }
    });
    
    // Fun Facts
    db.ref('websiteContent/funFacts').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.items) {
            const factsList = document.getElementById('funFactsContent');
            factsList.innerHTML = '';
            data.items.forEach(fact => {
                const li = document.createElement('li');
                li.textContent = fact;
                factsList.appendChild(li);
            });
        }
    });
    
    // Spotlight
    db.ref('websiteContent/spotlight').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('spotlightContent').innerHTML = data.content;
        }
    });
    
    // Quiz
    db.ref('websiteContent/quiz').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('quizContent').innerHTML = data.content;
        }
    });
}

// Admin Editor Functions
function openEditor(section) {
    if (!isAdmin) return;
    
    currentEditingSection = section;
    const modal = document.getElementById('adminModal');
    const editor = document.getElementById('contentEditor');
    const modalTitle = document.getElementById('modalTitle');
    
    const sectionTitles = {
        'hero': 'Edit Hero Section',
        'about': 'Edit About Section',
        'features': 'Edit Features Section',
        'news': 'Edit News Section',
        'funFacts': 'Edit Fun Facts',
        'spotlight': 'Edit Student Spotlight',
        'quiz': 'Edit Weekly Quiz'
    };
    modalTitle.textContent = sectionTitles[section] || 'Edit Content';
    
    let currentContent = '';
    switch(section) {
        case 'hero':
            currentContent = document.getElementById('heroTitle').textContent + '\n---\n' + document.getElementById('heroSubtitle').textContent;
            break;
        case 'about':
            currentContent = document.getElementById('aboutContent').textContent;
            break;
        case 'features':
            currentContent = document.getElementById('featuresContent').innerHTML;
            break;
        case 'news':
            currentContent = document.getElementById('newsContent').innerHTML;
            break;
        case 'funFacts':
            const facts = Array.from(document.getElementById('funFactsContent').getElementsByTagName('li')).map(li => li.textContent);
            currentContent = facts.join('\n');
            break;
        case 'spotlight':
            currentContent = document.getElementById('spotlightContent').innerHTML;
            break;
        case 'quiz':
            currentContent = document.getElementById('quizContent').innerHTML;
            break;
    }
    
    editor.value = currentContent;
    modal.style.display = 'block';
}

function closeEditor() {
    document.getElementById('adminModal').style.display = 'none';
}

function saveContent() {
    const newContent = document.getElementById('contentEditor').value;
    
    switch(currentEditingSection) {
        case 'hero':
            const lines = newContent.split('\n---\n');
            db.ref('websiteContent/hero').set({ title: lines[0] || '', subtitle: lines[1] || '' });
            break;
        case 'about':
            db.ref('websiteContent/about').set({ content: newContent });
            break;
        case 'features':
            db.ref('websiteContent/features').set({ content: newContent });
            break;
        case 'news':
            db.ref('websiteContent/news').set({ content: newContent });
            break;
        case 'funFacts':
            const facts = newContent.split('\n').filter(fact => fact.trim() !== '');
            db.ref('websiteContent/funFacts').set({ items: facts });
            break;
        case 'spotlight':
            db.ref('websiteContent/spotlight').set({ content: newContent });
            break;
        case 'quiz':
            db.ref('websiteContent/quiz').set({ content: newContent });
            break;
    }
    
    closeEditor();
    alert('Content updated successfully!');
}

// ==================== CUSTOM SECTIONS ====================
function loadCustomSections() {
    if (customSectionsLoaded) return;
    
    db.ref('customSections').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        const container = document.getElementById('customSectionsContainer');
        container.innerHTML = '';
        
        const sectionsArray = Object.keys(data).map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => a.order - b.order);
        
        sectionsArray.forEach(section => {
            const sectionHtml = renderCustomSection(section);
            container.insertAdjacentHTML('beforeend', sectionHtml);
        });
        
        customSectionsLoaded = true;
    });
}

function renderCustomSection(section) {
    let contentHtml = '';
    
    switch(section.type) {
        case 'text':
            contentHtml = `<div class="text-content">${(section.content || '').replace(/\n/g, '<br>')}</div>`;
            break;
        case 'documents':
            if (section.documents && section.documents.length > 0) {
                contentHtml = `<div class="documents-grid">${section.documents.map(doc => `
                    <div class="document-card">
                        <h4>${doc.title}</h4>
                        ${doc.description ? `<p>${doc.description}</p>` : ''}
                        <a href="${doc.link}" target="_blank" class="doc-link">Download</a>
                    </div>
                `).join('')}</div>`;
            } else {
                contentHtml = '<p>No documents available.</p>';
            }
            break;
        case 'links':
            if (section.links && section.links.length > 0) {
                contentHtml = `<div class="links-list">${section.links.map(link => `
                    <div class="link-item">
                        <a href="${link.url}" target="_blank" class="link-url">${link.text}</a>
                        ${link.description ? `<p class="link-desc">${link.description}</p>` : ''}
                    </div>
                `).join('')}</div>`;
            } else {
                contentHtml = '<p>No links available.</p>';
            }
            break;
        case 'custom':
            contentHtml = section.customHTML || '<p>No content available.</p>';
            break;
    }
    
    return `
        <section class="custom-section" id="${section.id}">
            <h2>${section.title}</h2>
            ${contentHtml}
            ${isAdmin ? `<button class="admin-edit-btn" onclick="editCustomSection('${section.id}')">Edit Section</button>` : ''}
        </section>
    `;
}

function editCustomSection(sectionId) {
    window.location.href = 'admin-dashboard.html';
}

// ==================== TIMETABLE ====================
function loadTimetableData() {
    // Regular timetable
    db.ref('timetable/regular').once('value').then(snapshot => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('regularPeriod').textContent = data.period || 'Current Academic Period';
            displayRegularTimetable(data.schedule);
        } else {
            document.getElementById('regularTimetableContent').innerHTML = '<div class="no-timetable">No timetable data available.</div>';
        }
    });
    
    // Exam timetable
    db.ref('timetable/exam').once('value').then(snapshot => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('examPeriod').textContent = data.period || 'Current Examination Period';
            displayExamTimetable(data.schedule);
        } else {
            document.getElementById('examTimetableContent').innerHTML = '<div class="no-timetable">No exam schedule available.</div>';
        }
    });
}

function showTimetableType(type) {
    currentTimetableType = type;
    
    document.querySelectorAll('.timetable-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    document.getElementById('regularTimetable').style.display = type === 'regular' ? 'block' : 'none';
    document.getElementById('examTimetable').style.display = type === 'exam' ? 'block' : 'none';
}

function displayRegularTimetable(schedule) {
    if (!schedule || !Array.isArray(schedule)) {
        document.getElementById('regularTimetableContent').innerHTML = '<div class="no-timetable">No timetable data available.</div>';
        return;
    }
    
    const timeOrder = { '7:00 AM - 10:00 AM': 1, '10:00 AM - 1:00 PM': 2, '1:00 PM - 4:00 PM': 3, '4:00 PM - 7:00 PM': 4 };
    const sortedSchedule = [...schedule].sort((a, b) => (timeOrder[a.timeSlot] || 0) - (timeOrder[b.timeSlot] || 0));
    
    let html = `<table class="timetable-table"><thead><tr><th>Time/Day</th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr></thead><tbody>`;
    
    sortedSchedule.forEach(dayData => {
        html += `<tr>
            <td class="time-slot">${dayData.timeSlot}</td>
            <td>${formatClassInfo(dayData.Monday)}</td>
            <td>${formatClassInfo(dayData.Tuesday)}</td>
            <td>${formatClassInfo(dayData.Wednesday)}</td>
            <td>${formatClassInfo(dayData.Thursday)}</td>
            <td>${formatClassInfo(dayData.Friday)}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('regularTimetableContent').innerHTML = html;
}

function displayExamTimetable(schedule) {
    if (!schedule || Object.keys(schedule).length === 0) {
        document.getElementById('examTimetableContent').innerHTML = '<div class="no-timetable">No exam schedule available.</div>';
        return;
    }
    
    let html = `<table class="timetable-table"><thead><tr><th>Date</th><th>Time</th><th>Unit Code</th><th>Unit Name</th><th>Venue</th></tr></thead><tbody>`;
    
    Object.keys(schedule).forEach(examId => {
        const exam = schedule[examId];
        if (exam.date && exam.unitCode) {
            html += `<tr>
                <td>${formatDate(exam.date)}</td>
                <td>${exam.time || 'TBA'}</td>
                <td class="unit-code">${exam.unitCode}</td>
                <td>${exam.unitName || ''}</td>
                <td class="venue">${exam.venue || 'TBA'}</td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    document.getElementById('examTimetableContent').innerHTML = html;
}

function formatClassInfo(info) {
    if (!info) return '';
    return info.split('\n').filter(line => line.trim()).map(line => {
        if (line.includes(',')) {
            const parts = line.split(',');
            return `<div class="unit-code">${parts[0].trim()}</div><div class="venue">${parts.slice(1).join(',').trim()}</div>`;
        }
        return `<div>${line}</div>`;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'TBA';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

// ==================== STUDY DOCUMENTS ====================
function loadStudyDocuments() {
    const loadingEl = document.getElementById('loadingState');
    const errorEl = document.getElementById('errorState');
    const container = document.getElementById('studyDocsContainer');
    
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    
    db.ref('studyDocuments').once('value').then(snapshot => {
        const data = snapshot.val();
        loadingEl.style.display = 'none';
        
        if (!data) {
            container.innerHTML = '<p>No study documents available yet.</p>';
            return;
        }
        
        container.innerHTML = generateStudyDocsHTML(data);
        attachCollapsibleListeners();
    }).catch(error => {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
    });
}

function generateStudyDocsHTML(data) {
    let html = '';
    const predefinedOrder = ['year1sem1', 'year1sem2', 'year2sem1', 'year2sem2'];
    const semesters = Object.keys(data);
    const customSemesters = semesters.filter(s => !predefinedOrder.includes(s)).sort();
    const sortedSemesters = [...predefinedOrder.filter(s => semesters.includes(s)), ...customSemesters];
    
    sortedSemesters.forEach(semesterKey => {
        const semesterName = getSemesterDisplayName(semesterKey);
        html += `<div class="semester"><button class="collapsible">${semesterName}</button><div class="content">`;
        
        const sortedCourses = Object.keys(data[semesterKey]).sort();
        sortedCourses.forEach(courseCode => {
            const courseData = data[semesterKey][courseCode];
            html += `<div class="unit"><button class="collapsible">${courseCode}</button><div class="content"><ul>`;
            
            const documents = Object.values(courseData).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            documents.forEach(doc => {
                const icon = doc.type === 'exam' ? '📝' : doc.type === 'cat' ? '📊' : '📓';
                html += `<li><a href="${doc.driveLink}" target="_blank">${icon} ${doc.title}</a></li>`;
            });
            
            html += `</ul></div></div>`;
        });
        
        html += `</div></div>`;
    });
    
    return html;
}

function getSemesterDisplayName(key) {
    const names = { 'year1sem1': 'Year 1 Semester 1', 'year1sem2': 'Year 1 Semester 2', 'year2sem1': 'Year 2 Semester 1', 'year2sem2': 'Year 2 Semester 2' };
    if (names[key]) return names[key];
    return key.replace(/(year)(\d+)(sem)(\d+)/, 'Year $2 Semester $4').replace(/\b\w/g, l => l.toUpperCase());
}

function attachCollapsibleListeners() {
    document.querySelectorAll('.collapsible').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
    });
}

// ==================== PUBLIC ANNOUNCEMENTS ====================
function loadPublicAnnouncements() {
    const loadingEl = document.getElementById('announcementsLoading');
    const containerEl = document.getElementById('announcementsContainer');
    const noAnnouncementsEl = document.getElementById('noAnnouncements');
    
    loadingEl.style.display = 'block';
    
    db.ref('announcements').orderByChild('createdAt').once('value').then(snapshot => {
        const data = snapshot.val();
        loadingEl.style.display = 'none';
        
        if (!data) {
            noAnnouncementsEl.style.display = 'block';
            return;
        }
        
        allAnnouncements = Object.keys(data).map(key => ({ id: key, ...data[key] }))
            .filter(ann => ann.status === 'active' && ann.showOnWebsite !== false && (!ann.expiry || new Date(ann.expiry) > new Date()))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (allAnnouncements.length === 0) {
            noAnnouncementsEl.style.display = 'block';
            return;
        }
        
        containerEl.style.display = 'block';
        displayAnnouncements(allAnnouncements);
        updateNotificationBadge();
    }).catch(error => {
        loadingEl.innerHTML = '<div style="color: red;">Error loading announcements. Please try again.</div>';
    });
}

function displayAnnouncements(announcements) {
    const container = document.getElementById('announcementsContainer');
    container.innerHTML = '';
    
    announcements.forEach(ann => {
        const date = new Date(ann.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        const typeConfig = {
            'info': { class: 'type-info', icon: 'ℹ️', label: 'Information' },
            'warning': { class: 'type-warning', icon: '⚠️', label: 'Warning' },
            'important': { class: 'type-important', icon: '❗', label: 'Important' },
            'urgent': { class: 'type-urgent', icon: '🚨', label: 'Urgent' },
            'event': { class: 'type-event', icon: '📅', label: 'Event' },
            'success': { class: 'type-success', icon: '✅', label: 'Success' }
        };
        
        const config = typeConfig[ann.type] || typeConfig.info;
        const audienceText = { 'all': '👥 All Students', 'year2': '🎓 Year 2 Students', 'bsc-eee': '⚡ BSC EEE Students' }[ann.audience] || ann.audience;
        
        container.innerHTML += `
            <div class="announcement-item">
                <div class="announcement-type ${config.class}">${config.icon} ${config.label}</div>
                <h2 class="announcement-title">${ann.title}${ann.important ? '<span class="important-star"><i class="fas fa-star"></i></span>' : ''}</h2>
                <div class="announcement-message">${ann.message.replace(/\n/g, '<br>')}</div>
                ${ann.link ? `<a href="${ann.link}" target="_blank" class="announcement-link"><i class="fas fa-external-link-alt"></i> More Information</a>` : ''}
                <div class="announcement-footer">
                    <div class="announcement-date"><i class="far fa-clock"></i> ${formattedDate}</div>
                    <div class="announcement-audience"><i class="fas fa-users"></i> ${audienceText}</div>
                </div>
            </div>
        `;
    });
}

function filterAnnouncements(filterType) {
    currentFilter = filterType;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filtered = allAnnouncements;
    if (filterType === 'important') filtered = allAnnouncements.filter(ann => ann.important || ann.type === 'important');
    else if (filterType === 'urgent') filtered = allAnnouncements.filter(ann => ann.type === 'urgent');
    else if (filterType === 'event') filtered = allAnnouncements.filter(ann => ann.type === 'event');
    else if (filterType === 'info') filtered = allAnnouncements.filter(ann => ann.type === 'info' || ann.type === 'success');
    
    displayAnnouncements(filtered);
    
    const noAnnouncementsEl = document.getElementById('noAnnouncements');
    const containerEl = document.getElementById('announcementsContainer');
    if (filtered.length === 0) {
        noAnnouncementsEl.style.display = 'block';
        containerEl.style.display = 'none';
    } else {
        noAnnouncementsEl.style.display = 'none';
        containerEl.style.display = 'block';
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    
    db.ref('announcements').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) {
            badge.textContent = '0';
            badge.style.display = 'none';
            return;
        }
        
        const count = Object.keys(data).length;
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count.toString();
            badge.style.display = 'flex';
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    });
}

// ==================== PERSONNEL ====================
function loadClassLeadership() {
    const grid = document.getElementById('classLeadershipGrid');
    db.ref('personnel/classLeadership').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) { grid.innerHTML = '<div class="no-data">No class leadership data.</div>'; return; }
        
        grid.innerHTML = '';
        Object.keys(data).forEach(key => {
            const p = data[key];
            grid.innerHTML += `<div class="person"><h3>${p.position || 'Position'}</h3><p><strong>Name:</strong> ${p.name || 'N/A'}</p><p><strong>Phone:</strong> ${p.phone || 'N/A'}</p><p><strong>Role:</strong> ${p.role || 'N/A'}</p></div>`;
        });
    });
}

function loadFacultyLeadership() {
    const grid = document.getElementById('facultyLeadershipGrid');
    db.ref('personnel/facultyLeadership').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) { grid.innerHTML = '<div class="no-data">No faculty leadership data.</div>'; return; }
        
        grid.innerHTML = '';
        Object.keys(data).forEach(key => {
            const p = data[key];
            grid.innerHTML += `<div class="person"><h3>${p.position || 'Position'}</h3><p><strong>Name:</strong> ${p.name || 'N/A'}</p><p><strong>Phone:</strong> ${p.phone || 'N/A'}</p><p><strong>Role:</strong> ${p.role || 'N/A'}</p></div>`;
        });
    });
}

function loadLecturers(semester) {
    currentSemester = semester;
    const grid = document.getElementById('lecturersGrid');
    
    document.querySelectorAll('.semester-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    
    grid.innerHTML = '<div class="loading">Loading lecturers...</div>';
    
    db.ref(`personnel/lecturers/${semester}`).once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) { grid.innerHTML = '<div class="no-data">No lecturers for this semester.</div>'; return; }
        
        grid.innerHTML = '';
        Object.keys(data).forEach(key => {
            const l = data[key];
            grid.innerHTML += `<div class="lecturer-card"><h3>${l.course || 'Course'}</h3><p><strong>Name:</strong> ${l.name || 'N/A'}</p><p><strong>Phone:</strong> ${l.phone || 'N/A'}</p></div>`;
        });
    });
}

// ==================== REGISTRATION ====================
// Individual Registration
document.getElementById('individualRegForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.Name.value.trim();
    const regNo = e.target.RegNo.value.trim().toUpperCase();
    const phone = e.target.Phone.value.trim();
    
    if (!name || !regNo || !phone) { alert('Please fill in all fields.'); return; }
    
    try {
        const snapshot = await db.ref(`registrations/${regNo}`).get();
        if (snapshot.exists()) {
            alert('This registration number has already been used.');
        } else {
            await db.ref(`registrations/${regNo}`).set({ name, regNo, phone, timestamp: new Date().toISOString() });
            alert('Registration successful!');
            e.target.reset();
        }
    } catch (err) { alert('Something went wrong. Try again.'); }
});

// Group Registration
document.getElementById('groupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = document.getElementById('groupName').value.trim();
    const regInputs = document.querySelectorAll('.regInput');
    const regNos = [...regInputs].map(input => input.value.trim().toUpperCase());
    
    if (!groupName || regNos.some(r => !r) || new Set(regNos).size !== regNos.length) {
        alert('Please fill all registration numbers (no duplicates).');
        return;
    }
    
    try {
        const groupSnap = await db.ref(`groups/${groupName}`).get();
        if (groupSnap.exists()) { alert('Group name already exists!'); return; }
        
        const membersArray = [];
        for (const regNo of regNos) {
            const regSnap = await db.ref(`registrations/${regNo}`).get();
            if (!regSnap.exists()) { alert(`RegNo ${regNo} is not registered!`); return; }
            
            const inGroup = await checkIfInGroup(regNo);
            if (inGroup) { alert(`RegNo ${regNo} already belongs to another group!`); return; }
            
            membersArray.push({ regNo, name: regSnap.val().name });
        }
        
        await db.ref(`groups/${groupName}`).set({ groupName, members: membersArray, leader: regNos[0], timestamp: new Date().toISOString() });
        alert('Group Registered Successfully!');
        e.target.reset();
    } catch (err) { alert('Something went wrong.'); }
});

// Pending Students
document.getElementById('pendingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = e.target.RegNo.value.trim().toUpperCase();
    
    try {
        const regSnap = await db.ref(`registrations/${regNo}`).get();
        if (!regSnap.exists()) { alert('This registration number is not registered.'); return; }
        
        if (await checkIfInGroup(regNo)) { alert('You are already in a group!'); return; }
        
        const pendingSnap = await db.ref(`pending/${regNo}`).get();
        if (pendingSnap.exists()) { alert('You are already in the pending list!'); return; }
        
        await db.ref(`pending/${regNo}`).set({ regNo, name: regSnap.val().name, type: 'pending grouping', submittedAt: new Date().toISOString() });
        alert('Request submitted! You have been added to the pending list.');
        e.target.reset();
    } catch (err) { alert('Something went wrong.'); }
});

async function checkIfInGroup(regNo) {
    const groupsSnap = await db.ref('groups').get();
    if (!groupsSnap.exists()) return false;
    const groups = groupsSnap.val();
    for (const groupName in groups) {
        if (groups[groupName].members && groups[groupName].members.some(m => m.regNo === regNo)) return true;
    }
    return false;
}

// Trip Shift Registration
let shift1Count = 0, shift2Count = 0;
const SHIFT1_MAX = 51, SHIFT2_MAX = 52;

function loadShiftCounts() {
    db.ref('trip/shift1').on('value', snap => { shift1Count = snap.exists() ? Object.keys(snap.val()).length : 0; updateShiftStatus(); });
    db.ref('trip/shift2').on('value', snap => { shift2Count = snap.exists() ? Object.keys(snap.val()).length : 0; updateShiftStatus(); });
}

function updateShiftStatus() {
    document.getElementById('shift1Status').innerHTML = `Shift 1: ${shift1Count}/${SHIFT1_MAX} registered${shift1Count >= SHIFT1_MAX ? ' (FULL)' : ''}`;
    document.getElementById('shift2Status').innerHTML = `Shift 2: ${shift2Count}/${SHIFT2_MAX} registered${shift2Count >= SHIFT2_MAX ? ' (FULL)' : ''}`;
    document.getElementById('shift1Status').className = `shift-status ${shift1Count >= SHIFT1_MAX ? 'shift-full' : 'shift-available'}`;
    document.getElementById('shift2Status').className = `shift-status ${shift2Count >= SHIFT2_MAX ? 'shift-full' : 'shift-available'}`;
}

document.getElementById('tripForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('tripName').value.trim();
    const regNo = document.getElementById('tripRegNo').value.trim().toUpperCase();
    const shift = document.getElementById('tripShift').value;
    
    if (!name || !regNo || !shift) { alert('Please fill in all fields.'); return; }
    if ((shift === 'shift1' && shift1Count >= SHIFT1_MAX) || (shift === 'shift2' && shift2Count >= SHIFT2_MAX)) { alert('Selected shift is full!'); return; }
    
    try {
        const tripSnap = await db.ref('trip').get();
        let alreadyRegistered = false;
        if (tripSnap.exists()) {
            const data = tripSnap.val();
            if (data.shift1) for (const key in data.shift1) if (data.shift1[key].regNo === regNo) alreadyRegistered = true;
            if (!alreadyRegistered && data.shift2) for (const key in data.shift2) if (data.shift2[key].regNo === regNo) alreadyRegistered = true;
        }
        if (alreadyRegistered) { alert('This registration number is already registered!'); return; }
        
        const newRef = db.ref(`trip/${shift}`).push();
        await newRef.set({ name, regNo, shift, timestamp: new Date().toISOString() });
        alert('Successfully registered for trip!');
        e.target.reset();
    } catch (err) { alert('An error occurred.'); }
});

loadShiftCounts();

// ==================== SUPPORT COMPLAINTS ====================
// Year 2 Complaint
document.getElementById('complaint-year2')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const regNo = e.target.RegNo.value.trim().toUpperCase();
    const unit = e.target.Unit.value;
    
    const regSnap = await db.ref('registrations/' + regNo).get();
    if (!regSnap.exists()) { alert('This registration number is not registered.'); return; }
    
    const complaintsSnap = await db.ref('complaints/' + regNo).get();
    if (complaintsSnap.exists()) {
        for (const entry of Object.values(complaintsSnap.val())) {
            if (entry.unit === unit) { alert('Complaint already exists for this unit.'); return; }
        }
    }
    
    const timestamp = Date.now();
    await db.ref(`complaints/${regNo}/${timestamp}`).set({ regNo, unit, type: 'Missing Marks', submittedAt: new Date().toISOString() });
    alert('Complaint submitted!');
    e.target.reset();
});

// Year 1 Complaint
document.getElementById('complaint-year1')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.Name.value.trim();
    const regNo = e.target.RegNo.value.trim().toUpperCase();
    const unit = e.target.Unit.value;
    const lecturer = e.target.Lecturer.value.trim();
    const timestamp = Date.now();
    await db.ref(`complaints_year1/${regNo}/${timestamp}`).set({ name, regNo, unit, lecturer, type: 'Missing Marks', submittedAt: new Date().toISOString() });
    alert('Complaint submitted!');
    e.target.reset();
});

// Anonymous Issues
document.getElementById('anonymous-year2')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const issueType = e.target.IssueType.value;
    const description = e.target.Description.value.trim();
    const timestamp = Date.now();
    await db.ref(`anonymous_issues/year2/${timestamp}`).set({ issueType, description, submittedAt: new Date().toISOString() });
    alert('Anonymous issue submitted successfully!');
    e.target.reset();
});

// Course Registration Issues
document.getElementById('courseReg-year2')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.studentName.value.trim();
    const regNo = e.target.regNumber.value.trim().toUpperCase();
    const issueType = e.target.issueType.value;
    const explanation = e.target.explanation.value.trim();
    
    if (!name || !regNo || !issueType || !explanation) { alert('Please fill in all required fields.'); return; }
    
    const timestamp = Date.now();
    await db.ref(`course_registration_issues/year2/${timestamp}`).set({
        name, regNumber: regNo, issueType, explanation, submittedAt: new Date().toISOString(), status: 'pending', resolved: false, year: 'year2'
    });
    alert('Course registration issue submitted successfully!');
    e.target.reset();
});

function showSupportYear(year) {
    document.querySelectorAll('.support-year-content').forEach(el => el.style.display = 'none');
    document.getElementById(`support-${year}`).style.display = 'block';
    document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ==================== PRACTICAL HUB ====================
function loadProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';
    
    db.ref('practicalHub/products').once('value').then(snapshot => {
        const data = snapshot.val();
        if (!data) { container.innerHTML = '<p>No products available yet.</p>'; return; }
        
        allProducts = Object.entries(data).map(([id, product]) => ({
            id, name: product.name || 'Unnamed', price: product.price || 0, stock: product.stock || 0,
            category: product.category || 'Uncategorized', description: product.description || '',
            fullDescription: product.fullDescription || product.details || '', image: product.image || ''
        }));
        
        displayProducts(allProducts);
    }).catch(error => { container.innerHTML = '<p>Error loading products.</p>'; });
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    
    if (products.length === 0) { container.innerHTML = '<p>No products match your filters.</p>'; return; }
    
    products.forEach(product => {
        const stockClass = product.stock > 10 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-of-stock';
        const stockText = product.stock > 10 ? `${product.stock} in stock` : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of stock';
        
        container.innerHTML += `
            <div class="product-card">
                <img src="${product.image || 'https://via.placeholder.com/280x200?text=No+Image'}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/280x200?text=No+Image'">
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
                    <div class="product-price">Ksh ${product.price}</div>
                    <div class="product-stock ${stockClass}">${stockText}</div>
                    <div class="product-actions">
                        <button class="btn-buy" onclick="addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}><i class="fas fa-cart-plus"></i> Add to Cart</button>
                        <button class="btn-details" onclick="showProductDetails('${product.id}')"><i class="fas fa-info-circle"></i> Details</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const price = document.getElementById('priceFilter').value;
    const search = document.getElementById('searchBox').value.toLowerCase();
    
    let filtered = [...allProducts];
    if (category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (price === '0-500') filtered = filtered.filter(p => p.price <= 500);
    else if (price === '500-1000') filtered = filtered.filter(p => p.price >= 500 && p.price <= 1000);
    else if (price === '1000-5000') filtered = filtered.filter(p => p.price >= 1000 && p.price <= 5000);
    else if (price === '5000+') filtered = filtered.filter(p => p.price >= 5000);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
    
    displayProducts(filtered);
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) existingItem.quantity++;
        else { alert('Not enough stock!'); return; }
    } else {
        cart.push({ id: productId, name: product.name, price: product.price, image: product.image, quantity: 1 });
    }
    
    saveCart();
    updateCartDisplay();
    showNotification('Added to cart!', 'success');
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const cartCountSpan = document.getElementById('cartCount');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.textContent = totalItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>Your cart is empty</p></div>';
        cartTotalSpan.textContent = '0';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        cartItems.innerHTML += `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/60x60'}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">Ksh ${item.price} each</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)"><i class="fas fa-minus"></i></button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-total">Ksh ${itemTotal}</div>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    cartTotalSpan.textContent = total;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = allProducts.find(p => p.id === productId);
    if (item && product) {
        const newQty = item.quantity + change;
        if (newQty < 1) removeFromCart(productId);
        else if (newQty <= product.stock) item.quantity = newQty;
        else alert(`Only ${product.stock} in stock!`);
        saveCart();
        updateCartDisplay();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
    showNotification('Removed from cart', 'info');
}

function saveCart() {
    localStorage.setItem('practicalHubCart', JSON.stringify(cart));
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
}

function checkout() {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }
    alert('Checkout feature will be implemented. Total: Ksh ' + document.getElementById('cartTotal').textContent);
}

function showProductDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productDetailsModal');
    const displayDesc = product.fullDescription || product.description || 'No description available.';
    
    modal.innerHTML = `
        <div class="product-modal-content">
            <div class="product-modal-header">
                <h3>${product.name}</h3>
                <button class="product-modal-close" onclick="closeProductDetails()">&times;</button>
            </div>
            <div class="product-modal-body">
                <img src="${product.image || 'https://via.placeholder.com/400x300'}" class="product-modal-image">
                <div class="product-modal-info">
                    <span class="product-modal-category">${product.category}</span>
                    <div class="product-modal-price">Ksh ${product.price}</div>
                    <div class="product-modal-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                    <div class="product-modal-section"><h4>Description</h4><p>${displayDesc}</p></div>
                    <div class="product-modal-actions">
                        <button class="btn-buy" onclick="addToCart('${productId}'); closeProductDetails();" ${product.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
                        <button class="btn-details" onclick="closeProductDetails()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeProductDetails() {
    const modal = document.getElementById('productDetailsModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

function openProductEditor() {
    window.location.href = 'admin-dashboard.html';
}

function showNotification(message, type) {
    const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8' };
    const notification = document.createElement('div');
    notification.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: ${colors[type] || colors.info}; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000; animation: fadeIn 0.3s;`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ==================== ADMIN DASHBOARD (Simplified) ====================
function loadAdminDashboard() {
    const container = document.getElementById('adminDashboardContent');
    container.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="stat-item" style="background: linear-gradient(135deg, #004080, #0066cc); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div class="stat-number" id="totalStudents">0</div>
                    <div class="stat-label">Total Students</div>
                </div>
                <div class="stat-item" style="background: linear-gradient(135deg, #004080, #0066cc); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div class="stat-number" id="totalGroups">0</div>
                    <div class="stat-label">Groups Formed</div>
                </div>
                <div class="stat-item" style="background: linear-gradient(135deg, #004080, #0066cc); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div class="stat-number" id="pendingStudents">0</div>
                    <div class="stat-label">Pending Students</div>
                </div>
            </div>
            <div class="quick-actions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="action-btn" onclick="showPage('registration')" style="background: white; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer;">
                    <i class="fas fa-users fa-2x" style="color: #004080;"></i>
                    <h3>View Registrations</h3>
                </div>
                <div class="action-btn" onclick="showPage('support')" style="background: white; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer;">
                    <i class="fas fa-exclamation-circle fa-2x" style="color: #004080;"></i>
                    <h3>View Complaints</h3>
                </div>
                <div class="action-btn" onclick="showPage('practicalHub')" style="background: white; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer;">
                    <i class="fas fa-microchip fa-2x" style="color: #004080;"></i>
                    <h3>Manage Products</h3>
                </div>
            </div>
        </div>
    `;
    
    // Load stats
    db.ref('registrations').once('value').then(s => {
        let count = 0;
        const data = s.val();
        if (data) for (let p1 in data) for (let p2 in data[p1]) for (let p3 in data[p1][p2]) count++;
        document.getElementById('totalStudents').textContent = count;
    });
    db.ref('groups').once('value').then(s => { document.getElementById('totalGroups').textContent = s.val() ? Object.keys(s.val()).length : 0; });
    db.ref('pending').once('value').then(s => { document.getElementById('pendingStudents').textContent = s.val() ? Object.keys(s.val()).length : 0; });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const newTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });
    
    // Sidebar Toggle
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // PWA Install Button
    let deferredPrompt;
    const installBtn = document.getElementById('installButton');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
        installBtn.onclick = () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
        };
    });
    
    // Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => console.log('SW registered:', reg.scope)).catch(err => console.log('SW failed:', err));
    }
    
    // Show home page by default
    showPage('home');
});