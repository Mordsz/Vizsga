// Demo bejegyzések
    const demoPosts = [
      {
        id: 'p1',
        title: 'Üdvözlő bejegyzés',
        date: '2025-11-30',
        tags: ['Általános','Bemutató'],
        excerpt: 'Ez a blog első bejegyzése — üdvözlünk az oldalon! Olvass tovább a részletekért.',
        content: `<p>Ez egy példa bejegyzés. Szerkeszd, töröld, vagy írj újat! A tartalom HTML-t is tartalmazhat (szöveg, felsorolás, képek).</p>
                  <p>Tippek: használd a keresőt, címkéket, vagy nyomd meg az "Új bejegyzés (demo)" gombot egy gyors mintabejegyzéshez.</p>`
      },
      {
        id: 'p2',
        title: 'Hogyan írj jó blogbejegyzést?',
        date: '2025-10-12',
        tags: ['Írás','Tippek'],
        excerpt: 'Rövid útmutató arról, hogyan szerkeszd meg bejegyzéseidet, hogy olvasmányosak legyenek.',
        content: `<p>Az olvasók szeretik a tiszta szerkezetet: bevezető, tárgyalás, lezárás. Használj alcímeket, képeket és rövid bekezdéseket.</p>
                  <ul><li>Legyen egyértelmű célod.</li><li>Törd meg a szöveget alcímekkel.</li><li>Adj forrásokat.</li></ul>`
      },
      {
        id: 'p3',
        title: 'Technikai megjegyzés: localStorage',
        date: '2025-08-01',
        tags: ['Technika','Demo'],
        excerpt: 'A kommentek és demo bejegyzések a böngésző localStorage-ában tárolódnak — értelemszerűen ez csak helyi demo.',
        content: `<p>A localStorage segítségével elmenthetjük ideiglenesen a felhasználói adatokat. Használj szervert, ha tartós, megosztott tárolás kell.</p>`
      }
    ];

    // --- State ---
    let posts = loadPosts(); // tölt vagy fallback demo
    const postsContainer = document.getElementById('posts');
    const countEl = document.getElementById('count');
    const searchInput = document.getElementById('search');
    const noResults = document.getElementById('noResults');
    const listView = document.getElementById('listView');
    const postView = document.getElementById('postView');
    const postTitle = document.getElementById('postTitle');
    const postMeta = document.getElementById('postMeta');
    const postContent = document.getElementById('postContent');
    const postTags = document.getElementById('postTags');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentForm = document.getElementById('commentForm');
    const yearEl = document.getElementById('year');

    yearEl.textContent = new Date().getFullYear();

    // initial render
    renderPostList(posts);
    renderTagList(posts);

    // search
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags && p.tags.join(' ').toLowerCase().includes(q))
      );
      renderPostList(filtered);
    });

    // New demo post button
    document.getElementById('newPostBtn').addEventListener('click', () => {
      const id = 'p' + Date.now();
      const newPost = {
        id,
        title: 'Új demo bejegyzés — ' + new Date().toLocaleString(),
        date: new Date().toISOString().slice(0,10),
        tags: ['Demo'],
        excerpt: 'Gyorsan generált demo bejegyzés.',
        content: `<p>Automatikusan létrehozott demo bejegyzés. Szerkeszthető a localStorage-ból.</p>`
      };
      posts.unshift(newPost);
      savePosts(posts);
      renderPostList(posts);
      renderTagList(posts);
    });

    // back to list
    document.getElementById('backBtn').addEventListener('click', () => {
      showList();
    });

    // quick pills
    document.getElementById('allBtn').addEventListener('click', () => { searchInput.value=''; renderPostList(posts); });
    document.getElementById('latestBtn').addEventListener('click', () => {
      const latest = [...posts].sort((a,b)=> new Date(b.date)-new Date(a.date));
      renderPostList(latest);
    });

    // RENDER LIST
    function renderPostList(list){
      postsContainer.innerHTML = '';
      if(!list || list.length === 0){
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
        list.forEach(p=>{
          const el = document.createElement('div');
          el.className = 'post';
          el.tabIndex = 0;
          el.setAttribute('role','article');
          el.innerHTML = `
            <h3>${escapeHtml(p.title)}</h3>
            <div class="meta">${formatDate(p.date)} • ${p.tags ? p.tags.join(', ') : ''}</div>
            <div class="excerpt">${escapeHtml(p.excerpt)}</div>
          `;
          el.addEventListener('click', ()=> openPost(p.id));
          el.addEventListener('keypress', (e)=> { if(e.key==='Enter') openPost(p.id); });
          postsContainer.appendChild(el);
        });
      }
      countEl.textContent = (list && list.length) ? (list.length + ' bejegyzés') : '0 bejegyzés';
    }

    // OPEN POST
    function openPost(id){
      const p = posts.find(x=>x.id===id);
      if(!p) return;
      listView.classList.add('hidden');
      postView.classList.remove('hidden');
      postTitle.textContent = p.title;
      postMeta.textContent = formatDate(p.date) + (p.tags ? ' • ' + p.tags.join(', ') : '');
      postContent.innerHTML = p.content;
      postTags.innerHTML = '';
      if(p.tags) p.tags.forEach(t=>{
        const sp = document.createElement('span'); sp.className='tag'; sp.textContent = t;
        sp.addEventListener('click', ()=> filterByTag(t));
        postTags.appendChild(sp);
      });
      renderComments(id);
      window.scrollTo({top:0,behavior:'smooth'});
    }

    // SHOW LIST
    function showList(){
      postView.classList.add('hidden');
      listView.classList.remove('hidden');
    }

    // TAG LIST
    function renderTagList(list){
      const tagSet = new Set();
      list.forEach(p=> (p.tags||[]).forEach(t=>tagSet.add(t)));
      const tagList = Array.from(tagSet).sort();
      const container = document.getElementById('tagList');
      container.innerHTML = '';
      tagList.forEach(t=>{
        const btn = document.createElement('span');
        btn.className = 'tag';
        btn.textContent = t;
        btn.addEventListener('click', ()=> filterByTag(t));
        container.appendChild(btn);
      });
    }

    function filterByTag(tag){
      const filtered = posts.filter(p => (p.tags||[]).includes(tag));
      renderPostList(filtered);
      searchInput.value = '';
    }

    // COMMENTS (localStorage per post)
    function addComment(){
      const name = document.getElementById('commentName').value.trim();
      const email = document.getElementById('commentEmail').value.trim();
      const text = document.getElementById('commentText').value.trim();
      if(!text || !name) { alert('Add meg a neved és a kommentet.'); return; }
      const postId = posts.find(p => p.title === postTitle.textContent)?.id;
      if(!postId) return;
      const key = 'comments_'+postId;
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({name, email, text, date: new Date().toISOString()});
      localStorage.setItem(key, JSON.stringify(arr));
      commentForm.reset();
      renderComments(postId);
    }

    function renderComments(postId){
      commentsContainer.innerHTML = '';
      const arr = JSON.parse(localStorage.getItem('comments_'+postId) || '[]');
      if(arr.length===0){
        commentsContainer.innerHTML = '<div class="meta">Még nincs komment — légy te az első!</div>';
        return;
      }
      arr.forEach(c=>{
        const d = document.createElement('div');
        d.className = 'comment';
        d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>${escapeHtml(c.name)}</strong><div class="meta" style="font-size:0.85rem">${formatDate(c.date)}</div></div><div style="margin-top:8px">${escapeHtml(c.text)}</div>`;
        commentsContainer.appendChild(d);
      });
    }

    // STORAGE: posts
    function savePosts(arr){
      localStorage.setItem('blog_posts_demo_v1', JSON.stringify(arr));
    }
    function loadPosts(){
      try{
        const raw = localStorage.getItem('blog_posts_demo_v1');
        if(raw) return JSON.parse(raw);
      }catch(e){ /* ignore */ }
      // default demo
      savePosts(demoPosts);
      return demoPosts.slice();
    }

    // Utilities
    function formatDate(d){
      if(!d) return '';
      const date = new Date(d);
      return date.toLocaleDateString('hu-HU',{year:'numeric',month:'short',day:'numeric'});
    }
    function escapeHtml(unsafe){
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    // On load: ensure posts variable up-to-date
    // (re-render in case localStorage modified)
    posts = loadPosts();
    renderPostList(posts);
    renderTagList(posts);
