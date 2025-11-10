class TagsManager {
    constructor() {
        this.tags = [];
        this.init();
    }

    init() {
        const tagsInput = document.getElementById('taskTags');
        if (tagsInput) {
            tagsInput.addEventListener('input', (e) => {
                this.handleTagsInput(e.target.value);
            });
            
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCurrentTag();
                }
            });
        }
    }

    handleTagsInput(value) {
        // Si l'utilisateur tape une virgule, ajouter le tag
        if (value.endsWith(',')) {
            this.addCurrentTag();
        }
    }

    addCurrentTag() {
        const tagsInput = document.getElementById('taskTags');
        const tagText = tagsInput.value.replace(',', '').trim();
        
        if (tagText && this.tags.length < 5) {
            if (!this.tags.includes(tagText)) {
                this.tags.push(tagText);
                this.updateTagsPreview();
            }
        }
        
        tagsInput.value = '';
    }

    removeTag(tagToRemove) {
        this.tags = this.tags.filter(tag => tag !== tagToRemove);
        this.updateTagsPreview();
    }

    updateTagsPreview() {
        const preview = document.getElementById('tagsPreview');
        if (!preview) return;

        if (this.tags.length === 0) {
            preview.innerHTML = '';
            return;
        }

        preview.innerHTML = this.tags.map(tag => `
            <span class="tag-preview">
                ${tag}
                <span class="remove-tag" onclick="tagsManager.removeTag('${tag}')">
                    <i class="fas fa-times"></i>
                </span>
            </span>
        `).join('');
    }

    getTagsForSubmit() {
        return this.tags;
    }

    clearTags() {
        this.tags = [];
        this.updateTagsPreview();
        document.getElementById('taskTags').value = '';
    }
}

// Initialisation globale
const tagsManager = new TagsManager();
