/* APP.JS - PUBLIC FRONTEND */

var pathHistory = [{id: '', name: '🏠 Trang chủ'}];

$(document).ready(function() {
    $('head').append(`
        <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
        <script src="https://cdn.plyr.io/3.7.8/plyr.js"></script>
        <style>
            .search-container { max-width: 800px; margin: 0 auto; }
            .form-control-dark { background-color: #2c2c2c; border: 1px solid #444; color: #fff; }
            .form-control-dark:focus { background-color: #333; color: #fff; border-color: #0d6efd; box-shadow: none; }
            .list-group-item { background-color: #1e1e1e; border-color: #333; color: #ccc; transition: 0.15s; }
            .list-group-item:hover { background-color: #2a2a2a; color: #fff; z-index: 10; }
            .badge-size { background-color: #333; color: #aaa; border: 1px solid #444; }
            .file-icon { font-size: 1.3rem; min-width: 30px; display: inline-block; text-align: center; }
            .modal-content { background-color: #1a1a1a; border: 1px solid #444; color: #fff; }
            .modal-header, .modal-footer { border-color: #333; }
            .btn-close { filter: invert(1); }
            .preview-box { background: #000; min-height: 400px; display: flex; align-items: center; justify-content: center; }
            .preview-img { max-width: 100%; max-height: 80vh; }
            .preview-iframe { width: 100%; height: 80vh; border: none; background: #fff; }
            .preview-code { text-align: left; background: #222; color: #0f0; padding: 15px; max-height: 80vh; overflow: auto; width: 100%; }
        </style>
    `);

    $('body').append(`
        <div class="modal fade" id="viewModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="vmTitle">Preview</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="stopMedia()"></button>
                    </div>
                    <div class="modal-body p-0 preview-box" id="vmBody"></div>
                    <div class="modal-footer">
                        <a href="#" id="vmDownload" class="btn btn-primary" target="_blank">Download</a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick="stopMedia()">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    renderLayout(); 
    loadFolder(''); 
});

function renderLayout() {
    const html = `
    <div class="container pt-5 pb-5">
        <div class="text-center mb-4"><h1 class="fw-bold text-light display-5" style="cursor:pointer" onclick="goHome()">YU-GI-OH!</h1><p class="text-secondary">Chia sẻ mọi thứ về Yu-gi-oh!</p></div>
        <div class="search-container mb-4">
            <form onsubmit="event.preventDefault(); doSearch();">
                <div class="input-group input-group-lg"><input type="search" class="form-control form-control-dark" id="searchInput" placeholder="Nhập tên file để tìm kiếm..."><button class="btn btn-primary" type="submit">🔍</button></div>
            </form>
        </div>
        <div class="ads-slot">
    <span>Theo dõi kênh Youtube để cập nhật các video game mới nhất và sớm nhất: <a href="https://www.youtube.com/@Bankhonggioi" target="_blank">BanKhongGioi</a></span>
</div>
        <div id="breadcrumbArea" class="mb-3"></div>
        <div id="fileListArea"></div>
        <div class="ads-slot mt-4"><span>Theo dõi Facebook để cập nhật thông tin mới nhất: <a href="https://www.facebook.com/bankhonggioidotcom" target="_blank">Bạn Không Giỏi</a></span></div>
    </div>`;
    $('#app').html(html);
}

function loadFolder(folderId, pageToken = '') {
    $('#fileListArea').html(`<div class="text-center py-5"><div class="spinner-border text-light" role="status"></div></div>`);
    updateBreadcrumb();
    const idToSend = folderId || '';
    $.ajax({
        url: '/api/list', type: 'POST', data: { id: idToSend, page_token: pageToken }, dataType: 'json',
        success: function(res) { renderFiles(res); },
        error: function(xhr) { $('#fileListArea').html(`<div class="alert alert-danger text-center bg-dark border-danger text-danger">Lỗi tải dữ liệu.</div>`); }
    });
}

function renderFiles(res) {
    const files = res.files || [];
    if (files.length === 0) { $('#fileListArea').html(`<div class="alert alert-dark text-center text-secondary border-secondary">Thư mục trống.</div>`); return; }
    let html = `<div class="list-group shadow">`;
    files.forEach(file => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = getIcon(file.mimeType, file.name);
        const time = formatTime(file.modifiedTime);
        const sizeBadge = isFolder ? '' : `<span class="badge badge-size me-2">${formatSize(file.size)}</span>`;
        let onClickAttr = isFolder ? `onclick="openFolder('${file.id}', '${file.name.replace(/'/g, "\\'")}')"` : `onclick="viewFile('${file.id}', '${file.name.replace(/'/g, "\\'")}', '${file.mimeType}')"`;
        let btnHtml = isFolder ? `<button class="btn btn-sm btn-outline-primary">Open</button>` : `
            <button class="btn btn-sm btn-outline-secondary me-1 text-light">View</button>
            <a href="/api/proxy?id=${file.id}&name=${encodeURIComponent(file.name)}" class="btn btn-sm btn-success" target="_blank" onclick="event.stopPropagation()">Download</a>`;
        
        html += `<div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" style="cursor:pointer" ${onClickAttr}>
            <div class="text-truncate flex-grow-1 pe-3"><span class="file-icon me-2">${icon}</span><span class="fw-bold">${file.name}</span></div>
            <div class="d-flex align-items-center" style="min-width: max-content;"><small class="text-muted me-3 d-none d-md-block">${time}</small>${sizeBadge}<div class="btn-group">${btnHtml}</div></div>
        </div>`;
    });
    html += `</div>`;
    $('#fileListArea').html(html);
}

function doSearch() {
    const q = $('#searchInput').val().trim(); if (!q) return;
    pathHistory = [{id: '', name: '🏠 Trang chủ'}, {id: 'search', name: `🔍 Tìm: ${q}`}]; updateBreadcrumb();
    $('#fileListArea').html(`<div class="text-center py-5"><div class="spinner-border text-warning" role="status"></div></div>`);
    $.ajax({ url: '/api/search', type: 'POST', data: { q: q }, dataType: 'json', success: function(res) { renderFiles(res); } });
}

function viewFile(id, name, mime) {
    const url = `/api/proxy?id=${id}`, dl = `${url}&name=${encodeURIComponent(name)}`;
    $('#vmTitle').text(name); $('#vmDownload').attr('href', dl);
    let c = ''; const ext = name.split('.').pop().toLowerCase();
    if (mime.startsWith('video/')) { c = `<video id="player" playsinline controls style="width:100%;max-height:80vh"><source src="${url}" type="${mime}"></video>`; setTimeout(()=>new Plyr('#player'),100); }
    else if (mime.startsWith('audio/')) { c = `<div class="p-5 w-100 text-center"><audio id="player" controls style="width:100%"><source src="${url}" type="${mime}"></audio></div>`; setTimeout(()=>new Plyr('#player'),100); }
    else if (mime.startsWith('image/')) c = `<img src="${url}" class="preview-img">`;
    else if (mime === 'application/pdf') c = `<iframe src="${url}" class="preview-iframe"></iframe>`;
    else if (['txt','html','js','css','json','md'].includes(ext)) { $.get(url, d => $('#vmBody').html(`<pre class="preview-code"><code>${$('<div>').text(d).html()}</code></pre>`)); c = `<div class="spinner-border text-light m-5"></div>`; }
    else c = `<div class="text-center p-5"><h4 class="text-secondary">Không hỗ trợ xem trước</h4><a href="${dl}" class="btn btn-lg btn-success mt-3">Download</a></div>`;
    $('#vmBody').html(c); new bootstrap.Modal('#viewModal').show();
}

function stopMedia() { $('#vmBody').html(''); }
function goHome() { pathHistory = [{id: '', name: '🏠 Trang chủ'}]; $('#searchInput').val(''); loadFolder(''); }
function openFolder(id, name) { pathHistory.push({id: id, name: name}); loadFolder(id); }
function jumpTo(i) { pathHistory = pathHistory.slice(0, i + 1); loadFolder(pathHistory[i].id); }
function updateBreadcrumb() {
    let h = `<nav aria-label="breadcrumb"><ol class="breadcrumb p-3 rounded" style="background-color:#1f1f1f;">`;
    pathHistory.forEach((item, i) => h += `<li class="breadcrumb-item ${i===pathHistory.length-1?'active':''}"><a href="#" onclick="jumpTo(${i})" class="text-decoration-none ${i===pathHistory.length-1?'text-light':'text-primary'}">${item.name}</a></li>`);
    h += `</ol></nav>`; $('#breadcrumbArea').html(h);
}
function formatSize(b) { if(!b) return ''; const k=1024, s=['B','KB','MB','GB','TB'], i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(2))+' '+s[i]; }
function formatTime(t) { return t ? new Date(t).toLocaleDateString('vi-VN') : ''; }
function getIcon(m, n) { if(m==='application/vnd.google-apps.folder') return '📁'; const e = n.split('.').pop().toLowerCase(), map={'mp4':'🎬','mkv':'🎬','mp3':'🎵','wav':'🎵','jpg':'🖼️','png':'🖼️','pdf':'📕','zip':'📦','rar':'📦','exe':'💾'}; return map[e]||'📄'; }