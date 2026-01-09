// Configuration
const MY_NAME = "John Doe"; // Change this to your WhatsApp Display Name
const DATE_REGEX = /\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]\s*(.*?):\s*(.*)/;
const ATTACHMENT_REGEX = /<attached: (.*?)>/;
const MSG_CHUNK_SIZE = 50; // How many messages to load at once
const MEDIA_CHUNK_SIZE = 30; // How many images to load at once

let allChats = {};
let currentChatID = null;
let currentTab = 'images';

let renderState = {
    msgStartIndex: 0,
    msgEndIndex: 0,
    mediaIndex: 0,
    isSearching: false
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    document.getElementById('contactSearch').addEventListener('input', (e) => filterContacts(e.target.value));
    
    let timeout = null;
    document.getElementById('msgSearch').addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => handleSearch(e.target.value), 300);
    });

    document.getElementById('messageContainer').addEventListener('scroll', handleMessageScroll);
    document.getElementById('drawerContent').addEventListener('scroll', handleMediaScroll);
});

async function initApp() {
    try {
        const response = await fetch('scan.php');
        const chatFolders = await response.json(); 
        
        const loadedChats = [];

        for (const chatObj of chatFolders) {
            const folderName = chatObj.id;
            const fileInventory = chatObj.files;
            
            const safeFolder = encodeURIComponent(folderName);
            try {
                const txtRes = await fetch(`${safeFolder}/_chat.txt`);
                if (txtRes.ok) {
                    const text = await txtRes.text();
                    
                    const parsed = parseChat(text, folderName, fileInventory);
                    
                    let timestamp = 0;
                    if (parsed.messages.length > 0) {
                        const lastMsg = parsed.messages[parsed.messages.length - 1];
                        timestamp = parseDateString(lastMsg.date, lastMsg.time);
                    }

                    loadedChats.push({
                        id: folderName,
                        data: parsed,
                        timestamp: timestamp,
                        lastMsg: parsed.messages[parsed.messages.length - 1]?.text || ''
                    });
                    
                    allChats[folderName] = parsed;
                }
            } catch (err) {
                console.warn(`Failed to load ${folderName}:`, err);
            }
        }

        loadedChats.sort((a, b) => b.timestamp - a.timestamp);
        renderSidebar(loadedChats);

    } catch (err) {
        console.error("Critical Error:", err);
    }
}

function loadChat(folderID) {
    currentChatID = folderID;
    const data = allChats[folderID];
    renderState.isSearching = false;

    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.getElementById('chatTitle').innerText = folderID;
    const searchBox = document.getElementById('msgSearch');
    searchBox.style.display = 'block';
    searchBox.value = '';

    const totalMsgs = data.messages.length;
    renderState.msgEndIndex = totalMsgs; 
    renderState.msgStartIndex = Math.max(0, totalMsgs - MSG_CHUNK_SIZE);
    renderState.mediaIndex = 0;

    document.getElementById('messageContainer').innerHTML = '';
    renderMessageChunk(data.messages.slice(renderState.msgStartIndex, renderState.msgEndIndex), 'bottom');
    renderMediaDrawer(true);
}

function handleMessageScroll() {
    if (renderState.isSearching) return;
    const container = document.getElementById('messageContainer');
    if (container.scrollTop === 0 && renderState.msgStartIndex > 0) {
        const currentStart = renderState.msgStartIndex;
        const newStart = Math.max(0, currentStart - MSG_CHUNK_SIZE);
        const msgs = allChats[currentChatID].messages;
        const chunk = msgs.slice(newStart, currentStart);
        renderMessageChunk(chunk, 'top');
        renderState.msgStartIndex = newStart;
    }
}

function renderMessageChunk(chunk, position) {
    const container = document.getElementById('messageContainer');
    const oldScrollHeight = container.scrollHeight;

    let html = '';
    let lastDate = '';

    chunk.forEach(msg => {
        if (msg.date !== lastDate) {
            html += `<div class="date-divider">${msg.date}</div>`;
            lastDate = msg.date;
        }

        const isMe = msg.sender.includes(MY_NAME);
        let senderHtml = '';
        if (!isMe) {
            const color = stringToColor(msg.sender);
            senderHtml = `<span class="sender-name" style="color:${color}">${msg.sender}</span>`;
        }

        html += `
            <div class="msg ${isMe ? 'msg-me' : 'msg-them'}">
                ${senderHtml}
                ${formatMessageContent(msg)}
                <div class="msg-meta">${msg.time}</div>
            </div>
        `;
    });

    if (position === 'bottom') {
        container.innerHTML += html;
        container.scrollTop = container.scrollHeight;
    } else {
        container.insertAdjacentHTML('afterbegin', html);
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - oldScrollHeight;
    }
}

function handleMediaScroll() {
    const container = document.getElementById('drawerContent');
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 50) {
        renderMediaDrawer(false);
    }
}

function renderMediaDrawer(reset = false) {
    if (!currentChatID) return;
    const media = allChats[currentChatID].media;
    const container = document.getElementById('drawerContent');
    
    if (reset) {
        container.innerHTML = '';
        renderState.mediaIndex = 0;
        if (currentTab === 'images' || currentTab === 'videos') {
            container.className = 'drawer-content media-grid';
        } else {
            container.className = 'drawer-content doc-list';
        }
    }

    const start = renderState.mediaIndex;
    const end = start + MEDIA_CHUNK_SIZE;
    let targetArray = [];
    
    if (currentTab === 'images') targetArray = media.images;
    else if (currentTab === 'videos') targetArray = media.videos;
    else targetArray = media.docs;

    if (start >= targetArray.length) return;

    const chunk = targetArray.slice(start, end);
    let html = '';

    chunk.forEach(item => {
        if(item.isMissing) return; 

        if (currentTab === 'images') {
            html += `<div class="grid-item">
                        <img src="${item.path}" loading="lazy" onclick="window.open('${item.path}')">
                     </div>`;
        } else if (currentTab === 'videos') {
            html += `<div class="grid-item" style="border:1px solid #333;">
                        <video src="${item.path}" preload="metadata" style="width:100%; height:100%; object-fit:cover;" 
                           onmouseover="this.play()" onmouseout="this.pause()"></video>
                     </div>`;
        } else {
            html += `<a href="${item.path}" target="_blank" class="doc-card">
                        <div class="doc-icon" style="background:#54656f">${item.ext}</div>
                        <span>${item.filename}</span>
                     </a>`;
        }
    });

    container.insertAdjacentHTML('beforeend', html);
    renderState.mediaIndex = end;
}

function handleSearch(query) {
    if (!currentChatID) return;
    const container = document.getElementById('messageContainer');

    if (!query) {
        renderState.isSearching = false;
        loadChat(currentChatID);
        return;
    }

    renderState.isSearching = true;
    container.innerHTML = '<div class="loading-indicator">Searching history...</div>';

    const msgs = allChats[currentChatID].messages;
    const lowerQ = query.toLowerCase();
    
    const matches = [];
    for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        if (m.text.toLowerCase().includes(lowerQ) || m.sender.toLowerCase().includes(lowerQ)) {
            matches.push(m);
            if (matches.length >= 250) break;
        }
    }

    container.innerHTML = '';
    if (matches.length === 0) {
        container.innerHTML = '<div class="loading-indicator">No matches found.</div>';
        return;
    }

    let html = '';
    matches.forEach(msg => {
        const isMe = msg.sender.includes(MY_NAME);
        const regex = new RegExp(`(${query})`, 'gi');
        let content = formatMessageContent(msg);
        
        if (!msg.isMedia) {
            content = content.replace(regex, '<span class="highlight">$1</span>');
        }

        html += `
            <div class="msg ${isMe ? 'msg-me' : 'msg-them'}">
                <span class="sender-name">${msg.sender}</span>
                ${content}
                <div class="msg-meta">${msg.time} - ${msg.date}</div> 
            </div>
        `;
    });
    container.innerHTML += html;
}

function formatMessageContent(msg) {
    if (!msg.isMedia) return msg.text.replace(/\n/g, '<br>');

    if (msg.isMissing) {
        return `
            <div class="media-container">
                <div class="missing-file">
                    <div style="font-size:24px">⚠️</div>
                    <div style="font-weight:bold; font-size:12px; margin-top:5px">FILE NOT FOUND</div>
                    <div style="font-size:10px; opacity:0.7">${msg.filename}</div>
                </div>
            </div>
            ${msg.cleanText}
        `;
    }

    const fullPath = `${encodeURIComponent(msg.folder)}/${encodeURIComponent(msg.filename)}`;
    
    if (msg.mediaType === 'image') {
        return `
            <div class="media-container">
                <img src="${fullPath}" loading="lazy">
            </div>
            ${msg.cleanText}
        `;
    }
    
    if (msg.mediaType === 'video') {
        return `
            <div class="media-container">
                <video controls preload="metadata" src="${fullPath}" style="width:100%; max-height:300px;"></video>
            </div>
             ${msg.cleanText}
        `;
    }

    return `
        ${msg.cleanText}
        <a href="${fullPath}" target="_blank" class="doc-card">
            <div class="doc-icon">${msg.filename.split('.').pop()}</div>
            <div style="overflow:hidden; text-overflow:ellipsis;">${msg.filename}</div>
        </a>
    `;
}

function parseChat(rawText, folderName, fileInventory) {
    const lines = rawText.replace(/\r\n/g, '\n').split('\n');
    const messages = [];
    const media = { images: [], videos: [], docs: [] };
    let currentMsg = null;

    lines.forEach(line => {
        const cleanLine = line.replace(/^[\u200B-\u200F\u202A-\u202E\s]+/, '');
        const match = cleanLine.match(DATE_REGEX);
        
        if (match) {
            if (currentMsg) messages.push(currentMsg);
            const [_, date, time, sender, content] = match;
            currentMsg = { 
                date, time, sender: sender.trim(), text: content.trim(), folder: folderName, isMedia: false 
            };
            checkForMedia(currentMsg, media, fileInventory);
        } else {
            if (currentMsg) {
                currentMsg.text += '\n' + line.trim();
                checkForMedia(currentMsg, media, fileInventory);
            }
        }
    });
    if (currentMsg) messages.push(currentMsg);
    return { messages, media };
}

function checkForMedia(msg, mediaStore, fileInventory) {
    const attachMatch = msg.text.match(ATTACHMENT_REGEX);
    if (attachMatch) {
        msg.isMedia = true;
        msg.filename = attachMatch[1].trim();
        msg.cleanText = msg.text.replace(attachMatch[0], '').trim();
        
        if (!fileInventory.includes(msg.filename)) {
            msg.isMissing = true;
            return; 
        }

        const ext = msg.filename.split('.').pop().toLowerCase();
        const fullPath = `${encodeURIComponent(msg.folder)}/${encodeURIComponent(msg.filename)}`;
        
        const mediaItem = { path: fullPath, filename: msg.filename, ext: ext, isMissing: false };

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            msg.mediaType = 'image';
            mediaStore.images.push(mediaItem);
        } else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
            msg.mediaType = 'video';
            mediaStore.videos.push(mediaItem);
        } else {
            msg.mediaType = 'doc';
            mediaStore.docs.push(mediaItem);
        }
    }
}

function parseDateString(dateStr, timeStr) {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length < 3) return 0;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; 
    const year = parseInt(parts[2]);
    const timeParts = timeStr.split(':');
    const hour = parseInt(timeParts[0]);
    const min = parseInt(timeParts[1] || 0);
    const sec = parseInt(timeParts[2] || 0);
    return new Date(year, month, day, hour, min, sec).getTime();
}

function renderSidebar(chatArray) {
    const listContainer = document.getElementById('chatList');
    listContainer.innerHTML = '';
    chatArray.forEach(chat => {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.onclick = () => loadChat(chat.id);
        let preview = chat.lastMsg;
        if (preview.length > 50) preview = preview.substring(0, 50) + '...';
        div.innerHTML = `
            <div class="chat-info"><h4>${chat.id}</h4><p>${preview}</p></div>
            <div style="font-size:11px; color:#666;">${chat.data.messages[chat.data.messages.length-1]?.date || ''}</div>
        `;
        listContainer.appendChild(div);
    });
}

function filterContacts(query) {
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        const name = item.querySelector('h4').innerText.toLowerCase();
        item.style.display = name.includes(query.toLowerCase()) ? 'flex' : 'none';
    });
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const clickedTab = Array.from(document.querySelectorAll('.tab')).find(el => el.textContent.toLowerCase().includes(tab));
    if(clickedTab) clickedTab.classList.add('active');
    renderMediaDrawer(true);
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
}
