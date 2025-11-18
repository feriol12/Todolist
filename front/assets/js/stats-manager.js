// js/stats-manager.js - STATISTIQUES DU DERNIER PROJET
class StatsManager {
    static async init() {
        console.log('📊 Initialisation stats dernier projet...');
        await this.loadLastProjectStats();
        console.log('✅ Stats dernier projet initialisé');
    }

    static async loadLastProjectStats() {
        try {
            const response = await fetch('/todolist/back/api/projectApi.php?action=stats');
            const data = await response.json();
            
            if (data.success && data.stats.length > 0) {
                this.updateLastProjectStats(data.stats[0]);
            } else {
                this.showNoProjectsMessage();
            }
        } catch (error) {
            console.log('❌ Erreur stats dernier projet:', error);
            this.showNoProjectsMessage();
        }
    }

    static updateLastProjectStats(lastProject) {
        // Mettre à jour VOTRE HTML avec les stats du dernier projet
        const statsTodo = document.getElementById('stats-todo');
        const statsProgress = document.getElementById('stats-progress');
        const statsDone = document.getElementById('stats-done');

        if (statsTodo) statsTodo.textContent = parseInt(lastProject.todo_tasks) || 0;
        if (statsProgress) statsProgress.textContent = parseInt(lastProject.in_progress_tasks) || 0;
        if (statsDone) statsDone.textContent = parseInt(lastProject.done_tasks) || 0;

        // Mettre à jour le titre avec le nom du dernier projet
        this.updateStatsTitle(lastProject);

        console.log(`📊 Dernier projet: "${lastProject.name}" - ${lastProject.todo_tasks} à faire, ${lastProject.in_progress_tasks} en cours, ${lastProject.done_tasks} terminées`);
    }

    static updateStatsTitle(project) {
        const statsHeader = document.querySelector('.card-header.bg-info h6.mb-0');
        if (!statsHeader) return;

        statsHeader.innerHTML = `<i class="fas fa-chart-bar me-2"></i>Statistiques du projet ${project.name}`;
    }

    static showNoProjectsMessage() {
        const statsTodo = document.getElementById('stats-todo');
        const statsProgress = document.getElementById('stats-progress');
        const statsDone = document.getElementById('stats-done');
        const statsHeader = document.querySelector('.card-header.bg-info h6.mb-0');

        if (statsTodo) statsTodo.textContent = '0';
        if (statsProgress) statsProgress.textContent = '0';
        if (statsDone) statsDone.textContent = '0';
        
        if (statsHeader) {
            statsHeader.innerHTML = '<i class="fas fa-chart-bar me-2"></i>Statistiques (Aucun projet)';
        }

        console.log('ℹ️ Aucun projet trouvé');
    }

    static refreshStats() {
        console.log('🔄 Rafraîchissement stats dernier projet...');
        this.loadLastProjectStats();
    }
}

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => StatsManager.init(), 1000);
    });
} else {
    setTimeout(() => StatsManager.init(), 1000);
}

window.StatsManager = StatsManager;