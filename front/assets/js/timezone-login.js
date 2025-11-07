class TimezoneManager {
    // 🌍 LISTE DES FUSEAUX HORAIRES PRINCIPAUX
    static getTimezones() {
        return [
            // Europe
            { value: 'Europe/Paris', label: '🇫🇷 Paris, France' },
            { value: 'Europe/London', label: '🇬🇧 Londres, Royaume-Uni' },
            { value: 'Europe/Berlin', label: '🇩🇪 Berlin, Allemagne' },
            { value: 'Europe/Madrid', label: '🇪🇸 Madrid, Espagne' },
            { value: 'Europe/Rome', label: '🇮🇹 Rome, Italie' },
            { value: 'Europe/Amsterdam', label: '🇳🇱 Amsterdam, Pays-Bas' },
            
            // Amérique
            { value: 'America/Montreal', label: '🇨🇦 Montréal, Canada' },
            { value: 'America/New_York', label: '🇺🇸 New York, USA' },
            { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles, USA' },
            { value: 'America/Toronto', label: '🇨🇦 Toronto, Canada' },
            { value: 'America/Chicago', label: '🇺🇸 Chicago, USA' },
            
            // Afrique
            { value: 'Africa/Casablanca', label: '🇲🇦 Casablanca, Maroc' },
            { value: 'Africa/Abidjan', label: '🇨🇮 Abidjan, Côte d\'Ivoire' },
            { value: 'Africa/Tunis', label: '🇹🇳 Tunis, Tunisie' },
            { value: 'Africa/Algiers', label: '🇩🇿 Alger, Algérie' },
            { value: 'Africa/Dakar', label: '🇸🇳 Dakar, Sénégal' },
            
            // Asie
            { value: 'Asia/Tokyo', label: '🇯🇵 Tokyo, Japon' },
            { value: 'Asia/Dubai', label: '🇦🇪 Dubaï, Émirats Arabes Unis' },
            { value: 'Asia/Singapore', label: '🇸🇬 Singapour' },
            { value: 'Asia/Hong_Kong', label: '🇭🇰 Hong Kong' },
            
            // Océanie
            { value: 'Australia/Sydney', label: '🇦🇺 Sydney, Australie' },
            { value: 'Pacific/Auckland', label: '🇳🇿 Auckland, Nouvelle-Zélande' }
        ];
    }

    // 🎯 DÉTECTER LE FUSEAU HORAIRE DU NAVIGATEUR
    static detectUserTimezone() {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log('🌍 Timezone détecté:', timezone);
            return timezone;
        } catch (error) {
            console.warn('❌ Impossible de détecter le timezone:', error);
            return 'Europe/Paris'; // Fallback
        }
    }

    // 📝 REMPLIR LE SELECT AVEC LES OPTIONS
    static populateTimezoneSelect(selectedTimezone = null) {
        const select = document.getElementById('timezone');
        if (!select) {
            console.error('❌ Élément timezone non trouvé');
            return;
        }

        // Vider les options actuelles
        select.innerHTML = '';

        // Timezone détecté ou valeur par défaut
        const detectedTimezone = selectedTimezone || this.detectUserTimezone();
        const timezones = this.getTimezones();

        // Option par défaut
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Sélectionnez votre fuseau horaire';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        select.appendChild(defaultOption);

        // Ajouter toutes les options
        timezones.forEach(tz => {
            const option = document.createElement('option');
            option.value = tz.value;
            option.textContent = tz.label;
            
            // Sélectionner automatiquement le timezone détecté
            if (tz.value === detectedTimezone) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });

        // Si le timezone détecté n'est pas dans la liste, l'ajouter
        if (!select.value && detectedTimezone) {
            const option = document.createElement('option');
            option.value = detectedTimezone;
            option.textContent = `🌍 ${detectedTimezone} (Détecté)`;
            option.selected = true;
            select.appendChild(option);
        }

        console.log('✅ Timezone select rempli, sélection:', select.value);
    }

    // 🔄 INITIALISER AU CHARGEMENT
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Initialisation TimezoneManager...');
            this.populateTimezoneSelect();
        });
    }
}

// Initialisation automatique
TimezoneManager.init();