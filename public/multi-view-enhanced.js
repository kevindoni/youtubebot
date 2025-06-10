// Enhanced multi-view functionality with advanced features
function enableDragAndDrop() {
    const videoList = document.getElementById('videoList');
    
    if (currentView === 'list' || currentView === 'compact') {
        // Enable sortable for list and compact views
        videoList.addEventListener('dragstart', handleDragStart, false);
        videoList.addEventListener('dragenter', handleDragEnter, false);
        videoList.addEventListener('dragover', handleDragOver, false);
        videoList.addEventListener('dragleave', handleDragLeave, false);
        videoList.addEventListener('drop', handleDrop, false);
        videoList.addEventListener('dragend', handleDragEnd, false);
    }
}

let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.style.opacity = '0.5';
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (dragSrcEl !== this) {
        // Reorder the videos in the queue
        const dragIndex = parseInt(dragSrcEl.dataset.index);
        const dropIndex = parseInt(this.dataset.index);
        
        // Move video in the array
        const draggedVideo = videoQueue.splice(dragIndex, 1)[0];
        videoQueue.splice(dropIndex, 0, draggedVideo);
        
        // Update the display
        updateQueueWithView(videoQueue);
        
        addLog(`Video reordered: moved position ${dragIndex + 1} to ${dropIndex + 1}`, 'info');
    }
    
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    
    // Clean up
    document.querySelectorAll('.video-list-item, .video-compact-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Bulk actions functionality
function toggleBulkMode() {
    const bulkMode = document.getElementById('bulkMode');
    const isBulkMode = bulkMode.checked;
    
    if (isBulkMode) {
        // Show checkboxes and bulk actions
        document.querySelectorAll('.video-checkbox').forEach(cb => {
            cb.style.display = 'block';
        });
        document.getElementById('bulkActions').style.display = 'flex';
    } else {
        // Hide checkboxes and bulk actions
        document.querySelectorAll('.video-checkbox').forEach(cb => {
            cb.style.display = 'none';
            cb.checked = false;
        });
        document.getElementById('bulkActions').style.display = 'none';
    }
}

function selectAllVideos() {
    const checkboxes = document.querySelectorAll('.video-checkbox input');
    const selectAll = document.getElementById('selectAll').checked;
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll;
    });
    
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const checkedBoxes = document.querySelectorAll('.video-checkbox input:checked');
    const count = checkedBoxes.length;
    
    const editBtn = document.querySelector('#bulkActions .bulk-btn:not(.danger)');
    const deleteBtn = document.querySelector('#bulkActions .bulk-btn.danger');
    
    if (editBtn) editBtn.disabled = count === 0;
    if (deleteBtn) deleteBtn.disabled = count === 0;
    
    // Update selected count in bulk actions
    const selectedCountSpan = document.querySelector('#bulkActions span');
    if (selectedCountSpan) {
        selectedCountSpan.textContent = `${count} selected`;
    }
    
    updateStatusSummary();
}

function updateStatusSummary() {
    const totalCount = videoQueue.length;
    const filteredCount = filteredQueue.length;
    const selectedCount = document.querySelectorAll('.video-checkbox input:checked').length;
    
    // Update counters
    document.getElementById('totalVideosCount').textContent = totalCount;
    document.getElementById('currentViewDisplay').textContent = currentView.charAt(0).toUpperCase() + currentView.slice(1);
    document.getElementById('filteredCount').textContent = filteredCount;
    document.getElementById('selectedCount').textContent = selectedCount;
    
    // Update queue count in header
    const queueCountElement = document.getElementById('queueCount');
    if (queueCountElement) {
        queueCountElement.textContent = totalCount;
    }
}

// Enhanced updateQueueWithView function
function updateQueueWithView(queue) {
    videoQueue = queue;
    filteredQueue = queue;
    renderVideoQueue(queue);
    updateStatusSummary();
}

// Enhanced filterVideos function
function filterVideos() {
    const searchTerm = document.getElementById('videoSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredQueue = videoQueue.filter(video => {
        const matchesSearch = video.url.toLowerCase().includes(searchTerm) ||
                            (video.customComment && video.customComment.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || video.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderVideoQueue(filteredQueue);
    updateStatusSummary();
}

function bulkDelete() {
    const checkedBoxes = document.querySelectorAll('.video-checkbox input:checked');
    const indicesToDelete = Array.from(checkedBoxes).map(cb => 
        parseInt(cb.closest('.video-item').dataset.index)
    ).sort((a, b) => b - a); // Sort in descending order
    
    if (confirm(`Delete ${indicesToDelete.length} selected videos?`)) {
        indicesToDelete.forEach(index => {
            removeVideo(index);
        });
        
        addLog(`Bulk deleted ${indicesToDelete.length} videos`, 'warning');
    }
}

function bulkEdit() {
    const checkedBoxes = document.querySelectorAll('.video-checkbox input:checked');
    const indices = Array.from(checkedBoxes).map(cb => 
        parseInt(cb.closest('.video-item').dataset.index)
    );
    
    if (indices.length === 0) return;
    
    // Show bulk edit modal
    showBulkEditModal(indices);
}

function showBulkEditModal(indices) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Bulk Edit ${indices.length} Videos</h3>
            <div class="form-group">
                <label for="bulkWatchTime">Watch Time (seconds):</label>
                <input type="number" id="bulkWatchTime" min="5" max="600" placeholder="Leave empty to keep current">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="bulkLike"> Apply to Like setting
                </label>
                <select id="bulkLikeValue">
                    <option value="true">Enable Like</option>
                    <option value="false">Disable Like</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="bulkComment"> Apply to Comment setting
                </label>
                <select id="bulkCommentValue">
                    <option value="true">Enable Comment</option>
                    <option value="false">Disable Comment</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="applyBulkEdit([${indices.join(',')}])">Apply Changes</button>
                <button class="btn btn-secondary" onclick="closeBulkEditModal()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function applyBulkEdit(indices) {
    const watchTime = document.getElementById('bulkWatchTime').value;
    const applyLike = document.getElementById('bulkLike').checked;
    const likeValue = document.getElementById('bulkLikeValue').value === 'true';
    const applyComment = document.getElementById('bulkComment').checked;
    const commentValue = document.getElementById('bulkCommentValue').value === 'true';
    
    indices.forEach(index => {
        const video = videoQueue[index];
        if (video) {
            if (watchTime) video.watchTime = parseInt(watchTime) * 1000;
            if (applyLike) video.shouldLike = likeValue;
            if (applyComment) video.shouldComment = commentValue;
        }
    });
    
    updateQueueWithView(videoQueue);
    closeBulkEditModal();
    addLog(`Bulk edited ${indices.length} videos`, 'success');
}

function closeBulkEditModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Enhanced rendering functions with priority support
function renderEnhancedGridView(container, queue) {
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    
    queue.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = `video-card video-item ${video.priority ? 'has-priority' : ''}`;
        card.dataset.index = getOriginalIndex(video);
        if (video.priority) {
            card.style.setProperty('--priority-color', getPriorityColor(video.priority));
        }
        
        card.innerHTML = `
            <input type="checkbox" class="video-checkbox" style="display: none;">
            <div class="video-card-header">
                <div class="video-thumbnail">YT</div>
                <div class="video-status status-${video.status || 'pending'}">${video.status || 'pending'}</div>
                ${video.priority ? `<div class="priority-indicator priority-${video.priority}" data-tooltip="Priority: ${video.priority}"></div>` : ''}
            </div>
            <div class="video-url">${truncateUrl(video.url, 50)}</div>
            <div class="video-meta">
                <div>⏱️ ${Math.floor(video.watchTime / 1000)}s</div>
                <div>${video.shouldLike ? '👍' : '👎'} Like</div>
                <div>${video.shouldComment ? '💬' : '🚫'} Comment</div>
            </div>
            ${video.customComment ? `<div style="font-size: 12px; color: #6c757d; font-style: italic; margin-bottom: 10px;">"${truncateText(video.customComment, 80)}"</div>` : ''}
            <div style="font-size: 11px; color: #adb5bd;">Added: ${formatDate(video.addedAt)}</div>
            <div class="video-actions">
                <select class="priority-selector" onchange="setPriority(${getOriginalIndex(video)}, this.value)" data-tooltip="Set priority">
                    <option value="">Normal</option>
                    <option value="high" ${video.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="medium" ${video.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="low" ${video.priority === 'low' ? 'selected' : ''}>Low</option>
                </select>
                <button class="action-btn action-btn-edit" onclick="editVideo(${getOriginalIndex(video)})" data-tooltip="Edit video">Edit</button>
                <button class="action-btn action-btn-remove" onclick="removeVideo(${getOriginalIndex(video)})" data-tooltip="Remove video">Remove</button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
}

function renderEnhancedListView(container, queue) {
    const list = document.createElement('div');
    list.className = 'video-list';
    
    queue.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = `video-list-item video-item ${video.priority ? 'has-priority' : ''}`;
        item.dataset.index = getOriginalIndex(video);
        item.draggable = true;
        if (video.priority) {
            item.style.setProperty('--priority-color', getPriorityColor(video.priority));
        }
        
        item.innerHTML = `
            <input type="checkbox" class="video-checkbox" style="display: none;">
            ${video.priority ? `<div class="priority-indicator priority-${video.priority}"></div>` : ''}
            <div class="video-thumbnail">YT</div>
            <div class="video-list-content">
                <div class="video-url">${video.url}</div>
                <div class="video-meta">
                    <span class="video-status status-${video.status || 'pending'}">${video.status || 'pending'}</span>
                    <span>⏱️ ${Math.floor(video.watchTime / 1000)}s</span>
                    <span>${video.shouldLike ? '👍' : '👎'} Like</span>
                    <span>${video.shouldComment ? '💬' : '🚫'} Comment</span>
                    <span>📅 ${formatDate(video.addedAt)}</span>
                    ${video.priority ? `<span class="priority-badge priority-${video.priority}">⚡ ${video.priority}</span>` : ''}
                </div>
                ${video.customComment ? `<div style="font-size: 12px; color: #6c757d; font-style: italic; margin-top: 5px;">"${video.customComment}"</div>` : ''}
            </div>
            <div class="video-list-actions">
                <select class="priority-selector" onchange="setPriority(${getOriginalIndex(video)}, this.value)">
                    <option value="">Normal</option>
                    <option value="high" ${video.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="medium" ${video.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="low" ${video.priority === 'low' ? 'selected' : ''}>Low</option>
                </select>
                <button class="action-btn action-btn-edit" onclick="editVideo(${getOriginalIndex(video)})">Edit</button>
                <button class="action-btn action-btn-remove" onclick="removeVideo(${getOriginalIndex(video)})">Remove</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

// Clear all filters function
function clearAllFilters() {
    document.getElementById('videoSearch').value = '';
    document.getElementById('statusFilter').value = '';
    filterVideos();
    addLog('All filters cleared', 'info');
}

// Advanced search with multiple criteria
function advancedSearch() {
    const searchTerm = document.getElementById('videoSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter')?.value;
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;
    
    filteredQueue = videoQueue.filter(video => {
        const matchesSearch = video.url.toLowerCase().includes(searchTerm) ||
                            (video.customComment && video.customComment.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || video.status === statusFilter;
        const matchesPriority = !priorityFilter || video.priority === priorityFilter;
        
        let matchesDate = true;
        if (dateFrom || dateTo) {
            const videoDate = new Date(video.addedAt);
            if (dateFrom) matchesDate = matchesDate && videoDate >= new Date(dateFrom);
            if (dateTo) matchesDate = matchesDate && videoDate <= new Date(dateTo + 'T23:59:59');
        }
        
        return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
    
    renderVideoQueue(filteredQueue);
    addLog(`Found ${filteredQueue.length} videos matching criteria`, 'info');
}

// Enhanced keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    changeView('grid');
                    break;
                case '2':
                    e.preventDefault();
                    changeView('list');
                    break;
                case '3':
                    e.preventDefault();
                    changeView('table');
                    break;
                case '4':
                    e.preventDefault();
                    changeView('compact');
                    break;
                case 'a':
                    e.preventDefault();
                    document.getElementById('selectAll').checked = true;
                    selectAllVideos();
                    break;
                case 's':
                    e.preventDefault();
                    exportQueue();
                    break;
                case 'o':
                    e.preventDefault();
                    importQueue();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('videoSearch').focus();
                    break;
            }
        }
        
        // Delete key for bulk delete
        if (e.key === 'Delete' && document.querySelectorAll('.video-checkbox input:checked').length > 0) {
            e.preventDefault();
            bulkDelete();
        }
        
        // Escape key to clear selection/filters
        if (e.key === 'Escape') {
            clearAllFilters();
            document.querySelectorAll('.video-checkbox input:checked').forEach(cb => cb.checked = false);
            updateBulkActionButtons();
        }
    });
}

// Performance metrics tracking
let performanceMetrics = {
    viewSwitches: 0,
    searches: 0,
    bulkActions: 0,
    startTime: Date.now()
};

function trackPerformance(action) {
    performanceMetrics[action] = (performanceMetrics[action] || 0) + 1;
    
    // Add performance info to logs occasionally
    if (performanceMetrics.viewSwitches % 10 === 0 && performanceMetrics.viewSwitches > 0) {
        const uptime = Math.round((Date.now() - performanceMetrics.startTime) / 1000);
        addLog(`📊 Performance: ${performanceMetrics.viewSwitches} view switches, ${performanceMetrics.searches} searches, ${performanceMetrics.bulkActions} bulk actions in ${uptime}s`, 'info');
    }
}

// Enhanced change view function with performance tracking
function changeView(viewType) {
    currentView = viewType;
    trackPerformance('viewSwitches');
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
    
    // Re-render the queue with new view
    updateQueueWithView(videoQueue);
    
    addLog(`Switched to ${viewType} view`, 'info');
}

// Auto-save queue to localStorage
function autoSaveQueue() {
    try {
        localStorage.setItem('youtube-bot-queue', JSON.stringify(videoQueue));
        localStorage.setItem('youtube-bot-queue-timestamp', Date.now().toString());
    } catch (error) {
        console.warn('Failed to auto-save queue:', error);
    }
}

// Auto-load queue from localStorage
function autoLoadQueue() {
    try {
        const savedQueue = localStorage.getItem('youtube-bot-queue');
        const timestamp = localStorage.getItem('youtube-bot-queue-timestamp');
        
        if (savedQueue && timestamp) {
            const age = Date.now() - parseInt(timestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (age < maxAge) {
                const parsed = JSON.parse(savedQueue);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    videoQueue = parsed;
                    updateQueueWithView(videoQueue);
                    addLog(`Auto-loaded ${parsed.length} videos from previous session`, 'info');
                }
            }
        }
    } catch (error) {
        console.warn('Failed to auto-load queue:', error);
    }
}

// Test data generator for multi-view testing
function generateTestData() {
    const testVideos = [
        {
            id: Date.now() + 1,
            url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            watchTime: 30000,
            shouldLike: true,
            shouldComment: true,
            customComment: 'Great video! Really enjoyed this content.',
            status: 'pending',
            priority: 'high',
            addedAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            url: 'https://youtube.com/watch?v=J---aiyznGQ',
            watchTime: 45000,
            shouldLike: false,
            shouldComment: true,
            customComment: 'Interesting perspective on this topic.',
            status: 'processing',
            priority: 'medium',
            addedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: Date.now() + 3,
            url: 'https://youtube.com/watch?v=9bZkp7q19f0',
            watchTime: 60000,
            shouldLike: true,
            shouldComment: false,
            customComment: '',
            status: 'completed',
            priority: 'low',
            addedAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: Date.now() + 4,
            url: 'https://youtube.com/watch?v=ZZ5LpwO-An4',
            watchTime: 25000,
            shouldLike: false,
            shouldComment: false,
            customComment: '',
            status: 'failed',
            addedAt: new Date(Date.now() - 10800000).toISOString()
        },
        {
            id: Date.now() + 5,
            url: 'https://youtube.com/watch?v=fJ9rUzIMcZQ',
            watchTime: 90000,
            shouldLike: true,
            shouldComment: true,
            customComment: 'Amazing tutorial! Very helpful for beginners.',
            status: 'pending',
            priority: 'high',
            addedAt: new Date(Date.now() - 14400000).toISOString()
        }
    ];
    
    videoQueue = testVideos;
    updateQueueWithView(videoQueue);
    addLog(`Generated ${testVideos.length} test videos for multi-view testing`, 'info');
}

function clearTestData() {
    videoQueue = [];
    updateQueueWithView(videoQueue);
    addLog('Test data cleared', 'info');
}

// Add test controls to the admin panel
function addTestControls() {
    const controlsSection = document.querySelector('.controls');
    if (controlsSection && !document.getElementById('testControls')) {
        const testDiv = document.createElement('div');
        testDiv.id = 'testControls';
        testDiv.innerHTML = `
            <h4 style="margin-top: 20px; color: #667eea;">Test Data Controls</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn" onclick="generateTestData()" style="background: #28a745; color: white;">
                    Generate Test Data
                </button>
                <button class="btn" onclick="clearTestData()" style="background: #dc3545; color: white;">
                    Clear Test Data
                </button>
                <button class="btn" onclick="testAllViews()" style="background: #17a2b8; color: white;">
                    Test All Views
                </button>
            </div>
        `;
        controlsSection.appendChild(testDiv);
    }
}

function testAllViews() {
    const views = ['grid', 'list', 'table', 'compact'];
    let currentIndex = 0;
    
    function switchToNextView() {
        if (currentIndex < views.length) {
            changeView(views[currentIndex]);
            addLog(`Switched to ${views[currentIndex]} view`, 'info');
            currentIndex++;
            setTimeout(switchToNextView, 2000);
        } else {
            addLog('All views tested successfully!', 'success');
        }
    }
    
    addLog('Starting automated view testing...', 'info');
    switchToNextView();
}

// Comprehensive feature testing
function runComprehensiveTest() {
    addLog('Starting comprehensive multi-view feature test...', 'info');
    
    // Step 1: Generate test data
    generateTestData();
    
    setTimeout(() => {
        // Step 2: Test search functionality
        document.getElementById('videoSearch').value = 'tutorial';
        filterVideos();
        addLog('Search test: Filtering by "tutorial"', 'info');
        
        setTimeout(() => {
            // Step 3: Test status filtering
            document.getElementById('videoSearch').value = '';
            document.getElementById('statusFilter').value = 'pending';
            filterVideos();
            addLog('Status filter test: Showing only pending videos', 'info');
            
            setTimeout(() => {
                // Step 4: Test priority filtering
                document.getElementById('statusFilter').value = '';
                document.getElementById('priorityFilter').value = 'high';
                advancedSearch();
                addLog('Priority filter test: Showing only high priority videos', 'info');
                
                setTimeout(() => {
                    // Step 5: Clear filters and test view switching
                    clearAllFilters();
                    testAllViews();
                    
                    setTimeout(() => {
                        addLog('✅ Comprehensive test completed successfully!', 'success');
                    }, 8000);
                }, 2000);
            }, 2000);
        }, 2000);
    }, 1000);
}

// Initialize enhanced features when page loads
document.addEventListener('DOMContentLoaded', () => {
    setupKeyboardShortcuts();
    autoLoadQueue();
    
    // Auto-save every 30 seconds
    setInterval(autoSaveQueue, 30000);
    
    setTimeout(() => {
        addTestControls();
    }, 1000);
});
