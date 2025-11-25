class NotificationManager {
    constructor() {
        this.checkInterval = null;
        this.currentReminders = []; // Initialiser comme tableau vide
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

    // Vérifier les rappels échus
    startReminderChecker() {
        // Vérifier toutes les 30 secondes
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 30000);
    }
   //API ici
   async checkReminders() {
    try {
        const response = await fetch(`http://localhost/todolist/back/api/taskApi.php?action=getDueReminders&t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Réponse API rappels:', data); // Pour voir la structure

        if (data.success) {
            // ⚠️ CORRECTION ICI : utiliser data.data au lieu de data.reminders
            this.currentReminders = Array.isArray(data.data) ? data.data : [];
            console.log('Rappels trouvés:', this.currentReminders); // Vérifier
            this.updateNotificationBell();
        } else {
            this.currentReminders = [];
            this.updateNotificationBell();
        }
    } catch (error) {
        console.error('Erreur vérification rappels:', error);
        this.currentReminders = [];
        this.updateNotificationBell();
    }
}

    // Mettre à jour l'affichage de la cloche
    updateNotificationBell() {
        const bell = document.getElementById('notificationBell');
        const countBadge = document.getElementById('notificationCount');
        
        if (!bell || !countBadge) {
            console.error('Éléments notification non trouvés dans le DOM');
            return;
        }

        // S'assurer que currentReminders est un tableau
        const hasReminders = Array.isArray(this.currentReminders) && this.currentReminders.length > 0;

        if (hasReminders) {
            bell.style.display = 'block';
            countBadge.textContent = this.currentReminders.length;
            countBadge.style.display = 'block';
            
            // Animation
            bell.classList.add('animate__animated', 'animate__tada');
            setTimeout(() => {
                bell.classList.remove('animate__animated', 'animate__tada');
            }, 1000);
        } else {
            bell.style.display = 'none';
            countBadge.style.display = 'none';
        }
    }

    // Ouvrir le modal des rappels
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

        if (!container || !emptyState) {
            console.error('Éléments modal non trouvés');
            return;
        }

        // S'assurer que currentReminders est un tableau
        const hasReminders = Array.isArray(this.currentReminders) && this.currentReminders.length > 0;

        if (hasReminders) {
            container.innerHTML = this.renderReminders();
            emptyState.style.display = 'none';
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
            emptyState.style.display = 'block';
        }
    }

   renderReminders() {
    // S'assurer que currentReminders est un tableau
    if (!Array.isArray(this.currentReminders)) {
        return '<div class="text-center text-muted">Erreur de chargement des rappels</div>';
    }

    return this.currentReminders.map(reminder => {
        // ⚠️ CORRECTION : utiliser reminder.title au lieu de reminder.task_title
        const taskTitle = reminder.title || '';
        const projectName = reminder.project_name || '';
        
        console.log('Données reminder:', reminder); // Pour debug
        
        return `
            <div class="card mb-3 border-warning">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title text-warning">
                                <i class="fas fa-clock me-2"></i>
                                Rappel de tâche
                            </h6>
                            <p class="card-text mb-1">
                                La tâche <strong>"${taskTitle}"</strong> 
                                ${projectName ? `du projet <strong>"${projectName}"</strong>` : ''} 
                                est prévue pour le <strong>${this.formatDueDate(reminder.due_date, reminder.due_time)}</strong>
                            </p>
                            <small class="text-muted">
                                <i class="fas fa-bell me-1"></i>
                                Rappel programmé pour ${this.formatReminderDate(reminder.reminder)}
                            </small>
                        </div>
                        <button class="btn btn-sm btn-outline-success" onclick="notificationManager.markReminderAsSeen('${reminder.task_uuid || reminder.uuid || ''}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

    formatDueDate(dueDate, dueTime) {
        if (!dueDate) return 'date non définie';
        
        try {
            const date = new Date(dueDate);
            const formattedDate = date.toLocaleDateString('fr-FR');
            
            if (dueTime) {
                return `${formattedDate} à ${dueTime.substring(0, 5)}`;
            }
            return formattedDate;
        } catch (error) {
            return 'date invalide';
        }
    }

    formatReminderDate(reminder) {
        if (!reminder) return 'date non définie';
        
        try {
            const date = new Date(reminder);
            return date.toLocaleString('fr-FR');
        } catch (error) {
            return 'date invalide';
        }
    }

    // Marquer le rappel comme "vu" (optionnel)
    async markReminderAsSeen(taskUuid) {
        // Recharger les rappels
        await this.checkReminders();
    }
}

// Initialiser
const notificationManager = new NotificationManager();
document.addEventListener('DOMContentLoaded', function() {
    notificationManager.init();
});