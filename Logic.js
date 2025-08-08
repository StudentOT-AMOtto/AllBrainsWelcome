document.addEventListener('DOMContentLoaded', function () {
    
    // --- DATA (Initial Test Idea) ---
    const database = [
        { id: 1, title: 'E-commerce Platform', description: 'A full-featured e-commerce platform with a custom CMS, product management, and a secure checkout process. Built for scalability and high traffic.', category: 'Web Development', status: 'Completed', tech: ['React', 'Node.js', 'PostgreSQL'] },
        { id: 2, title: 'Mobile Banking App', description: 'A native mobile application for iOS and Android that allows users to manage their bank accounts, transfer funds, and pay bills securely.', category: 'Mobile App', status: 'In Progress', tech: ['Swift', 'Kotlin', 'Firebase'] },
        { id: 3, title: 'Data Analytics Dashboard', description: 'An interactive dashboard for visualizing complex sales and marketing data, with real-time updates and customizable reports.', category: 'Data Science', status: 'Completed', tech: ['Python', 'D3.js', 'React'] },
        { id: 4, title: 'Company Website Redesign', description: 'A complete overhaul of the corporate website to improve user experience, accessibility, and search engine optimization.', category: 'Web Development', status: 'Planning', tech: ['HTML', 'CSS', 'JavaScript'] },
        { id: 5, title: 'Inventory Management System', description: 'A web-based system for tracking inventory across multiple warehouses, with barcode scanning and automated reordering features.', category: 'Web Development', status: 'In Progress', tech: ['React', 'Firebase'] },
        { id: 6, title: 'Fitness Tracker App', description: 'A cross-platform mobile app that tracks user workouts, sets goals, and provides social sharing features.', category: 'Mobile App', status: 'Completed', tech: ['React Native', 'GraphQL'] },
        { id: 7, title: 'AI Chatbot Integration', description: 'An AI-powered chatbot integrated into the customer support portal to answer common questions and escalate complex issues to human agents.', category: 'AI/ML', status: 'In Progress', tech: ['Python', 'TensorFlow', 'Dialogflow'] },
        { id: 8, title: 'Marketing Campaign Analytics', description: 'A data pipeline and visualization tool to track the performance of marketing campaigns across various channels.', category: 'Data Science', status: 'Planning', tech: ['Python', 'Tableau', 'SQL'] }
    ];

    // --- ELEMENTS ---
    const resultsGrid = document.getElementById('results-grid');
    const resultsCount = document.getElementById('results-count');
    const noResultsMessage = document.getElementById('no-results');
    const filterForm = document.getElementById('filter-form');
    const infoModalContainer = document.getElementById('info-modal-container');
    const infoModal = document.getElementById('info-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalOverlay = document.getElementById('modal-overlay');

    // --- FUNCTIONS ---

    /**
     * Renders a single project card.
     * @param {object} item - The project data object.
     * @returns {string} - The HTML string for the card.
     */
    function renderCard(item) {
        const techBadges = item.tech.map(t => 
            `<span class="inline-block bg-gray-200 text-gray-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${t}</span>`
        ).join('');

        return `
            <div data-id="${item.id}" class="resource-card bg-white rounded-lg shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div class="p-6 flex-grow">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${item.title}</h3>
                    <p class="text-gray-600 text-base mb-4 line-clamp-2">${item.description}</p>
                </div>
                <div class="p-6 pt-2 border-t border-gray-100 mt-auto">
                    <div class="flex flex-wrap">
                        ${techBadges}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Populates the results grid with project cards.
     * @param {Array<object>} items - An array of project objects to display.
     */
    function populateResults(items) {
        resultsGrid.innerHTML = '';
        if (items.length > 0) {
            resultsGrid.classList.remove('hidden');
            noResultsMessage.classList.add('hidden');
            items.forEach(item => {
                resultsGrid.innerHTML += renderCard(item);
            });
        } else {
            resultsGrid.classList.add('hidden');
            noResultsMessage.classList.remove('hidden');
        }
        resultsCount.textContent = `Showing ${items.length} of ${database.length} results`;
    }
    
    /**
     * Creates and populates the filter checkboxes based on the data.
     */
    function populateFilters() {
        const categories = [...new Set(database.map(item => item.category))];
        const statuses = [...new Set(database.map(item => item.status))];
        const allTech = [...new Set(database.flatMap(item => item.tech))];

        const categoryContainer = document.getElementById('category-filters');
        const statusContainer = document.getElementById('status-filters');
        const techContainer = document.getElementById('tech-filters');

        categories.sort().forEach(val => categoryContainer.innerHTML += createCheckbox('category', val));
        statuses.sort().forEach(val => statusContainer.innerHTML += createCheckbox('status', val));
        allTech.sort().forEach(val => techContainer.innerHTML += createCheckbox('tech', val));
    }
    
    /**
     * Creates the HTML for a filter checkbox.
     * @param {string} name - The name attribute for the input.
     * @param {string} value - The value for the checkbox.
     * @returns {string} - The HTML string for the checkbox label.
     */
    function createCheckbox(name, value) {
        return `
            <label class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="${name}" value="${value}" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700">${value}</span>
            </label>
        `;
    }

    /**
     * Filters the data based on the selected checkboxes and re-renders the results.
     */
    function filterData() {
        const formData = new FormData(filterForm);
        const selectedCategories = formData.getAll('category');
        const selectedStatuses = formData.getAll('status');
        const selectedTech = formData.getAll('tech');

        const filteredItems = database.filter(item => {
            const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
            const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
            const techMatch = selectedTech.length === 0 || selectedTech.every(tech => item.tech.includes(tech));
            return categoryMatch && statusMatch && techMatch;
        });

        populateResults(filteredItems);
    }

    /**
     * Opens the modal with details for a specific project.
     * @param {string|number} itemId - The ID of the item to display.
     */
    function openModal(itemId) {
        const item = database.find(i => i.id == itemId);
        if (!item) return;

        modalTitle.textContent = item.title;
        
        const techBadges = item.tech.map(t => 
            `<span class="inline-block bg-gray-200 text-gray-800 text-sm font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${t}</span>`
        ).join('');

        let contentHTML = `<p class="text-gray-700 text-base">${item.description}</p>`;
        
        contentHTML += `
            <div class="mt-6">
                <h4 class="font-semibold text-gray-800">Tech Stack</h4>
                <div class="flex flex-wrap mt-2">${techBadges}</div>
            </div>
        `;

        modalContent.innerHTML = contentHTML;
        infoModalContainer.classList.remove('hidden');
        setTimeout(() => infoModal.classList.remove('hidden'), 10);
        document.body.style.overflow = 'hidden';
    }

    /**
     * Closes the details modal.
     */
    function closeModal() {
        infoModal.classList.add('hidden');
        setTimeout(() => {
            infoModalContainer.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    // --- EVENT LISTENERS ---
    
    filterForm.addEventListener('change', filterData);
    filterForm.addEventListener('reset', () => { setTimeout(filterData, 0); });

    resultsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.resource-card');
        if (card) {
            openModal(card.dataset.id);
        }
    });

    modalCloseButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !infoModalContainer.classList.contains('hidden')) {
            closeModal();
        }
    });

    // --- INITIALIZATION ---
    populateFilters();
    populateResults(database);
});
