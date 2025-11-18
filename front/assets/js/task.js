// Dans ton app.js principal
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le gestionnaire de projets
    window.projectsManager = new ProjectsManager();
});



// Gestion des formulaires
document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  handleTask();
});

async function handleTask() {
//  Récupération des valeurs du formulaire
  const btn = document.getElementById("saveTask");


  //   // Simulation de chargement
    btn.innerHTML =
      '<div class="spinner-border spinner-border-sm me-2"></div>Sauvegarde...';
    btn.disabled = true;

  // Ici, vous intégrerez l'appel API réel

  try {
        const taskData = getTaskData(); 
    const response = await fetch("http://localhost/todolist/back/api/taskApi.php?action=taskSave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),  //envoie de l'objet structuré
    });

    const data = await response.json();
    console.log(data);

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
      if (typeof tagsManager !== 'undefined') {
        tagsManager.clearTags();
      }

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
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text:"Problème de connexion au serveur",
      });
    // showToast("Erreur", "Problème de connexion au serveur", "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Créer mon compte';
    btn.disabled = false;
  }
}

function getTaskData(){
  // Gérer le rappel personnalisé
  let reminderValue = null;
  const reminderType = document.getElementById("taskReminder").value;
  
  if (reminderType === 'custom') {
    const customDate = document.getElementById("customReminderDate").value;
    const customTime = document.getElementById("customReminderTime").value;
    if (customDate && customTime) {
      reminderValue = `${customDate} ${customTime}:00`;
    }
  } else if (reminderType) {
    // Logique pour les rappels relatifs (30min, 1h, etc.)
    reminderValue = reminderType; // À adapter selon ton backend
  }

  // Récupérer les tags depuis tagsManager
  const tagsValue = (typeof tagsManager !== 'undefined') 
    ? tagsManager.getTagsForSubmit() 
    : null;

  return {
    project_id: document.getElementById("project").value || null,
    title: document.getElementById("taskTitle").value.trim(),
    description: document.getElementById("taskDescription").value.trim(),
    status: document.getElementById("taskStatus").value,
    priority: document.getElementById("taskPriority").value,
    due_date: document.getElementById("taskDueDate").value || null,
    due_time: document.getElementById("taskDueTime").value || null,
    reminder: reminderValue,
    estimated_duration: document.getElementById("taskDureEstimation").value || null,
    tags: tagsValue,
    // ⚠️ NOTE: "taskDureEstimation" devrait s'appeler "taskEstimatedDuration" pour être cohérent
  };
}
