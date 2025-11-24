// js/project.js - VERSION COMPLÈTE AVEC PAGINATION
class ProjectManager {
    static API_BASE_URL = window.location.origin + '/todolist/back/api/';
    static currentPage = 1;
    static itemsPerPageDesktop = 5;
    static itemsPerPageMobile = 2;
    static allProjects = [];
    static currentItemsPerPage = 5;
    static currentEditProjectId = null;

    static init() {
        console.log('🚀 Initialisation ProjectManager...');
        
        // Événements
        document.getElementById("saveProject")?.addEventListener("click", () => this.handleProject());

        // 🔍 INITIALISATION RECHERCHE
        this.initSearchEvents();
        
         // 🗑️ NOUVEL ÉVÉNEMENT ARCHIVES
        document.getElementById("show-archives-btn")?.addEventListener("click", () => this.openArchivesModal());

        // ✅ CHARGEMENT INITIAL
        this.loadProjects();
        
        console.log('✅ ProjectManager initialisé');
    }

    static initSearchEvents() {
        const searchInput = document.getElementById('project-search-input');
        const searchBtn = document.getElementById('project-search-btn');
        const clearBtn = document.getElementById('project-search-clear');

        if (searchInput) {
            // Recherche à la saisie (délai de 300ms)
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentPage = 1;
                    this.searchProjects();
                }, 300);
            });

            // Recherche au clic
            searchBtn?.addEventListener('click', () => {
                this.currentPage = 1;
                this.searchProjects();
            });
            
            // Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentPage = 1;
                    this.searchProjects();
                }
            });

            // Effacer la recherche
            clearBtn?.addEventListener('click', () => {
                searchInput.value = '';
                this.currentPage = 1;
                this.searchProjects();
            });
        }

        // Réinitialiser la pagination quand la fenêtre est redimensionnée
        window.addEventListener('resize', () => {
            const newItemsPerPage = this.getItemsPerPage();
            if (newItemsPerPage !== this.currentItemsPerPage) {
                this.currentItemsPerPage = newItemsPerPage;
                this.currentPage = 1;
                this.renderPaginatedProjects();
            }
        });
    }

    static async searchProjects() {
        const searchTerm = document.getElementById('project-search-input')?.value || '';

        try {
            let url = `${this.API_BASE_URL}projectApi.php?action=list`;
            
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            
            if (params.toString()) {
                url += '&' + params.toString();
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.allProjects = data.projects;
                this.currentPage = 1;
                this.currentItemsPerPage = this.getItemsPerPage();
                this.renderPaginatedProjects(); 
                this.updateSearchResultsCount(data.projects.length, searchTerm);
            } else {
                console.error("Erreur recherche projets:", data.error);
            }
        } catch (error) {
            console.error("Erreur recherche:", error);
            this.showToast("Erreur", "Problème de connexion au serveur", "error");
        }
    }

 static async loadProjectsTable() {
    const loadingElement = document.getElementById('loading');
    const projectsTable = document.getElementById('projects-table');
    const emptyState = document.getElementById('empty-state');
    
    try {
        // ✅ ÉTAPE 1: CACHER TOUT SAUF LE LOADING
        this.hideAllElementsExceptLoading();
        
        // ✅ ÉTAPE 2: ATTENDRE 1s MINIMUM + API EN PARALLÈLE
        const startTime = Date.now();
        const apiPromise = fetch(`${this.API_BASE_URL}projectApi.php?action=list`);
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1000));
        
          // Pour tester, tu peux simuler un délai API court :
        const [apiResponse] = await Promise.all([
            fetch(`${this.API_BASE_URL}projectApi.php?action=list`),
            new Promise(resolve => setTimeout(resolve, 1000)) // ← Garantit 1s minimum
        ]);
        
        // ✅ ÉTAPE 3: TRAITER LA RÉPONSE
        if (!apiResponse.ok) throw new Error(`HTTP error! status: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        if (!data.success) throw new Error(data.error || "Erreur API");
        
        this.allProjects = data.projects;
        this.currentPage = 1;
        this.currentItemsPerPage = this.getItemsPerPage();
        this.renderPaginatedProjects();
        this.updateSearchResultsCount(data.projects.length, '');
        

    } catch (error) {
        console.error("Erreur chargement projets:", error);
        this.showToast("Erreur", "Impossible de charger les projets", "error");
        
    } finally {
        // ✅ ÉTAPE 4: TRANSITION VERS LE CONTENU
        this.showContentAfterLoading();
    }
}

static hideAllElementsExceptLoading() {
    const loadingElement = document.getElementById('loading');
    const projectsTable = document.getElementById('projects-table');
    const emptyState = document.getElementById('empty-state');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (projectsTable) projectsTable.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
}

static showContentAfterLoading() {
    const loadingElement = document.getElementById('loading');
    const projectsTable = document.getElementById('projects-table');
    const emptyState = document.getElementById('empty-state');
    
    // Petit délai pour une transition plus smooth
    setTimeout(() => {
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (this.allProjects.length > 0) {
            if (projectsTable) projectsTable.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }
    }, 200);
}

static hideAllElementsExceptLoading() {
    const loadingElement = document.getElementById('loading');
    const projectsTable = document.getElementById('projects-table');
    const emptyState = document.getElementById('empty-state');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (projectsTable) projectsTable.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
}

static showContentAfterLoading() {
    const loadingElement = document.getElementById('loading');
    const projectsTable = document.getElementById('projects-table');
    const emptyState = document.getElementById('empty-state');
    
    // Petit délai pour une transition plus smooth
    setTimeout(() => {
        if (loadingElement) loadingElement.style.display = 'none';
        
        if (this.allProjects.length > 0) {
            if (projectsTable) projectsTable.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }
    }, 200);
}

    static renderPaginatedProjects() {
        const itemsPerPage = this.getItemsPerPage();
        this.currentItemsPerPage = itemsPerPage;
        
        const startIndex = (this.currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProjects = this.allProjects.slice(startIndex, endIndex);

        console.log(`📄 Pagination: Page ${this.currentPage}, ${itemsPerPage} projets/écran`);
        this.renderProjectsTable(paginatedProjects);
        this.renderPagination();
    }

    static getItemsPerPage() {
        return window.innerWidth < 768 ? this.itemsPerPageMobile : this.itemsPerPageDesktop;
    }

    static renderPagination() {
        const paginationElement = document.getElementById('projects-pagination');
        if (!paginationElement) return;

        const itemsPerPage = this.getItemsPerPage();
        const totalPages = Math.ceil(this.allProjects.length / itemsPerPage);

        if (totalPages <= 1) {
            paginationElement.style.display = 'none';
            return;
        }

        paginationElement.style.display = 'block';

        let paginationHTML = '';
        const maxVisiblePages = 5;

        // Bouton Précédent
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="ProjectManager.changePage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Pages
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="ProjectManager.changePage(${i})">${i}</a>
                </li>
            `;
        }

        // Bouton Suivant
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="ProjectManager.changePage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationElement.querySelector('.pagination').innerHTML = paginationHTML;
    }

    static changePage(page) {
        const itemsPerPage = this.getItemsPerPage();
        const totalPages = Math.ceil(this.allProjects.length / itemsPerPage);
        
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        
        this.currentPage = page;
        this.renderPaginatedProjects();
        
        // Scroll doux vers le haut du tablea
        document.getElementById('projects-table').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    static updateSearchResultsCount(totalCount, searchTerm) {
        const countElement = document.getElementById('projects-count');
        if (!countElement) return;

        const itemsPerPage = this.getItemsPerPage();
        const startIndex = (this.currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * itemsPerPage, totalCount);
        const showingText = totalCount > itemsPerPage ? 
            ` (affichage ${startIndex}-${endIndex} sur ${totalCount})` : '';

        let message = `${totalCount} projet${totalCount !== 1 ? 's' : ''}${showingText}`;
        
        if (searchTerm) {
            message += ` trouvé pour "${searchTerm}"`;
        }

        countElement.textContent = message;
    }

    static async handleProject() {
        if (this.currentEditProjectId) {
            await this.handleProjectUpdate();
            return;
        }
        
        const name = document.getElementById("projectName").value;
        const description = document.getElementById("projectDescription").value;
        const color = document.getElementById("projectColor").value;
        const icon = document.getElementById("projectIcon").value;
        const is_favorite = document.getElementById("projectIsFavorite").checked;

        const btn = document.getElementById("saveProject");
        
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

            if (data.success) {
                this.showToast("Succès", "Projet créé avec succès!", "success");
                
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
                    if (modal) modal.hide();
                    
                    document.getElementById("projectForm")?.reset();
                    this.loadProjects();
                    
                    if (window.StatsManager) {
                        StatsManager.refreshStats();
                    }
                    
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
                this.loadProjectsTable();
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
                this.loadProjects();
                this.loadProjectsTable();
                
                if (window.StatsManager) {
                    StatsManager.refreshStats();
                }

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
                this.loadProjects();
                this.loadProjectsTable();
            } else {
                this.showToast("Erreur", data.error || "Erreur", "error");
            }
        } catch (error) {
            console.error("Erreur favori:", error);
            this.showToast("Erreur", "Problème de connexion", "error");
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
                        <div class="d-flex align-items-start">
                            <span class="project-color-badge me-2 mt-1" style="background-color: ${project.color || '#4361ee'}"></span>
                            <div class="d-flex flex-column">
                                <div class="d-flex align-items-center">
                                    <span class="me-2">${this.escapeHtml(project.name)}</span>
                                </div>
                                ${project.is_favorite ? '<div><i class="fas fa-star text-warning" title="Favori"></i></div>' : ''}
                            </div>
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
                            <i class="${project.is_favorite ? 'fas' : 'far'} fa-star"></i>
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

    // 🆕 FONCTION POUR AFFICHER LES DÉTAILS D'UN PROJET
    static async showProjectDetails(projectId) {
        try {
        // 1. Récupérer les infos du projet
            const projectsResponse = await fetch(`${this.API_BASE_URL}projectApi.php?action=list`);
            const projectsData = await projectsResponse.json();
            
            const project = projectsData.projects.find(p => p.id == projectId);
            
            if (!project) {
                this.showToast("Erreur", "Projet non trouvé", "error");
                return;
            }

            // 2. Récupérer les tâches de ce projet
            const tasksResponse = await fetch(`${this.API_BASE_URL}taskApi.php?action=list&project_id=${projectId}`);
            const tasksData = await tasksResponse.json();
            
            const projectTasks = tasksData.success ? tasksData.data : [];

            // 3. Afficher les détails
            this.displayProjectDetails(project, projectTasks);
            
        } catch (error) {
            console.error("Erreur chargement détails:", error);
            this.showToast("Erreur", "Impossible de charger les détails", "error");
        }
    }

    // 🆕 FONCTION POUR AFFICHER LES DÉTAILS DANS L'INTERFACE    
    static displayProjectDetails(project, tasks) {
        document.getElementById('project-details-name').textContent = project.name;
        document.getElementById('project-details-description').textContent = project.description || 'Aucune description';
        document.getElementById('project-details-color').textContent = project.color;
        document.getElementById('project-details-color-badge').style.backgroundColor = project.color;
        document.getElementById('project-details-favorite').innerHTML = project.is_favorite 
            ? '<i class="fas fa-star text-warning"></i> Oui' 
            : '<i class="far fa-star text-muted"></i> Non';

        // B. Calculer et afficher les statistiques
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'done').length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        document.getElementById('project-details-progress').style.width = `${progress}%`;
        document.getElementById('project-details-progress').textContent = `${Math.round(progress)}%`;
        document.getElementById('project-details-stats').textContent = 
            `${completedTasks} sur ${totalTasks} tâches terminées`;

         // C. Afficher le tableau des tâches
        const tasksBody = document.getElementById('project-tasks-table-body');
        
        if (tasks.length === 0) {
            tasksBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-3">
                        <i class="fas fa-tasks fa-2x mb-2"></i>
                        <p>Aucune tâche dans ce projet</p>
                        <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#taskModal">
                            <i class="fas fa-plus me-1"></i>Créer une tâche
                        </button>
                    </td>
                </tr>
            `;
        } else {
            tasksBody.innerHTML = tasks.map(task => `
                <tr>
                    <td>
                        <strong>${this.escapeHtml(task.title)}</strong>
                    </td>
                    <td>
                        <small class="text-muted">${this.escapeHtml(task.description || 'Aucune description')}</small>
                    </td>
                    <td>
                        <span class="badge bg-${this.getStatusBadgeColor(task.status)}">
                            ${this.getStatusText(task.status)}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-${this.getPriorityBadgeColor(task.priority)}">
                            ${this.getPriorityText(task.priority)}
                        </span>
                    </td>
                    <td>
                        ${task.due_date ? this.formatDate(task.due_date) : 'Non définie'}
                        ${task.due_time ? `<br><small class="text-muted">${task.due_time}</small>` : ''}
                    </td>
                </tr>
            `).join('');
        }

         // D. Afficher la section détails
        document.getElementById('project-details-section').style.display = 'block';

         // E. Scroll vers la section détails
        document.getElementById('project-details-section').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    // 🆕 FONCTION POUR CACHER LES DÉTAILS
    static hideProjectDetails() {
        document.getElementById('project-details-section').style.display = 'none';
    }

// 🛠️ FONCTIONS UTILITAIRES (assure-toi qu'elles existent)
    static getStatusText(status) {
        const statusMap = { 'todo': 'À faire', 'in_progress': 'En cours', 'done': 'Terminée' };
        return statusMap[status] || status;
    }

    static getPriorityText(priority) {
        const priorityMap = { 'low': 'Basse', 'medium': 'Moyenne', 'high': 'Haute' };
        return priorityMap[priority] || priority;
    }

    static getStatusBadgeColor(status) {
        const colorMap = { 'todo': 'secondary', 'in_progress': 'warning', 'done': 'success' };
        return colorMap[status] || 'secondary';
    }

    static getPriorityBadgeColor(priority) {
        const colorMap = { 'low': 'success', 'medium': 'warning', 'high': 'danger' };
        return colorMap[priority] || 'secondary';
    }

    static formatDate(dateString) {
        if (!dateString) return 'Non définie';
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    static async editProject(projectId) {
        console.log('✏️ Édition du projet:', projectId);
        
        try {
            const project = await this.loadProjectData(projectId);
            
            if (project) {
                this.fillEditModal(project);
                this.currentEditProjectId = projectId;
                const modal = new bootstrap.Modal(document.getElementById('projectModal'));
                modal.show();
            }
        } catch (error) {
            console.error('Erreur chargement projet:', error);
            this.showToast('Erreur', 'Impossible de charger le projet', 'error');
        }
    }

    static async loadProjectData(projectId) {
        const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=get&id=${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.project;
        } else {
            throw new Error(data.error || 'Projet non trouvé');
        }
    }

    static fillEditModal(project) {
        document.getElementById('projectModalTitle').textContent = 'Modifier le Projet';
        document.getElementById('projectName').value = project.name || '';
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectColor').value = project.color || '#4361ee';
        document.getElementById('projectIcon').value = project.icon || '';
        document.getElementById('projectIsFavorite').checked = project.is_favorite || false;
        document.getElementById('saveProject').innerHTML = '<i class="fas fa-save me-2"></i>Modifier le projet';
    }

    static async handleProjectUpdate() {
        const name = document.getElementById("projectName").value;
        const description = document.getElementById("projectDescription").value;
        const color = document.getElementById("projectColor").value;
        const icon = document.getElementById("projectIcon").value;
        const is_favorite = document.getElementById("projectIsFavorite").checked;

        const btn = document.getElementById("saveProject");
        
        if (!name.trim()) {
            this.showToast("Erreur", "Le nom du projet est obligatoire", "error");
            return;
        }

        btn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Modification...';
        btn.disabled = true;

        try {
            const response = await fetch(`${this.API_BASE_URL}projectApi.php?action=update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    project_id: this.currentEditProjectId,
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

            if (data.success) {
                this.showToast("Succès", "Projet modifié avec succès!", "success");
                
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
                    if (modal) modal.hide();
                    
                    this.resetModal();
                    this.loadProjects();
                    this.loadProjectsTable();
                    
                    if (window.StatsManager) StatsManager.refreshStats();
                    
                }, 1500);
            } else {
                this.showToast("Erreur", data.error || "Erreur lors de la modification", "error");
            }
        } catch (error) {
            console.error("Erreur modification:", error);
            this.showToast("Erreur", error.message || "Problème de connexion au serveur", "error");
        } finally {
            btn.innerHTML = '<i class="fas fa-save me-2"></i>Modifier le projet';
            btn.disabled = false;
        }
    }

    static resetModal() {
        document.getElementById('projectModalTitle').textContent = 'Nouveau Projet';
        document.getElementById('projectForm').reset();
        document.getElementById('saveProject').innerHTML = '<i class="fas fa-save me-2"></i>Créer le projet';
        this.currentEditProjectId = null;
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

    // ✅ AJOUTER CES MÉTHODES DANS ProjectManager

static async openArchivesModal() {
    try {
        const modal = new bootstrap.Modal(document.getElementById('archivesModal'));
        modal.show();
        
        // Charger les archives
        await this.loadArchivesTable();
    } catch (error) {
        console.error("Erreur ouverture archives:", error);
        this.showToast("Erreur", "Impossible d'ouvrir les archives", "error");
    }
}

static async loadArchivesTable() {
    try {
        const response = await fetch(`${this.API_BASE_URL}projectArchivesApi.php?action=list_archived`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            this.renderArchivesTable(data.projects);
            this.updateArchivesCount(data.count);
        } else {
            console.error("Erreur API archives:", data.error);
        }
    } catch (error) {
        console.error("Erreur chargement archives:", error);
        this.showToast("Erreur", "Problème de connexion au serveur", "error");
    }
}

static renderArchivesTable(projects) {
    const tbody = document.getElementById("archivesTableBody");
    const emptyState = document.getElementById("archives-empty-state");
    
    if (!tbody) return;

    if (!projects || projects.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    tbody.innerHTML = projects.map(project => `
        <tr>
            <td>
                <div class="project-name">
                    <div class="d-flex align-items-start">
                        <span class="project-color-badge me-2 mt-1" style="background-color: ${project.color || '#4361ee'}"></span>
                        <div class="d-flex flex-column">
                            <div class="d-flex align-items-center">
                                <span class="me-2">${this.escapeHtml(project.name)}</span>
                            </div>
                            ${project.is_favorite ? '<div><i class="fas fa-star text-warning" title="Favori"></i></div>' : ''}
                        </div>
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
                    <button class="btn btn-outline-info" onclick="ProjectManager.showArchivedProjectDetails(${project.id})" 
                            title="Voir les détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    <button class="btn btn-outline-success" onclick="ProjectManager.restoreProject(${project.id})" 
                            title="Restaurer le projet">
                        <i class="fas fa-undo"></i>
                    </button>
                    
                    <button class="btn btn-outline-danger" onclick="ProjectManager.permanentDeleteProject(${project.id})" 
                            title="Supprimer définitivement">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

static updateArchivesCount(count) {
    const badge = document.getElementById('archives-count');
    if (badge) {
        badge.textContent = count;
    }
}

// Méthodes d'actions pour les archives
static async restoreProject(projectId) {
    if (!confirm('Restaurer ce projet ? Il réapparaîtra dans vos projets actifs.')) {
        return;
    }

    try {
        const response = await fetch(`${this.API_BASE_URL}projectArchivesApi.php?action=restore`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ project_id: projectId }),
        });

        const data = await response.json();

        if (data.success) {
            this.showToast("Succès", "Projet restauré avec succès", "success");
            // Recharger les archives et les projets actifs
            this.loadArchivesTable();
            this.loadProjectsTable();
        } else {
            this.showToast("Erreur", data.error || "Erreur lors de la restauration", "error");
        }
    } catch (error) {
        console.error("Erreur restauration:", error);
        this.showToast("Erreur", "Problème de connexion au serveur", "error");
    }
}

static async permanentDeleteProject(projectId) {
    if (!confirm('SUPPRESSION DÉFINITIVE ! Ce projet et toutes ses tâches seront effacés. Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`${this.API_BASE_URL}projectArchivesApi.php?action=permanent_delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ project_id: projectId }),
        });

        const data = await response.json();

        if (data.success) {
            this.showToast("Succès", "Projet supprimé définitivement", "success");
            // Recharger les archives
            this.loadArchivesTable();
        } else {
            this.showToast("Erreur", data.error || "Erreur lors de la suppression", "error");
        }
    } catch (error) {
        console.error("Erreur suppression:", error);
        this.showToast("Erreur", "Problème de connexion au serveur", "error");
    }
}

static async showArchivedProjectDetails(projectId) {
    try {
        // 1. Récupérer les infos du projet archivé AVEC SES TÂCHES
        const archivesResponse = await fetch(`${this.API_BASE_URL}projectArchivesApi.php?action=list_archived`);
        const archivesData = await archivesResponse.json();
        
        const project = archivesData.projects.find(p => p.id == projectId);
        
        if (!project) {
            this.showToast("Erreur", "Projet archivé non trouvé", "error");
            return;
        }

        // 2. Utiliser les tâches déjà incluses dans la réponse du projet
        const projectTasks = project.tasks || [];

        // 3. Afficher les détails
        this.displayProjectDetails(project, projectTasks);
        
        // 4. Ajouter les badges
        const detailsSection = document.getElementById('project-details-section');
        if (detailsSection) {
            const header = detailsSection.querySelector('.card-header');
            if (header && !header.querySelector('.archived-badge')) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-warning archived-badge ms-2';
                badge.innerHTML = '<i class="fas fa-archive me-1"></i>Archivé';
                header.querySelector('h5').appendChild(badge);
            }
            
            // Indiquer les tâches archivées
            const inactiveTasks = projectTasks.filter(task => task.is_active === false || task.is_active === 0);
            if (inactiveTasks.length > 0) {
                const taskBadge = document.createElement('span');
                taskBadge.className = 'badge bg-secondary ms-2';
                taskBadge.innerHTML = `<i class="fas fa-eye-slash me-1"></i>${inactiveTasks.length} tâche(s) archivée(s)`;
                header.querySelector('h5').appendChild(taskBadge);
            }
        }
        
    } catch (error) {
        console.error("Erreur chargement détails projet archivé:", error);
        this.showToast("Erreur", "Impossible de charger les détails du projet archivé", "error");
    }
}

// 🆕 Surcharger la méthode hideProjectDetails pour nettoyer le badge archivé
static hideProjectDetails() {
    const detailsSection = document.getElementById('project-details-section');
    if (detailsSection) {
        // Supprimer le badge archivé si présent
        const archivedBadge = detailsSection.querySelector('.archived-badge');
        if (archivedBadge) {
            archivedBadge.remove();
        }
    }
    document.getElementById('project-details-section').style.display = 'none';
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