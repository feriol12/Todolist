// Gestion du rappel personnalisé
class ReminderManager {
    constructor() {
        this.init();
    }

    init() {
        const reminderSelect = document.getElementById('taskReminder');
        const customSection = document.getElementById('customReminderSection');
        
        if (reminderSelect && customSection) {
            // Écouter les changements de sélection
            reminderSelect.addEventListener('change', (e) => {
                this.handleReminderChange(e.target.value);
            });

            // Pré-remplir la date custom avec aujourd'hui
            this.setDefaultCustomDate();
        }
    }

// ✅ GARDER ton ReminderManager existant
    
    
    // ✅ AJOUTER cette méthode
    getReminderValue() {
        const reminderType = document.getElementById('taskReminder').value;
        
        if (reminderType === 'custom') {
            return this.getCustomReminderValue();
        } else if (reminderType) {
            return this.getOffsetReminderValue(parseInt(reminderType));
        }
        
        return null;
    }

    getCustomReminderValue() {
        const customDate = document.getElementById('customReminderDate').value;
        const customTime = document.getElementById('customReminderTime').value;
        
        if (!customDate || !customTime) {
            return null;
        }
        
        return `${customDate} ${customTime}:00`;
    }

    getOffsetReminderValue(offsetMinutes) {
        const dueDate = document.getElementById('taskDueDate').value;
        const dueTime = document.getElementById('taskDueTime').value;
        
        if (!dueDate) return null;
        
        // Logique de calcul du rappel relatif
        // À implémenter selon tes besoins
        return `${dueDate} ${dueTime || '23:59:00'}`;
    }



    handleReminderChange(selectedValue) {
        const customSection = document.getElementById('customReminderSection');
        
        if (selectedValue === 'custom') {
            // Afficher la section personnalisée
            customSection.style.display = 'block';
        } else {
            // Cacher la section personnalisée
            customSection.style.display = 'none';
        }
    }

    setDefaultCustomDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const customDateInput = document.getElementById('customReminderDate');
        if (customDateInput) {
            customDateInput.value = formattedDate;
        }
        
        // Définir l'heure par défaut (1 heure dans le futur)
        const oneHourLater = new Date(today.getTime() + 60 * 60 * 1000);
        const formattedTime = oneHourLater.toTimeString().slice(0, 5);
        const customTimeInput = document.getElementById('customReminderTime');
        if (customTimeInput) {
            customTimeInput.value = formattedTime;
        }
    }
}


// Initialiser le gestionnaire de rappel
document.addEventListener('DOMContentLoaded', function() {
    new ReminderManager();
});
