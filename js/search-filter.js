/**
 * Advanced Search and Filter System
 * Handles real-time filtering, search, and pagination for project and blog pages.
 */

class SearchFilterSystem {
    constructor(options) {
        this.containerId = options.containerId;
        this.itemsSelector = options.itemsSelector;
        this.filterGroupId = options.filterGroupId;
        this.searchInputId = options.searchInputId;
        this.paginationId = options.paginationId;
        this.itemsPerPage = options.itemsPerPage || 6;
        this.currentPage = 1;
        this.debounceTimer = null;
        
        this.container = document.getElementById(this.containerId);
        this.allItems = Array.from(document.querySelectorAll(this.itemsSelector));
        this.filteredItems = [...this.allItems];
        
        this.filters = {
            category: 'all',
            search: '',
            tags: [],
            dateRange: { start: null, end: null }
        };

        this.init();
    }

    init() {
        if (!this.container) return;

        this.setupEventListeners();
        this.updateUI();
        this.setupMobileFilters();
    }

    setupEventListeners() {
        // Category Filter
        const filterGroups = [this.filterGroupId, 'mobileFilterGroup'];
        filterGroups.forEach(groupId => {
            const group = document.getElementById(groupId);
            if (group) {
                group.addEventListener('click', (e) => {
                    const btn = e.target.closest('.filter-btn');
                    if (btn) {
                        // Update both desktop and mobile UI
                        filterGroups.forEach(gid => {
                            const g = document.getElementById(gid);
                            if (g) {
                                const buttons = g.querySelectorAll('.filter-btn');
                                buttons.forEach(b => {
                                    if (b.dataset.filter === btn.dataset.filter) {
                                        b.classList.add('active');
                                    } else {
                                        b.classList.remove('active');
                                    }
                                });
                            }
                        });
                        
                        this.filters.category = btn.dataset.filter;
                        this.currentPage = 1;
                        this.applyFilters();

                        // Close drawer if it was a mobile click
                        if (groupId === 'mobileFilterGroup') {
                            this.toggleDrawer(false);
                        }
                    }
                });
            }
        });

        // Search Input (Multiple)
        const searchInputIds = [this.searchInputId, this.searchInputId + 'Mobile'];
        searchInputIds.forEach(id => {
            const searchInput = document.getElementById(id);
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const value = e.target.value.toLowerCase();
                    
                    // Sync values between desktop and mobile search
                    searchInputIds.forEach(syncId => {
                        const syncInput = document.getElementById(syncId);
                        if (syncInput && syncInput !== e.target) syncInput.value = e.target.value;
                    });

                    clearTimeout(this.debounceTimer);
                    this.debounceTimer = setTimeout(() => {
                        this.filters.search = value;
                        this.currentPage = 1;
                        this.applyFilters();
                    }, 300);
                });
            }
        });

        // Items per page selector
        const ippSelector = document.getElementById('itemsPerPage');
        if (ippSelector) {
            ippSelector.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.updateUI();
            });
        }
    }

    setupMobileFilters() {
        const trigger = document.getElementById('mobileFilterTrigger');
        const closeBtn = document.getElementById('closeDrawer');
        const backdrop = document.getElementById('drawerBackdrop');

        if (trigger) {
            trigger.addEventListener('click', () => this.toggleDrawer(true));
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleDrawer(false));
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.toggleDrawer(false));
        }
    }

    toggleDrawer(isOpen) {
        const drawer = document.getElementById('filterDrawer');
        const backdrop = document.getElementById('drawerBackdrop');
        
        if (drawer && backdrop) {
            if (isOpen) {
                drawer.classList.add('is-open');
                backdrop.classList.add('is-active');
                document.body.style.overflow = 'hidden';
            } else {
                drawer.classList.remove('is-open');
                backdrop.classList.remove('is-active');
                document.body.style.overflow = '';
            }
        }
    }

    applyFilters() {
        this.showLoading();

        setTimeout(() => {
            this.filteredItems = this.allItems.filter(item => {
                // Category match (check data-category or data-status or data-cat)
                const itemCategory = item.dataset.category || item.dataset.status || item.dataset.cat || 'all';
                const categoryMatch = this.filters.category === 'all' || 
                                     itemCategory.toLowerCase() === this.filters.category.toLowerCase();
                
                // Search match (search in title and description)
                const text = item.textContent.toLowerCase() + (item.dataset.search || '').toLowerCase();
                const searchMatch = !this.filters.search || text.includes(this.filters.search);
                
                return categoryMatch && searchMatch;
            });

            this.updateUI();
            this.hideLoading();
        }, 200);
    }

    updateUI() {
        // Clear container
        this.container.innerHTML = '';

        if (this.filteredItems.length === 0) {
            this.showNoResults();
            this.updatePagination(0);
            return;
        }

        // Calculate pagination
        const totalItems = this.filteredItems.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const itemsToShow = this.filteredItems.slice(startIndex, endIndex);

        // Append items
        itemsToShow.forEach(item => {
            const clone = item.cloneNode(true);
            clone.style.display = 'block';
            clone.style.opacity = '0';
            clone.style.transform = 'translateY(20px)';
            this.container.appendChild(clone);
            
            // Trigger animation
            setTimeout(() => {
                clone.style.transition = 'all 0.4s ease';
                clone.style.opacity = '1';
                clone.style.transform = 'translateY(0)';
            }, 10);
        });

        this.updatePagination(totalPages);
    }

    updatePagination(totalPages) {
        const pagContainer = document.getElementById(this.paginationId);
        if (!pagContainer) return;

        pagContainer.innerHTML = '';
        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = `pag-btn ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '&laquo;';
        prevBtn.ariaLabel = 'Previous Page';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateUI();
                this.scrollToTop();
            }
        };
        pagContainer.appendChild(prevBtn);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pag-btn ${this.currentPage === i ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                this.currentPage = i;
                this.updateUI();
                this.scrollToTop();
            };
            pagContainer.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = `pag-btn ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '&raquo;';
        nextBtn.ariaLabel = 'Next Page';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.onclick = () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateUI();
                this.scrollToTop();
            }
        };
        pagContainer.appendChild(nextBtn);
    }

    showLoading() {
        this.container.style.opacity = '0.5';
        this.container.style.pointerEvents = 'none';
        this.container.style.transition = 'opacity 0.2s';
    }

    hideLoading() {
        this.container.style.opacity = '1';
        this.container.style.pointerEvents = 'all';
    }

    showNoResults() {
        this.container.innerHTML = `
            <div class="no-results">
                <img src="assets/icons/Target.svg" alt="" width="64" height="64" style="filter: grayscale(1); opacity: 0.2;">
                <h3>No Result Found</h3>
                <p>We couldn't find anything matching your search. Try different keywords or filters.</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Reset All Filters</button>
            </div>
        `;
    }

    scrollToTop() {
        const offset = 120;
        const target = this.container.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({
            top: target,
            behavior: 'smooth'
        });
    }
}
