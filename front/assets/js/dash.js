// <!-- Scripts -->
        // Gestion de l'état d'authentification
        class AuthManager {
            constructor() {
                this.init();
            }

            init() {
                this.checkAuthState();
                this.setupEventListeners();
            }

            // Vérifier si l'utilisateur est connecté
            checkAuthState() {
                // Simuler une vérification d'authentification
                // En pratique, tu vérifierais un token JWT ou une session
                const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
                const userName = localStorage.getItem('userName') || 'Utilisateur';
                
                this.toggleAuthUI(isLoggedIn, userName);
            }

            // Basculer entre les états connecté/non connecté
            toggleAuthUI(isLoggedIn, userName = 'Utilisateur') {
                const authButtons = document.getElementById('auth-buttons');
                const userMenu = document.getElementById('user-menu');
                const userNameSpan = document.getElementById('user-name');

                if (isLoggedIn) {
                    authButtons.style.display = 'none';
                    userMenu.style.display = 'flex !important';
                    userNameSpan.textContent = userName;
                } else {
                    authButtons.style.display = 'flex';
                    userMenu.style.display = 'none !important';
                }
            }

            setupEventListeners() {
                // Gestion de la déconnexion
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => this.handleLogout());
                }
            }

            handleLogout() {
                // Simuler la déconnexion
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('userName');
                
                // Afficher message de confirmation
                this.showToast('Déconnexion réussie', 'Vous avez été déconnecté avec succès.', 'success');
                
                // Mettre à jour l'UI
                setTimeout(() => {
                    this.toggleAuthUI(false);
                    // Rediriger vers la page de connexion si nécessaire
                    // window.location.href = 'login.html';
                }, 1500);
            }

            // Méthode pour simuler la connexion (à utiliser après un login réussi)
            simulateLogin(userName) {
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('userName', userName);
                this.toggleAuthUI(true, userName);
                this.showToast('Connexion réussie', `Bienvenue ${userName} !`, 'success');
            }

            showToast(title, message, type = 'info') {
                const toast = new bootstrap.Toast(document.getElementById('liveToast'));
                document.getElementById('toastTitle').textContent = title;
                document.getElementById('toastMessage').textContent = message;
                
                // Changer la couleur selon le type
                const toastHeader = document.querySelector('#liveToast .toast-header');
                toastHeader.className = 'toast-header';
                if (type === 'success') toastHeader.classList.add('text-success');
                if (type === 'error') toastHeader.classList.add('text-danger');
                
                toast.show();
            }
        }

        // Initialiser le gestionnaire d'authentification
        const authManager = new AuthManager();

        // Pour tester : décommenter la ligne ci-dessous pour simuler un utilisateur connecté
        // authManager.simulateLogin('John Doe');
    