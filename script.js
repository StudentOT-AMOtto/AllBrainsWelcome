document.addEventListener('DOMContentLoaded', function () {

    let database = []; // Global variable to hold the fetched JSON data

    // --- DOM Elements ---
    // Get references to all necessary HTML elements by their IDs
    const resultsGrid = document.getElementById('results-grid'); // Container for resource cards
    const resultsCount = document.getElementById('results-count'); // Displays the number of results
    const noResultsMessage = document.getElementById('no-results'); // Message for no results found
    const filterForm = document.getElementById('filter-form'); // The form containing all filter checkboxes
    const areasOfSupportContainer = document.getElementById('areas-of-support-filters'); // Container for Areas of Support checkboxes
    const formatContainer = document.getElementById('format-filters'); // Container for Format checkboxes
    const priceContainer = document.getElementById('price-filters'); // Container for Price checkboxes
    const infoModalContainer = document.getElementById('info-modal-container'); // The modal's outer container
    const infoModal = document.getElementById('info-modal'); // The modal's inner content panel
    const modalTitle = document.getElementById('modal-title'); // Title element within the modal
    const modalContent = document.getElementById('modal-content'); // Content area within the modal
    const modalCloseButton = document.getElementById('modal-close-button'); // Button to close the modal
    const modalOverlay = document.getElementById('modal-overlay'); // Overlay behind the modal
    const loadingIndicator = document.getElementById('loading-indicator'); // Loading spinner/message

    // --- FUNCTIONS ---

    /**
     * Fetches the data from the 'database.json' file.
     * Displays loading indicators and handles potential errors during fetch.
     */
    async function fetchDatabase() {
        try {
            loadingIndicator.classList.remove('hidden'); // Show loading indicator
            resultsCount.textContent = 'Loading data...'; // Update results count message
            // Fetch the JSON data. The path is relative to the HTML file for GitHub Pages compatibility.
            const response = await fetch('database.json'); 
            if (!response.ok) { // Check if the HTTP response was successful
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            database = await response.json(); // Parse the JSON data
            console.log('Database loaded:', database); // Log for debugging purposes
            populateFilters(); // Populate filter checkboxes once data is loaded
            populateResults(database); // Display all results initially
        } catch (error) {
            console.error('Error fetching database:', error); // Log any errors
            resultsCount.textContent = 'Failed to load data.'; // Update UI to reflect error
            noResultsMessage.classList.remove('hidden'); // Show error message
            noResultsMessage.querySelector('h3').textContent = 'Error loading data';
            noResultsMessage.querySelector('p').textContent = 'Please try again later.';
        } finally {
            loadingIndicator.classList.add('hidden'); // Hide loading indicator regardless of success or failure
        }
    }

    /**
     * Renders a single resource card using the provided item data.
     * @param {object} item - The resource data object from the database.
     * @returns {string} - The HTML string for the resource card.
     */
    function renderCard(item) {
        // Map the 'Format' array to HTML badges for display on the card
        const formatBadges = item.Format ? item.Format.map(f =>
            `<span class="inline-block bg-gray-200 text-gray-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">${f}</span>`
        ).join('') : ''; // Join badges into a single string, handle cases with no format

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
     * Populates the results grid with resource cards.
     * Shows/hides the no results message based on the number of items.
     * @param {Array<object>} items - An array of resource objects to display.
     */
    function populateResults(items) {
        resultsGrid.innerHTML = ''; // Clear previous results
        if (items.length > 0) {
            resultsGrid.classList.remove('hidden'); // Show the grid
            noResultsMessage.classList.add('hidden'); // Hide no results message
            // Iterate over items and append their HTML cards to the grid
            items.forEach(item => {
                resultsGrid.innerHTML += renderCard(item);
            });
        } else {
            resultsGrid.classList.add('hidden'); // Hide the grid
            noResultsMessage.classList.remove('hidden'); // Show no results message
        }
        // Update the results count display
        resultsCount.textContent = `Showing ${items.length} of ${database.length} results`;
    }
    
    /**
     * Dynamically creates and populates filter checkboxes based on unique values found in the database.
     * This ensures filters are always up-to-date with the data.
     */
    function populateFilters() {
        // Collect unique values for 'Areas of support', 'Format', and 'Price' from the database
        // flatMap is used to handle arrays within the database items
        const areasOfSupport = [...new Set(database.flatMap(item => item['Areas of support'] || []))];
        const formats = [...new Set(database.flatMap(item => item.Format || []))];
        const prices = [...new Set(database.flatMap(item => item.Price || []))];

        // Clear any existing checkboxes before populating (important for reset functionality)
        areasOfSupportContainer.innerHTML = '';
        formatContainer.innerHTML = '';
        priceContainer.innerHTML = '';

        // Sort unique values alphabetically and create checkboxes for each category
        areasOfSupport.sort().forEach(val => areasOfSupportContainer.innerHTML += createCheckbox('areas-of-support', val));
        formats.sort().forEach(val => formatContainer.innerHTML += createCheckbox('format', val));
        prices.sort().forEach(val => priceContainer.innerHTML += createCheckbox('price', val));
    }
    
    /**
     * Generates the HTML string for a single filter checkbox.
     * @param {string} name - The 'name' attribute for the input, used to group checkboxes.
     * @param {string} value - The 'value' attribute for the checkbox and its display text.
     * @returns {string} - The HTML string for the label and input elements.
     */
    function createCheckbox(name, value) {
        // Create a unique ID for the checkbox input, sanitizing the value for use in an ID
        const id = `${name}-${value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
        return `
            <label for="${id}" class="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" id="${id}" name="${name}" value="${value}" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700">${value}</span>
            </label>
        `;
    }

    /**
     * Filters the 'database' based on the currently selected checkboxes in the filter form.
     * It then calls `populateResults` to update the displayed items.
     */
    function filterData() {
        const formData = new FormData(filterForm); // Get all form data as key-value pairs
        // Get all selected values for each filter category
        const selectedAreasOfSupport = formData.getAll('areas-of-support');
        const selectedFormats = formData.getAll('format');
        const selectedPrices = formData.getAll('price');

        // Filter the main database array
        const filteredItems = database.filter(item => {
            // Check if the item matches the selected 'Areas of support' filters.
            // If no filters are selected, it's considered a match (length === 0).
            // Otherwise, every selected area must be present in the item's 'Areas of support' array.
            const areasOfSupportMatch = selectedAreasOfSupport.length === 0 ||
                                        selectedAreasOfSupport.every(area => (item['Areas of support'] || []).includes(area));

            // Check if the item matches the selected 'Format' filters (same logic as above).
            const formatMatch = selectedFormats.length === 0 ||
                                selectedFormats.every(format => (item.Format || []).includes(format));

            // Check if the item matches the selected 'Price' filters (same logic as above).
            const priceMatch = selectedPrices.length === 0 ||
                               selectedPrices.every(price => (item.Price || []).includes(price));

            // An item is included in the filtered results only if it matches ALL active filter categories
            return areasOfSupportMatch && formatMatch && priceMatch;
        });

        populateResults(filteredItems); // Update the display with the filtered items
    }

    /**
     * Opens the details modal and populates it with information about the selected resource.
     * @param {string|number} itemId - The 'Index' (ID) of the resource to display in the modal.
     */
    function openModal(itemId) {
        const item = database.find(i => i.Index == itemId); // Find the item in the database by its Index
        if (!item) return; // If item not found, exit function

        modalTitle.textContent = item.Name; // Set the modal title to the resource's name
        
        // Build the HTML content for the modal body
        let contentHTML = `<p class="text-gray-700 text-base">${item.Summary}</p>`;
        
        // Add 'Areas of Support' section if available
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

        // Add 'Format' section if available
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

        // Add 'Price' section if available
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

        // Add 'Link' section if available. 'noopener noreferrer' is for security best practices.
        if (item.Link) {
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Link</h4>
                    <a href="${item.Link}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${item.Link}</a>
                </div>
            `;
        }

        // Add 'Further Info' section if available
        if (item['Further info']) {
            contentHTML += `
                <div class="mt-4">
                    <h4 class="font-semibold text-gray-800">Further Information</h4>
                    <p class="text-gray-700">${item['Further info']}</p>
                </div>
            `;
        }

        modalContent.innerHTML = contentHTML; // Inject the built HTML into the modal content area
        infoModalContainer.classList.remove('hidden'); // Show the modal container
        // Small delay for smooth transition effect
        setTimeout(() => infoModal.classList.remove('hidden'), 10); 
        document.body.style.overflow = 'hidden'; // Prevent background scrolling when modal is open
    }

    /**
     * Closes the details modal.
     * Restores background scrolling after closing.
     */
    function closeModal() {
        infoModal.classList.add('hidden'); // Hide the modal's content panel
        // Delay hiding the container to allow for transition animation
        setTimeout(() => {
            infoModalContainer.classList.add('hidden'); // Hide the modal container
            document.body.style.overflow = ''; // Restore scrolling on the body
        }, 300);
    }

    // --- EVENT LISTENERS ---
    
    // Listen for changes on the filter form (e.g., checkbox clicks) to re-filter data
    filterForm.addEventListener('change', filterData);

    // Listen for the reset button click on the filter form.
    // setTimeout with 0 delay ensures the form's native reset action completes before filtering.
    filterForm.addEventListener('reset', () => { setTimeout(filterData, 0); });

    // Event delegation for clicks on resource cards within the results grid.
    // This allows dynamically added cards to also trigger the modal.
    resultsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.resource-card'); // Find the closest parent with 'resource-card' class
        if (card) {
            openModal(card.dataset.id); // Open modal using the item's ID stored in data-id attribute
        }
    });

    // Close modal when the close button inside the modal is clicked
    modalCloseButton.addEventListener('click', closeModal);
    // Close modal when the dark overlay behind the modal is clicked
    modalOverlay.addEventListener('click', closeModal);

    // Close modal on Escape key press for accessibility
    document.addEventListener('keydown', (e) => {
        // Check if the Escape key was pressed and the modal is currently visible
        if (e.key === 'Escape' && !infoModalContainer.classList.contains('hidden')) {
            closeModal();
        }
    });

    // --- INITIALIZATION ---
    // Start by fetching the database when the DOM is fully loaded.
    fetchDatabase(); 
});
