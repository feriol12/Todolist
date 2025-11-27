// js/debug.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DEBUG - Vérification des éléments DOM:');
    console.log('projectsTableBody:', document.getElementById('projectsTableBody'));
    console.log('projects-pagination:', document.getElementById('projects-pagination'));
    console.log('projects-count:', document.getElementById('projects-count'));
    
    // Vérifier si ProjectManager est bien chargé
    console.log('ProjectManager:', window.ProjectManager);
    
    // Tester la pagination manuellement
    setTimeout(() => {
        if (window.ProjectManager && window.ProjectManager.allProjects) {
            console.log('📊 Projets chargés:', window.ProjectManager.allProjects.length);
            console.log('📄 Page actuelle:', window.ProjectManager.currentPage);
        }
    }, 1000);
});