// js/project.js - VERSION CLASSE
class ProjectManager {
    static API_BASE_URL = window.location.origin + '/todolist/back/api/';

    static init() {
        console.log('🚀 Initialisation ProjectManager...');
        
        // Événements
        document.getElementById("saveProject")?.addEventListener("click", () => this.handleProject());
        
        // Chargement initial
        this.loadProjects();
        this.loadProjectsTable();
        
        console.log('✅ ProjectManager initialisé');
    }

    static async handleProject() {
        const name = document.getElementById("projectName").value;
        const description = document.getElementById("projectDescription").value;
        const color = document.getElementById("projectColor").value;
        const icon = document.getElementById("projectIcon").value;
        const is_favorite = document.getElementById("projectIsFavorite").checked;

        const btn = document.getElementById("saveProject");
        
        // Validation
        if (!name.trim()) {
            this.showToast("Erreur", "Le nom du projet est obligatoire", "error");
            return;
        }

        btn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Création...';
        btn.disabled = true;

        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    color: color,
                    icon: icon,
                    is_favorite: is_favorite,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Réponse API création:", data);

            if (data.success) {
                this.showToast("Succès", "Projet créé avec succès!", "success");
                
                // Fermer le modal et recharger
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
                    if (modal) modal.hide();
                    
                    document.getElementById("projectForm")?.reset();
                    this.loadProjects(); // Recharger la liste
                    
                    // Rafraîchir les stats du dernier projet
                    if (window.StatsManager) {
                        StatsManager.refreshStats();
                    }
                    
                    // Rafraîchir le tableau
                    this.loadProjectsTable();
                }, 1500);
            } else {
                this.showToast("Erreur", data.error || "Erreur lors de la création", "error");
            }
        } catch (error) {
            console.error("Erreur:", error);
            this.showToast("Erreur", error.message || "Problème de connexion au serveur", "error");
        } finally {
            btn.innerHTML = '<i class="fas fa-save me-2"></i>Créer le projet';
            btn.disabled = false;
        }
    }

    static async loadProjects() {
        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=list`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                console.log("Projets chargés:", data.projects);
                this.updateProjectSelect(data.projects);
            } else {
                console.error("Erreur API projets:", data.error);
            }
        } catch (error) {
            console.error("Erreur chargement projets:", error);
        }
    }

    static updateProjectSelect(projects) {
        const select = document.getElementById("project");
        if (!select) {
            console.warn("Element #project non trouvé");
            return;
        }
        
        select.innerHTML = '<option value="">Sans projet</option>';
        
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name; 
            option.dataset.color = project.color;
            select.appendChild(option);
        });
    }

    static async deleteProject(projectId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les tâches associées seront également supprimées.')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ project_id: projectId }),
            });

            const data = await response.json();

            if (data.success) {
                this.showToast("Succès", "Projet supprimé avec succès", "success");
                this.loadProjects(); // Recharger la liste
                this.loadProjectsTable(); // Recharger le tableau
                
                // Rafraîchir les stats globales
                if (window.StatsManager) {
                    StatsManager.refreshStats();
                }

                    // Rafraîchir les stats navbar
                if (window.NavbarManager) {
                    NavbarManager.loadTasksStats();
                }
            } else {
                this.showToast("Erreur", data.error || "Erreur lors de la suppression", "error");
            }
        } catch (error) {
            console.error("Erreur suppression:", error);
            this.showToast("Erreur", "Problème de connexion au serveur", "error");
        }
    }

    static async toggleFavorite(projectId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=toggle_favorite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ project_id: projectId }),
            });

            const data = await response.json();

            if (data.success) {
                this.showToast("Succès", data.message || "Favori mis à jour", "success");
                this.loadProjects(); // Recharger la liste
                this.loadProjectsTable(); // Recharger le tableau
            } else {
                this.showToast("Erreur", data.error || "Erreur", "error");
            }
        } catch (error) {
            console.error("Erreur favori:", error);
            this.showToast("Erreur", "Problème de connexion", "error");
        }
    }

    static async loadProjectsTable() {
        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=list`);
            

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Projets pour tableau chargés:", data.projects);
            
            if (data.success) {
                this.renderProjectsTable(data.projects);
                // Mettre à jour le compteur
                document.getElementById('projects-count').textContent = data.projects.length + ' projet' + (data.projects.length > 1 ? 's' : '');
            } else {
                console.error("Erreur API projets:", data.error);
            }
        } catch (error) {
            console.error("Erreur chargement projets:", error);
        }
    }

    static renderProjectsTable(projects) {
        const tbody = document.getElementById("projectsTableBody");
        if (!tbody) {
            console.warn("Tableau projets non trouvé");
            return;
        }

        if (!projects || projects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fas fa-folder-open fa-2x mb-2"></i>
                        <p>Aucun projet créé</p>
                        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#projectModal">
                            <i class="fas fa-plus me-1"></i>Créer un projet
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = projects.map(project => `
            <tr>
                <td>
                    <div class="project-name">
                        <span class="project-color-badge" style="background-color: ${project.color || '#4361ee'}"></span>
                        <div>
                            <div>${this.escapeHtml(project.name)}</div>
                            ${project.is_favorite ? '<i class="fas fa-star text-warning" title="Favori"></i>' : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <small class="text-muted">${this.escapeHtml(project.description || 'Aucune description')}</small>
                </td>
                <td>
                    <div class="project-stats">
                        <span class="badge bg-primary">${project.task_count || 0} tâches</span>
                        <small class="text-muted d-block">${project.total_done || 0} terminées</small>
                    </div>
                </td>
                <td>
                    ${this.getProjectStatusBadge(project)}
                </td>
                <td class="project-actions">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="ProjectManager.showProjectDetails(${project.id})" 
                                title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <button class="btn btn-outline-primary" onclick="ProjectManager.editProject(${project.id})" 
                                title="Modifier le projet">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <button class="btn btn-outline-warning" onclick="ProjectManager.toggleFavorite(${project.id})" 
                                title="${project.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="fas ${project.is_favorite ? 'fa-star' : 'fa-star'}"></i>
                        </button>
                        
                        <button class="btn btn-outline-danger" onclick="ProjectManager.deleteProject(${project.id})" 
                                title="Supprimer le projet">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 🛠️ FONCTIONS UTILITAIRES
    static getProjectStatusBadge(project) {
        const taskCount = project.task_count || 0;
        const completed = project.total_done || 0;
        const progress = taskCount > 0 ? (completed / taskCount) * 100 : 0;
        
        if (progress === 0) return '<span class="badge bg-secondary">Non commencé</span>';
        if (progress === 100) return '<span class="badge bg-success">Terminé</span>';
        if (progress >= 50) return '<span class="badge bg-primary">En progression</span>';
        return '<span class="badge bg-warning">En cours</span>';
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static showProjectDetails(projectId) {
        this.showToast("Info", `Détails du projet ${projectId} - À implémenter`, "info");
    }

    static editProject(projectId) {
        this.showToast("Info", `Édition du projet ${projectId} - À implémenter`, "info");
    }

    static showToast(title, message, type = "info") {
        const toastElement = document.getElementById("liveToast");
        if (!toastElement) {
            console.error("Toast element non trouvé");
            return;
        }
        
        const toast = new bootstrap.Toast(toastElement);
        document.getElementById("toastTitle").textContent = title;
        document.getElementById("toastMessage").textContent = message;

        const toastHeader = document.querySelector("#liveToast .toast-header");
        if (toastHeader) {
            toastHeader.className = "toast-header";
            if (type === "success") toastHeader.classList.add("text-bg-success");
            if (type === "error") toastHeader.classList.add("text-bg-danger");
        }

        toast.show();
    }
}

// Auto-initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ProjectManager.init();
    });
} else {
    ProjectManager.init();
}

// Exposer globalement
window.ProjectManager = ProjectManager;