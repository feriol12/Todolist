// ✅ URL CORRECTE - GARDER CETTE LIGNE
const API_BASE_URL = window.location.origin + '/todolist/back/api/';

document.getElementById("saveProject")?.addEventListener("click", handleProject);

async function handleProject() {
  const name = document.getElementById("projectName").value;
  const description = document.getElementById("projectDescription").value;
  const color = document.getElementById("projectColor").value;
  const icon = document.getElementById("projectIcon").value;
  const is_favorite = document.getElementById("projectIsFavorite").checked;

  const btn = document.getElementById("saveProject");
   
  // Validation
  if (!name.trim()) {
    showToast("Erreur", "Le nom du projet est obligatoire", "error");
    return;
  }

  btn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Création...';
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}projectApi.php?action=create`, {
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
      showToast("Succès", "Projet créé avec succès!", "success");
      
      // Fermer le modal et recharger
      setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
        if (modal) modal.hide();
        
        document.getElementById("projectForm")?.reset();
        loadProjects(); // Recharger la liste
        
        // 🔥 AJOUT: Rafraîchir les stats du dernier projet
        if (window.StatsManager) {
          StatsManager.refreshStats();
        }
      }, 1500);
    } else {
      showToast("Erreur", data.error || "Erreur lors de la création", "error");
    }
  } catch (error) {
    console.error("Erreur:", error);
    showToast("Erreur", error.message || "Problème de connexion au serveur", "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-save me-2"></i>Créer le projet';
    btn.disabled = false;
  }
}

async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE_URL}projectApi.php?action=list`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log("Projets chargés:", data.projects);
      updateProjectSelect(data.projects);
    } else {
      console.error("Erreur API projets:", data.error);
    }
  } catch (error) {
    console.error("Erreur chargement projets:", error);
  }
}

function updateProjectSelect(projects) {
  const select = document.getElementById("project");
  if (!select) {
    console.warn("Element #Project non trouvé");
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

// Fonction toast
function showToast(title, message, type = "info") {
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



// 🔧 FONCTIONS POUR LA GESTION DES PROJETS (À AJOUTER)

async function deleteProject(projectId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les tâches associées seront également supprimées.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}projectApi.php?action=delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id: projectId }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Succès", "Projet supprimé avec succès", "success");
      loadProjects(); // Recharger la liste
      loadProjectsTable(); // Recharger le tableau
    } else {
      showToast("Erreur", data.error || "Erreur lors de la suppression", "error");
    }
  } catch (error) {
    console.error("Erreur suppression:", error);
    showToast("Erreur", "Problème de connexion au serveur", "error");
  }
}

async function toggleFavorite(projectId) {
  try {
    const response = await fetch(`${API_BASE_URL}projectApi.php?action=toggle_favorite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ project_id: projectId }),
    });

    const data = await response.json();

    if (data.success) {
      showToast("Succès", data.message || "Favori mis à jour", "success");
      loadProjects(); // Recharger la liste
      loadProjectsTable(); // Recharger le tableau
    } else {
      showToast("Erreur", data.error || "Erreur", "error");
    }
  } catch (error) {
    console.error("Erreur favori:", error);
    showToast("Erreur", "Problème de connexion", "error");
  }
}

// 🎨 FONCTION POUR AFFICHER LE TABLEAU DES PROJETS
async function loadProjectsTable() {
  try {
    const response = await fetch(`${API_BASE_URL}projectApi.php?action=list`);
    

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Projets pour tableau chargés:", data.projects);
    
    if (data.success) {
      renderProjectsTable(data.projects);
         // ✅ METTRE À JOUR LE COMPTEUR - AJOUTE CETTE LIGNE
      document.getElementById('projects-count').textContent = data.projects.length + ' projet' + (data.projects.length > 1 ? 's' : '');
    } else {
      console.error("Erreur API projets:", data.error);
    }
  } catch (error) {
    console.error("Erreur chargement projets:", error);
    // Afficher des données mockées pour tester
    renderProjectsTable(getMockProjects());
  }
}

function renderProjectsTable(projects) {
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
            <div>${escapeHtml(project.name)}</div>
            ${project.is_favorite ? '<i class="fas fa-star text-warning" title="Favori"></i>' : ''}
          </div>
        </div>
      </td>
      <td>
        <small class="text-muted">${escapeHtml(project.description || 'Aucune description')}</small>
      </td>
      <td>
        <div class="project-stats">
          <span class="badge bg-primary">${project.task_count || 0} tâches</span>
          <small class="text-muted d-block">${project.total_done || 0} terminées</small>
        </div>
      </td>
      <td>
        ${getProjectStatusBadge(project)}
      </td>
      <td class="project-actions">
        <div class="btn-group btn-group-sm">
          <!-- Bouton Détails 👁️ -->
          <button class="btn btn-outline-info" onclick="showProjectDetails(${project.id})" 
                  title="Voir les détails">
            <i class="fas fa-eye"></i>
          </button>
          
          <!-- Bouton Modifier ✏️ -->
          <button class="btn btn-outline-primary" onclick="editProject(${project.id})" 
                  title="Modifier le projet">
            <i class="fas fa-edit"></i>
          </button>
          
          <!-- Bouton Favori ⭐ -->
          <button class="btn btn-outline-warning" onclick="toggleFavorite(${project.id})" 
                  title="${project.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            <i class="fas ${project.is_favorite ? 'fa-star' : 'fa-star'}"></i>
          </button>
          
          <!-- Bouton Supprimer 🗑️ -->
          <button class="btn btn-outline-danger" onclick="deleteProject(${project.id})" 
                  title="Supprimer le projet">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 🛠️ FONCTIONS UTILITAIRES
function getProjectStatusBadge(project) {
  const taskCount = project.task_count || 0;
  const completed = project.total_done || 0;
  const progress = taskCount > 0 ? (completed / taskCount) * 100 : 0;
  
  if (progress === 0) return '<span class="badge bg-secondary">Non commencé</span>';
  if (progress === 100) return '<span class="badge bg-success">Terminé</span>';
  if (progress >= 50) return '<span class="badge bg-primary">En progression</span>';
  return '<span class="badge bg-warning">En cours</span>';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 🆕 FONCTION POUR AFFICHER LES DÉTAILS D'UN PROJET
async function showProjectDetails(projectId) {
    try {
        // 1. Récupérer les infos du projet
        const projectsResponse = await fetch(`${API_BASE_URL}projectApi.php?action=list`);
        const projectsData = await projectsResponse.json();
        
        const project = projectsData.projects.find(p => p.id == projectId);
        
        if (!project) {
            showToast("Erreur", "Projet non trouvé", "error");
            return;
        }

        // 2. Récupérer les tâches de ce projet
        const tasksResponse = await fetch(`${API_BASE_URL}taskApi.php?action=list&project_id=${projectId}`);
        const tasksData = await tasksResponse.json();
        
        const projectTasks = tasksData.success ? tasksData.data : [];

        // 3. Afficher les détails
        displayProjectDetails(project, projectTasks);
        
    } catch (error) {
        console.error("Erreur chargement détails:", error);
        showToast("Erreur", "Impossible de charger les détails", "error");
    }
}

// 🆕 FONCTION POUR AFFICHER LES DÉTAILS DANS L'INTERFACE
function displayProjectDetails(project, tasks) {
    // A. Mettre à jour les infos du projet
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
                    <strong>${escapeHtml(task.title)}</strong>
                </td>
                <td>
                    <small class="text-muted">${escapeHtml(task.description || 'Aucune description')}</small>
                </td>
                <td>
                    <span class="badge bg-${getStatusBadgeColor(task.status)}">
                        ${getStatusText(task.status)}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${getPriorityBadgeColor(task.priority)}">
                        ${getPriorityText(task.priority)}
                    </span>
                </td>
                <td>
                    ${task.due_date ? formatDate(task.due_date) : 'Non définie'}
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
function hideProjectDetails() {
    document.getElementById('project-details-section').style.display = 'none';
}

// 🛠️ FONCTIONS UTILITAIRES (assure-toi qu'elles existent)
function getStatusText(status) {
    const statusMap = { 'todo': 'À faire', 'in_progress': 'En cours', 'done': 'Terminée' };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = { 'low': 'Basse', 'medium': 'Moyenne', 'high': 'Haute' };
    return priorityMap[priority] || priority;
}

function getStatusBadgeColor(status) {
    const colorMap = { 'todo': 'secondary', 'in_progress': 'warning', 'done': 'success' };
    return colorMap[status] || 'secondary';
}

function getPriorityBadgeColor(priority) {
    const colorMap = { 'low': 'success', 'medium': 'warning', 'high': 'danger' };
    return colorMap[priority] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function editProject(projectId) {
  showToast("Info", `Édition du projet ${projectId} - À implémenter`, "info");
}


// Charger les projets au démarrage
document.addEventListener('DOMContentLoaded', function() {
  loadProjects();
  loadProjectsTable();
});