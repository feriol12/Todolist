class ProjectsManager {
    constructor() {
        this.projects = [];
        this.currentProjectId = null;
        this.init();
    }

    init() {
        this.loadProjects();
        this.setupEventListeners();
    }

    async loadProjects() {
        try {
            this.showLoading();
            
            // Simulation de données - À remplacer par ton API
            const mockProjects = [
                {
                    id: 1,
                    name: 'Site E-commerce',
                    description: 'Développement site e-commerce avec React',
                    color: '#4361ee',
                    icon: 'fas fa-shopping-cart',
                    task_count: 8,
                    completed_tasks: 3,
                    is_favorite: true,
                    created_at: '2024-01-15'
                },
                {
                    id: 2,
                    name: 'Application Mobile',
                    description: 'App React Native pour gestion de tâches',
                    color: '#dc3545',
                    icon: 'fas fa-mobile-alt',
                    task_count: 12,
                    completed_tasks: 8,
                    is_favorite: false,
                    created_at: '2024-01-10'
                },
                {
                    id: 3,
                    name: 'Refonte Logo',
                    description: 'Nouvelle identité visuelle',
                    color: '#198754',
                    icon: 'fas fa-palette',
                    task_count: 5,
                    completed_tasks: 5,
                    is_favorite: true,
                    created_at: '2024-01-20'
                }
            ];

            this.projects = mockProjects;
            this.renderProjects();
            this.updateProjectsCount();

        } catch (error) {
            console.error('Erreur chargement projets:', error);
            this.showError('Erreur lors du chargement des projets');
        }
    }

    renderProjects() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;

        this.hideLoading();

        if (this.projects.length === 0) {
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

        tbody.innerHTML = this.projects.map(project => `
            <tr>
                <td>
                    <div class="project-name">
                        <span class="project-color-badge" style="background-color: ${project.color}"></span>
                        <div>
                            <div>${this.escapeHtml(project.name)}</div>
                            ${project.is_favorite ? '<i class="fas fa-star text-warning" title="Favori"></i>' : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <small class="text-muted">${this.escapeHtml(project.description)}</small>
                </td>
                <td>
                    <div class="project-stats">
                        <span class="badge bg-primary">${project.task_count} tâches</span>
                        <small class="text-muted d-block">${project.completed_tasks} terminées</small>
                    </div>
                </td>
                <td>
                    ${this.getProjectStatusBadge(project)}
                </td>
                <td class="project-actions">
                    <div class="btn-group btn-group-sm">
                        <!-- Bouton Détails 👁️ -->
                        <button class="btn btn-outline-info" onclick="projectsManager.showProjectDetails(${project.id})" 
                                title="Voir les détails">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        <!-- Bouton Modifier ✏️ -->
                        <button class="btn btn-outline-primary" onclick="projectsManager.editProject(${project.id})" 
                                title="Modifier le projet">
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <!-- Bouton Favori ⭐ -->
                        <button class="btn btn-outline-warning" onclick="projectsManager.toggleFavorite(${project.id})" 
                                title="${project.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="fas ${project.is_favorite ? 'fa-star' : 'fa-star'}"></i>
                        </button>
                        
                        <!-- Bouton Supprimer 🗑️ -->
                        <button class="btn btn-outline-danger" onclick="projectsManager.deleteProject(${project.id})" 
                                title="Supprimer le projet">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getProjectStatusBadge(project) {
        const progress = project.task_count > 0 ? (project.completed_tasks / project.task_count) * 100 : 0;
        
        if (progress === 0) return '<span class="badge bg-secondary">Non commencé</span>';
        if (progress === 100) return '<span class="badge bg-success">Terminé</span>';
        if (progress >= 50) return '<span class="badge bg-primary">En progression</span>';
        return '<span class="badge bg-warning">En cours</span>';
    }

    async showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        this.currentProjectId = projectId;

        // Afficher la section détails
        document.getElementById('project-details').style.display = 'block';
        document.getElementById('project-details-title').textContent = `Détails : ${project.name}`;

        // Charger les détails du projet
        const detailsContent = document.getElementById('project-details-content');
        detailsContent.innerHTML = this.getProjectDetailsHTML(project);

        // Scroll vers la section détails
        document.getElementById('project-details').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    getProjectDetailsHTML(project) {
        const progress = project.task_count > 0 ? (project.completed_tasks / project.task_count) * 100 : 0;
        
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informations du projet</h6>
                    <table class="table table-sm">
                        <tr>
                            <td><strong>Nom:</strong></td>
                            <td>${this.escapeHtml(project.name)}</td>
                        </tr>
                        <tr>
                            <td><strong>Description:</strong></td>
                            <td>${this.escapeHtml(project.description)}</td>
                        </tr>
                        <tr>
                            <td><strong>Date création:</strong></td>
                            <td>${this.formatDate(project.created_at)}</td>
                        </tr>
                        <tr>
                            <td><strong>Statut:</strong></td>
                            <td>${this.getProjectStatusBadge(project)}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Progression</h6>
                    <div class="progress mb-2" style="height: 20px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${progress}%;" 
                             aria-valuenow="${progress}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${Math.round(progress)}%
                        </div>
                    </div>
                    <small class="text-muted">
                        ${project.completed_tasks} sur ${project.task_count} tâches terminées
                    </small>
                </div>
            </div>

            <div class="mt-4">
                <h6>Tâches du projet</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Tâche</th>
                                <th>Statut</th>
                                <th>Priorité</th>
                                <th>Échéance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.getProjectTasksHTML(project.id)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getProjectTasksHTML(projectId) {
        // Simulation des tâches - À remplacer par ton API
        const mockTasks = [
            { title: 'Design homepage', status: 'done', priority: 'high', due_date: '2024-01-25' },
            { title: 'Intégration responsive', status: 'in_progress', priority: 'medium', due_date: '2024-01-30' },
            { title: 'Tests utilisateurs', status: 'todo', priority: 'low', due_date: '2024-02-05' }
        ];

        if (mockTasks.length === 0) {
            return '<tr><td colspan="4" class="text-center text-muted">Aucune tâche dans ce projet</td></tr>';
        }

        return mockTasks.map(task => `
            <tr>
                <td>${this.escapeHtml(task.title)}</td>
                <td><span class="badge bg-${this.getStatusBadgeColor(task.status)}">${this.getStatusText(task.status)}</span></td>
                <td><span class="badge bg-${this.getPriorityBadgeColor(task.priority)}">${this.getPriorityText(task.priority)}</span></td>
                <td>${task.due_date ? this.formatDate(task.due_date) : 'Non définie'}</td>
            </tr>
        `).join('');
    }

    hideProjectDetails() {
        document.getElementById('project-details').style.display = 'none';
        this.currentProjectId = null;
    }

    editProject(projectId) {
        // Logique pour éditer le projet
        console.log('Édition du projet:', projectId);
        // Ouvrir le modal d'édition
    }

    toggleFavorite(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.is_favorite = !project.is_favorite;
            this.renderProjects();
            this.showToast('Succès', `Projet ${project.is_favorite ? 'ajouté aux' : 'retiré des'} favoris`, 'success');
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les tâches associées seront également supprimées.')) {
            return;
        }

        try {
            // Logique de suppression - À implémenter avec ton API
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.renderProjects();
            this.updateProjectsCount();
            this.showToast('Succès', 'Projet supprimé avec succès', 'success');
            
            // Cacher les détails si le projet courant est supprimé
            if (this.currentProjectId === projectId) {
                this.hideProjectDetails();
            }
        } catch (error) {
            this.showToast('Erreur', 'Erreur lors de la suppression', 'error');
        }
    }

    updateProjectsCount() {
        const countElement = document.getElementById('projects-count');
        if (countElement) {
            countElement.textContent = `${this.projects.length} projet${this.projects.length > 1 ? 's' : ''}`;
        }
    }

    // Utilitaires (à adapter selon ton code existant)
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR');
    }

    getStatusText(status) {
        const statusMap = { 'todo': 'À faire', 'in_progress': 'En cours', 'done': 'Terminée' };
        return statusMap[status] || status;
    }

    getPriorityText(priority) {
        const priorityMap = { 'low': 'Basse', 'medium': 'Moyenne', 'high': 'Haute' };
        return priorityMap[priority] || priority;
    }

    getStatusBadgeColor(status) {
        const colorMap = { 'todo': 'secondary', 'in_progress': 'warning', 'done': 'success' };
        return colorMap[status] || 'secondary';
    }

    getPriorityBadgeColor(priority) {
        const colorMap = { 'low': 'success', 'medium': 'warning', 'high': 'danger' };
        return colorMap[priority] || 'secondary';
    }

    showLoading() {
        // Implémente ton loading
    }

    hideLoading() {
        // Implémente ton hide loading
    }

    showToast(title, message, type) {
        // Utilise ta fonction toast existante
    }

    setupEventListeners() {
        // Éventuels écouteurs d'événements supplémentaires
    }
}

// Initialisation globale
const projectsManager = new ProjectsManager();

// Fonction globale pour cacher les détails
function hideProjectDetails() {
    projectsManager.hideProjectDetails();
}

