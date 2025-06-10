// Multi-view functionality for video queue
let currentView = 'grid';
let videoQueue = [];
let filteredQueue = [];

function changeView(viewType) {
    currentView = viewType;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
    
    // Re-render the queue with new view
    updateQueueWithView(videoQueue);
}

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
}

function updateQueueWithView(queue) {
    videoQueue = queue;
    filteredQueue = queue;
    const count = document.getElementById('queueCount');
    count.textContent = queue.length;
    renderVideoQueue(queue);
}

function renderVideoQueue(queue) {
    const container = document.getElementById('videoList');
    container.innerHTML = '';
    
    if (queue.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6c757d; font-style: italic;">No videos in queue</div>';
        return;
    }
    
    switch (currentView) {
        case 'grid':
            renderGridView(container, queue);
            break;
        case 'list':
            renderListView(container, queue);
            break;
        case 'table':
            renderTableView(container, queue);
            break;
        case 'compact':
            renderCompactView(container, queue);
            break;
    }
}

function renderGridView(container, queue) {
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    
    queue.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-card-header">
                <div class="video-thumbnail">YT</div>
                <div class="video-status status-${video.status || 'pending'}">${video.status || 'pending'}</div>
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
                <button class="action-btn action-btn-edit" onclick="editVideo(${getOriginalIndex(video)})">Edit</button>
                <button class="action-btn action-btn-remove" onclick="removeVideo(${getOriginalIndex(video)})">Remove</button>
            </div>
        `;
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
}

function renderListView(container, queue) {
    const list = document.createElement('div');
    list.className = 'video-list';
    
    queue.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'video-list-item';
        item.innerHTML = `
            <div class="video-thumbnail">YT</div>
            <div class="video-list-content">
                <div class="video-url">${video.url}</div>
                <div class="video-meta">
                    <span class="video-status status-${video.status || 'pending'}">${video.status || 'pending'}</span>
                    <span>⏱️ ${Math.floor(video.watchTime / 1000)}s</span>
                    <span>${video.shouldLike ? '👍' : '👎'} Like</span>
                    <span>${video.shouldComment ? '💬' : '🚫'} Comment</span>
                    <span>📅 ${formatDate(video.addedAt)}</span>
                </div>
                ${video.customComment ? `<div style="font-size: 12px; color: #6c757d; font-style: italic; margin-top: 5px;">"${video.customComment}"</div>` : ''}
            </div>
            <div class="video-list-actions">
                <button class="action-btn action-btn-edit" onclick="editVideo(${getOriginalIndex(video)})">Edit</button>
                <button class="action-btn action-btn-remove" onclick="removeVideo(${getOriginalIndex(video)})">Remove</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    container.appendChild(list);
}

function renderTableView(container, queue) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'video-table';
    
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Video URL</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Like</th>
                <th>Comment</th>
                <th>Added</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${queue.map(video => `
                <tr>
                    <td>
                        <div style="max-width: 300px;">
                            <div style="font-weight: 600; margin-bottom: 2px;">${truncateUrl(video.url, 60)}</div>
                            ${video.customComment ? `<div style="font-size: 11px; color: #6c757d; font-style: italic;">"${truncateText(video.customComment, 50)}"</div>` : ''}
                        </div>
                    </td>
                    <td><span class="video-status status-${video.status || 'pending'}">${video.status || 'pending'}</span></td>
                    <td>${Math.floor(video.watchTime / 1000)}s</td>
                    <td>${video.shouldLike ? '✅' : '❌'}</td>
                    <td>${video.shouldComment ? '✅' : '❌'}</td>
                    <td style="font-size: 12px;">${formatDate(video.addedAt)}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="compact-btn" style="background: #17a2b8; color: white;" onclick="editVideo(${getOriginalIndex(video)})">Edit</button>
                            <button class="compact-btn" style="background: #dc3545; color: white;" onclick="removeVideo(${getOriginalIndex(video)})">Remove</button>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
}

function renderCompactView(container, queue) {
    const compact = document.createElement('div');
    compact.className = 'video-compact';
    
    queue.forEach((video, index) => {
        const item = document.createElement('div');
        item.className = 'video-compact-item';
        item.innerHTML = `
            <div class="video-thumbnail" style="width: 40px; height: 30px; font-size: 10px;">YT</div>
            <div class="video-compact-content">
                <div class="video-compact-url">${video.url}</div>
                <div class="video-compact-meta">
                    <span class="status-${video.status || 'pending'}">${video.status || 'pending'}</span> •
                    ${Math.floor(video.watchTime / 1000)}s •
                    ${video.shouldLike ? '👍' : '👎'} •
                    ${video.shouldComment ? '💬' : '🚫'} •
                    ${formatDate(video.addedAt)}
                </div>
            </div>
            <div class="video-compact-actions">
                <button class="compact-btn" style="background: #17a2b8; color: white;" onclick="editVideo(${getOriginalIndex(video)})">Edit</button>
                <button class="compact-btn" style="background: #dc3545; color: white;" onclick="removeVideo(${getOriginalIndex(video)})">×</button>
            </div>
        `;
        compact.appendChild(item);
    });
    
    container.appendChild(compact);
}

function getOriginalIndex(video) {
    return videoQueue.findIndex(v => v.id === video.id);
}

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, 30);
    const end = url.substring(url.length - 15);
    return start + '...' + end;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function editVideo(index) {
    const video = videoQueue[index];
    if (!video) return;
    
    // Populate form with video data
    document.getElementById('videoUrl').value = video.url;
    document.getElementById('watchTime').value = Math.floor(video.watchTime / 1000);
    document.getElementById('shouldLike').checked = video.shouldLike;
    document.getElementById('shouldComment').checked = video.shouldComment;
    document.getElementById('customComment').value = video.customComment || '';
    
    // Remove the video from queue
    removeVideo(index);
    
    // Scroll to form
    document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
    
    addLog(`Video loaded for editing: ${truncateUrl(video.url, 50)}`, 'info');
}
