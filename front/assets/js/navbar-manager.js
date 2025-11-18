// js/navbar-manager.js - EN ATTENTE = À FAIRE + EN COURS
class NavbarManager {
    static async init() {
        console.log('🚀 Initialisation navbar manager...');
        
        await this.loadRealUserName();
        this.setupRealLogout();
        await this.loadTasksStats();
        
        console.log('✅ Navbar manager initialisé');
    }

    static async loadTasksStats() {
        try {
            const response = await fetch('/todolist/back/api/taskApi.php');
            const data = await response.json();
            
            if (data.success && data.data) {
                const totalTasks = data.data.length;
                
                // 🎯 EN ATTENTE = À FAIRE + EN COURS
                const pendingTasks = data.data.filter(task => 
                    task.status === 'todo' || task.status === 'in_progress'
                ).length;
                
                // Mettre à jour UNIQUEMENT la navbar
                const totalElement = document.getElementById('total-tasks');
                const pendingElement = document.getElementById('pending-tasks');
                
                if (totalElement) totalElement.textContent = totalTasks;
                if (pendingElement) pendingElement.textContent = pendingTasks;
                
                console.log(`📊 Navbar: ${totalTasks} total, ${pendingTasks} en attente (todo + in_progress)`);
            }
        } catch (error) {
            console.log('❌ Erreur stats tâches:', error);
        }
    }

    static async loadRealUserName() {
        try {
            const response = await fetch('/todolist/back/api/auth.php?action=current_user');
            const data = await response.json();
            
            if (data.success) {
                const userNameElements = document.querySelectorAll('#user-name');
                userNameElements.forEach(element => {
                    element.textContent = `${data.user.first_name} ${data.user.last_name}`;
                });
                console.log('👤 Nom utilisateur mis à jour');
            }
        } catch (error) {
            console.log('ℹ️ Nom par défaut conservé');
        }
    }

    static setupRealLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (!logoutBtn) {
            console.log('❌ Bouton déconnexion non trouvé');
            return;
        }

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('🚪 Déconnexion...');
            
            try {
                await fetch('/todolist/back/api/auth.php?action=logout', {
                    method: 'POST'
                });
            } catch (error) {
                console.log('Déconnexion offline');
            }
            
            window.location.href = 'http://localhost/todolist/index.html';
        });
        
        console.log('🔐 Déconnexion configurée');
    }

    static refreshStats() {
        console.log('🔄 Rafraîchissement stats navbar...');
        this.loadTasksStats();
    }
}

// Exposer pour rafraîchissement depuis d'autres fichiers
window.NavbarManager = NavbarManager;

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => NavbarManager.init(), 1000);
    });
} else {
    setTimeout(() => NavbarManager.init(), 1000);
}