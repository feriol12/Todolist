class TaskManager {
  static API_BASE_URL = window.location.origin + "/todolist/back/api/";

  static currentEditTaskId = null; // Stocker l'ID de la tâche en cours d'édition
  static currentProjectId = null;
  static currentProjectTasks = [];
  // ✅ AJOUTEZ CETTE MÉTHODE D'INITIALISATION
  static init() {
    console.log("🚀 Initialisation TaskManager...");

    // Gestion du formulaire de tâche
    const taskForm = document.getElementById("taskForm");
    if (taskForm) {
      console.log("📝 Formulaire tâche trouvé, ajout event listener...");
      taskForm.addEventListener("submit", function (e) {
        e.preventDefault();
        console.log("🎯 Formulaire soumis - appel TaskManager.handleTask()");
        TaskManager.handleTask();
      });
    } else {
      console.warn("⚠️ Formulaire taskForm non trouvé");
    }

    // Réinitialiser le modal quand il se ferme
    const taskModal = document.getElementById("taskModal");
    if (taskModal) {
      taskModal.addEventListener("hidden.bs.modal", function () {
        console.log("🔄 Modal fermé - réinitialisation");
        TaskManager.resetModal();
      });
    }
     // 🔥 ACTIVER LES LISTENERS DES FILTRES
        this.initFiltersListener();
              
    console.log("✅ TaskManager initialisé");
  }

  //Listener  global sur les filtres
  static initFiltersListener() {
    const filterBox = document.getElementById("task-filters");
    if (!filterBox) return;

    filterBox.addEventListener("input", () => {
      this.applyFiltersOnProjectTasks();
    });

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("keyup", () => {
        this.applyFiltersOnProjectTasks();
      });
    }
  }
  //fonction de filtrage des taches sans appel API car showProjectDetails() les a déjà chargées
  static applyFiltersOnProjectTasks() {
    if (!this.currentProjectTasks || this.currentProjectTasks.length === 0)
      return;

    let tasks = [...this.currentProjectTasks];

    // FILTRE STATUS
    const status =
      document.querySelector('input[name="statusFilter"]:checked')?.value ||
      "all";
    if (status !== "all") {
      tasks = tasks.filter((t) => t.status === status);
    }
    // FILTRE PRIORITÉS
    const priorities = [
      ...document.querySelectorAll(".filter-priority:checked"),
    ].map((el) => el.value);
    if (priorities.length > 0) {
      tasks = tasks.filter((t) => priorities.includes(t.priority));
    }

    // FILTRE RECHERCHE
    const search =
      document.getElementById("search-input")?.value.toLowerCase() || "";
    if (search.length > 0) {
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          (t.description && t.description.toLowerCase().includes(search))
      );
    }

    // APPELER L’AFFICHAGE
    this.renderProjectTasks(tasks);
  }
  //Afficher uniquement les taches filtrées
  static renderProjectTasks(tasks) {
    const tbody = document.getElementById("project-tasks-table-body");
    if (!tbody) return;

    if (!tasks.length) {
      tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-3">
                    <i class="fas fa-tasks fa-2x mb-2"></i>
                    <p>Aucune tâche trouvée</p>
                </td>
            </tr>
        `;
      return;
    }

    tbody.innerHTML = tasks
      .map(
        (task) => `
        <tr>
            <td><strong>${TaskManager.escapeHtml(task.title)}</strong></td>
            <td>${TaskManager.escapeHtml(task.description || "Aucune")}</td>
            <td>
                <span class="badge bg-${TaskManager.getStatusBadgeColor(
                  task.status
                )}">
                    ${TaskManager.getStatusText(task.status)}
                </span>
            </td>
            <td>
                <span class="badge bg-${TaskManager.getPriorityBadgeColor(
                  task.priority
                )}">
                    ${TaskManager.getPriorityText(task.priority)}
                </span>
            </td>
            <td>
                ${
                  task.due_date
                    ? TaskManager.formatDate(task.due_date)
                    : "Non définie"
                }
                ${
                  task.due_time
                    ? `<br><small class="text-muted">${task.due_time}</small>`
                    : ""
                }
            </td>
            <td class="task-actions">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="TaskManager.editTask(${
                      task.id
                    })">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="TaskManager.deleteTask(${
                      task.id
                    }, this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
      )
      .join("");
  }

  // === MÉTHODES POUR LES ACTIONS DES BOUTONS ===
  // ✏️ OUVIR LE MODAL D'ÉDITION
  static async editTask(taskId) {
    console.log("✏️ Édition de la tâche:", taskId);

    try {
      // 1. Charger les données de la tâche
      const task = await this.loadTaskData(taskId);

      if (task) {
        // 2. Pré-remplir le modal
        this.fillEditModal(task);

        // 3. Stocker l'ID pour la sauvegarde
        this.currentEditTaskId = taskId;

        // 4. Ouvrir le modal
        const modal = new bootstrap.Modal(document.getElementById("taskModal"));
        modal.show();
      }
    } catch (error) {
      console.error("Erreur chargement tâche:", error);
      this.showToast("Erreur", "Impossible de charger la tâche", "error");
    }
  }

  // 📥 CHARGER LES DONNÉES D'UNE TÂCHE
  static async loadTaskData(taskId) {
    const response = await fetch(
      `${this.API_BASE_URL}taskApi.php?action=get&task_id=${taskId}`
    );
    const data = await response.json();

    if (data.success) {
      return data.task;
    } else {
      throw new Error(data.error || "Tâche non trouvée");
    }
  }

  // 🎯 PRÉ-REMPLIR LE MODAL
  static fillEditModal(task) {
    // Changer le titre du modal
    document.getElementById("modalTitle").textContent = "Modifier la Tâche";

    // Pré-remplir les champs
    document.getElementById("taskTitle").value = task.title || "";
    document.getElementById("taskDescription").value = task.description || "";
    document.getElementById("taskStatus").value = task.status || "todo";
    document.getElementById("taskPriority").value = task.priority || "medium";
    document.getElementById("taskDueDate").value = task.due_date || "";
    document.getElementById("taskDueTime").value = task.due_time || "";
    document.getElementById("taskDureEstimation").value = task.estimated_duration || "";
    document.getElementById("project").value = task.project_id || "";

    // Gérer les tags avec ton TagsManager
    if (typeof tagsManager !== "undefined") {
        // On remplit la liste interne avec les tags existants de la tâche
        tagsManager.tags = Array.isArray(task.tags) ? task.tags : [];
        tagsManager.updateTagsPreview(); // Met à jour l'affichage
    }

    // Changer le texte du bouton
    document.getElementById("saveTask").innerHTML =
        '<i class="fas fa-save me-2"></i>Modifier la tâche';
}

  // 💾 GÉRER LA MODIFICATION
  static async handleTaskUpdate() {
    const btn = document.getElementById("saveTask");

    btn.innerHTML =
      '<div class="spinner-border spinner-border-sm me-2"></div>Modification...';
    btn.disabled = true;

    try {
      const taskData = this.getTaskData();
         console.log("📥 donner pour modif:", taskData); // ✅ DEBUG

      taskData.task_id = this.currentEditTaskId; // Ajouter l'ID de la tâche

      const response = await fetch(
        `${this.API_BASE_URL}taskApi.php?action=update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        }
      );

      const data = await response.json();
         console.log("📥 Réponse reçue de Api:", data); // ✅ DEBUG
      if (data.success) {
        this.showToast("Succès", "Tâche modifiée avec succès!", "success");
            
        // Fermer le modal et recharger
        setTimeout(() => {
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("taskModal")
          );
          if (modal) modal.hide();

          this.resetModal();

          // Recharger les données
          if (window.ProjectManager) {
            const projectId = this.getCurrentProjectId();
            if (projectId) {
              ProjectManager.showProjectDetails(projectId);
            }
          }
        }, 1500);
      } else {
        this.showToast(
          "Erreur",
          data.error || "Erreur lors de la modification",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur modification:", error);
      this.showToast("Erreur", "Problème de connexion au serveur", "error");
    } finally {
      btn.innerHTML = '<i class="fas fa-save me-2"></i>Modifier la tâche';
      btn.disabled = false;
    }
  }

  // 🔄 RÉINITIALISER LE MODAL
  static resetModal() {
    // Réinitialiser pour la création
    document.getElementById("taskModalLabel").textContent = "Nouvelle Tâche";
    document.getElementById("taskForm").reset();
    document.getElementById("saveTask").innerHTML =
      '<i class="fas fa-plus me-2"></i>Créer la tâche';

    // Réinitialiser les tags
    if (typeof tagsManager !== "undefined") {
      tagsManager.clearTags();
    }

    this.currentEditTaskId = null;
  }

  static async handleTask() {
    // Si on est en mode édition
    if (this.currentEditTaskId) {
      await this.handleTaskUpdate();
      return;
    }
    //  Récupération des valeurs du formulaire
    const btn = document.getElementById("saveTask");

    //   // Simulation de chargement
    btn.innerHTML =
      '<div class="spinner-border spinner-border-sm me-2"></div>Sauvegarde...';
    btn.disabled = true;

    // Ici, vous intégrerez l'appel API réel

    try {
      const taskData = this.getTaskData();
      console.log("📦 Données envoyées:", taskData); // ✅ DEBUG
      const response = await fetch(
        `${this.API_BASE_URL}taskApi.php?action=taskSave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData), //envoie de l'objet structuré
        }
      );
      console.log("📤 status HTTP", response.status); // ✅ DEBUG
      const data = await response.json();
      console.log("📥 Réponse reçue de Api:", data); // ✅ DEBUG

      if (data.success) {
        btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>créer';
        btn.disabled = false;

        Swal.fire({
          icon: "success",
          title: "Succès!",
          text: "La tâche a été créée avec succès!",
          showConfirmButton: false,
          timer: 1500,
        });

        // Réinitialiser le formulaire après succès
        document.getElementById("taskForm").reset();

        // ✅ RÉINITIALISER LES TAGS
        if (typeof tagsManager !== "undefined") {
          tagsManager.clearTags();
        }
        console.error("❌ Erreur API:", data.error); // ✅ DEBUG
        // Redirection après le popup
        setTimeout(() => {
          window.location.href = "../assets/dashboard.html";
        }, 1500);
      } else {
        // Popup d'erreur
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: data.error || "Impossible de créer la tâche.",
        });
        // Remettre le bouton en état normal
        btn.innerHTML = '<i class="fas fa-check me-2"></i>Créer';
        btn.disabled = false;
      }
    } catch (error) {
      console.error("💥 Erreur fetch:", error); // ✅ DEBUG
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Problème de connexion au serveur",
      });
      // showToast("Erreur", "Problème de connexion au serveur", "error");
    } finally {
      btn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Créer mon compte';
      btn.disabled = false;
    }
  }

  // suppression de tâche
  static async deleteTask(taskId, buttonElement) {
    console.log("🗑️ Suppression de la tâche:", taskId); //debug
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      return;
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}taskApi.php?action=delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showToast("Succès", "Tâche supprimée avec succès", "success");
        // // Recharger les détails du projet
        // if (window.ProjectManager) {
        //     const projectId = this.getCurrentProjectId();
        //     if (projectId) {
        //         ProjectManager.showProjectDetails(projectId);
        //     }

        // }

        // ✅ ANIMATION DE SUPPRESSION (seulement si buttonElement existe)
        if (buttonElement) {
          const row = buttonElement.closest("tr");
          if (row) {
            // Ajouter une classe pour l'animation
            row.classList.add("deleting");

            // Animation de disparition
            row.style.transition = "all 0.4s ease";
            row.style.opacity = "0";
            row.style.maxHeight = "0";
            row.style.overflow = "hidden";
            row.style.transform = "scale(0.8)";

            setTimeout(() => {
              row.remove();
              this.checkIfTableEmpty();

              // ✅ SIMPLE RAFRAÎCHISSEMENT
              if (window.ProjectManager) {
                // Rafraîchir le tableau des projets
                ProjectManager.loadProjectsTable();

                // Rafraîchir aussi les stats si elles sont affichées
                if (window.StatsManager) {
                  StatsManager.refreshStats();
                }
              }
            }, 400);
          }
        }
      } else {
        this.showToast(
          "Erreur",
          data.error || "Erreur lors de la suppression",
          "error"
        );
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      this.showToast("Erreur", "Problème de connexion au serveur", "error");
    }
  }

  // fonctionnalité de favoris pour la tâche
  static async toggleFavorite(taskId) {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}taskApi.php?action=toggle_favorite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        this.showToast(
          "Succès",
          data.message || "Favori mis à jour",
          "success"
        );
        // Recharger les détails du projet
        if (window.ProjectManager) {
          const projectId = this.getCurrentProjectId();
          if (projectId) {
            ProjectManager.showProjectDetails(projectId);
          }
        }
      } else {
        this.showToast("Erreur", data.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur favori:", error);
      this.showToast("Erreur", "Problème de connexion", "error");
    }
  }
  // details de la tache
  static async showTaskDetails(taskId) {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}taskApi.php?action=get&task_id=${taskId}`
      );
      const data = await response.json();

      if (data.success) {
        this.displayTaskDetails(data.task);
      } else {
        this.showToast("Erreur", "Tâche non trouvée", "error");
      }
    } catch (error) {
      console.error("Erreur chargement détails tâche:", error);
      this.showToast("Erreur", "Impossible de charger les détails", "error");
    }
  }

  // afficher le tableau
  static displayTaskDetails(task) {
    // Afficher les détails dans votre section existante (comme pour les projets)
    // Vous pouvez créer une section similaire à project-details-section

    // 1. Créer ou utiliser une section existante pour les détails tâche
    let taskDetailsSection = document.getElementById("task-details-section");

    if (!taskDetailsSection) {
      // Créer la section si elle n'existe pas
      taskDetailsSection = document.createElement("div");
      taskDetailsSection.id = "task-details-section";
      taskDetailsSection.className = "card mt-4";
      taskDetailsSection.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Détails de la Tâche</h5>
                    <button class="btn btn-sm btn-light" onclick="TaskManager.hideTaskDetails()">
                        <i class="fas fa-times me-1"></i> Fermer
                    </button>
                </div>
                <div class="card-body">
                    <div id="task-details-content">
                        <!-- Le contenu sera injecté ici -->
                    </div>
                </div>
            `;
      document
        .getElementById("project-details-section")
        .after(taskDetailsSection);
    }

    // 2. Remplir le contenu
    const taskDetailsContent = document.getElementById("task-details-content");
    taskDetailsContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informations générales</h6>
                    <p><strong>Titre:</strong> ${this.escapeHtml(
                      task.title
                    )}</p>
                    <p><strong>Description:</strong> ${this.escapeHtml(
                      task.description || "Aucune"
                    )}</p>
                    <p><strong>Statut:</strong> <span class="badge bg-${this.getStatusBadgeColor(
                      task.status
                    )}">${this.getStatusText(task.status)}</span></p>
                    <p><strong>Priorité:</strong> <span class="badge bg-${this.getPriorityBadgeColor(
                      task.priority
                    )}">${this.getPriorityText(task.priority)}</span></p>
                </div>
                <div class="col-md-6">
                    <h6>Dates et Détails</h6>
                    <p><strong>Date d'échéance:</strong> ${
                      task.due_date
                        ? this.formatDate(task.due_date)
                        : "Non définie"
                    }</p>
                    <p><strong>Heure:</strong> ${
                      task.due_time || "Non définie"
                    }</p>
                    <p><strong>Durée estimée:</strong> ${
                      task.estimated_duration || "Non définie"
                    }</p>
                    ${
                      task.project_name
                        ? `<p><strong>Projet:</strong> ${this.escapeHtml(
                            task.project_name
                          )}</p>`
                        : ""
                    }
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="TaskManager.editTask(${
                  task.id
                })">
                    <i class="fas fa-edit me-1"></i>Modifier la tâche
                </button>
            </div>
        `;

    // 3. Afficher la section
    taskDetailsSection.style.display = "block";

    // 4. Scroll vers la section
    taskDetailsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  static getTaskData() {
    // Gérer le rappel personnalisé
    let reminderValue = null;
    const reminderType = document.getElementById("taskReminder").value;

    if (reminderType === "custom") {
      const customDate = document.getElementById("customReminderDate").value;
      const customTime = document.getElementById("customReminderTime").value;
      if (customDate && customTime) {
        reminderValue = `${customDate} ${customTime}:00`;
      }
    } else if (reminderType) {
      // Logique pour les rappels relatifs (30min, 1h, etc.)
      reminderValue = reminderType; // À adapter selon ton backend
    }

    // Récupérer les tags depuis tagsManager sous forme de tableau json
  const tagsArray = tagsManager.getTagsForSubmit();
  const tagsValue = tagsArray.length ? JSON.stringify(tagsArray) : null;

    return {
      project_id: document.getElementById("project").value || null,
      title: document.getElementById("taskTitle").value.trim(),
      description: document.getElementById("taskDescription").value.trim(),
      status: document.getElementById("taskStatus").value,
      priority: document.getElementById("taskPriority").value,
      due_date: document.getElementById("taskDueDate").value || null,
      due_time: document.getElementById("taskDueTime").value || null,
      reminder: reminderValue,
      estimated_duration:
        document.getElementById("taskDureEstimation").value || null,
      tags: tagsValue,
      // ⚠️ NOTE: "taskDureEstimation" devrait s'appeler "taskEstimatedDuration" pour être cohérent
    };
  }

  static getCurrentProjectId() {
    const projectNameElement = document.getElementById("project-details-name");
    return projectNameElement ? projectNameElement.dataset.projectId : null;
  }

  static showToast(title, message, type = "info") {
    const icon =
      type === "success" ? "success" : type === "error" ? "error" : "info";

    Swal.fire({
      icon: icon,
      title: title,
      text: message,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  static getStatusText(status) {
    const statusMap = {
      todo: "À faire",
      in_progress: "En cours",
      done: "Terminée",
    };
    return statusMap[status] || status;
  }

  static getPriorityText(priority) {
    const priorityMap = { low: "Basse", medium: "Moyenne", high: "Haute" };
    return priorityMap[priority] || priority;
  }

  static getStatusBadgeColor(status) {
    const colorMap = {
      todo: "secondary",
      in_progress: "warning",
      done: "success",
    };
    return colorMap[status] || "secondary";
  }

  static getPriorityBadgeColor(priority) {
    const colorMap = { low: "success", medium: "warning", high: "danger" };
    return colorMap[priority] || "secondary";
  }

  static formatDate(dateString) {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString("fr-FR");
  }

  static escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  TaskManager.init();
});

 
