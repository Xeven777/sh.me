document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    fetchLinks();
});

const form = document.getElementById('shorten-form');
const container = document.getElementById('links-container');
const countBadge = document.getElementById('link-count');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('code').value;
    const url = document.getElementById('url').value;

    const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, url })
    });

    if (response.ok) {
        form.reset();
        fetchLinks();
    } else {
        alert('Failed to add link');
    }
});

async function fetchLinks() {
    const response = await fetch('/api/links');
    const links = await response.json();
    
    container.innerHTML = '';
    const entries = Object.entries(links);
    countBadge.textContent = `${entries.length} Links`;

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
                <i data-lucide="ghost" class="w-12 h-12 text-zinc-700 mx-auto mb-4"></i>
                <p class="text-zinc-500">No links found. Create your first one above!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    entries.forEach(([code, url]) => {
        const div = document.createElement('div');
        div.className = 'link-card flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl group';
        div.innerHTML = `
            <div class="flex flex-col min-w-0 pr-4">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg font-semibold text-indigo-400 font-['Outfit']">${code}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-zinc-600"></i>
                </div>
                <a href="${url}" target="_blank" class="text-zinc-400 text-sm truncate hover:text-white transition-colors">
                    ${url}
                </a>
            </div>
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="copyLink('${code}')" class="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all" title="Copy shortened URL">
                    <i data-lucide="copy" class="w-5 h-5"></i>
                </button>
                <button onclick="deleteLink('${code}')" class="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400 transition-all" title="Delete link">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
    
    lucide.createIcons();
}

async function deleteLink(code) {
    if (!confirm(`Are you sure you want to delete "${code}"?`)) return;

    const response = await fetch('/api/links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    if (response.ok) {
        fetchLinks();
    }
}

function copyLink(code) {
    const fullUrl = `${window.location.origin}/${code}`;
    navigator.clipboard.writeText(fullUrl);
    
    // Simple feedback logic could go here
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce font-medium';
    toast.textContent = 'Link copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
