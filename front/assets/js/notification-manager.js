class NotificationManager {
    constructor() {
        this.checkInterval = null;
        this.currentReminders = [];
        this.seenReminders = new Set(); // Pour éviter les doublons
    }

    init() {
        this.setupEventListeners();
        this.startReminderChecker();
        this.checkReminders(); // Vérifier immédiatement
    }

    setupEventListeners() {
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.openRemindersModal();
            });
        }
    }

    startReminderChecker() {
        // Vérifier toutes les 1 seconde pour ne rien rater
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 1000);
    }

    async checkReminders() {
        try {
            const response = await fetch(`http://localhost/todolist/back/api/taskApi.php?action=getDueReminders&t=${Date.now()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (!data.success) return;

            const nowSec = Math.floor(Date.now() / 1000);

            data.data.forEach(r => {
                const reminderTime = new Date(r.reminder).getTime();
                const reminderSec = Math.floor(reminderTime / 1000);

                // Notification seulement au moment exact du reminder et si pas déjà vue
                if (!this.seenReminders.has(r.uuid) && reminderSec === nowSec) {
                    this.currentReminders.push(r);
                    this.seenReminders.add(r.uuid);
                }
            });

            this.updateNotificationBell();
        } catch (error) {
            console.error('Erreur vérification rappels:', error);
        }
    }

    updateNotificationBell() {
        const bell = document.getElementById('notificationBell');
        const countBadge = document.getElementById('notificationCount');
        if (!bell || !countBadge) return;

        if (this.currentReminders.length > 0) {
            bell.style.display = 'block';
            countBadge.style.display = 'block';
            countBadge.textContent = this.currentReminders.length;
            bell.classList.add('animate__animated', 'animate__tada');
            setTimeout(() => bell.classList.remove('animate__animated', 'animate__tada'), 1000);
        } else {
            bell.style.display = 'none';
            countBadge.style.display = 'none';
        }
    }

    async openRemindersModal() {
        try {
            await this.loadRemindersModal();
            const modalElement = document.getElementById('notificationsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        } catch (error) {
            console.error('Erreur ouverture modal:', error);
        }
    }

    async loadRemindersModal() {
        const container = document.getElementById('notificationsList');
        const emptyState = document.getElementById('emptyNotifications');
        if (!container || !emptyState) return;

        if (this.currentReminders.length > 0) {
            container.innerHTML = this.renderReminders();
            container.style.display = 'block';
            emptyState.style.display = 'none';
        } else {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }

    renderReminders() {
        return this.currentReminders.map(r => `
            <div class="card mb-3 border-warning" id="reminder-${r.uuid}">
                <div class="card-body d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title text-warning">
                            <i class="fas fa-clock me-2"></i> Rappel de tâche
                        </h6>
                        <p class="card-text mb-1">
                            La tâche <strong>"${r.title}"</strong>
                            ${r.project_name ? `du projet <strong>"${r.project_name}"</strong>` : ''}
                            est prévue pour <strong>${this.formatDueDate(r.due_date, r.due_time)}</strong>
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-bell me-1"></i> Rappel programmé pour ${this.formatReminderDate(r.reminder)}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="notificationManager.dismissReminder('${r.uuid}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDueDate(dueDate, dueTime) {
        if (!dueDate) return 'date non définie';
        const date = new Date(dueDate);
        const formattedDate = date.toLocaleDateString('fr-FR');
        return dueTime ? `${formattedDate} à ${dueTime.substring(0, 5)}` : formattedDate;
    }

    formatReminderDate(reminder) {
        if (!reminder) return 'date non définie';
        return new Date(reminder).toLocaleString('fr-FR');
    }

    dismissReminder(uuid) {
        // Supprimer visuellement la notification
        this.currentReminders = this.currentReminders.filter(r => r.uuid !== uuid);
        this.seenReminders.add(uuid);
        const elem = document.getElementById(`reminder-${uuid}`);
        if (elem) elem.remove();
        this.updateNotificationBell();
    }
}

const notificationManager = new NotificationManager();
document.addEventListener('DOMContentLoaded', () => notificationManager.init());
