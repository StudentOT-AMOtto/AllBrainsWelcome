document.addEventListener('DOMContentLoaded', function () {

    let database = []; // This will hold the fetched JSON data

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
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- FUNCTIONS ---

    /**
     * Fetches the data from Database.json.
     */
    async function fetchDatabase() {
        try {
            loadingIndicator.classList.remove('hidden'); // Show loading indicator
            resultsCount.textContent = 'Loading data...'; // Update results count message
            const response = await fetch('Database.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            database = await response.json();
            console.log('Database loaded:', database); // For debugging
            populateFilters();
            populateResults(database);
        } catch (error) {
            console.error('Error fetching database:', error);
            resultsCount.textContent = 'Failed to load data.';
            noResultsMessage.classList.remove('hidden'); // Show no results message on error
            noResultsMessage.querySelector('h3').textContent = 'Error loading data';
            noResultsMessage.querySelector('p').textContent = 'Please try again later.';
        } finally {
            loadingIndicator.classList.add('hidden'); // Hide loading indicator
        }
    }

    /**
     * Renders a single project card.
     * @param {object} item - The project data object.
     * @returns {string} - The HTML string for the card.
     */
    function renderCard(item) {
        // Use 'Format' from the JSON as 'techBadges' for display on the card
        const formatBadges = item.Format ? item.Format.map(f =>
            `<span class="inline-block bg-gray-200 text-gray-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${f}</span>`
        ).join('') : '';

        return `
            <div data-id="${item.Index}" class="resource-card bg-white rounded-lg shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div class="p-6 flex-grow">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${item.Name}</h3>
                    <p class="text-gray-600 text-base mb-4 line-clamp-2">${item.Summary}</p>
                </div>
                <div class="p-6 pt-2 border-t border-gray-100 mt-auto">
                    <div class="flex flex-wrap">
                        ${formatBadges}
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
        // Collect unique values for each filter category from the database
        const areasOfSupport = [...new Set(database.flatMap(item => item['Areas of support'] || []))];
        const formats = [...new Set(database.flatMap(item => item.Format || []))];
        const prices = [...new Set(database.flatMap(item => item.Price || []))];

        const areasOfSupportContainer = document.getElementById('areas-of-support-filters');
        const formatContainer = document.getElementById('format-filters');
        const priceContainer = document.getElementById('price-filters');

        // Clear existing filters before populating
        areasOfSupportContainer.innerHTML = '';
        formatContainer.innerHTML = '';
        priceContainer.innerHTML = '';

        // Sort and create checkboxes
        areasOfSupport.sort().forEach(val => areasOfSupportContainer.innerHTML += createCheckbox('areas-of-support', val));
        formats.sort().forEach(val => formatContainer.innerHTML += createCheckbox('format', val));
        prices.sort().forEach(val => priceContainer.innerHTML += createCheckbox('price', val));
    }
    
    /**
     * Creates the HTML for a filter checkbox.
     * @param {string} name - The name attribute for the input.
     * @param {string} value - The value for the checkbox.
     * @returns {string} - The HTML string for the checkbox label.
     */
    function createCheckbox(name, value) {
        // Sanitize value for HTML id attribute if necessary (e.g., replace spaces)
        const id = `${name}-${value.replace(/\s+/g, '-').toLowerCase()}`;
        return `
            <label for="${id}" class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" id="${id}" name="${name}" value="${value}" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700">${value}</span>
            </label>
        `;
    }

    /**
     * Filters the data based on the selected checkboxes and re-renders the results.
     */
    function filterData() {
        const formData = new FormData(filterForm);
        const selectedAreasOfSupport = formData.getAll('areas-of-support');
        const selectedFormats = formData.getAll('format');
        const selectedPrices = formData.getAll('price');

        const filteredItems = database.filter(item => {
            // Check if item's 'Areas of support' array contains ALL selected areas
            const areasOfSupportMatch = selectedAreasOfSupport.length === 0 ||
                                        selectedAreasOfSupport.every(area => (item['Areas of support'] || []).includes(area));

            // Check if item's 'Format' array contains ALL selected formats
            const formatMatch = selectedFormats.length === 0 ||
                                selectedFormats.every(format => (item.Format || []).includes(format));

            // Check if item's 'Price' array contains ALL selected prices
            const priceMatch = selectedPrices.length === 0 ||
                               selectedPrices.every(price => (item.Price || []).includes(price));

            return areasOfSupportMatch && formatMatch && priceMatch;
        });

        populateResults(filteredItems);
    }

    /**
     * Opens the modal with details for a specific project.
     * @param {string|number} itemId - The ID (Index) of the item to display.
     */
    function openModal(itemId) {
        const item = database.find(i => i.Index == itemId);
        if (!item) return;

        modalTitle.textContent = item.Name;
        
        let contentHTML = `<p class="text-gray-700 text-base">${item.Summary}</p>`;
        
        // Areas of Support
        if (item['Areas of support'] && item['Areas of support'].length > 0) {
            const areasBadges = item['Areas of support'].map(a => 
                `<span class="inline-block bg-gray-200 text-gray-800 text-sm font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${a}</span>`
            ).join('');
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Areas of Support</h4>
                    <div class="flex flex-wrap mt-2">${areasBadges}</div>
                </div>
            `;
        }

        // Format
        if (item.Format && item.Format.length > 0) {
            const formatBadges = item.Format.map(f => 
                `<span class="inline-block bg-gray-200 text-gray-800 text-sm font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${f}</span>`
            ).join('');
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Format</h4>
                    <div class="flex flex-wrap mt-2">${formatBadges}</div>
                </div>
            `;
        }

        // Price
        if (item.Price && item.Price.length > 0) {
            const priceBadges = item.Price.map(p => 
                `<span class="inline-block bg-gray-200 text-gray-800 text-sm font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${p}</span>`
            ).join('');
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Price</h4>
                    <div class="flex flex-wrap mt-2">${priceBadges}</div>
                </div>
            `;
        }

        // Link
        if (item.Link) {
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Link</h4>
                    <a href="${item.Link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${item.Link}</a>
                </div>
            `;
        }

        // Further Info
        if (item['Further info']) {
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Further Information</h4>
                    <p class="text-gray-700">${item['Further info']}</p>
                </div>
            `;
        }

        modalContent.innerHTML = contentHTML;
        infoModalContainer.classList.remove('hidden');
        setTimeout(() => infoModal.classList.remove('hidden'), 10);
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    /**
     * Closes the details modal.
     */
    function closeModal() {
        infoModal.classList.add('hidden');
        setTimeout(() => {
            infoModalContainer.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }, 300);
    }

    // --- EVENT LISTENERS ---
    
    // Listen for changes on the filter form to re-filter data
    filterForm.addEventListener('change', filterData);
    // When reset button is clicked, reset filters and then re-filter to show all data
    filterForm.addEventListener('reset', () => { setTimeout(filterData, 0); });

    // Event delegation for clicks on resource cards to open the modal
    resultsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.resource-card');
        if (card) {
            openModal(card.dataset.id);
        }
    });

    // Close modal listeners
    modalCloseButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !infoModalContainer.classList.contains('hidden')) {
            closeModal();
        }
    });

    // --- INITIALIZATION ---
    fetchDatabase(); // Start by fetching the database
});
