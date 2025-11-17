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

// Charger les projets au démarrage
document.addEventListener('DOMContentLoaded', function() {
  loadProjects();
});