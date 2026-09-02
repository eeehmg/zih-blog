
        // ============================================================
        // 0. Profile 管理
        // ============================================================
        const PROFILE_KEY = 'ZIH_profile';
        // 默认头像：放在 assets/avatar/avatar.png（可换成自己的图）
        const DEFAULT_AVATAR = 'assets/avatar/avatar.png';

        function getProfile() {
            const stored = localStorage.getItem(PROFILE_KEY);
            if (stored) {
                try {
                    const p = JSON.parse(stored);
                    // 若 localStorage 无头像，回退到 assets 默认头像
                    if (!p.avatar) p.avatar = DEFAULT_AVATAR;
                    return p;
                } catch (_) {}
            }
            const defaults = { avatar: DEFAULT_AVATAR, name: 'ZIH' };
            localStorage.setItem(PROFILE_KEY, JSON.stringify(defaults));
            return defaults;
        }

        function saveProfile(profile) {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        }

        function renderProfile() {
            const profile = getProfile();
            const nameEl = document.getElementById('profileName');
            const imgEl = document.getElementById('avatarImg');
            const svgEl = document.querySelector('#avatarContent svg');
            if (nameEl) nameEl.textContent = profile.name || 'ZIH';
            if (profile.avatar) {
                imgEl.onerror = function() {
                    // 资源不存在时回退到默认图标
                    this.style.display = 'none';
                    this.src = '';
                    if (svgEl) svgEl.style.display = 'block';
                };
                imgEl.src = profile.avatar;
                imgEl.style.display = 'block';
                if (svgEl) svgEl.style.display = 'none';
            } else {
                imgEl.style.display = 'none';
                imgEl.src = '';
                if (svgEl) svgEl.style.display = 'block';
            }
        }

        const avatarWrapper = document.getElementById('avatarUpload');
        const avatarInput = document.getElementById('avatarInput');
        avatarWrapper.addEventListener('click', function(e) { e.stopPropagation();
            avatarInput.click(); });
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('请选择图片文件');
                avatarInput.value = ''; return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                const dataUrl = ev.target.result;
                const profile = getProfile();
                profile.avatar = dataUrl;
                saveProfile(profile);
                renderProfile();
                avatarInput.value = '';
            };
            reader.readAsDataURL(file);
        });

        const nameEl = document.getElementById('profileName');
        nameEl.addEventListener('blur', function() {
            const newName = this.textContent.trim() || 'ZIH';
            if (this.textContent.trim() === '') this.textContent = 'ZIH';
            const profile = getProfile();
            profile.name = this.textContent.trim();
            saveProfile(profile);
        });
        nameEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault();
                this.blur(); } });
        nameEl.addEventListener('input', function() {
            if (this.textContent.length > 20) {
                this.textContent = this.textContent.slice(0, 20);
                const range = document.createRange();
                range.selectNodeContents(this);
                range.collapse(false);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });

        // ============================================================
        // 1. 文章数据管理
        // ============================================================
        const STORAGE_KEY = 'ZIH_posts';
        const defaultPosts = [
            { id: 1, title: '自然拼读入门：一文带你解锁英语声音的底层代码', category: '英语体系', summary: '深入浅出讲解自然拼读规则，适合初学者。', coverColor: 'teal',
                date: '2025-8-9', comments: 0, views: 0, type: 'article', content: '<p>自然拼读是英语学习的核心基础...本文详细讲解了自然拼读的规则和应用。</p>' },
            { id: 2, title: 'Java 微服务（一）：1.0 Spring6 框架 - 为简化开发而生', category: 'Java 微服务篇',
                summary: 'Spring6 新特性及微服务入门实践。', coverColor: 'dark', date: '2025-8-9', comments: 0, views: 0, type: 'article',
                content: '<p>Spring6 带来了全新的微服务架构体验...本篇从基础开始讲解。</p>' },
            { id: 3, title: 'Coze 三方平台使用教程：从入门到核心概念', category: 'Coze 系列', summary: '全面介绍 Coze 平台的搭建与核心功能。',
                coverColor: 'amber', date: '2025-8-2', comments: 0, views: 0, type: 'article',
                content: '<p>Coze 平台是新一代AI应用开发平台...本文带你快速上手。</p>' },
            { id: 4, title: '第四小节：VERS/VERT 家族——方向一转，意义千变', category: '英语词根词缀打卡篇',
                summary: '深入剖析 VERS/VERT 词根家族。', coverColor: 'violet', date: '2 天前', comments: 0, views: 0, type: 'news',
                content: '<p>VERS/VERT 是英语中非常重要的词根家族...今天我们来系统学习。</p>' }
        ];

        function getPosts() {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    const posts = JSON.parse(stored);
                    posts.forEach(p => {
                        if (p.views === undefined) p.views = 0;
                        if (p.type === undefined) p.type = 'article';
                        if (p.content === undefined) p.content = '';
                        if (p.likes === undefined) p.likes = 0;
                        if (p.pinned === undefined) p.pinned = false;
                        if (p.status === undefined) p.status = 'published';
                        if (p.coverImage === undefined) p.coverImage = '';
                    });
                    return posts;
                } catch (_) {}
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
            return defaultPosts;
        }

        function savePosts(posts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }

        const LIKED_KEY = 'ZIH_liked_posts';
        function getLikedSet() {
            try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); } catch (_) { return new Set(); }
        }
        function saveLikedSet(set) { localStorage.setItem(LIKED_KEY, JSON.stringify([...set])); }

        function toggleLike(id, ev) {
            if (ev) ev.stopPropagation();
            const posts = getPosts();
            const post = posts.find(p => p.id === id);
            if (!post) return;
            const liked = getLikedSet();
            if (liked.has(id)) {
                liked.delete(id);
                post.likes = Math.max(0, (post.likes || 0) - 1);
            } else {
                liked.add(id);
                post.likes = (post.likes || 0) + 1;
            }
            saveLikedSet(liked);
            savePosts(posts);
            renderGrid(posts, currentCategory, currentSearch);
        }

        function togglePin(id, ev) {
            if (ev) ev.stopPropagation();
            const posts = getPosts();
            const post = posts.find(p => p.id === id);
            if (!post) return;
            post.pinned = !post.pinned;
            savePosts(posts);
            renderAll();
        }


        function genId() { return Date.now() + Math.floor(Math.random() * 1000); }

        function incrementViews(postId) {
            const posts = getPosts();
            const post = posts.find(p => p.id === postId);
            if (post) { post.views = (post.views || 0) + 1;
                savePosts(posts); }
            return post;
        }

        let currentCategory = '全部';
        let currentSearch = '';
        let currentSort = 'newest';
        let showDraftsOnly = false;
        let galleryMediaFilter = 'all';
        let mediaViewerList = [];
        let mediaViewerIndex = 0;

        function getAllCategories(posts) {
            const cats = new Set();
            posts.forEach(p => { if (p.category) cats.add(p.category); });
            return ['全部', ...Array.from(cats)];
        }

        function getCategoryCount(posts, category) {
            if (category === '全部') return posts.length;
            return posts.filter(p => p.category === category).length;
        }

        function filterPosts(posts, category, keyword) {
            let list = posts;
            // 草稿箱模式 or 默认隐藏草稿
            if (showDraftsOnly) {
                list = list.filter(p => p.status === 'draft');
            } else {
                list = list.filter(p => p.status !== 'draft');
            }
            if (category && category !== '全部') {
                list = list.filter(p => p.category === category);
            }
            const k = (keyword || '').trim().toLowerCase();
            if (k) {
                list = list.filter(p => {
                    const text = [
                        p.title || '',
                        p.category || '',
                        p.summary || '',
                        (p.content || '').replace(/<[^>]+>/g, ' ')
                    ].join(' ').toLowerCase();
                    return text.includes(k);
                });
            }
            list = [...list];
            if (currentSort === 'likes') {
                list.sort((a, b) => (b.likes || 0) - (a.likes || 0) || (b.id - a.id));
            } else if (currentSort === 'views') {
                list.sort((a, b) => (b.views || 0) - (a.views || 0) || (b.id - a.id));
            } else {
                list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.id - a.id));
            }
            return list;
        }

        function renderGrid(posts, category, keyword) {
            const container = document.getElementById('post-grid');
            const filtered = filterPosts(posts, category, keyword !== undefined ? keyword : currentSearch);
            const hasSearch = !!(keyword !== undefined ? keyword : currentSearch).trim();
            if (filtered.length === 0) {
                const msg = hasSearch
                    ? `没有找到与「${(keyword !== undefined ? keyword : currentSearch).trim()}」相关的内容`
                    : '该分类下暂无内容，去写一篇吧！';
                container.innerHTML =
                    `<p style="grid-column:1/-1;text-align:center;color:var(--ink-faint);padding:40px 0;">${msg}</p>`;
                return;
            }
            let html = '';
            filtered.forEach(p => {
                const coverText = p.title.length > 8 ? p.title.slice(0, 8) + '…' : p.title;
                const views = p.views || 0;
                const typeLabel = p.type === 'news' ? '📰 新闻' : '📝 文章';
                const typeClass = p.type === 'news' ? 'news' : 'article';
                const coverStyle = p.coverImage
                    ? `style="background-image:url('${p.coverImage.replace(/'/g, "\'")}');"`
                    : '';
                const coverClass = p.coverImage ? `cover color-${p.coverColor || 'teal'} has-image` : `cover color-${p.coverColor || 'teal'}`;
                const draftBadge = p.status === 'draft' ? '<span class="draft-badge">草稿</span>' : '';
                html += `
                    <article class="post" data-id="${p.id}">
                        <div class="click-area" onclick="openDetail(${p.id})">
                            <div class="${coverClass}" ${coverStyle}>${coverText}</div>
                            <div class="body">
                                <div class="kick">
                                    ${draftBadge}
                                    <span class="type-badge ${typeClass}">${typeLabel}</span>
                                    # ${p.category}
                                </div>
                                <h3>${p.title}</h3>
                                ${p.summary ? `<div class="summary">${p.summary}</div>` : ''}
                            </div>
                        </div>
                        <div class="foot">
                            <span>${p.pinned ? '<span class="pin-badge">📌 置顶</span>' : ''}${p.date || '刚刚'}</span>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <span class="views" title="阅读">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    ${views}
                                </span>
                                <button class="like-btn ${getLikedSet().has(p.id) ? 'liked' : ''}" onclick="toggleLike(${p.id}, event)" title="点赞">
                                    ${getLikedSet().has(p.id) ? '❤️' : '🤍'} ${p.likes || 0}
                                </button>
                                <button class="pin-btn ${p.pinned ? 'pinned' : ''}" onclick="togglePin(${p.id}, event)" title="${p.pinned ? '取消置顶' : '置顶'}">
                                    ${p.pinned ? '📌' : '📍'}
                                </button>
                                <button class="edit-btn" onclick="editPost(${p.id}, event)" title="编辑">✏️</button>
                                <button class="delete-btn" onclick="deletePost(${p.id})" title="删除文章">🗑️</button>
                            </div>
                        </div>
                    </article>
                `;
            });
            container.innerHTML = html;
        }

        function renderRecent(posts) {
            const container = document.getElementById('recent-posts');
            const sorted = [...posts].sort((a, b) => b.id - a.id);
            const recent = sorted.slice(0, 3);
            if (recent.length === 0) {
                container.innerHTML = '<p style="font-size:12px;color:var(--ink-faint);">暂无发布</p>';
                return;
            }
            let html = '';
            recent.forEach((p, idx) => {
                const thumbClass = idx % 2 === 0 ? '' : 'b';
                html += `
                    <div class="postmini">
                        <div class="thumb ${thumbClass}"></div>
                        <p>${p.title}</p>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderHot() {
            const container = document.getElementById('hot-posts');
            if (!container) return;
            const posts = getPosts().filter(p => p.status !== 'draft');
            const hot = [...posts].sort((a, b) => {
                const sa = (a.likes || 0) * 3 + (a.views || 0);
                const sb = (b.likes || 0) * 3 + (b.views || 0);
                return sb - sa;
            }).slice(0, 5);
            if (!hot.length) {
                container.innerHTML = '<p style="font-size:12px;color:var(--ink-faint);">暂无文章</p>';
                return;
            }
            container.innerHTML = hot.map((p, idx) => `
                <div class="postmini" style="cursor:pointer" onclick="openDetail(${p.id})">
                    <div class="thumb ${idx % 2 ? 'b' : ''}"></div>
                    <p>❤️${p.likes || 0} · 👁️${p.views || 0}<br/>${p.title}</p>
                </div>
            `).join('');
        }

        function updateDraftCount() {
            const n = getPosts().filter(p => p.status === 'draft').length;
            const el = document.getElementById('draftCount');
            if (el) el.textContent = n;
        }

        function renderPillbar(posts, activeCategory) {
            const container = document.getElementById('pillbar');
            const categories = getAllCategories(posts);
            let html = '';
            categories.forEach(cat => {
                const count = getCategoryCount(posts, cat);
                const activeClass = (cat === activeCategory) ? 'active' : '';
                html += `<span class="pill ${activeClass}" data-category="${cat}">${cat} <span style="font-weight:400;opacity:0.6;font-size:11px;">${count}</span></span>`;
            });
            html += `<span class="pill" style="color:var(--ink-faint);cursor:default;">更多 »</span>`;
            container.innerHTML = html;
            container.querySelectorAll('.pill[data-category]').forEach(el => {
                el.addEventListener('click', function() {
                    const cat = this.dataset.category;
                    if (cat) setCategory(cat);
                });
            });
        }

        function renderMenuCategories(posts, activeCategory) {
            const container = document.getElementById('menuBody');
            const categories = getAllCategories(posts);
            let html = `<div class="menu-label">📂 所有分类</div>`;
            categories.forEach(cat => {
                const count = getCategoryCount(posts, cat);
                const activeClass = (cat === activeCategory) ? 'active' : '';
                html += `
                    <div class="menu-item ${activeClass}" data-category="${cat}">
                        <span class="dot"></span>
                        <span>${cat}</span>
                        <span class="count">${count}</span>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.querySelectorAll('.menu-item').forEach(el => {
                el.addEventListener('click', function() {
                    const cat = this.dataset.category;
                    if (cat) { setCategory(cat);
                        closeMenu(); }
                });
            });
            document.getElementById('menuTotalPosts').textContent = posts.length;
        }

        function setCategory(category) {
            currentCategory = category;
            const posts = getPosts();
            renderGrid(posts, category, currentSearch);
            renderPillbar(posts, category);
            renderMenuCategories(posts, category);
            document.getElementById('total-articles').textContent = posts.length;
            updateSearchHint();
        }

        function renderAll() {
            const posts = getPosts();
            renderGrid(posts, currentCategory, currentSearch);
            renderRecent(posts);
            renderHot();
            updateDraftCount();
            renderPillbar(posts, currentCategory);
            renderMenuCategories(posts, currentCategory);
            document.getElementById('total-articles').textContent = posts.length;
            document.getElementById('menuTotalPosts').textContent = posts.length;
        }

        function deletePost(id) {
            if (!confirm('确定要删除此文章吗？此操作不可撤销。')) return;
            let posts = getPosts();
            posts = posts.filter(p => p.id !== id);
            savePosts(posts);
            const filtered = filterPosts(posts, currentCategory);
            if (filtered.length === 0 && currentCategory !== '全部') { currentCategory = '全部'; }
            renderAll();
        }

        // ============================================================
        // 2. 文章详情查看
        // ============================================================
        function openDetail(id) {
            const posts = getPosts();
            const post = posts.find(p => p.id === id);
            if (!post) return;
            window._currentDetailId = id;
            // 增加阅读量
            incrementViews(id);
            // 更新视图中的阅读量
            const viewsSpan = document.querySelector(`.post[data-id="${id}"] .views`);
            if (viewsSpan) {
                const newViews = (post.views || 0) + 1;
                viewsSpan.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    ${newViews}
                `;
            }

            const modal = document.getElementById('detailModal');
            document.getElementById('detailTitle').textContent = post.title;
            document.getElementById('detailCategory').textContent = '# ' + post.category;
            document.getElementById('detailDate').textContent = post.date || '刚刚';
            document.getElementById('detailViews').textContent = (post.views || 0) + 1;
            const badge = document.getElementById('detailBadge');
            if (post.type === 'news') {
                badge.textContent = '📰 新闻';
                badge.className = 'badge news';
            } else {
                badge.textContent = '📝 文章';
                badge.className = 'badge article';
            }
            const content = post.content || '<p>暂无正文内容</p>';
            document.getElementById('detailContent').innerHTML = content;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        document.getElementById('closeDetailBtn').addEventListener('click', function() {
            document.getElementById('detailModal').classList.remove('active');
            document.body.style.overflow = '';
        });
        document.getElementById('closeDetailBtn2').addEventListener('click', function() {
            document.getElementById('detailModal').classList.remove('active');
            document.body.style.overflow = '';
        });
        document.getElementById('detailModal').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // ============================================================
        // 3. 发布文章（增强版）
        // ============================================================
        const publishModal = document.getElementById('publishModal');
        const editorContent = document.getElementById('editorContent');
        let selectedType = 'article';

        // 类型切换
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedType = this.dataset.type;
            });
        });

        // 编辑器工具栏
        document.querySelectorAll('.editor-toolbar button').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const cmd = this.dataset.cmd;
                const editor = editorContent;
                editor.focus();

                switch (cmd) {
                    case 'bold':
                        document.execCommand('bold', false, null);
                        break;
                    case 'italic':
                        document.execCommand('italic', false, null);
                        break;
                    case 'underline':
                        document.execCommand('underline', false, null);
                        break;
                    case 'h2':
                        document.execCommand('formatBlock', false, '<h2>');
                        break;
                    case 'h3':
                        document.execCommand('formatBlock', false, '<h3>');
                        break;
                    case 'ul':
                        document.execCommand('insertUnorderedList', false, null);
                        break;
                    case 'ol':
                        document.execCommand('insertOrderedList', false, null);
                        break;
                    case 'quote':
                        document.execCommand('formatBlock', false, '<blockquote>');
                        break;
                    case 'image':
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = function(e2) {
                            const file = e2.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = function(ev) {
                                const img = document.createElement('img');
                                img.src = ev.target.result;
                                img.style.maxWidth = '100%';
                                img.style.borderRadius = '4px';
                                editor.appendChild(img);
                                editor.focus();
                            };
                            reader.readAsDataURL(file);
                        };
                        input.click();
                        break;
                    case 'link':
                        const url = prompt('请输入链接地址：', 'https://');
                        if (url) {
                            const text = window.getSelection().toString() || url;
                            document.execCommand('insertHTML', false,
                                `<a href="${url}" target="_blank">${text}</a>`);
                        }
                        break;
                    case 'undo':
                        document.execCommand('undo', false, null);
                        break;
                    case 'redo':
                        document.execCommand('redo', false, null);
                        break;
                    case 'clear':
                        document.execCommand('removeFormat', false, null);
                        break;
                }
                editor.focus();
            });
        });

        // 编辑器支持粘贴图片
        editorContent.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const img = document.createElement('img');
                        img.src = ev.target.result;
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '4px';
                        editorContent.appendChild(img);
                        editorContent.focus();
                    };
                    reader.readAsDataURL(file);
                    break;
                }
            }
        });

        // 打开/关闭发布模态框
        function resetPublishForm() {
            document.getElementById('publishForm').reset();
            editorContent.innerHTML = '';
            document.getElementById('editPostId').value = '';
            document.getElementById('coverImageData').value = '';
            document.getElementById('coverPreview').style.display = 'none';
            document.getElementById('saveAsDraft').checked = false;
            document.getElementById('publishModalTitle').textContent = '✏️ 发布新内容';
            document.getElementById('publishSubmitBtn').textContent = '发布';
            document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === 'article'));
            selectedType = 'article';
            const teal = document.querySelector('input[name="coverColor"][value="teal"]');
            if (teal) teal.checked = true;
        }

        function openPublishModal() {
            resetPublishForm();
            publishModal.classList.add('active');
            document.getElementById('postTitle').focus();
        }

        window.editPost = function(id, ev) {
            if (ev) ev.stopPropagation();
            const post = getPosts().find(p => p.id === id);
            if (!post) return;
            publishModal.classList.add('active');
            document.getElementById('editPostId').value = String(post.id);
            document.getElementById('postTitle').value = post.title || '';
            document.getElementById('postCategory').value = post.category || '';
            document.getElementById('postSummary').value = post.summary || '';
            editorContent.innerHTML = post.content || '';
            document.getElementById('saveAsDraft').checked = post.status === 'draft';
            selectedType = post.type || 'article';
            document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === selectedType));
            const color = post.coverColor || 'teal';
            const radio = document.querySelector('input[name="coverColor"][value="' + color + '"]');
            if (radio) radio.checked = true;
            if (post.coverImage) {
                document.getElementById('coverImageData').value = post.coverImage;
                document.getElementById('coverPreviewImg').src = post.coverImage;
                document.getElementById('coverPreview').style.display = 'block';
            } else {
                document.getElementById('coverImageData').value = '';
                document.getElementById('coverPreview').style.display = 'none';
            }
            document.getElementById('publishModalTitle').textContent = '✏️ 编辑文章';
            document.getElementById('publishSubmitBtn').textContent = '保存';
            document.getElementById('detailModal')?.classList.remove('active');
            document.body.style.overflow = 'hidden';
        };

        document.getElementById('openPublishBtn').addEventListener('click', openPublishModal);
        document.getElementById('closePublishBtn').addEventListener('click', function() {
            publishModal.classList.remove('active');
            resetPublishForm();
            document.body.style.overflow = '';
        });
        publishModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                resetPublishForm();
                document.body.style.overflow = '';
            }
        });

        document.getElementById('coverInput')?.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            if (file.size > 2 * 1024 * 1024) {
                alert('封面图请小于 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('coverImageData').value = ev.target.result;
                document.getElementById('coverPreviewImg').src = ev.target.result;
                document.getElementById('coverPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
        document.getElementById('clearCoverBtn')?.addEventListener('click', function() {
            document.getElementById('coverImageData').value = '';
            document.getElementById('coverInput').value = '';
            document.getElementById('coverPreview').style.display = 'none';
        });

        // 提交发布 / 保存编辑
        document.getElementById('publishForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const title = document.getElementById('postTitle').value.trim();
            const category = document.getElementById('postCategory').value.trim();
            const summary = document.getElementById('postSummary').value.trim();
            const content = editorContent.innerHTML.trim();
            const colorRadio = document.querySelector('input[name="coverColor"]:checked');
            const coverColor = colorRadio ? colorRadio.value : 'teal';
            const coverImage = document.getElementById('coverImageData').value || '';
            const isDraft = document.getElementById('saveAsDraft').checked;
            const editId = document.getElementById('editPostId').value;

            if (!title || !category) { alert('请填写标题和分类'); return; }
            if (!content) { alert('请填写正文内容'); return; }

            const posts = getPosts();
            if (editId) {
                const post = posts.find(p => String(p.id) === String(editId));
                if (post) {
                    post.title = title;
                    post.category = category;
                    post.summary = summary || '';
                    post.coverColor = coverColor;
                    post.coverImage = coverImage;
                    post.type = selectedType;
                    post.content = content;
                    post.status = isDraft ? 'draft' : 'published';
                    post.date = post.date || new Date().toISOString().slice(0, 10);
                }
            } else {
                posts.push({
                    id: genId(),
                    title,
                    category,
                    summary: summary || '',
                    coverColor,
                    coverImage,
                    date: new Date().toISOString().slice(0, 10),
                    comments: 0,
                    views: 0,
                    likes: 0,
                    pinned: false,
                    type: selectedType,
                    content: content,
                    status: isDraft ? 'draft' : 'published'
                });
            }
            savePosts(posts);
            renderAll();
            publishModal.classList.remove('active');
            resetPublishForm();
            document.body.style.overflow = '';
            if (!isDraft) {
                document.getElementById('post-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                alert('已保存到草稿箱');
            }
        });

        document.getElementById('editFromDetailBtn')?.addEventListener('click', function() {
            const title = document.getElementById('detailTitle')?.textContent;
            const posts = getPosts();
            const post = posts.find(p => p.title === title);
            // better: store current detail id
            if (window._currentDetailId) editPost(window._currentDetailId);
        });

        // ============================================================
        // 4. 相册 / 视频管理
        // ============================================================
        const IMAGE_KEY = 'ZIH_gallery';
        // type: 'image' | 'video' | 'bilibili'
        // 长期多设备：把文件放进 assets/gallery/，在这里写相对路径，再推送到 GitHub。
        // 修改后若网页仍显示旧数据，请点「同步仓库图集」或执行 localStorage.removeItem('ZIH_gallery')
        const defaultImages = [
            // —— 示例（可删可改）：仓库内图片 ——
            // { id: 101, url: 'assets/gallery/photo1.jpg', title: '我的照片', desc: '来自仓库', type: 'image' },
            // { id: 102, url: 'assets/gallery/clip.mp4', title: '小视频', desc: '来自仓库', type: 'video' },
            // { id: 103, type: 'bilibili', bvid: 'BV1xx411c7mD', url: 'https://www.bilibili.com/video/BV1xx411c7mD', title: 'B站示例', desc: '来自 B 站' },
            // —— 占位图（无本地文件时也能看到布局；有真实文件后请改成 assets 路径）——
            { id: 1, url: 'https://picsum.photos/seed/zih1/400/300', title: '示例·晨光', desc: '请替换为 assets/gallery/ 下的文件', type: 'image' },
            { id: 2, url: 'https://picsum.photos/seed/zih2/400/300', title: '示例·城市', desc: '推送 GitHub 后所有设备可见', type: 'image' },
            { id: 3, url: 'https://picsum.photos/seed/zih3/400/300', title: '示例·小径', desc: '点下方「同步仓库图集」可重置', type: 'image' }
        ];

        // 单个文件建议不超过 4MB（localStorage 总容量约 5~10MB）
        const MAX_MEDIA_SIZE = 4 * 1024 * 1024; // 非本地云盘的 localStorage 兜底上限
        const LOCAL_VIDEO_URLS = new Map();

        function getImages() {
            const stored = localStorage.getItem(IMAGE_KEY);
            if (stored) {
                try {
                    const list = JSON.parse(stored);
                    list.forEach(item => {
                        if (!item.type) item.type = 'image';
                    });
                    return list;
                } catch (_) {}
            }
            localStorage.setItem(IMAGE_KEY, JSON.stringify(defaultImages));
            return defaultImages.map(x => ({ ...x }));
        }

        function saveImages(images) {
            try {
                localStorage.setItem(IMAGE_KEY, JSON.stringify(images));
            } catch (err) {
                alert('存储空间不足，请删除一些本地上传项。\n长期保存请把文件放 assets/gallery/ 并写入 defaultImages。');
                throw err;
            }
        }

        function syncGalleryFromRepo() {
            if (!confirm('用仓库 defaultImages 覆盖本机预览列表？\n仅本机上传、未写入代码的内容会消失。')) return;
            localStorage.setItem(IMAGE_KEY, JSON.stringify(defaultImages));
            renderGallery();
            alert('已同步。请确认图片已在 assets/gallery/ 并推送到 GitHub。');
        }
        window.syncGalleryFromRepo = syncGalleryFromRepo;

        function genImageId() { return Date.now() + Math.floor(Math.random() * 1000); }

        // ----- 本地云盘：File System Access API + IndexedDB -----
        const LOCAL_CLOUD_DB = 'ZIH_LocalCloudDB';
        const LOCAL_CLOUD_STORE = 'handles';
        const LOCAL_CLOUD_FILES_STORE = 'fileHandles';
        const LOCAL_CLOUD_KEY = 'directory';
        let localCloudHandle = null;
        const localObjectUrls = new Map();

        function openLocalCloudDB() {
            return new Promise((resolve, reject) => {
                if (!('indexedDB' in window)) return reject(new Error('IndexedDB 不可用'));
                const req = indexedDB.open(LOCAL_CLOUD_DB, 2);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(LOCAL_CLOUD_STORE)) db.createObjectStore(LOCAL_CLOUD_STORE);
                    if (!db.objectStoreNames.contains(LOCAL_CLOUD_FILES_STORE)) db.createObjectStore(LOCAL_CLOUD_FILES_STORE);
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('数据库打开失败'));
            });
        }
        async function saveLocalCloudHandle(handle) {
            const db = await openLocalCloudDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(LOCAL_CLOUD_STORE, 'readwrite');
                tx.objectStore(LOCAL_CLOUD_STORE).put(handle, LOCAL_CLOUD_KEY);
                tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
            });
            db.close();
        }
        async function loadLocalCloudHandle() {
            try {
                const db = await openLocalCloudDB();
                const handle = await new Promise((resolve, reject) => {
                    const tx = db.transaction(LOCAL_CLOUD_STORE, 'readonly');
                    const req = tx.objectStore(LOCAL_CLOUD_STORE).get(LOCAL_CLOUD_KEY);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => reject(req.error);
                });
                db.close();
                return handle;
            } catch (_) { return null; }
        }
        async function saveLocalFileHandle(id, handle) {
            if (!id || !handle) return;
            const db = await openLocalCloudDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(LOCAL_CLOUD_FILES_STORE, 'readwrite');
                tx.objectStore(LOCAL_CLOUD_FILES_STORE).put(handle, String(id));
                tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
            });
            db.close();
        }
        async function loadLocalFileHandle(id) {
            if (!id) return null;
            try {
                const db = await openLocalCloudDB();
                const handle = await new Promise((resolve, reject) => {
                    const tx = db.transaction(LOCAL_CLOUD_FILES_STORE, 'readonly');
                    const req = tx.objectStore(LOCAL_CLOUD_FILES_STORE).get(String(id));
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => reject(req.error);
                });
                db.close();
                return handle;
            } catch (_) { return null; }
        }
        async function deleteLocalFileHandle(id) {
            if (!id) return;
            try {
                const db = await openLocalCloudDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(LOCAL_CLOUD_FILES_STORE, 'readwrite');
                    tx.objectStore(LOCAL_CLOUD_FILES_STORE).delete(String(id));
                    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
                });
                db.close();
            } catch (_) {}
        }

        async function clearLocalCloudHandle() {
            localCloudHandle = null;
            try {
                const db = await openLocalCloudDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(LOCAL_CLOUD_STORE, 'readwrite');
                    tx.objectStore(LOCAL_CLOUD_STORE).delete(LOCAL_CLOUD_KEY);
                    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
                });
                db.close();
            } catch (_) {}
            updateLocalCloudUI();
        }
        async function verifyLocalCloudPermission(handle, request = false, mode = 'read') {
            if (!handle) return false;
            try {
                if ((await handle.queryPermission({ mode })) === 'granted') return true;
                // 读取时，若 read 未授权但 readwrite 已授权，也视为可读。
                if (mode === 'read' && (await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
                if (request && (await handle.requestPermission({ mode })) === 'granted') return true;
            } catch (_) {}
            return false;
        }
        function updateLocalCloudUI() {
            const status = document.getElementById('localCloudStatus');
            const dot = document.getElementById('localCloudDot');
            if (!status || !dot) return;
            if (localCloudHandle) {
                status.textContent = '已连接：' + (localCloudHandle.name || '本地文件夹');
                dot.classList.add('active');
            } else {
                status.textContent = '尚未连接文件夹';
                dot.classList.remove('active');
            }
        }
        async function chooseLocalCloudFolder() {
            if (!window.showDirectoryPicker) {
                alert('当前浏览器不支持本地云盘文件夹连接。请使用最新版 Chrome / Edge，并通过 HTTPS 或 localhost 打开网站。');
                return false;
            }
            try {
                const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
                localCloudHandle = handle;
                await saveLocalCloudHandle(handle);
                updateLocalCloudUI();
                alert('本地云盘已连接：' + (handle.name || '文件夹') + '\n\n之后上传图片/视频会优先复制到这个文件夹。');
                return true;
            } catch (e) {
                if (e && e.name !== 'AbortError') alert('连接文件夹失败：' + (e.message || e));
                return false;
            }
        }
        async function initLocalCloud() {
            if (!window.showDirectoryPicker) return;
            localCloudHandle = await loadLocalCloudHandle();
            if (localCloudHandle) {
                const ok = await verifyLocalCloudPermission(localCloudHandle, false);
                if (!ok) localCloudHandle = null;
            }
            updateLocalCloudUI();
        }
        async function writeFileToLocalCloud(file) {
            if (!localCloudHandle) return false;
            if (!(await verifyLocalCloudPermission(localCloudHandle, true))) return false;
            const safeName = file.name.replace(/[\\/:*?"<>|]/g, '_');
            const fh = await localCloudHandle.getFileHandle(safeName, { create: true });
            const writable = await fh.createWritable();
            await writable.write(file);
            await writable.close();
            return { fileName: safeName, folderName: localCloudHandle.name || '本地云盘', fileHandle: fh };
        }
        async function getLocalFileByRelativePath(relativePath) {
            if (!localCloudHandle || !relativePath) return null;
            try {
                if (!(await verifyLocalCloudPermission(localCloudHandle, false))) return null;
                const parts = String(relativePath).split('/').filter(Boolean);
                let dir = localCloudHandle;
                for (let i = 0; i < parts.length - 1; i++) {
                    dir = await dir.getDirectoryHandle(parts[i]);
                }
                const fh = await dir.getFileHandle(parts[parts.length - 1]);
                return await fh.getFile();
            } catch (_) { return null; }
        }

        async function getLocalFile(item) {
            if (!item || !item.localFile) return null;
            // 优先使用持久化的 FileSystemFileHandle，避免每次播放都重新从路径解析。
            const directHandle = await loadLocalFileHandle(item.id);
            if (directHandle) {
                try {
                    if (!(await verifyLocalCloudPermission(directHandle, false, 'read'))) return null;
                    return await directHandle.getFile();
                } catch (_) {}
            }
            if (!localCloudHandle) return null;
            return item.relativePath
                ? getLocalFileByRelativePath(item.relativePath)
                : (item.fileName ? getLocalFileByRelativePath(item.fileName) : null);
        }

        async function getLocalFileUrl(item) {
            if (!item || !item.localFile) return null;
            if (LOCAL_VIDEO_URLS.has(item.id)) return LOCAL_VIDEO_URLS.get(item.id);
            const file = await getLocalFile(item);
            if (!file) return null;
            const url = URL.createObjectURL(file);
            LOCAL_VIDEO_URLS.set(item.id, url);
            return url;
        }

        function revokeLocalMediaUrl(id) {
            const url = LOCAL_VIDEO_URLS.get(id);
            if (url) { URL.revokeObjectURL(url); LOCAL_VIDEO_URLS.delete(id); }
        }

        function isVideoName(name) {
            return /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv|mpg|mpeg|ts|mts|m2ts|3gp|3g2|flv|f4v|wmv)$/i.test(name || '');
        }
        function getVideoMime(name, fileType = '') {
            if (fileType && fileType.startsWith('video/')) return fileType;
            const ext = (String(name || '').split('.').pop() || '').toLowerCase();
            const map = {
                mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4',
                ogv: 'video/ogg', ogg: 'video/ogg', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
                mpg: 'video/mpeg', mpeg: 'video/mpeg', ts: 'video/mp2t', mts: 'video/mp2t', m2ts: 'video/mp2t',
                '3gp': 'video/3gpp', '3g2': 'video/3gpp2', flv: 'video/x-flv', f4v: 'video/x-f4v', wmv: 'video/x-ms-wmv'
            };
            return map[ext] || 'video/*';
        }
        function getVideoExtension(name) {
            const m = String(name || '').match(/\.([^.]+)$/);
            return m ? m[1].toUpperCase() : 'VIDEO';
        }
        function getChromePlaybackHint(item, video) {
            const mime = getVideoMime(item.fileName || item.title || '', item.mimeType || '');
            const support = video.canPlayType(mime);
            if (support) return { mime, support, message: '' };
            return {
                mime, support: '',
                message: `Chrome 已识别 ${getVideoExtension(item.fileName || item.title)} 文件，但当前编码/容器可能无法直接播放。推荐转换为 MP4（H.264 + AAC）或 WebM（VP8/VP9/AV1 + Opus）。`
            };
        }
        function isImageName(name) {
            return /\.(jpg|jpeg|png|webp|gif|bmp|avif)$/i.test(name || '');
        }

        async function scanLocalCloudDirectory(dirHandle, relative = '', out = []) {
            for await (const [name, handle] of dirHandle.entries()) {
                const rel = relative ? `${relative}/${name}` : name;
                if (handle.kind === 'directory') {
                    // 只扫描常见媒体，避免把整个云盘的非媒体文件都塞进列表
                    await scanLocalCloudDirectory(handle, rel, out);
                } else if (isVideoName(name) || isImageName(name)) {
                    try {
                        const file = await handle.getFile();
                        out.push({
                            name,
                            relativePath: rel,
                            size: file.size,
                            mimeType: isVideoName(name) ? getVideoMime(name, file.type) : (file.type || 'image/*'),
                            type: isVideoName(name) ? 'video' : 'image',
                            fileHandle: handle
                        });
                    } catch (_) {}
                }
            }
            return out;
        }

        async function scanLocalCloudMedia() {
            if (!localCloudHandle) {
                alert('请先连接本地云盘文件夹。');
                return;
            }
            if (!(await verifyLocalCloudPermission(localCloudHandle, true))) {
                alert('浏览器没有获得云盘文件夹读取权限，请重新选择文件夹。');
                return;
            }
            const btn = document.getElementById('scanCloudFolderBtn');
            const oldText = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = '🔎 扫描中…'; }
            try {
                const found = await scanLocalCloudDirectory(localCloudHandle);
                let images = getImages();
                const existing = new Set(images.filter(x => x.localFile).map(x => x.relativePath || x.fileName));
                let added = 0;
                for (const f of found) {
                    if (existing.has(f.relativePath)) continue;
                    const id = genImageId();
                    images.push({
                        id, url: '', title: f.name.replace(/\.[^.]+$/, ''),
                        desc: `来自 ${localCloudHandle.name || '本地云盘'} / ${f.relativePath}`,
                        type: f.type, localFile: true, fileName: f.name,
                        relativePath: f.relativePath, folderName: localCloudHandle.name || '本地云盘',
                        size: f.size, mimeType: f.mimeType
                    });
                    if (f.fileHandle) await saveLocalFileHandle(id, f.fileHandle);
                    existing.add(f.relativePath); added++;
                }
                saveImages(images);
                renderGallery();
                alert(`扫描完成：发现 ${found.length} 个媒体文件，新增 ${added} 个。\n\n视频仍然只在你点击播放时读取。`);
            } catch (e) {
                alert('扫描失败：' + (e.message || e));
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = oldText || '🔎 扫描视频/图片'; }
            }
        }
        window.scanLocalCloudMedia = scanLocalCloudMedia;

        async function hydrateLocalGalleryMedia() {
            // 图片按需读取；本地视频只读取少量数据生成缩略图，不把整段视频读入内存。
            const imageNodes = document.querySelectorAll('.gallery-item[data-type="image"]');
            for (const node of imageNodes) {
                const id = Number(node.dataset.id);
                const item = getImages().find(i => i.id === id);
                if (!item || !item.localFile) continue;
                const url = await getLocalFileUrl(item);
                const media = node.querySelector('img');
                if (media && url) media.src = url;
            }

            const videoNodes = document.querySelectorAll('.gallery-item[data-type="video"]');
            for (const node of videoNodes) {
                const id = Number(node.dataset.id);
                const item = getImages().find(i => i.id === id);
                if (!item || !item.localFile) continue;
                const thumb = node.querySelector('.local-video-thumb');
                if (!thumb) continue;
                try {
                    const url = await getLocalFileUrl(item);
                    if (!url) throw new Error('no url');
                    await createLocalVideoThumbnail(url, thumb);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    thumb.classList.remove('local-video-thumb-loading');
                    thumb.classList.add('local-video-thumb-fallback');
                    const text = thumb.querySelector('.local-video-thumb-text');
                    if (text) text.textContent = '点击播放视频';
                }
            }
        }

        function createLocalVideoThumbnail(url, container) {
            return new Promise((resolve, reject) => {
                const v = document.createElement('video');
                v.muted = true;
                v.playsInline = true;
                v.preload = 'metadata';
                let done = false;
                const finish = (ok) => {
                    if (done) return;
                    done = true;
                    v.removeAttribute('src');
                    v.load();
                    ok ? resolve() : reject(new Error('thumbnail failed'));
                };
                v.onerror = () => finish(false);
                v.onloadedmetadata = () => {
                    const target = Number.isFinite(v.duration) ? Math.min(Math.max(v.duration * 0.08, 0.15), 1.5) : 0.5;
                    try { v.currentTime = target; } catch (_) { v.onloadeddata(); }
                };
                v.onloadeddata = () => {
                    try {
                        const w = 640, h = 360;
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(v, 0, 0, w, h);
                        const data = canvas.toDataURL('image/jpeg', 0.82);
                        const bg = container.querySelector('.local-video-thumb-bg');
                        if (bg) {
                            bg.style.backgroundImage = `url("${data}")`;
                            bg.classList.add('has-thumb');
                        }
                        const text = container.querySelector('.local-video-thumb-text');
                        if (text) text.textContent = '点击播放';
                        container.classList.remove('local-video-thumb-loading');
                        container.classList.add('local-video-thumb-ready');
                        finish(true);
                    } catch (_) { finish(false); }
                };
                v.src = url;
                v.load();
            });
        }

        function renderGallery() {
            const container = document.getElementById('gallery-grid');
            let images = getImages();
            if (galleryMediaFilter && galleryMediaFilter !== 'all') {
                images = images.filter(img => (img.type || 'image') === galleryMediaFilter);
            }
            if (images.length === 0) {
                container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--ink-faint);padding:40px 0;">该筛选下暂无内容</p>`;
                return;
            }
            let html = '';
            images.forEach(img => {
                const t = img.type || 'image';
                let mediaHtml = '';
                let badge = '';
                let footHint = '点击查看';
                if (t === 'bilibili') {
                    mediaHtml = `
                        <div class="bili-thumb">
                            <div class="bili-play">▶</div>
                            <div class="bili-id">${img.bvid || ''}</div>
                        </div>
                        <span class="media-badge bili">📺 B站</span>`;
                    footHint = '点击播放';
                } else if (t === 'cloud') {
                    mediaHtml = `
                        <div class="cloud-thumb">
                            <div class="cloud-icon">☁️</div>
                            <div class="cloud-name">${img.pan || '云盘'}</div>
                        </div>
                        <span class="media-badge cloud">☁️ 云盘</span>`;
                    footHint = '点击打开';
                } else if (t === 'video') {
                    const src = img.localFile ? '' : (img.url || '');
                    const sizeText = img.size ? formatFileSize(img.size) : '';
                    if (img.localFile) {
                        mediaHtml = `<div class="local-video-thumb local-video-thumb-loading"><div class="local-video-thumb-bg"></div><div class="local-video-thumb-center"><span class="local-video-play">▶</span><span class="local-video-thumb-text">正在生成封面…</span></div></div>`;
                    } else {
                        mediaHtml = `<video src="${src}" preload="metadata" playsinline muted></video><div class="local-video-overlay"><span class="local-video-play">▶</span></div>`;
                    }
                    mediaHtml += `<span class="media-badge video">🎬 视频</span>${img.localFile ? '<span class="gallery-local-badge">💻 本地云盘</span>' : ''}${sizeText ? `<span class="media-size-badge">${sizeText}</span>` : ''}`;
                    footHint = '点击播放';
                } else {
                    const src = img.localFile ? '' : (img.url || '');
                    mediaHtml = `<img src="${src}" alt="${img.title || ''}" loading="lazy" />
                       <span class="media-badge">📷 图片</span>${img.localFile ? '<span class="gallery-local-badge">💻 本地云盘</span>' : ''}`;
                }
                html += `
                    <div class="gallery-item" data-id="${img.id}" data-type="${t}" onclick="${t === 'video' ? 'openWebPlayerForItemById(' + img.id + '); return false;' : 'openMediaViewer(' + img.id + ')'}">
                        ${mediaHtml}
                        <button type="button" class="gallery-delete-btn" onclick="event.preventDefault();event.stopPropagation();deleteImage(${img.id})" title="删除${t === 'video' ? '视频' : '内容'}" aria-label="删除">🗑️</button>
                        <div class="caption">
                            <strong>${img.title || (t === 'bilibili' ? (img.bvid || 'B站视频') : t === 'cloud' ? (img.pan || '云盘链接') : t === 'video' ? '未命名视频' : '未命名图片')}</strong>
                            ${img.desc ? img.desc : ''}
                        </div>
                        <div class="foot">
                            <span style="font-size:11px;color:var(--ink-faint);">${footHint}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
            hydrateLocalGalleryMedia();
        }

        // ----- V4：网页播放助手（不再依赖 Windows 本机助手） -----
        // 本地文件使用浏览器 File System Access / Blob URL；网络文件使用浏览器原生媒体能力。
        // 旧版 127.0.0.1:47823 / BAT / PowerShell 播放助手已移除。

        // ----- 媒体预览：点击放大 + 全屏 -----
        let currentMediaEl = null;

        async function openMediaViewer(id) {
            // V4 直连播放：视频卡片点击后直接交给“网页播放助手”，
            // 不再先打开旧的媒体预览弹窗、再手动点击“网页播放助手”。
            let directItem = getImages().find(i => i.id === id);
            if (directItem && directItem.type === 'video' && window.openWebPlayerForItem) {
                await window.openWebPlayerForItem(directItem);
                return;
            }
            let all = getImages();
            if (galleryMediaFilter && galleryMediaFilter !== 'all') {
                all = all.filter(i => (i.type || 'image') === galleryMediaFilter);
            }
            mediaViewerList = all;
            mediaViewerIndex = all.findIndex(i => i.id === id);
            if (mediaViewerIndex < 0) mediaViewerIndex = 0;
            let item = all.find(i => i.id === id) || getImages().find(i => i.id === id);
            if (!item) return;
            if (item.localFile) {
                const localUrl = await getLocalFileUrl(item);
                if (!localUrl) {
                    alert('无法读取本地云盘文件。请重新连接云盘文件夹，并确认文件没有被移动或删除。');
                    return;
                }
                item = { ...item, url: localUrl };
            }
            const modal = document.getElementById('mediaModal');
            const body = document.getElementById('mediaModalBody');
            const title = document.getElementById('mediaModalTitle');
            const fsBtn = document.getElementById('mediaFullscreenBtn');
            const webBtn = document.getElementById('mediaWebPlayerBtn');
            const tip = document.querySelector('.media-modal-tip');
            if (webBtn) { webBtn.style.display = 'none'; webBtn.dataset.mediaId = ''; }
            title.textContent = item.title || (item.type === 'bilibili' ? 'B站视频' : item.type === 'cloud' ? (item.pan || '云盘链接') : item.type === 'video' ? '视频预览' : '图片预览');
            body.innerHTML = '';
            currentMediaEl = null;

            if (item.type === 'cloud') {
                const card = document.createElement('div');
                card.className = 'cloud-card';
                const codeHtml = item.code
                    ? `<div class="cloud-card-code">提取码：${item.code}</div>`
                    : '';
                card.innerHTML = `
                    <div class="cloud-card-icon">☁️</div>
                    <div class="cloud-card-pan">${item.pan || '云盘'}</div>
                    ${codeHtml}
                    <div class="cloud-card-actions">
                        <button type="button" class="cloud-open-btn">🔗 打开云盘链接</button>
                        ${item.code ? '<button type="button" class="cloud-copy-btn">📋 复制提取码</button>' : ''}
                    </div>
                `;
                card.querySelector('.cloud-open-btn').addEventListener('click', () => {
                    window.open(item.url, '_blank', 'noopener');
                });
                const copyBtn = card.querySelector('.cloud-copy-btn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard?.writeText(item.code || '').then(() => {
                            copyBtn.textContent = '✅ 已复制';
                            setTimeout(() => { copyBtn.textContent = '📋 复制提取码'; }, 1500);
                        }).catch(() => alert('复制失败，请手动复制：' + item.code));
                    });
                }
                body.appendChild(card);
                if (fsBtn) fsBtn.style.display = 'none';
                if (tip) tip.textContent = '云盘文件不占用本机存储 · 点击按钮跳转到网盘打开';
            } else if (item.type === 'bilibili' && item.bvid) {
                const wrap = document.createElement('div');
                wrap.className = 'bili-iframe-wrap';
                // high_quality=1 & danmaku optional; as_wide=1
                const src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(item.bvid)}&page=1&high_quality=1&danmaku=0`;
                wrap.innerHTML = `<iframe src="${src}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" allow="fullscreen; encrypted-media"></iframe>`;
                body.appendChild(wrap);
                currentMediaEl = wrap;
                if (fsBtn) fsBtn.style.display = 'inline-flex';
                if (tip) tip.textContent = 'B 站嵌入播放 · 点「全屏」可尝试全屏（部分浏览器需在播放器内点全屏）';
            } else if (item.type === 'video') {
                const video = document.createElement('video');
                video.controls = true;
                video.preload = 'metadata';
                video.playsInline = true;
                video.setAttribute('playsinline', '');
                video.setAttribute('controlsList', 'nodownload');
                const loading = document.createElement('div');
                loading.className = 'local-video-loading';
                loading.textContent = item.localFile ? '正在准备视频…' : '正在加载视频…';
                body.appendChild(loading);
                body.appendChild(video);

                const applySource = async () => {
                    let src = item.url || '';
                    if (item.localFile) {
                        const cachedTranscode = localStorage.getItem('ZIH_transcode_' + item.id) || '';
                        if (cachedTranscode) src = cachedTranscode;
                        else src = await getLocalFileUrl(item);
                    }
                    if (!src) {
                        loading.textContent = '⚠️ 无法读取本地视频，请重新连接云盘文件夹';
                        return;
                    }
                    const supportInfo = getChromePlaybackHint(item, video);
                    video.src = src;
                    if (supportInfo.mime && supportInfo.mime !== 'video/*') video.setAttribute('type', supportInfo.mime);
                    video.load();
                    if (supportInfo.message) {
                        loading.textContent = 'ℹ️ ' + supportInfo.message;
                    }
                    const onReady = () => {
                        loading.remove();
                        video.play().catch(() => {});
                    };
                    video.addEventListener('loadeddata', onReady, { once: true });
                    video.addEventListener('canplay', onReady, { once: true });
                };
                applySource();
                video.addEventListener('error', () => {
                    loading.textContent = `⚠️ 文件已从本地云盘读取，但 Chrome 无法解码。格式：${getVideoExtension(item.fileName || item.title)}。请检查视频编码；最稳妥的是 MP4 + H.264 + AAC。`;
                    if (!loading.isConnected) body.insertBefore(loading, video);
                });
                video.addEventListener('click', function(e) {
                    if (e.target === video) {
                        if (video.paused) video.play();
                        else video.pause();
                    }
                });
                currentMediaEl = video;
                if (fsBtn) fsBtn.style.display = 'inline-flex';
                if (webBtn) {
                    webBtn.style.display = 'inline-flex';
                    webBtn.dataset.mediaId = String(item.id);
                }
                if (tip) tip.textContent = item.localFile
                    ? `本地云盘 · ${item.size ? formatFileSize(item.size) : '大文件'} · 仅加载当前视频`
                    : '点击视频可播放/暂停 · 点「全屏」进入全屏播放';
            } else {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.title || '';
                img.addEventListener('click', function() {
                    requestMediaFullscreen(img);
                });
                body.appendChild(img);
                currentMediaEl = img;
                if (fsBtn) fsBtn.style.display = 'inline-flex';
                if (tip) tip.textContent = '点击图片可尝试全屏';
            }
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }


        function navigateMedia(delta) {
            if (!mediaViewerList.length) return;
            mediaViewerIndex = (mediaViewerIndex + delta + mediaViewerList.length) % mediaViewerList.length;
            const item = mediaViewerList[mediaViewerIndex];
            if (item) openMediaViewer(item.id);
        }
        document.getElementById('mediaPrevBtn')?.addEventListener('click', () => navigateMedia(-1));
        document.getElementById('mediaNextBtn')?.addEventListener('click', () => navigateMedia(1));

        function closeMediaViewer() {
            const modal = document.getElementById('mediaModal');
            const body = document.getElementById('mediaModalBody');
            // 停止视频
            const v = body && body.querySelector('video');
            if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            modal.classList.remove('active');
            document.body.style.overflow = '';
            currentMediaEl = null;
            if (body) body.innerHTML = '';
        }

        function requestMediaFullscreen(el) {
            const target = el || currentMediaEl || document.getElementById('mediaModalBody');
            if (!target) return;
            const req = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
            if (req) {
                req.call(target).catch(() => {
                    alert('当前浏览器不支持全屏，或需要用户手势触发');
                });
            } else {
                alert('当前浏览器不支持全屏 API');
            }
        }

        // 绑定关闭 / 全屏按钮（DOM 可能稍后才有，用委托或延迟）
        (function bindMediaModal() {
            const modal = document.getElementById('mediaModal');
            if (!modal) return;
            document.getElementById('closeMediaBtn')?.addEventListener('click', closeMediaViewer);
            document.getElementById('mediaFullscreenBtn')?.addEventListener('click', function() {
                requestMediaFullscreen(currentMediaEl);
            });
            document.getElementById('mediaWebPlayerBtn')?.addEventListener('click', async function() {
                const id = this.dataset.mediaId ? Number(this.dataset.mediaId) : 0;
                const item = getImages().find(i => i.id === id);
                if (item && window.openWebPlayerForItem) await window.openWebPlayerForItem(item);
            });
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeMediaViewer();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('active') && !document.fullscreenElement) {
                    closeMediaViewer();
                }
            });
        })();


        function deleteImage(id) {
            if (!confirm('确定要删除这项内容吗？')) return;
            let images = getImages();
            images = images.filter(img => img.id !== id);
            revokeLocalMediaUrl(id);
            deleteLocalFileHandle(id);
            saveImages(images);
            renderGallery();
        }

        function formatFileSize(bytes) {
            if (!bytes || !Number.isFinite(bytes)) return '';
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let n = bytes, i = 0;
            while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
            return `${n >= 10 || i === 0 ? n.toFixed(0) : n.toFixed(1)} ${units[i]}`;
        }

        function handleMediaUpload(files, mediaType) {
            if (!files || !files.length) return;
            const images = getImages();
            const validFiles = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const okType = mediaType === 'video'
                    ? (file.type.startsWith('video/') || isVideoName(file.name))
                    : (file.type.startsWith('image/') || isImageName(file.name));
                if (!okType) continue;
                // 已连接本地云盘时不限制大文件；文件只写入本地文件夹，不塞进 localStorage。
                // 未连接本地云盘时仍限制 4MB，避免浏览器 localStorage 爆满。
                if (!localCloudHandle && file.size > MAX_MEDIA_SIZE) {
                    alert(`「${file.name}」超过 4MB。请先连接「☁️ 云盘」文件夹，再上传大视频。`);
                    continue;
                }
                validFiles.push(file);
            }
            if (!validFiles.length) return;

            let loaded = 0;
            const total = validFiles.length;
            validFiles.forEach(async file => {
                try {
                    if (localCloudHandle) {
                        const saved = await writeFileToLocalCloud(file);
                        if (saved) {
                            const id = genImageId();
                            images.push({
                                id, url: '', title: file.name.replace(/\.[^.]+$/, ''),
                                desc: `来自 ${saved.folderName}`, type: mediaType, localFile: true,
                                fileName: saved.fileName, folderName: saved.folderName, size: file.size, mimeType: file.type
                            });
                            if (saved.fileHandle) await saveLocalFileHandle(id, saved.fileHandle);
                            loaded++;
                            if (loaded === total) { saveImages(images); renderGallery(); }
                            return;
                        }
                    }
                    if (file.size > MAX_MEDIA_SIZE) {
                        alert(`「${file.name}」无法写入本地云盘，且超过 4MB，因此跳过。`);
                        loaded++;
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const dataUrl = ev.target.result;
                        images.push({ id: genImageId(), url: dataUrl, title: file.name.replace(/\.[^.]+$/, ''), desc: '', type: mediaType, size: file.size, mimeType: file.type });
                        loaded++;
                        if (loaded === total) { try { saveImages(images); renderGallery(); } catch (_) {} }
                    };
                    reader.onerror = function() { loaded++; alert(`读取「${file.name}」失败`); };
                    reader.readAsDataURL(file);
                } catch (err) {
                    loaded++;
                    alert(`保存「${file.name}」失败：${err.message || err}`);
                }
            });
        }

        const fileInput = document.getElementById('imageInput');
        const videoInput = document.getElementById('videoInput');

        document.getElementById('uploadImageBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });
        fileInput.addEventListener('change', function(e) {
            handleMediaUpload(e.target.files, 'image');
            fileInput.value = '';
        });

        if (document.getElementById('uploadVideoBtn')) {
            document.getElementById('uploadVideoBtn').addEventListener('click', function(e) {
                e.stopPropagation();
                videoInput.click();
            });
            videoInput.addEventListener('change', function(e) {
                handleMediaUpload(e.target.files, 'video');
                videoInput.value = '';
            });
        }

        // ----- B 站嵌入 -----
        function parseBilibiliBvid(input) {
            if (!input) return null;
            const s = String(input).trim();
            const m = s.match(/BV[0-9A-Za-z]+/);
            return m ? m[0] : null;
        }

        function addBilibiliVideo(raw, title) {
            const bvid = parseBilibiliBvid(raw);
            if (!bvid) {
                alert('请粘贴带 BV 号的链接，或直接填 BV 号\n例：https://www.bilibili.com/video/BV1xx411c7mD\n或：BV1xx411c7mD');
                return false;
            }
            const images = getImages();
            images.push({
                id: genImageId(),
                type: 'bilibili',
                bvid: bvid,
                url: 'https://www.bilibili.com/video/' + bvid,
                title: (title && title.trim()) || bvid,
                desc: '来自 B 站'
            });
            try {
                saveImages(images);
                renderGallery();
                return true;
            } catch (e) {
                return false;
            }
        }

        function openBiliModal(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const modal = document.getElementById('biliModal');
            if (!modal) {
                alert('未找到 B 站嵌入窗口，请确认已更新最新页面文件');
                return;
            }
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const input = document.getElementById('biliInput');
                if (input) { input.focus(); input.select(); }
            }, 50);
        }
        window.openBiliModal = openBiliModal;

        function closeBiliModal() {
            const modal = document.getElementById('biliModal');
            const form = document.getElementById('biliForm');
            if (modal) modal.classList.remove('active');
            if (form) form.reset();
            document.body.style.overflow = '';
        }
        window.closeBiliModal = closeBiliModal;

        (function bindBiliModal() {
            const modal = document.getElementById('biliModal');
            const form = document.getElementById('biliForm');
            const openBtn = document.getElementById('addBiliBtn');
            const closeBtn = document.getElementById('closeBiliBtn');

            // 多重绑定，避免点不到
            if (openBtn) {
                openBtn.addEventListener('click', openBiliModal);
            }
            // 事件委托兜底（防止按钮被重绘或后插入）
            document.addEventListener('click', function(ev) {
                const t = ev.target.closest && ev.target.closest('#addBiliBtn, .btn-upload-bili');
                if (t) openBiliModal(ev);
            });

            if (closeBtn) closeBtn.addEventListener('click', function(ev) {
                ev.preventDefault();
                closeBiliModal();
            });
            if (modal) {
                modal.addEventListener('click', function(ev) {
                    if (ev.target === modal) closeBiliModal();
                });
            }
            if (form) {
                form.addEventListener('submit', function(ev) {
                    ev.preventDefault();
                    const raw = document.getElementById('biliInput')?.value || '';
                    const title = document.getElementById('biliTitle')?.value || '';
                    if (addBilibiliVideo(raw, title)) {
                        closeBiliModal();
                        if (typeof showTab === 'function') showTab('gallery', false);
                    }
                });
            }
            console.log('[B站] 嵌入按钮已绑定', !!openBtn, !!modal, !!form);
        })();

        // ----- 云盘嵌入 -----
        function addCloudLink(raw, code, title, pan) {
            const url = String(raw || '').trim();
            if (!/^https?:\/\//i.test(url)) {
                alert('请粘贴以 http:// 或 https:// 开头的网盘分享链接');
                return false;
            }
            const images = getImages();
            images.push({
                id: genImageId(),
                type: 'cloud',
                url: url,
                code: (code || '').trim(),
                pan: pan || '其他',
                title: (title && title.trim()) || pan || '云盘链接',
                desc: '来自云盘分享'
            });
            try {
                saveImages(images);
                renderGallery();
                return true;
            } catch (e) {
                return false;
            }
        }

        function openCloudModal(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const modal = document.getElementById('cloudModal');
            if (!modal) {
                alert('未找到云盘窗口，请确认已更新最新页面文件');
                return;
            }
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const input = document.getElementById('cloudInput');
                if (input) input.focus();
            }, 50);
        }
        window.openCloudModal = openCloudModal;

        function closeCloudModal() {
            const modal = document.getElementById('cloudModal');
            const form = document.getElementById('cloudForm');
            if (modal) modal.classList.remove('active');
            if (form) form.reset();
            document.body.style.overflow = '';
        }
        window.closeCloudModal = closeCloudModal;

        (function bindLocalCloud() {
            const choose = document.getElementById('chooseCloudFolderBtn');
            const clear = document.getElementById('clearCloudFolderBtn');
            if (choose) choose.addEventListener('click', chooseLocalCloudFolder);
            const scan = document.getElementById('scanCloudFolderBtn');
            if (scan) scan.addEventListener('click', scanLocalCloudMedia);
            if (clear) clear.addEventListener('click', async () => {
                if (confirm('断开本地云盘连接？已有文件不会删除。')) await clearLocalCloudHandle();
            });
            initLocalCloud();
        })();

        (function bindCloudModal() {
            const modal = document.getElementById('cloudModal');
            const form = document.getElementById('cloudForm');
            const openBtn = document.getElementById('addCloudBtn');
            const closeBtn = document.getElementById('closeCloudBtn');

            if (openBtn) openBtn.addEventListener('click', openCloudModal);
            document.addEventListener('click', function(ev) {
                const t = ev.target.closest && ev.target.closest('#addCloudBtn, .btn-upload-cloud');
                if (t) openCloudModal(ev);
            });
            if (closeBtn) closeBtn.addEventListener('click', function(ev) {
                ev.preventDefault();
                closeCloudModal();
            });
            if (modal) {
                modal.addEventListener('click', function(ev) {
                    if (ev.target === modal) closeCloudModal();
                });
            }
            if (form) {
                form.addEventListener('submit', function(ev) {
                    ev.preventDefault();
                    const raw = document.getElementById('cloudInput')?.value || '';
                    const code = document.getElementById('cloudCode')?.value || '';
                    const title = document.getElementById('cloudTitle')?.value || '';
                    const pan = document.getElementById('cloudPan')?.value || '';
                    if (addCloudLink(raw, code, title, pan)) {
                        closeCloudModal();
                        if (typeof showTab === 'function') showTab('gallery', false);
                    }
                });
            }
        })();


        // ============================================================
        // 5. 评论系统（支持回复）
        // ============================================================
        const COMMENT_KEY = 'ZIH_comments';
        const defaultComments = [
            { id: 1, name: '路人甲', content: '这个博客真不错！加油！', time: '2026-08-31 10:20', parentId: null, replyTo: null },
            { id: 2, name: '小赵', content: '学习了，文章很有帮助。', time: '2026-08-31 14:35', parentId: null, replyTo: null },
        ];

        let replyParentId = null;
        let replyParentName = null;

        function getComments() {
            const stored = localStorage.getItem(COMMENT_KEY);
            if (stored) {
                try {
                    const list = JSON.parse(stored);
                    list.forEach(c => {
                        if (c.parentId === undefined) c.parentId = null;
                        if (c.replyTo === undefined) c.replyTo = null;
                    });
                    return list;
                } catch (_) {}
            }
            localStorage.setItem(COMMENT_KEY, JSON.stringify(defaultComments));
            return defaultComments;
        }

        function saveComments(comments) { localStorage.setItem(COMMENT_KEY, JSON.stringify(comments)); }

        function genCommentId() { return Date.now() + Math.floor(Math.random() * 1000); }

        function renderOneComment(c, isReply) {
            const initial = (c.name || '?').charAt(0).toUpperCase();
            const replyTag = c.replyTo ? `<div class="reply-to-tag">回复 @${c.replyTo}</div>` : '';
            const replyBtn = isReply ? '' : `<button class="reply-btn" onclick="startReply(${c.id}, '${(c.name || '').replace(/'/g, "\\'")}')">回复</button>`;
            return `
                <div class="comment-card" data-id="${c.id}">
                    <div class="body">
                        <div class="comment-author">
                            <span class="initial">${initial}</span>
                            <span class="name">${c.name}</span>
                            <span class="time">${c.time || '刚刚'}</span>
                        </div>
                        ${replyTag}
                        <div class="comment-content">${c.content}</div>
                        <div class="foot">
                            <span>${replyBtn}</span>
                            <button class="delete-btn" onclick="deleteComment(${c.id})" title="删除评论">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderComments() {
            const container = document.getElementById('comment-grid');
            const comments = getComments();
            const roots = comments.filter(c => !c.parentId).sort((a, b) => b.id - a.id);
            if (roots.length === 0) {
                container.innerHTML =
                    `<p style="grid-column:1/-1;text-align:center;color:var(--ink-faint);padding:40px 0;">还没有评论，来说两句吧～</p>`;
                return;
            }
            let html = '';
            roots.forEach(c => {
                const replies = comments.filter(r => r.parentId === c.id).sort((a, b) => a.id - b.id);
                let repliesHtml = '';
                if (replies.length) {
                    repliesHtml = `<div class="comment-replies">${replies.map(r => renderOneComment(r, true)).join('')}</div>`;
                }
                // wrap root + replies
                html += `<div class="comment-thread">${renderOneComment(c, false)}${repliesHtml}</div>`;
            });
            container.innerHTML = html;
        }

        function deleteComment(id) {
            if (!confirm('确定要删除这条评论吗？')) return;
            let comments = getComments();
            // 同时删除回复
            comments = comments.filter(c => c.id !== id && c.parentId !== id);
            saveComments(comments);
            if (replyParentId === id) cancelReply();
            renderComments();
        renderTieba();
        renderGroups();
        }

        function startReply(parentId, name) {
            replyParentId = parentId;
            replyParentName = name;
            const hint = document.getElementById('replyHint');
            const nameEl = document.getElementById('replyToName');
            if (hint) hint.style.display = 'flex';
            if (nameEl) nameEl.textContent = '@' + name;
            const ta = document.getElementById('commentContent');
            if (ta) {
                ta.placeholder = '回复 ' + name + '…';
                ta.focus();
            }
            const btn = document.getElementById('submitCommentBtn');
            if (btn) btn.textContent = '发表回复';
            document.getElementById('personal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function cancelReply() {
            replyParentId = null;
            replyParentName = null;
            const hint = document.getElementById('replyHint');
            if (hint) hint.style.display = 'none';
            const ta = document.getElementById('commentContent');
            if (ta) ta.placeholder = '想说什么呢？';
            const btn = document.getElementById('submitCommentBtn');
            if (btn) btn.textContent = '发表评论';
        }

        document.getElementById('cancelReplyBtn')?.addEventListener('click', cancelReply);

        document.getElementById('submitCommentBtn')?.addEventListener('click', function() {
            const name = document.getElementById('commentName').value.trim();
            const content = document.getElementById('commentContent').value.trim();
            if (!name || !content) { alert('请填写昵称和评论内容'); return; }
            const comments = getComments();
            comments.push({
                id: genCommentId(),
                name,
                content,
                time: new Date().toLocaleString('zh-CN', { hour12: false }),
                parentId: replyParentId,
                replyTo: replyParentName
            });
            saveComments(comments);
            renderComments();
        renderTieba();
        renderGroups();
            document.getElementById('commentContent').value = '';
            cancelReply();
            const firstCard = document.querySelector('#comment-grid .comment-thread, #comment-grid .comment-card');
            if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // ============================================================
        // 5.5 贴吧 & 社群
        // ============================================================
        const TIEBA_KEY = 'ZIH_tieba';
        const GROUP_KEY = 'ZIH_groups';

        const defaultTieba = [
            { id: 1, name: '编程吧', url: 'https://tieba.baidu.com/f?kw=%E7%BC%96%E7%A8%8B', desc: '编程学习交流' }
        ];
        const defaultGroups = [
            { id: 1, type: 'qq', name: '技术交流群', link: 'https://qm.qq.com/', desc: '示例 QQ 群链接' }
        ];

        const GROUP_ICONS = {
            qq: '💬',
            wechat: '💚',
            discord: '🎮',
            telegram: '✈️',
            other: '👥'
        };
        const GROUP_LABELS = {
            qq: 'QQ 群',
            wechat: '微信群',
            discord: 'Discord',
            telegram: 'Telegram',
            other: '社群'
        };

        function getTieba() {
            const stored = localStorage.getItem(TIEBA_KEY);
            if (stored) {
                try { return JSON.parse(stored); } catch (_) {}
            }
            localStorage.setItem(TIEBA_KEY, JSON.stringify(defaultTieba));
            return defaultTieba.slice();
        }
        function saveTieba(list) { localStorage.setItem(TIEBA_KEY, JSON.stringify(list)); }

        function getGroups() {
            const stored = localStorage.getItem(GROUP_KEY);
            if (stored) {
                try { return JSON.parse(stored); } catch (_) {}
            }
            localStorage.setItem(GROUP_KEY, JSON.stringify(defaultGroups));
            return defaultGroups.slice();
        }
        function saveGroups(list) { localStorage.setItem(GROUP_KEY, JSON.stringify(list)); }

        function genCommunityId() { return Date.now() + Math.floor(Math.random() * 1000); }

        function renderTieba() {
            const box = document.getElementById('tieba-grid');
            if (!box) return;
            const list = getTieba();
            if (!list.length) {
                box.innerHTML = '<p class="community-empty">暂无贴吧，点击「添加贴吧」创建</p>';
                return;
            }
            box.innerHTML = list.map(item => `
                <a class="community-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
                    <span class="c-icon">📌</span>
                    <span class="c-name">${item.name}</span>
                    <span class="c-type">百度贴吧</span>
                    ${item.desc ? `<span class="c-desc">${item.desc}</span>` : ''}
                    <button type="button" class="c-del" title="删除" onclick="event.preventDefault();event.stopPropagation();deleteTieba(${item.id})">🗑️</button>
                </a>
            `).join('');
        }

        function renderGroups() {
            const box = document.getElementById('group-grid');
            if (!box) return;
            const list = getGroups();
            if (!list.length) {
                box.innerHTML = '<p class="community-empty">暂无社群，点击「添加社群」创建</p>';
                return;
            }
            box.innerHTML = list.map(item => {
                const isUrl = /^https?:\/\//i.test(item.link || '');
                const icon = GROUP_ICONS[item.type] || '👥';
                const label = GROUP_LABELS[item.type] || '社群';
                const extra = isUrl ? '' : `<span class="c-desc">点击复制：${item.link}</span>`;
                return `
                <div class="community-card" data-id="${item.id}" data-link="${(item.link || '').replace(/"/g, '&quot;')}" data-isurl="${isUrl ? '1' : '0'}">
                    <span class="c-icon">${icon}</span>
                    <span class="c-name">${item.name}</span>
                    <span class="c-type">${label}</span>
                    ${item.desc ? `<span class="c-desc">${item.desc}</span>` : ''}
                    ${extra}
                    <button type="button" class="c-del" title="删除" data-del-group="${item.id}">🗑️</button>
                </div>`;
            }).join('');

            box.querySelectorAll('.community-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    if (e.target.closest('.c-del')) return;
                    const link = this.dataset.link;
                    const isUrl = this.dataset.isurl === '1';
                    if (isUrl && link) {
                        window.open(link, '_blank', 'noopener,noreferrer');
                    } else if (link) {
                        navigator.clipboard.writeText(link).then(() => {
                            alert('已复制：' + link);
                        }).catch(() => {
                            prompt('请手动复制：', link);
                        });
                    }
                });
            });
            box.querySelectorAll('[data-del-group]').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteGroup(parseInt(this.dataset.delGroup, 10));
                });
            });
        }

        function deleteTieba(id) {
            if (!confirm('确定删除这个贴吧？')) return;
            saveTieba(getTieba().filter(i => i.id !== id));
            renderTieba();
        }
        function deleteGroup(id) {
            if (!confirm('确定删除这个社群？')) return;
            saveGroups(getGroups().filter(i => i.id !== id));
            if (activeChatGroupId === id) activeChatGroupId = null;
            saveChatMessages(getChatMessages().filter(m => m.groupId !== id));
            renderGroups();
            renderChatList();
            renderActiveChat();
        }

        // ============================================================
        // 个人页统一聊天中心：访客大厅 + 群组 + 群聊
        // ============================================================
        const CHAT_KEY = 'ZIH_group_chat_v2';
        const OLD_CHAT_KEY = 'ZIH_group_chat_v1';
        const CHAT_NAME_KEY = 'ZIH_chat_name';
        const GUEST_ROOM_ID = 'visitor';
        let activeChatGroupId = GUEST_ROOM_ID;

        function getChatMessages() {
            try {
                const current = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
                if (current.length) return current;
                const old = JSON.parse(localStorage.getItem(OLD_CHAT_KEY) || '[]');
                if (old.length) { localStorage.setItem(CHAT_KEY, JSON.stringify(old)); return old; }
                return [];
            } catch (_) { return []; }
        }
        function saveChatMessages(list) { localStorage.setItem(CHAT_KEY, JSON.stringify(list)); }
        function escapeChat(s) {
            return String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        }
        function migrateGuestComments() {
            const chats = getChatMessages();
            if (chats.some(m => m.groupId === GUEST_ROOM_ID)) return;
            let comments = [];
            try { comments = getComments() || []; } catch (_) { comments = []; }
            if (!comments.length) return;
            const migrated = comments.map(c => ({
                id: 'comment-' + c.id,
                groupId: GUEST_ROOM_ID,
                name: c.name || '访客',
                content: c.replyTo ? `回复 @${c.replyTo}：${c.content || ''}` : (c.content || ''),
                time: c.time || '',
                migrated: true
            }));
            saveChatMessages(chats.concat(migrated));
        }
        function chatRooms() {
            return [
                { id: GUEST_ROOM_ID, name: '访客大厅', icon: '💬', meta: '公开访客聊天 · 留言区' },
                ...getGroups().map(g => ({ id: g.id, name: g.name, icon: GROUP_ICONS[g.type] || '👥', meta: g.desc || (GROUP_LABELS[g.type] || '本地群组') }))
            ];
        }
        function renderChatList() {
            const box = document.getElementById('chat-list');
            if (!box) return;
            migrateGuestComments();
            const messages = getChatMessages();
            const rooms = chatRooms();
            box.innerHTML = rooms.map(room => {
                const count = messages.filter(m => String(m.groupId) === String(room.id)).length;
                const guest = room.id === GUEST_ROOM_ID;
                return `<button type="button" class="chat-list-item ${String(activeChatGroupId) === String(room.id) ? 'active' : ''}" data-chat-group="${escapeChat(room.id)}">
                    <span class="chat-avatar">${room.icon}</span>
                    <span class="chat-list-copy"><strong>${escapeChat(room.name)}</strong><small>${count ? count + ' 条消息' : room.meta}</small></span>
                    ${guest ? '<span class="chat-room-badge">公开</span>' : ''}
                </button>`;
            }).join('');
            box.querySelectorAll('[data-chat-group]').forEach(btn => btn.addEventListener('click', () => {
                const raw = btn.dataset.chatGroup;
                activeChatGroupId = raw === GUEST_ROOM_ID ? GUEST_ROOM_ID : Number(raw);
                renderChatList(); renderActiveChat();
            }));
        }
        function renderActiveChat() {
            const empty = document.getElementById('chat-empty');
            const active = document.getElementById('chat-active');
            if (!empty || !active) return;
            const room = chatRooms().find(r => String(r.id) === String(activeChatGroupId));
            if (!room) { activeChatGroupId = GUEST_ROOM_ID; return renderActiveChat(); }
            empty.style.display='none'; active.style.display='flex'; active.style.flexDirection='column';
            document.getElementById('chat-title').textContent = room.icon + ' ' + room.name;
            document.getElementById('chat-meta').textContent = room.meta;
            const nameInput = document.getElementById('chatName');
            if (nameInput) nameInput.value = localStorage.getItem(CHAT_NAME_KEY) || '';
            const manage = document.getElementById('chatManageBtn');
            if (manage) manage.style.display = room.id === GUEST_ROOM_ID ? 'none' : 'inline-flex';
            const box = document.getElementById('chat-messages');
            const messages = getChatMessages().filter(m => String(m.groupId) === String(room.id));
            box.innerHTML = messages.length ? messages.map(m => `<div class="chat-message ${m.name === (localStorage.getItem(CHAT_NAME_KEY) || '') ? 'mine' : ''}">
                <div class="chat-message-top"><strong>${escapeChat(m.name || '访客')}</strong><time>${escapeChat(m.time)}</time></div><div>${escapeChat(m.content)}</div>
            </div>`).join('') : `<div class="chat-no-messages">${room.id === GUEST_ROOM_ID ? '还没有访客留言，欢迎留下第一句话 👋' : '还没有群消息，来发第一句话吧 👋'}</div>`;
            box.scrollTop = box.scrollHeight;
        }
        function initSocialChat() {
            migrateGuestComments();
            renderChatList(); renderActiveChat();
            document.getElementById('chatForm')?.addEventListener('submit', e => {
                e.preventDefault();
                const input = document.getElementById('chatInput');
                const nameInput = document.getElementById('chatName');
                const content = input.value.trim(); const name = nameInput.value.trim() || '访客';
                if (!content) return;
                localStorage.setItem(CHAT_NAME_KEY, name);
                const list = getChatMessages();
                list.push({ id: Date.now()+Math.floor(Math.random()*1000), groupId: activeChatGroupId, name, content, time: new Date().toLocaleString('zh-CN',{hour12:false}) });
                saveChatMessages(list); input.value=''; renderChatList(); renderActiveChat();
            });
            document.getElementById('chatClearBtn')?.addEventListener('click', () => {
                if (!activeChatGroupId || !confirm('清空当前聊天频道的本地记录？')) return;
                saveChatMessages(getChatMessages().filter(m => String(m.groupId) !== String(activeChatGroupId))); renderChatList(); renderActiveChat();
            });
            document.getElementById('chatManageBtn')?.addEventListener('click', () => {
                const group = getGroups().find(g => String(g.id) === String(activeChatGroupId));
                if (!group) return;
                const nextName = prompt('群组名称', group.name);
                if (nextName === null) return;
                const name = nextName.trim();
                if (!name) return alert('群组名称不能为空');
                saveGroups(getGroups().map(g => g.id === group.id ? {...g, name} : g));
                renderChatList(); renderActiveChat();
            });
        }
        initSocialChat();
        document.getElementById('addGroupBtn')?.addEventListener('click', () => openModal('groupModal'));
        document.getElementById('closeGroupBtn')?.addEventListener('click', () => closeModal('groupModal', 'groupForm'));
        document.getElementById('groupModal')?.addEventListener('click', e => {
            if (e.target.id === 'groupModal') closeModal('groupModal', 'groupForm');
        });
        document.getElementById('groupForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const type = document.getElementById('groupType').value;
            const name = document.getElementById('groupName').value.trim();
            const link = document.getElementById('groupLink').value.trim();
            const desc = document.getElementById('groupDesc').value.trim();
            if (!name || !link) return;
            const list = getGroups();
            list.push({ id: genCommunityId(), type, name, link, desc });
            saveGroups(list);
            renderGroups();
            activeChatGroupId = list[list.length - 1].id;
            renderChatList();
            renderActiveChat();
            closeModal('groupModal', 'groupForm');
        });

        // ============================================================
        // 6. 联系方式管理
        // ============================================================
        const CONTACT_KEY = 'ZIH_contacts';
        // 默认联系方式照片：放在 assets/contacts/ 下
        const defaultContacts = [
            { id: 1, label: '微信', iconType: 'wechat', imageUrl: 'assets/contacts/wechat.png' },
            { id: 2, label: '抖音', iconType: 'douyin', imageUrl: 'assets/contacts/douyin.png' }
        ];

        function getContacts() {
            const stored = localStorage.getItem(CONTACT_KEY);
            if (stored) {
                try { return JSON.parse(stored); } catch (_) {}
            }
            localStorage.setItem(CONTACT_KEY, JSON.stringify(defaultContacts));
            return defaultContacts;
        }

        function saveContacts(contacts) { localStorage.setItem(CONTACT_KEY, JSON.stringify(contacts)); }

        function genContactId() { return Date.now() + Math.floor(Math.random() * 1000); }

        function renderContacts() {
            const container = document.getElementById('contact-grid');
            const contacts = getContacts();
            if (contacts.length === 0) {
                container.innerHTML =
                    `<p style="grid-column:1/-1;text-align:center;color:var(--ink-faint);padding:40px 0;">暂无联系方式，点击「添加联系方式」创建吧。</p>`;
                return;
            }
            let html = '';
            contacts.forEach(c => {
                const iconSvg = c.iconType === 'wechat' ?
                    `<svg viewBox="0 0 24 24" fill="currentColor" style="width:36px;height:36px;color:#07c160;"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.802 0 1.452.65 1.452 1.452s-.65 1.452-1.452 1.452-1.452-.65-1.452-1.452.65-1.452 1.452-1.452zm5.812 0c.802 0 1.452.65 1.452 1.452s-.65 1.452-1.452 1.452-1.452-.65-1.452-1.452.65-1.452 1.452-1.452zm9.682 4.9c-2.894 0-5.24 2.038-5.24 4.552 0 2.514 2.346 4.552 5.24 4.552.84 0 1.64-.174 2.366-.488a.71.71 0 0 1 .586.08l1.5.878a.264.264 0 0 0 .136.044.234.234 0 0 0 .234-.234c0-.059-.024-.117-.039-.175l-.31-1.163a.484.484 0 0 1 .176-.547c1.506-1.116 2.45-2.688 2.45-4.497 0-2.514-2.346-4.552-5.24-4.552zm-2.212 3.553c.654 0 1.186.532 1.186 1.186s-.532 1.186-1.186 1.186-1.186-.532-1.186-1.186.532-1.186 1.186-1.186zm4.424 0c.654 0 1.186.532 1.186 1.186s-.532 1.186-1.186 1.186-1.186-.532-1.186-1.186.532-1.186 1.186-1.186z"/></svg>` :
                    `<svg viewBox="0 0 24 24" fill="currentColor" style="width:36px;height:36px;color:#000;"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`;
                const imageHtml = c.imageUrl ?
                    `<img src="${c.imageUrl}" alt="${c.label}" />` :
                    `<span class="placeholder">点击上传图片</span>`;
                html += `
                    <div class="contact-card">
                        <div class="icon">${iconSvg}</div>
                        <div class="label" contenteditable="true" data-id="${c.id}">${c.label}</div>
                        <div class="image-area" data-id="${c.id}">
                            ${imageHtml}
                            <div class="upload-hint">点击上传 / 更换</div>
                        </div>
                        <div class="image-actions">
                            <button class="upload-btn" data-id="${c.id}">📤 上传</button>
                            ${c.imageUrl ? `<button class="delete-img-btn danger" data-id="${c.id}">🗑️ 删除照片</button>` : ''}
                        </div>
                        <div class="foot">
                            <span></span>
                            <button class="delete-btn" onclick="deleteContact(${c.id})" title="删除卡片">🗑️</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            document.querySelectorAll('.contact-card .label').forEach(el => {
                el.addEventListener('blur', function() {
                    const id = parseInt(this.dataset.id);
                    const newLabel = this.textContent.trim();
                    if (newLabel) {
                        let contacts = getContacts();
                        const item = contacts.find(c => c.id === id);
                        if (item) { item.label = newLabel;
                            saveContacts(contacts); }
                    } else {
                        const contacts = getContacts();
                        const item = contacts.find(c => c.id === id);
                        if (item) this.textContent = item.label;
                    }
                });
                el.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault();
                        this.blur(); } });
            });

            document.querySelectorAll('.contact-card .image-area, .contact-card .upload-btn').forEach(el => {
                el.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const card = this.closest('.contact-card');
                    const id = parseInt(card.querySelector('.label').dataset.id);
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = function(e2) {
                        const file = e2.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = function(ev) {
                            const dataUrl = ev.target.result;
                            let contacts = getContacts();
                            const item = contacts.find(c => c.id === id);
                            if (item) {
                                item.imageUrl = dataUrl;
                                saveContacts(contacts);
                                renderContacts();
                            }
                        };
                        reader.readAsDataURL(file);
                    };
                    input.click();
                });
            });

            document.querySelectorAll('.delete-img-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = parseInt(this.dataset.id);
                    if (!confirm('确定要删除这张照片吗？')) return;
                    let contacts = getContacts();
                    const item = contacts.find(c => c.id === id);
                    if (item) {
                        item.imageUrl = '';
                        saveContacts(contacts);
                        renderContacts();
                    }
                });
            });
        }

        function deleteContact(id) {
            if (!confirm('确定要删除这个联系方式卡片吗？')) return;
            let contacts = getContacts();
            contacts = contacts.filter(c => c.id !== id);
            saveContacts(contacts);
            renderContacts();
        }

        const addContactModal = document.getElementById('addContactModal');
        document.getElementById('addContactBtn').addEventListener('click', () => {
            addContactModal.classList.add('active');
            document.getElementById('contactLabel').focus();
        });
        document.getElementById('closeAddContactBtn').addEventListener('click', () => {
            addContactModal.classList.remove('active');
            document.getElementById('addContactForm').reset();
        });
        addContactModal.addEventListener('click', e => {
            if (e.target === addContactModal) {
                addContactModal.classList.remove('active');
                document.getElementById('addContactForm').reset();
            }
        });
        document.getElementById('addContactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const type = document.getElementById('contactType').value;
            const label = document.getElementById('contactLabel').value.trim();
            if (!label) { alert('请填写标签'); return; }
            const contacts = getContacts();
            contacts.push({ id: genContactId(), label, iconType: type, imageUrl: '' });
            saveContacts(contacts);
            renderContacts();
            addContactModal.classList.remove('active');
            this.reset();
            const firstCard = document.querySelector('#contact-grid .contact-card');
            if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // ============================================================
        // 7. 音乐播放器
        // ============================================================
        const MUSIC_KEY = 'ZIH_music';
        // 默认音乐：放在 assets/music/bgm.mp3
        const DEFAULT_MUSIC = { src: 'assets/music/bgm.mp3', name: '默认背景音乐', volume: 0.8, playing: false, loop: true };

        function getMusicData() {
            const stored = localStorage.getItem(MUSIC_KEY);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    // 旧数据没有 loop 字段时，默认开启循环
                    if (data && data.loop === undefined) data.loop = true;
                    return data;
                } catch (_) {}
            }
            // 无 localStorage 数据时，尝试使用 assets 默认音乐
            return { ...DEFAULT_MUSIC };
        }

        function saveMusicData(data) { localStorage.setItem(MUSIC_KEY, JSON.stringify(data)); }

        function applyLoopState(enabled) {
            if (!audioPlayer) return;
            const on = enabled !== false;
            audioPlayer.loop = on;
            if (on) audioPlayer.setAttribute('loop', '');
            else audioPlayer.removeAttribute('loop');
            const loopBtn = document.getElementById('loopBtn');
            if (loopBtn) loopBtn.classList.toggle('active', on);
        }

        const audioPlayer = document.getElementById('audioPlayer');
        const playBtn = document.getElementById('playBtn');
        const musicStatus = document.getElementById('musicStatus');
        const musicTime = document.getElementById('musicTime');
        const progressFill = document.getElementById('progressFill');
        const progressBar = document.getElementById('progressBar');
        const volumeSlider = document.getElementById('volumeSlider');
        const musicControls = document.getElementById('musicControls');
        const musicUploadArea = document.getElementById('musicUploadArea');
        const musicInput = document.getElementById('musicInput');
        const deleteMusicBtn = document.getElementById('deleteMusicBtn');

        let isPlaying = false,
            isLoaded = false;

        function loadMusic() {
            const data = getMusicData();
            if (data && data.src) {
                // 监听加载失败（例如 assets 下还没放文件）
                audioPlayer.onerror = function() {
                    isLoaded = false;
                    musicControls.classList.remove('show');
                    musicUploadArea.style.display = 'block';
                    musicStatus.textContent = '默认音乐未找到，请上传';
                    playBtn.textContent = '▶ 播放';
                    playBtn.classList.remove('paused');
                };
                audioPlayer.src = data.src;
                applyLoopState(data.loop !== false);
                audioPlayer.load();
                isLoaded = true;
                musicControls.classList.add('show');
                musicUploadArea.style.display = 'none';
                musicStatus.textContent = data.name || '已加载';
                if (data.volume !== undefined) {
                    audioPlayer.volume = data.volume;
                    volumeSlider.value = data.volume;
                }
                if (data.playing) {
                    playBtn.textContent = '▶ 播放';
                    playBtn.classList.remove('paused');
                    musicStatus.textContent = data.name || '已暂停';
                }
                updateTimeDisplay();
            } else {
                musicControls.classList.remove('show');
                musicUploadArea.style.display = 'block';
                musicStatus.textContent = '未加载';
                playBtn.textContent = '▶ 播放';
                playBtn.classList.remove('paused');
            }
        }

        function updateTimeDisplay() {
            if (audioPlayer.duration) {
                const current = formatTime(audioPlayer.currentTime);
                const total = formatTime(audioPlayer.duration);
                musicTime.textContent = `${current} / ${total}`;
                const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = percent + '%';
            } else { musicTime.textContent = '00:00 / 00:00';
                progressFill.style.width = '0%'; }
        }

        function formatTime(seconds) {
            if (isNaN(seconds)) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        }

        function togglePlay() {
            if (!isLoaded) { alert('请先上传音乐文件'); return; }
            if (audioPlayer.paused) {
                // 每次播放前确保循环状态与设置一致
                const data0 = getMusicData();
                applyLoopState(!data0 || data0.loop !== false);
                audioPlayer.play().then(() => {
                    isPlaying = true;
                    playBtn.textContent = '⏸ 暂停';
                    playBtn.classList.add('paused');
                    musicStatus.textContent = audioPlayer.loop ? '循环播放中' : '播放中';
                    const data = getMusicData();
                    if (data) { data.playing = true; data.loop = audioPlayer.loop;
                        saveMusicData(data); }
                }).catch(err => { alert('请手动点击页面后再次尝试播放'); });
            } else {
                audioPlayer.pause();
                isPlaying = false;
                playBtn.textContent = '▶ 播放';
                playBtn.classList.remove('paused');
                musicStatus.textContent = '已暂停';
                const data = getMusicData();
                if (data) { data.playing = false;
                    saveMusicData(data); }
            }
        }

        progressBar.addEventListener('click', function(e) {
            if (!isLoaded) return;
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            if (audioPlayer.duration) { audioPlayer.currentTime = percent * audioPlayer.duration; }
        });

        volumeSlider.addEventListener('input', function() {
            audioPlayer.volume = parseFloat(this.value);
            const data = getMusicData();
            if (data) { data.volume = parseFloat(this.value);
                saveMusicData(data); }
        });

        audioPlayer.addEventListener('timeupdate', updateTimeDisplay);
        audioPlayer.addEventListener('loadedmetadata', function() {
            isLoaded = true;
            updateTimeDisplay();
            musicControls.classList.add('show');
            musicUploadArea.style.display = 'none';
        });
        audioPlayer.addEventListener('ended', function() {
            const shouldLoop = audioPlayer.loop || (getMusicData() && getMusicData().loop !== false);
            if (shouldLoop) {
                applyLoopState(true);
                isPlaying = true;
                playBtn.textContent = '⏸ 暂停';
                playBtn.classList.add('paused');
                musicStatus.textContent = '循环播放中';
                try { audioPlayer.currentTime = 0; } catch (_) {}
                const p = audioPlayer.play();
                if (p && p.catch) p.catch(() => {});
                return;
            }
            isPlaying = false;
            playBtn.textContent = '▶ 播放';
            playBtn.classList.remove('paused');
            musicStatus.textContent = '已结束';
            const data = getMusicData();
            if (data) { data.playing = false; saveMusicData(data); }
            updateTimeDisplay();
        });

        // 部分浏览器对 data URL 音频 loop 支持不稳，临近结束时手动重绕
        audioPlayer.addEventListener('timeupdate', function() {
            if (!audioPlayer.loop || !audioPlayer.duration || audioPlayer.paused) return;
            // 距结束不足 0.15 秒时，若即将结束则由 ended 处理；这里不做强行跳转避免卡顿
        });

        musicUploadArea.addEventListener('click', function(e) { e.stopPropagation();
            musicInput.click(); });
        musicInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('audio/')) { alert('请选择音频文件');
                musicInput.value = ''; return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                const dataUrl = ev.target.result;
                const musicData = { src: dataUrl, name: file.name, volume: parseFloat(volumeSlider.value) || 0.8,
                    playing: false, loop: true };
                saveMusicData(musicData);
                loadMusic();
                applyLoopState(true);
                isLoaded = true;
                musicControls.classList.add('show');
                musicUploadArea.style.display = 'none';
                musicStatus.textContent = file.name;
                playBtn.textContent = '▶ 播放';
                playBtn.classList.remove('paused');
                musicInput.value = '';
            };
            reader.readAsDataURL(file);
        });

        deleteMusicBtn.addEventListener('click', function() {
            if (!confirm('确定要删除已上传的音乐吗？')) return;
            localStorage.removeItem(MUSIC_KEY);
            audioPlayer.src = '';
            audioPlayer.load();
            isLoaded = false;
            isPlaying = false;
            musicControls.classList.remove('show');
            musicUploadArea.style.display = 'block';
            musicStatus.textContent = '未加载';
            playBtn.textContent = '▶ 播放';
            playBtn.classList.remove('paused');
            musicTime.textContent = '00:00 / 00:00';
            progressFill.style.width = '0%';
        });

        playBtn.addEventListener('click', togglePlay);

        // 循环开关（默认开启）
        const loopBtnEl = document.getElementById('loopBtn');
        if (loopBtnEl) {
            applyLoopState(true);
            loopBtnEl.addEventListener('click', function() {
                const next = !audioPlayer.loop;
                applyLoopState(next);
                const data = getMusicData();
                if (data) {
                    data.loop = next;
                    saveMusicData(data);
                } else {
                    saveMusicData({ src: audioPlayer.src, name: '音乐', volume: audioPlayer.volume, playing: isPlaying, loop: next });
                }
                musicStatus.textContent = next ? '已开启循环' : '已关闭循环';
                setTimeout(() => {
                    if (isPlaying) musicStatus.textContent = '播放中';
                    else if (isLoaded) musicStatus.textContent = (getMusicData() && getMusicData().name) || '已加载';
                }, 1200);
            });
        }

        // ============================================================
        // 8. AI 在线客服（本地模拟回复，不依赖外网 API）
        // ============================================================
        let currentMode = 'ai';

        function getAiEls() {
            return {
                chatBox: document.getElementById('aiChatBox'),
                aiInput: document.getElementById('aiInput'),
                aiSendBtn: document.getElementById('aiSendBtn'),
                aiStatus: document.getElementById('aiStatus'),
                modeBtns: document.querySelectorAll('.ai-mode-toggle .mode-btn')
            };
        }

        function addMessage(text, type) {
            const { chatBox } = getAiEls();
            if (!chatBox) return;
            const msg = document.createElement('div');
            msg.className = 'msg ' + type;
            msg.textContent = text;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function switchMode(mode) {
            currentMode = mode;
            const { modeBtns, aiStatus, chatBox } = getAiEls();
            modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
            if (aiStatus) aiStatus.textContent = mode === 'ai' ? '当前模式：AI 自动回复' : '当前模式：人工客服';
            if (chatBox) chatBox.innerHTML = '';
            if (mode === 'ai') {
                addMessage('你好！我是 AI 助手，有什么可以帮助你的？', 'bot');
            } else {
                addMessage('👤 人工客服已接入，请稍候...', 'system');
                setTimeout(() => addMessage('您好，我是人工客服，请问有什么可以帮您？', 'bot'), 500);
            }
        }

        function aiReply(userText) {
            const t = (userText || '').toLowerCase();
            if (/你好|您好|hi|hello|在吗/.test(t)) return '你好呀！我是博客小助手，可以问我关于本站的功能～';
            if (/文章|博客|写|发布/.test(t)) return '在「文章」页点「发布新内容」即可写文章或新闻；支持富文本和分类。';
            if (/搜索/.test(t)) return '点顶部放大镜图标可打开搜索，支持按标题、分类、摘要、正文过滤。';
            if (/相册|图片|预览|视频|b站|哔哩|云盘|网盘/.test(t)) return '在「预览」可上传图片/小视频，点「嵌入 B 站」添加大视频，或点「添加云盘」放百度网盘/阿里云盘等分享链接。';
            if (/音乐|歌|循环/.test(t)) return '侧边栏「音乐框」可上传音频，🔁 按钮可开关循环播放。';
            if (/主题|暗色|黑夜|白天/.test(t)) return '侧边栏「主题切换」可选白天/黑夜等多种风格，也支持跟随系统。';
            if (/联系|微信|抖音/.test(t)) return '在「关于」页可管理联系方式卡片，并上传二维码图片。';
            if (/谢谢|感谢/.test(t)) return '不客气！还有问题随时问我 🙂';
            const fallback = [
                '好的，我明白了。',
                '收到！你可以在侧边栏切换主题、听音乐，或去预览页看媒体。',
                '这是一个很好的问题。本站数据保存在浏览器本地，可用「数据管理」导出备份。',
                '请稍等…（本地演示回复）建议试试搜索或发布一篇新文章。',
                '很高兴为你服务！点顶部导航可切换 文章 / 预览 / 留言 / 关于。'
            ];
            return fallback[Math.floor(Math.random() * fallback.length)];
        }

        function handleSend(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const { aiInput } = getAiEls();
            if (!aiInput) return;
            const text = aiInput.value.trim();
            if (!text) return;
            addMessage(text, 'user');
            aiInput.value = '';
            if (currentMode === 'ai') {
                const reply = aiReply(text);
                setTimeout(() => addMessage(reply, 'bot'), 350 + Math.random() * 400);
            } else {
                setTimeout(() => addMessage('📩 已收到您的消息，人工客服将尽快回复您。', 'system'), 300);
            }
        }
        window.aiSend = handleSend;

        (function bindAiChat() {
            const { aiInput, aiSendBtn, modeBtns } = getAiEls();
            if (aiSendBtn) {
                aiSendBtn.addEventListener('click', handleSend);
            }
            if (aiInput) {
                aiInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend(e);
                    }
                });
            }
            modeBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const mode = this.dataset.mode;
                    if (mode && mode !== currentMode) switchMode(mode);
                });
            });
            // 事件委托兜底
            document.addEventListener('click', function(ev) {
                if (ev.target && ev.target.id === 'aiSendBtn') handleSend(ev);
            });
            console.log('[AI客服] 已绑定', !!aiSendBtn, !!aiInput);
        })();

        // ============================================================
        // 9. 数据导出 / 导入
        // ============================================================
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importFileInput = document.getElementById('importFileInput');

        exportBtn.addEventListener('click', function() {
            const data = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                posts: getPosts(),
                comments: getComments(),
                images: getImages(),
                contacts: getContacts(),
                profile: getProfile(),
                music: getMusicData(),
                tieba: getTieba(),
                groups: getGroups(),
                friendLinks: getFriendLinks(),
                announce: localStorage.getItem('ZIH_announce')
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `ZIH-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            const count = data.posts.length + data.comments.length + data.images.length + data.contacts.length;
            alert(
                `✅ 数据已导出！\n共导出 ${count} 条数据（文章 ${data.posts.length}，评论 ${data.comments.length}，图片 ${data.images.length}，联系方式 ${data.contacts.length}）`
                );
        });

        importBtn.addEventListener('click', function() { importFileInput.click(); });
        importFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.json')) { alert('请选择 JSON 文件');
                importFileInput.value = ''; return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.version || !data.posts) { throw new Error('无效的备份文件格式'); }
                    const confirmMsg =
                        `即将导入数据，将覆盖当前所有内容！\n\n` +
                        `📄 文章: ${data.posts ? data.posts.length : 0} 篇\n` +
                        `💬 评论: ${data.comments ? data.comments.length : 0} 条\n` +
                        `🖼️ 图片: ${data.images ? data.images.length : 0} 张\n` +
                        `📇 联系方式: ${data.contacts ? data.contacts.length : 0} 个\n` +
                        `👤 个人资料: ${data.profile ? '已包含' : '无'}\n` +
                        `🎵 音乐: ${data.music ? '已包含' : '无'}\n\n` +
                        `确定要继续吗？`;
                    if (!confirm(confirmMsg)) { importFileInput.value = ''; return; }
                    if (data.posts) savePosts(data.posts);
                    if (data.comments) saveComments(data.comments);
                    if (data.images) saveImages(data.images);
                    if (data.contacts) saveContacts(data.contacts);
                    if (data.profile) saveProfile(data.profile);
                    if (data.music) saveMusicData(data.music);
                    if (data.tieba) saveTieba(data.tieba);
                    if (data.groups) saveGroups(data.groups);
                    if (data.friendLinks) saveFriendLinks(data.friendLinks);
                    if (data.announce) localStorage.setItem('ZIH_announce', typeof data.announce === 'string' ? data.announce : JSON.stringify(data.announce));
                    renderProfile();
                    renderAll();
                    renderGallery();
                    renderComments();
        renderTieba();
        renderGroups();
                    renderContacts();
                    loadMusic();
                    renderTieba();
                    renderGroups();
                    alert('✅ 数据导入成功！所有内容已恢复。');
                    importFileInput.value = '';
                } catch (err) { alert('❌ 导入失败：' + err.message);
                    importFileInput.value = ''; }
            };
            reader.readAsText(file);
        });

        // ============================================================
        // 10. 菜单控制
        // ============================================================
        const menuToggle = document.getElementById('menuToggle');
        const menuPanel = document.getElementById('menuPanel');
        const menuOverlay = document.getElementById('menuOverlay');
        const menuCloseBtn = document.getElementById('menuCloseBtn');

        function openMenu() { menuPanel.classList.add('open');
            menuOverlay.classList.add('open');
            menuToggle.classList.add('open');
            document.body.style.overflow = 'hidden'; }

        function closeMenu() { menuPanel.classList.remove('open');
            menuOverlay.classList.remove('open');
            menuToggle.classList.remove('open');
            document.body.style.overflow = ''; }

        function toggleMenu() { if (menuPanel.classList.contains('open')) closeMenu();
            else openMenu(); }

        menuToggle.addEventListener('click', toggleMenu);
        menuOverlay.addEventListener('click', closeMenu);
        menuCloseBtn.addEventListener('click', closeMenu);
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { closeMenu();
                closeSidebar(); } });

        // ============================================================
        // 11. 移动端侧边栏
        // ============================================================
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarWrapper = document.getElementById('sidebarWrapper');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        let isSidebarOpen = false;

        function openSidebar() { sidebarWrapper.classList.add('open');
            sidebarOverlay.classList.add('open');
            isSidebarOpen = true;
            document.body.style.overflow = 'hidden'; }

        function closeSidebar() { sidebarWrapper.classList.remove('open');
            sidebarOverlay.classList.remove('open');
            isSidebarOpen = false;
            document.body.style.overflow = ''; }

        function toggleSidebar() { if (isSidebarOpen) { closeSidebar(); } else { openSidebar(); } }

        sidebarToggle.addEventListener('click', function(e) { e.stopPropagation();
            toggleSidebar(); });
        sidebarOverlay.addEventListener('click', closeSidebar);
        sidebarWrapper.addEventListener('click', function(e) { e.stopPropagation(); });
        window.addEventListener('resize', function() { if (window.innerWidth > 860 && isSidebarOpen) { closeSidebar(); } });

        // ============================================================
        // 12. 顶部导航切换
        // ============================================================
        const blogContent = document.getElementById('blog-content');
        const gallery = document.getElementById('gallery');
        const personal = document.getElementById('personal');
        const about = document.getElementById('about');
        const navLinks = document.querySelectorAll('.toplinks a');
        const iconSearch = document.getElementById('icon-search');
        const iconGrid = document.getElementById('icon-grid');

        function showTab(tabId, fromIcon = false) {
            blogContent.classList.remove('active');
            gallery.classList.remove('active');
            personal.classList.remove('active');
            about.classList.remove('active');
            document.getElementById('links')?.classList.remove('active');
            if (tabId === 'blog') blogContent.classList.add('active');
            else if (tabId === 'gallery') gallery.classList.add('active');
            else if (tabId === 'personal') personal.classList.add('active');
            else if (tabId === 'about') about.classList.add('active');
            else if (tabId === 'links') document.getElementById('links')?.classList.add('active');
            navLinks.forEach(link => { link.classList.toggle('active', link.dataset.tab === tabId); });
            iconSearch.classList.toggle('active-icon', tabId === 'blog');
            iconGrid.classList.toggle('active-icon', tabId === 'gallery');
            if (tabId === 'gallery') renderGallery();
            if (tabId === 'personal') { renderComments(); renderTieba(); renderGroups(); renderChatList(); renderActiveChat(); }
            if (tabId === 'about') renderContacts();
            if (tabId === 'links') renderFriendLinks();
            if (fromIcon) {
                if (tabId === 'blog') { iconSearch.classList.remove('pulse');
                    void iconSearch.offsetWidth;
                    iconSearch.classList.add('pulse');
                    setTimeout(() => iconSearch.classList.remove('pulse'), 700); } else if (tabId === 'gallery') {
                    iconGrid.classList.remove('spin');
                    void iconGrid.offsetWidth;
                    iconGrid.classList.add('spin');
                    setTimeout(() => iconGrid.classList.remove('spin'), 700); }
            }
            if (window.innerWidth <= 860 && isSidebarOpen) { closeSidebar(); }
        }

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) { e.preventDefault();
                const tab = this.dataset.tab; if (tab) showTab(tab, false); });
        });
        iconSearch.addEventListener('click', function(e) {
            e.stopPropagation();
            showTab('blog', true);
            toggleSearchBar(true);
        });
        iconGrid.addEventListener('click', function(e) { e.stopPropagation();
            showTab('gallery', true); });

        // ============================================================
        // 12.5 搜索
        // ============================================================
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        const searchHint = document.getElementById('searchHint');

        function updateSearchHint() {
            if (!searchHint) return;
            const k = currentSearch.trim();
            if (!k) {
                searchHint.textContent = '';
                return;
            }
            const posts = getPosts();
            const count = filterPosts(posts, currentCategory, k).length;
            searchHint.textContent = count > 0
                ? `找到 ${count} 篇相关内容`
                : '未找到匹配内容，试试其他关键词';
        }

        function applySearch(keyword) {
            currentSearch = keyword || '';
            if (searchClear) {
                searchClear.style.display = currentSearch.trim() ? 'inline-flex' : 'none';
            }
            const posts = getPosts();
            renderGrid(posts, currentCategory, currentSearch);
            updateSearchHint();
        }

        function toggleSearchBar(forceOpen) {
            if (!searchBar) return;
            const open = forceOpen === true ? true
                : forceOpen === false ? false
                : !searchBar.classList.contains('open');
            if (open) {
                searchBar.classList.add('open');
                setTimeout(() => searchInput && searchInput.focus(), 50);
            } else {
                searchBar.classList.remove('open');
            }
        }

        function clearSearch() {
            currentSearch = '';
            if (searchInput) searchInput.value = '';
            if (searchClear) searchClear.style.display = 'none';
            applySearch('');
            if (searchInput) searchInput.focus();
        }

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                applySearch(this.value);
            });
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (this.value) {
                        clearSearch();
                    } else {
                        toggleSearchBar(false);
                        this.blur();
                    }
                }
            });
        }
        if (searchClear) {
            searchClear.addEventListener('click', function(e) {
                e.stopPropagation();
                clearSearch();
            });
        }

        // Esc 关闭搜索栏（无输入时）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchBar && searchBar.classList.contains('open') && !currentSearch.trim()) {
                toggleSearchBar(false);
            }
        });

        // ============================================================
        // 13. 主题切换
        // ============================================================
        const THEMES = {
            light: { name: '☀️ 白天' },
            dark: { name: '🌙 黑夜' },
            warm: { name: '🌅 暖阳' },
            forest: { name: '🌲 森林' },
            ocean: { name: '🌊 海洋' },
            sakura: { name: '🌸 樱花' },
            violet: { name: '💜 紫罗兰' }
        };

        function applyTheme(themeKey) {
            const root = document.documentElement;
            // 简化版主题应用 —— 使用 CSS 变量覆盖
            const themes = {
                light: { '--bg': '#f4f5f7', '--panel': '#ffffff', '--ink': '#17181c', '--ink-soft': '#5c5f68',
                    '--ink-faint': '#9a9da5', '--line': '#eaebee', '--teal': '#17b6a6', '--teal-hover': '#0f9e8f',
                    '--topbar-bg': 'rgba(244,245,247,0.86)', '--modal-overlay': 'rgba(0,0,0,0.4)',
                    '--pill-active': '#131316', '--pill-hover': '#e8e8ea', '--input-bg': '#f4f5f7',
                    '--input-focus': '#ffffff', '--btn-cancel-bg': '#f4f5f7', '--btn-cancel-hover': '#eaebee',
                    '--rail-bg': '#ffffff', '--rail-border': '#eaebee', '--rail-hover-bg': '#131316',
                    '--footer-border': '#eaebee', '--menu-item-hover': '#f4f5f7',
                    '--menu-item-active-bg': 'rgba(23,182,166,0.1)', '--menu-item-count-bg': '#f4f5f7',
                    '--menu-item-count-active': 'rgba(23,182,166,0.15)', '--sidebar-overlay': 'rgba(0,0,0,0.4)',
                    '--music-upload-border': '#eaebee', '--music-upload-hover-bg': 'rgba(23,182,166,0.04)',
                    '--mode-btn-bg': '#f4f5f7', '--mode-btn-border': '#eaebee', '--mode-btn-active-bg': '#17b6a6',
                    '--mode-btn-active-color': '#ffffff', '--mode-btn-hover-border': '#17b6a6',
                    '--data-btn-bg': '#f4f5f7', '--data-btn-border': '#eaebee',
                    '--data-btn-hover-border': '#17b6a6', '--data-btn-hover-color': '#17b6a6',
                    '--data-btn-export-bg': '#17b6a6', '--data-btn-export-hover': '#0f9e8f',
                    '--data-btn-import-bg': '#e8863a', '--data-btn-import-hover': '#d4782e',
                    '--data-hint-color': '#9a9da5', '--data-hint-strong': '#5c5f68',
                    '--theme-btn-border': '#eaebee', '--theme-btn-active-border': '#17b6a6',
                    '--theme-name-color': '#5c5f68', '--theme-name-active': '#17181c',
                    '--post-hover-shadow': 'rgba(0,0,0,0.06)', '--modal-shadow': 'rgba(0,0,0,0.2)',
                    '--modal-bg': '#ffffff', '--scrollbar-thumb': '#eaebee', '--avatar-bg': 'linear-gradient(145deg, #2a2b31, #0d0d10)',
                    '--profile-gradient': 'linear-gradient(160deg, #131316, #0a0a0c 85%)',
                    '--profile-accent': 'rgba(23,182,166,0.35)', '--greet-bg': 'rgba(255,255,255,0.08)',
                    '--greet-color': '#c9cbd3', '--social-bg': 'rgba(255,255,255,0.08)',
                    '--social-hover': 'rgba(255,255,255,0.18)', '--social-icon-color': '#c9cbd3',
                    '--avatar-border-color': 'rgba(255,255,255,0.15)', '--avatar-hint-bg': 'rgba(0,0,0,0.6)',
                    '--avatar-badge-bg': '#17b6a6', '--avatar-badge-border': '#131316',
                    '--avatar-default': '#9a9da5', '--pname-focus-shadow': '#17b6a6',
                    '--pname-hover-bg': 'rgba(255,255,255,0.06)', '--pname-focus-bg': 'rgba(255,255,255,0.1)',
                    '--pname-placeholder': '#8b8e97', '--pbio-color': '#9a9da5', '--pstats-color': '#8b8e97',
                    '--postmini-border': '#eaebee', '--postmini-thumb-bg': 'linear-gradient(150deg, #17b6a6, #0d8a7f)',
                    '--postmini-thumb-b': 'linear-gradient(150deg, #2d2e33, #131316)',
                    '--postmini-text': '#17181c', '--music-status-color': '#9a9da5',
                    '--music-time-color': '#9a9da5', '--music-progress-bg': '#f4f5f7',
                    '--music-progress-fill': '#17b6a6', '--music-volume-track': '#e0e0e0',
                    '--music-volume-thumb': '#17b6a6', '--ai-status-color': '#9a9da5', '--ai-chat-bg': '#f0f0f2',
                    '--ai-msg-bot': '#ffffff', '--ai-msg-user': '#17b6a6', '--ai-msg-system': '#e8863a',
                    '--ai-input-bg': '#ffffff', '--ai-input-border': '#eaebee',
                    '--ai-input-focus-border': '#17b6a6', '--ai-send-btn-bg': '#17b6a6',
                    '--ai-send-btn-hover': '#0f9e8f', '--theme-current-color': '#5c5f68',
                    '--theme-current-bg': '#f4f5f7', '--theme-btn-bg': '#f4f5f7', '--theme-btn-hover': '#e8e8ea',
                    '--theme-btn-active-shadow': '0 0 0 2px #17b6a6', '--theme-btn-text': '#5c5f68',
                    '--theme-btn-active-text': '#17181c', '--pill-active-text': '#ffffff',
                    '--rail-hover-color': '#ffffff', '--delete-hover-bg': '#fee2e2',
                    '--delete-hover-color': '#dc2626', '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #2b2b30, #131316 60%)',
                    '--fcard-dark2': 'linear-gradient(155deg, #232326, #0f0f11)', '--fcard-tag': 'rgba(255,255,255,0.1)',
                    '--theme-btn-active-bg': 'rgba(23,182,166,0.08)', '--input-border': '#eaebee',
                    '--input-focus-border': '#17b6a6', '--menu-item-active-color': '#17b6a6',
                    '--avatar-badge-color': '#ffffff', '--scrollbar-track': 'transparent',
                    '--editor-toolbar-bg': '#f4f5f7', '--editor-toolbar-border': '#eaebee',
                    '--editor-toolbar-btn-hover': '#e8e8ea', '--editor-content-bg': '#ffffff',
                    '--editor-content-border': '#eaebee', '--type-btn-active-bg': '#17b6a6',
                    '--type-btn-active-color': '#ffffff', '--type-btn-border': '#eaebee',
                    '--type-btn-bg': '#f4f5f7', '--type-btn-hover-border': '#17b6a6' }
            };
            const darkTheme = {
                '--bg': '#1a1a1e',
                '--panel': '#2a2a30',
                '--ink': '#ececf0',
                '--ink-soft': '#a8abb2',
                '--ink-faint': '#6a6d75',
                '--line': '#3a3a40',
                '--teal': '#2bc0b0',
                '--teal-hover': '#1fa89a',
                '--topbar-bg': 'rgba(26,26,30,0.86)',
                '--modal-overlay': 'rgba(0,0,0,0.7)',
                '--pill-active': '#3a3a40',
                '--pill-hover': '#3a3a40',
                '--input-bg': '#1a1a1e',
                '--input-focus': '#2a2a30',
                '--btn-cancel-bg': '#3a3a40',
                '--btn-cancel-hover': '#4a4a50',
                '--rail-bg': '#2a2a30',
                '--rail-border': '#3a3a40',
                '--rail-hover-bg': '#4a4a50',
                '--footer-border': '#3a3a40',
                '--menu-item-hover': '#3a3a40',
                '--menu-item-active-bg': 'rgba(43,192,176,0.15)',
                '--menu-item-count-bg': '#3a3a40',
                '--menu-item-count-active': 'rgba(43,192,176,0.2)',
                '--sidebar-overlay': 'rgba(0,0,0,0.7)',
                '--music-upload-border': '#3a3a40',
                '--music-upload-hover-bg': 'rgba(43,192,176,0.08)',
                '--mode-btn-bg': '#3a3a40',
                '--mode-btn-border': '#4a4a50',
                '--data-btn-bg': '#3a3a40',
                '--data-btn-border': '#4a4a50',
                '--data-btn-hover-border': '#2bc0b0',
                '--data-btn-hover-color': '#2bc0b0',
                '--theme-btn-border': '#3a3a40',
                '--theme-btn-active-border': '#2bc0b0',
                '--theme-name-color': '#a8abb2',
                '--theme-name-active': '#ececf0',
                '--post-hover-shadow': 'rgba(0,0,0,0.3)',
                '--modal-shadow': 'rgba(0,0,0,0.5)',
                '--modal-bg': '#2a2a30',
                '--scrollbar-thumb': '#3a3a40',
                '--avatar-bg': 'linear-gradient(145deg, #3a3a40, #1a1a1e)',
                '--profile-gradient': 'linear-gradient(160deg, #0a0a0c, #000000 85%)',
                '--profile-accent': 'rgba(43,192,176,0.3)',
                '--greet-bg': 'rgba(255,255,255,0.06)',
                '--greet-color': '#8a8d95',
                '--social-bg': 'rgba(255,255,255,0.06)',
                '--social-hover': 'rgba(255,255,255,0.12)',
                '--social-icon-color': '#8a8d95',
                '--avatar-border-color': 'rgba(255,255,255,0.08)',
                '--avatar-hint-bg': 'rgba(0,0,0,0.7)',
                '--avatar-badge-bg': '#2bc0b0',
                '--avatar-badge-border': '#1a1a1e',
                '--avatar-default': '#6a6d75',
                '--pname-focus-shadow': '#2bc0b0',
                '--pname-hover-bg': 'rgba(255,255,255,0.04)',
                '--pname-focus-bg': 'rgba(255,255,255,0.06)',
                '--pname-placeholder': '#6a6d75',
                '--pbio-color': '#6a6d75',
                '--pstats-color': '#6a6d75',
                '--postmini-border': '#3a3a40',
                '--postmini-thumb-bg': 'linear-gradient(150deg, #2bc0b0, #1a8a7a)',
                '--postmini-thumb-b': 'linear-gradient(150deg, #4a4a50, #2a2a30)',
                '--postmini-text': '#ececf0',
                '--music-status-color': '#6a6d75',
                '--music-time-color': '#6a6d75',
                '--music-progress-bg': '#3a3a40',
                '--music-progress-fill': '#2bc0b0',
                '--music-volume-track': '#3a3a40',
                '--music-volume-thumb': '#2bc0b0',
                '--ai-status-color': '#6a6d75',
                '--ai-chat-bg': '#1a1a1e',
                '--ai-msg-bot': '#2a2a30',
                '--ai-msg-user': '#2bc0b0',
                '--ai-msg-system': '#c07a3a',
                '--ai-input-bg': '#2a2a30',
                '--ai-input-border': '#3a3a40',
                '--ai-input-focus-border': '#2bc0b0',
                '--ai-send-btn-bg': '#2bc0b0',
                '--ai-send-btn-hover': '#1fa89a',
                '--theme-current-color': '#a8abb2',
                '--theme-current-bg': '#3a3a40',
                '--theme-btn-bg': '#3a3a40',
                '--theme-btn-hover': '#4a4a50',
                '--theme-btn-active-shadow': '0 0 0 2px #2bc0b0',
                '--theme-btn-text': '#a8abb2',
                '--theme-btn-active-text': '#ececf0',
                '--pill-active-text': '#ececf0',
                '--rail-hover-color': '#ececf0',
                '--data-btn-export-bg': '#2bc0b0',
                '--data-btn-export-hover': '#1fa89a',
                '--data-btn-import-bg': '#c07a3a',
                '--data-btn-import-hover': '#a86a2a',
                '--mode-btn-active-bg': '#2bc0b0',
                '--mode-btn-active-color': '#ececf0',
                '--mode-btn-hover-border': '#2bc0b0',
                '--delete-hover-bg': 'rgba(220,38,38,0.2)',
                '--delete-hover-color': '#ef4444',
                '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #3a3a40, #1a1a1e 60%)',
                '--fcard-dark2': 'linear-gradient(155deg, #3a3a40, #1a1a1e)',
                '--fcard-tag': 'rgba(255,255,255,0.06)',
                '--theme-btn-active-bg': 'rgba(43,192,176,0.12)',
                '--input-border': '#3a3a40',
                '--input-focus-border': '#2bc0b0',
                '--menu-item-active-color': '#2bc0b0',
                '--avatar-badge-color': '#ececf0',
                '--scrollbar-track': 'transparent',
                '--editor-toolbar-bg': '#2a2a30',
                '--editor-toolbar-border': '#3a3a40',
                '--editor-toolbar-btn-hover': '#3a3a40',
                '--editor-content-bg': '#2a2a30',
                '--editor-content-border': '#3a3a40',
                '--type-btn-active-bg': '#2bc0b0',
                '--type-btn-active-color': '#ececf0',
                '--type-btn-border': '#3a3a40',
                '--type-btn-bg': '#1a1a1e',
                '--type-btn-hover-border': '#2bc0b0'
            };
            // 其他主题复用 dark 的部分结构，主要调整背景色系
            const warmTheme = { ...darkTheme,
                '--bg': '#fdf6ee',
                '--panel': '#ffffff',
                '--ink': '#3d2c1a',
                '--ink-soft': '#8a7a6a',
                '--ink-faint': '#b8a898',
                '--line': '#f0e6d8',
                '--teal': '#d4893a',
                '--teal-hover': '#b8702a',
                '--topbar-bg': 'rgba(253,246,238,0.86)',
                '--modal-overlay': 'rgba(60,40,20,0.4)',
                '--pill-active': '#3d2c1a',
                '--pill-hover': '#f0e6d8',
                '--input-bg': '#fdf6ee',
                '--input-focus': '#ffffff',
                '--btn-cancel-bg': '#f0e6d8',
                '--btn-cancel-hover': '#e8dcc8',
                '--rail-bg': '#ffffff',
                '--rail-border': '#f0e6d8',
                '--rail-hover-bg': '#3d2c1a',
                '--footer-border': '#f0e6d8',
                '--menu-item-hover': '#fdf6ee',
                '--menu-item-active-bg': 'rgba(212,137,58,0.12)',
                '--menu-item-count-bg': '#f0e6d8',
                '--menu-item-count-active': 'rgba(212,137,58,0.2)',
                '--sidebar-overlay': 'rgba(60,40,20,0.4)',
                '--music-upload-border': '#f0e6d8',
                '--music-upload-hover-bg': 'rgba(212,137,58,0.06)',
                '--mode-btn-bg': '#f0e6d8',
                '--mode-btn-border': '#f0e6d8',
                '--data-btn-bg': '#f0e6d8',
                '--data-btn-border': '#f0e6d8',
                '--data-btn-hover-border': '#d4893a',
                '--data-btn-hover-color': '#d4893a',
                '--theme-btn-border': '#f0e6d8',
                '--theme-btn-active-border': '#d4893a',
                '--theme-name-color': '#8a7a6a',
                '--theme-name-active': '#3d2c1a',
                '--post-hover-shadow': 'rgba(180,140,100,0.08)',
                '--modal-shadow': 'rgba(60,40,20,0.2)',
                '--modal-bg': '#ffffff',
                '--scrollbar-thumb': '#f0e6d8',
                '--avatar-bg': 'linear-gradient(145deg, #f0e6d8, #d8c8b8)',
                '--profile-gradient': 'linear-gradient(160deg, #2a2018, #1a100a 85%)',
                '--profile-accent': 'rgba(212,137,58,0.3)',
                '--greet-bg': 'rgba(255,255,255,0.08)',
                '--greet-color': '#c9cbd3',
                '--social-bg': 'rgba(255,255,255,0.08)',
                '--social-hover': 'rgba(255,255,255,0.18)',
                '--social-icon-color': '#c9cbd3',
                '--avatar-border-color': 'rgba(255,255,255,0.15)',
                '--avatar-hint-bg': 'rgba(60,40,20,0.6)',
                '--avatar-badge-bg': '#d4893a',
                '--avatar-badge-border': '#2a2018',
                '--avatar-default': '#9a9da5',
                '--pname-focus-shadow': '#d4893a',
                '--pname-hover-bg': 'rgba(255,255,255,0.06)',
                '--pname-focus-bg': 'rgba(255,255,255,0.1)',
                '--pname-placeholder': '#8a7a6a',
                '--pbio-color': '#8a7a6a',
                '--pstats-color': '#8a7a6a',
                '--postmini-border': '#f0e6d8',
                '--postmini-thumb-bg': 'linear-gradient(150deg, #d4893a, #b8702a)',
                '--postmini-thumb-b': 'linear-gradient(150deg, #3d2c1a, #2a2018)',
                '--postmini-text': '#3d2c1a',
                '--music-status-color': '#b8a898',
                '--music-time-color': '#b8a898',
                '--music-progress-bg': '#f0e6d8',
                '--music-progress-fill': '#d4893a',
                '--music-volume-track': '#f0e6d8',
                '--music-volume-thumb': '#d4893a',
                '--ai-status-color': '#b8a898',
                '--ai-chat-bg': '#faf2e8',
                '--ai-msg-bot': '#ffffff',
                '--ai-msg-user': '#d4893a',
                '--ai-msg-system': '#e8863a',
                '--ai-input-bg': '#ffffff',
                '--ai-input-border': '#f0e6d8',
                '--ai-input-focus-border': '#d4893a',
                '--ai-send-btn-bg': '#d4893a',
                '--ai-send-btn-hover': '#b8702a',
                '--theme-current-color': '#8a7a6a',
                '--theme-current-bg': '#f0e6d8',
                '--theme-btn-bg': '#f0e6d8',
                '--theme-btn-hover': '#e8dcc8',
                '--theme-btn-active-shadow': '0 0 0 2px #d4893a',
                '--theme-btn-text': '#8a7a6a',
                '--theme-btn-active-text': '#3d2c1a',
                '--pill-active-text': '#ffffff',
                '--rail-hover-color': '#ffffff',
                '--data-btn-export-bg': '#d4893a',
                '--data-btn-export-hover': '#b8702a',
                '--data-btn-import-bg': '#e8863a',
                '--data-btn-import-hover': '#d4782e',
                '--mode-btn-active-bg': '#d4893a',
                '--mode-btn-active-color': '#ffffff',
                '--mode-btn-hover-border': '#d4893a',
                '--delete-hover-bg': '#fee2e2',
                '--delete-hover-color': '#dc2626',
                '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #3d2c1a, #2a2018 60%)',
                '--fcard-dark2': 'linear-gradient(155deg, #3d2c1a, #2a2018)',
                '--fcard-tag': 'rgba(255,255,255,0.08)',
                '--theme-btn-active-bg': 'rgba(212,137,58,0.1)',
                '--input-border': '#f0e6d8',
                '--input-focus-border': '#d4893a',
                '--menu-item-active-color': '#d4893a',
                '--avatar-badge-color': '#ffffff',
                '--scrollbar-track': 'transparent',
                '--editor-toolbar-bg': '#f0e6d8',
                '--editor-toolbar-border': '#f0e6d8',
                '--editor-toolbar-btn-hover': '#e8dcc8',
                '--editor-content-bg': '#ffffff',
                '--editor-content-border': '#f0e6d8',
                '--type-btn-active-bg': '#d4893a',
                '--type-btn-active-color': '#ffffff',
                '--type-btn-border': '#f0e6d8',
                '--type-btn-bg': '#fdf6ee',
                '--type-btn-hover-border': '#d4893a'
            };
            // 简化为直接应用 light 或 dark 变体，其他主题基于 dark 调整部分颜色
            let targetVars;
            if (themeKey === 'light') targetVars = themes.light;
            else if (themeKey === 'dark') targetVars = darkTheme;
            else if (themeKey === 'warm') targetVars = warmTheme;
            else if (themeKey === 'forest') {
                targetVars = { ...darkTheme };
                const f = {
                    '--bg': '#eef5ee',
                    '--panel': '#ffffff',
                    '--ink': '#1a3a1a',
                    '--ink-soft': '#5a7a5a',
                    '--ink-faint': '#8aaa8a',
                    '--line': '#d8e8d8',
                    '--teal': '#3a9a5a',
                    '--teal-hover': '#2a8a4a',
                    '--topbar-bg': 'rgba(238,245,238,0.86)',
                    '--modal-overlay': 'rgba(20,50,20,0.4)',
                    '--pill-active': '#1a3a1a',
                    '--pill-hover': '#d8e8d8',
                    '--input-bg': '#eef5ee',
                    '--input-focus': '#ffffff',
                    '--btn-cancel-bg': '#d8e8d8',
                    '--btn-cancel-hover': '#c8dcc8',
                    '--rail-bg': '#ffffff',
                    '--rail-border': '#d8e8d8',
                    '--rail-hover-bg': '#1a3a1a',
                    '--footer-border': '#d8e8d8',
                    '--menu-item-hover': '#eef5ee',
                    '--menu-item-active-bg': 'rgba(58,154,90,0.12)',
                    '--menu-item-count-bg': '#d8e8d8',
                    '--menu-item-count-active': 'rgba(58,154,90,0.2)',
                    '--sidebar-overlay': 'rgba(20,50,20,0.4)',
                    '--music-upload-border': '#d8e8d8',
                    '--music-upload-hover-bg': 'rgba(58,154,90,0.06)',
                    '--mode-btn-bg': '#d8e8d8',
                    '--mode-btn-border': '#d8e8d8',
                    '--data-btn-bg': '#d8e8d8',
                    '--data-btn-border': '#d8e8d8',
                    '--data-btn-hover-border': '#3a9a5a',
                    '--data-btn-hover-color': '#3a9a5a',
                    '--theme-btn-border': '#d8e8d8',
                    '--theme-btn-active-border': '#3a9a5a',
                    '--theme-name-color': '#5a7a5a',
                    '--theme-name-active': '#1a3a1a',
                    '--post-hover-shadow': 'rgba(60,120,60,0.06)',
                    '--modal-shadow': 'rgba(20,50,20,0.2)',
                    '--modal-bg': '#ffffff',
                    '--scrollbar-thumb': '#d8e8d8',
                    '--avatar-bg': 'linear-gradient(145deg, #2a4a2a, #1a3a1a)',
                    '--profile-gradient': 'linear-gradient(160deg, #1a3a1a, #0a1a0a 85%)',
                    '--profile-accent': 'rgba(58,154,90,0.35)',
                    '--greet-color': '#c9dcc9',
                    '--avatar-hint-bg': 'rgba(20,50,20,0.6)',
                    '--avatar-badge-bg': '#3a9a5a',
                    '--avatar-badge-border': '#1a3a1a',
                    '--avatar-default': '#8aaa8a',
                    '--pname-focus-shadow': '#3a9a5a',
                    '--pname-placeholder': '#5a7a5a',
                    '--pbio-color': '#5a7a5a',
                    '--pstats-color': '#5a7a5a',
                    '--postmini-border': '#d8e8d8',
                    '--postmini-thumb-bg': 'linear-gradient(150deg, #3a9a5a, #2a8a4a)',
                    '--postmini-thumb-b': 'linear-gradient(150deg, #1a3a1a, #2a4a2a)',
                    '--postmini-text': '#1a3a1a',
                    '--music-status-color': '#8aaa8a',
                    '--music-time-color': '#8aaa8a',
                    '--music-progress-bg': '#d8e8d8',
                    '--music-progress-fill': '#3a9a5a',
                    '--music-volume-track': '#d8e8d8',
                    '--music-volume-thumb': '#3a9a5a',
                    '--ai-status-color': '#8aaa8a',
                    '--ai-chat-bg': '#e8f0e8',
                    '--ai-msg-bot': '#ffffff',
                    '--ai-msg-user': '#3a9a5a',
                    '--ai-msg-system': '#e8863a',
                    '--ai-input-bg': '#ffffff',
                    '--ai-input-border': '#d8e8d8',
                    '--ai-input-focus-border': '#3a9a5a',
                    '--ai-send-btn-bg': '#3a9a5a',
                    '--ai-send-btn-hover': '#2a8a4a',
                    '--theme-current-color': '#5a7a5a',
                    '--theme-current-bg': '#d8e8d8',
                    '--theme-btn-bg': '#d8e8d8',
                    '--theme-btn-hover': '#c8dcc8',
                    '--theme-btn-active-shadow': '0 0 0 2px #3a9a5a',
                    '--theme-btn-text': '#5a7a5a',
                    '--theme-btn-active-text': '#1a3a1a',
                    '--pill-active-text': '#ffffff',
                    '--rail-hover-color': '#ffffff',
                    '--data-btn-export-bg': '#3a9a5a',
                    '--data-btn-export-hover': '#2a8a4a',
                    '--data-btn-import-bg': '#e8863a',
                    '--data-btn-import-hover': '#d4782e',
                    '--mode-btn-active-bg': '#3a9a5a',
                    '--mode-btn-active-color': '#ffffff',
                    '--mode-btn-hover-border': '#3a9a5a',
                    '--delete-hover-bg': '#fee2e2',
                    '--delete-hover-color': '#dc2626',
                    '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #1a3a1a, #0a2a0a 60%)',
                    '--fcard-dark2': 'linear-gradient(155deg, #1a3a1a, #0a2a0a)',
                    '--fcard-tag': 'rgba(255,255,255,0.08)',
                    '--theme-btn-active-bg': 'rgba(58,154,90,0.1)',
                    '--input-border': '#d8e8d8',
                    '--input-focus-border': '#3a9a5a',
                    '--menu-item-active-color': '#3a9a5a',
                    '--avatar-badge-color': '#ffffff',
                    '--scrollbar-track': 'transparent',
                    '--editor-toolbar-bg': '#d8e8d8',
                    '--editor-toolbar-border': '#d8e8d8',
                    '--editor-toolbar-btn-hover': '#c8dcc8',
                    '--editor-content-bg': '#ffffff',
                    '--editor-content-border': '#d8e8d8',
                    '--type-btn-active-bg': '#3a9a5a',
                    '--type-btn-active-color': '#ffffff',
                    '--type-btn-border': '#d8e8d8',
                    '--type-btn-bg': '#eef5ee',
                    '--type-btn-hover-border': '#3a9a5a'
                };
                Object.assign(targetVars, f);
            } else if (themeKey === 'ocean') {
                targetVars = { ...darkTheme };
                const o = {
                    '--bg': '#eef4f8',
                    '--panel': '#ffffff',
                    '--ink': '#1a2a4a',
                    '--ink-soft': '#5a7a9a',
                    '--ink-faint': '#8aaaba',
                    '--line': '#d8e4ec',
                    '--teal': '#2a8aaa',
                    '--teal-hover': '#1a7a9a',
                    '--topbar-bg': 'rgba(238,244,248,0.86)',
                    '--modal-overlay': 'rgba(20,40,70,0.4)',
                    '--pill-active': '#1a2a4a',
                    '--pill-hover': '#d8e4ec',
                    '--input-bg': '#eef4f8',
                    '--input-focus': '#ffffff',
                    '--btn-cancel-bg': '#d8e4ec',
                    '--btn-cancel-hover': '#c8d8e4',
                    '--rail-bg': '#ffffff',
                    '--rail-border': '#d8e4ec',
                    '--rail-hover-bg': '#1a2a4a',
                    '--footer-border': '#d8e4ec',
                    '--menu-item-hover': '#eef4f8',
                    '--menu-item-active-bg': 'rgba(42,138,170,0.12)',
                    '--menu-item-count-bg': '#d8e4ec',
                    '--menu-item-count-active': 'rgba(42,138,170,0.2)',
                    '--sidebar-overlay': 'rgba(20,40,70,0.4)',
                    '--music-upload-border': '#d8e4ec',
                    '--music-upload-hover-bg': 'rgba(42,138,170,0.06)',
                    '--mode-btn-bg': '#d8e4ec',
                    '--mode-btn-border': '#d8e4ec',
                    '--data-btn-bg': '#d8e4ec',
                    '--data-btn-border': '#d8e4ec',
                    '--data-btn-hover-border': '#2a8aaa',
                    '--data-btn-hover-color': '#2a8aaa',
                    '--theme-btn-border': '#d8e4ec',
                    '--theme-btn-active-border': '#2a8aaa',
                    '--theme-name-color': '#5a7a9a',
                    '--theme-name-active': '#1a2a4a',
                    '--post-hover-shadow': 'rgba(40,80,120,0.06)',
                    '--modal-shadow': 'rgba(20,40,70,0.2)',
                    '--modal-bg': '#ffffff',
                    '--scrollbar-thumb': '#d8e4ec',
                    '--avatar-bg': 'linear-gradient(145deg, #2a4a6a, #1a2a4a)',
                    '--profile-gradient': 'linear-gradient(160deg, #1a2a4a, #0a1a2a 85%)',
                    '--profile-accent': 'rgba(42,138,170,0.35)',
                    '--greet-color': '#c9dce8',
                    '--avatar-hint-bg': 'rgba(20,40,70,0.6)',
                    '--avatar-badge-bg': '#2a8aaa',
                    '--avatar-badge-border': '#1a2a4a',
                    '--avatar-default': '#8aaaba',
                    '--pname-focus-shadow': '#2a8aaa',
                    '--pname-placeholder': '#5a7a9a',
                    '--pbio-color': '#5a7a9a',
                    '--pstats-color': '#5a7a9a',
                    '--postmini-border': '#d8e4ec',
                    '--postmini-thumb-bg': 'linear-gradient(150deg, #2a8aaa, #1a7a9a)',
                    '--postmini-thumb-b': 'linear-gradient(150deg, #1a2a4a, #2a4a6a)',
                    '--postmini-text': '#1a2a4a',
                    '--music-status-color': '#8aaaba',
                    '--music-time-color': '#8aaaba',
                    '--music-progress-bg': '#d8e4ec',
                    '--music-progress-fill': '#2a8aaa',
                    '--music-volume-track': '#d8e4ec',
                    '--music-volume-thumb': '#2a8aaa',
                    '--ai-status-color': '#8aaaba',
                    '--ai-chat-bg': '#e8f0f4',
                    '--ai-msg-bot': '#ffffff',
                    '--ai-msg-user': '#2a8aaa',
                    '--ai-msg-system': '#e8863a',
                    '--ai-input-bg': '#ffffff',
                    '--ai-input-border': '#d8e4ec',
                    '--ai-input-focus-border': '#2a8aaa',
                    '--ai-send-btn-bg': '#2a8aaa',
                    '--ai-send-btn-hover': '#1a7a9a',
                    '--theme-current-color': '#5a7a9a',
                    '--theme-current-bg': '#d8e4ec',
                    '--theme-btn-bg': '#d8e4ec',
                    '--theme-btn-hover': '#c8d8e4',
                    '--theme-btn-active-shadow': '0 0 0 2px #2a8aaa',
                    '--theme-btn-text': '#5a7a9a',
                    '--theme-btn-active-text': '#1a2a4a',
                    '--pill-active-text': '#ffffff',
                    '--rail-hover-color': '#ffffff',
                    '--data-btn-export-bg': '#2a8aaa',
                    '--data-btn-export-hover': '#1a7a9a',
                    '--data-btn-import-bg': '#e8863a',
                    '--data-btn-import-hover': '#d4782e',
                    '--mode-btn-active-bg': '#2a8aaa',
                    '--mode-btn-active-color': '#ffffff',
                    '--mode-btn-hover-border': '#2a8aaa',
                    '--delete-hover-bg': '#fee2e2',
                    '--delete-hover-color': '#dc2626',
                    '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #1a2a4a, #0a1a3a 60%)',
                    '--fcard-dark2': 'linear-gradient(155deg, #1a2a4a, #0a1a3a)',
                    '--fcard-tag': 'rgba(255,255,255,0.08)',
                    '--theme-btn-active-bg': 'rgba(42,138,170,0.1)',
                    '--input-border': '#d8e4ec',
                    '--input-focus-border': '#2a8aaa',
                    '--menu-item-active-color': '#2a8aaa',
                    '--avatar-badge-color': '#ffffff',
                    '--scrollbar-track': 'transparent',
                    '--editor-toolbar-bg': '#d8e4ec',
                    '--editor-toolbar-border': '#d8e4ec',
                    '--editor-toolbar-btn-hover': '#c8d8e4',
                    '--editor-content-bg': '#ffffff',
                    '--editor-content-border': '#d8e4ec',
                    '--type-btn-active-bg': '#2a8aaa',
                    '--type-btn-active-color': '#ffffff',
                    '--type-btn-border': '#d8e4ec',
                    '--type-btn-bg': '#eef4f8',
                    '--type-btn-hover-border': '#2a8aaa'
                };
                Object.assign(targetVars, o);
            } else if (themeKey === 'sakura') {
                targetVars = { ...darkTheme };
                const s = {
                    '--bg': '#fdf0f0',
                    '--panel': '#ffffff',
                    '--ink': '#4a2a2a',
                    '--ink-soft': '#9a6a6a',
                    '--ink-faint': '#ca9a9a',
                    '--line': '#f0d8d8',
                    '--teal': '#d45a7a',
                    '--teal-hover': '#b84a6a',
                    '--topbar-bg': 'rgba(253,240,240,0.86)',
                    '--modal-overlay': 'rgba(70,30,40,0.4)',
                    '--pill-active': '#4a2a2a',
                    '--pill-hover': '#f0d8d8',
                    '--input-bg': '#fdf0f0',
                    '--input-focus': '#ffffff',
                    '--btn-cancel-bg': '#f0d8d8',
                    '--btn-cancel-hover': '#e8c8c8',
                    '--rail-bg': '#ffffff',
                    '--rail-border': '#f0d8d8',
                    '--rail-hover-bg': '#4a2a2a',
                    '--footer-border': '#f0d8d8',
                    '--menu-item-hover': '#fdf0f0',
                    '--menu-item-active-bg': 'rgba(212,90,122,0.12)',
                    '--menu-item-count-bg': '#f0d8d8',
                    '--menu-item-count-active': 'rgba(212,90,122,0.2)',
                    '--sidebar-overlay': 'rgba(70,30,40,0.4)',
                    '--music-upload-border': '#f0d8d8',
                    '--music-upload-hover-bg': 'rgba(212,90,122,0.06)',
                    '--mode-btn-bg': '#f0d8d8',
                    '--mode-btn-border': '#f0d8d8',
                    '--data-btn-bg': '#f0d8d8',
                    '--data-btn-border': '#f0d8d8',
                    '--data-btn-hover-border': '#d45a7a',
                    '--data-btn-hover-color': '#d45a7a',
                    '--theme-btn-border': '#f0d8d8',
                    '--theme-btn-active-border': '#d45a7a',
                    '--theme-name-color': '#9a6a6a',
                    '--theme-name-active': '#4a2a2a',
                    '--post-hover-shadow': 'rgba(180,80,100,0.06)',
                    '--modal-shadow': 'rgba(70,30,40,0.2)',
                    '--modal-bg': '#ffffff',
                    '--scrollbar-thumb': '#f0d8d8',
                    '--avatar-bg': 'linear-gradient(145deg, #6a3a3a, #4a2a2a)',
                    '--profile-gradient': 'linear-gradient(160deg, #3a1a1a, #2a0a0a 85%)',
                    '--profile-accent': 'rgba(212,90,122,0.35)',
                    '--greet-color': '#dcc9c9',
                    '--avatar-hint-bg': 'rgba(70,30,40,0.6)',
                    '--avatar-badge-bg': '#d45a7a',
                    '--avatar-badge-border': '#3a1a1a',
                    '--avatar-default': '#ca9a9a',
                    '--pname-focus-shadow': '#d45a7a',
                    '--pname-placeholder': '#9a6a6a',
                    '--pbio-color': '#9a6a6a',
                    '--pstats-color': '#9a6a6a',
                    '--postmini-border': '#f0d8d8',
                    '--postmini-thumb-bg': 'linear-gradient(150deg, #d45a7a, #b84a6a)',
                    '--postmini-thumb-b': 'linear-gradient(150deg, #4a2a2a, #6a3a3a)',
                    '--postmini-text': '#4a2a2a',
                    '--music-status-color': '#ca9a9a',
                    '--music-time-color': '#ca9a9a',
                    '--music-progress-bg': '#f0d8d8',
                    '--music-progress-fill': '#d45a7a',
                    '--music-volume-track': '#f0d8d8',
                    '--music-volume-thumb': '#d45a7a',
                    '--ai-status-color': '#ca9a9a',
                    '--ai-chat-bg': '#f8ecec',
                    '--ai-msg-bot': '#ffffff',
                    '--ai-msg-user': '#d45a7a',
                    '--ai-msg-system': '#e8863a',
                    '--ai-input-bg': '#ffffff',
                    '--ai-input-border': '#f0d8d8',
                    '--ai-input-focus-border': '#d45a7a',
                    '--ai-send-btn-bg': '#d45a7a',
                    '--ai-send-btn-hover': '#b84a6a',
                    '--theme-current-color': '#9a6a6a',
                    '--theme-current-bg': '#f0d8d8',
                    '--theme-btn-bg': '#f0d8d8',
                    '--theme-btn-hover': '#e8c8c8',
                    '--theme-btn-active-shadow': '0 0 0 2px #d45a7a',
                    '--theme-btn-text': '#9a6a6a',
                    '--theme-btn-active-text': '#4a2a2a',
                    '--pill-active-text': '#ffffff',
                    '--rail-hover-color': '#ffffff',
                    '--data-btn-export-bg': '#d45a7a',
                    '--data-btn-export-hover': '#b84a6a',
                    '--data-btn-import-bg': '#e8863a',
                    '--data-btn-import-hover': '#d4782e',
                    '--mode-btn-active-bg': '#d45a7a',
                    '--mode-btn-active-color': '#ffffff',
                    '--mode-btn-hover-border': '#d45a7a',
                    '--delete-hover-bg': '#fee2e2',
                    '--delete-hover-color': '#dc2626',
                    '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #3a1a1a, #2a0a0a 60%)',
                    '--fcard-dark2': 'linear-gradient(155deg, #3a1a1a, #2a0a0a)',
                    '--fcard-tag': 'rgba(255,255,255,0.08)',
                    '--theme-btn-active-bg': 'rgba(212,90,122,0.1)',
                    '--input-border': '#f0d8d8',
                    '--input-focus-border': '#d45a7a',
                    '--menu-item-active-color': '#d45a7a',
                    '--avatar-badge-color': '#ffffff',
                    '--scrollbar-track': 'transparent',
                    '--editor-toolbar-bg': '#f0d8d8',
                    '--editor-toolbar-border': '#f0d8d8',
                    '--editor-toolbar-btn-hover': '#e8c8c8',
                    '--editor-content-bg': '#ffffff',
                    '--editor-content-border': '#f0d8d8',
                    '--type-btn-active-bg': '#d45a7a',
                    '--type-btn-active-color': '#ffffff',
                    '--type-btn-border': '#f0d8d8',
                    '--type-btn-bg': '#fdf0f0',
                    '--type-btn-hover-border': '#d45a7a'
                };
                Object.assign(targetVars, s);
            } else if (themeKey === 'violet') {
                targetVars = { ...darkTheme };
                const v = {
                    '--bg': '#f4eef8',
                    '--panel': '#ffffff',
                    '--ink': '#2a1a4a',
                    '--ink-soft': '#7a5a9a',
                    '--ink-faint': '#aa8aba',
                    '--line': '#e8d8ec',
                    '--teal': '#7a3aaa',
                    '--teal-hover': '#6a2a9a',
                    '--topbar-bg': 'rgba(244,238,248,0.86)',
                    '--modal-overlay': 'rgba(40,20,70,0.4)',
                    '--pill-active': '#2a1a4a',
                    '--pill-hover': '#e8d8ec',
                    '--input-bg': '#f4eef8',
                    '--input-focus': '#ffffff',
                    '--btn-cancel-bg': '#e8d8ec',
                    '--btn-cancel-hover': '#dcc8e4',
                    '--rail-bg': '#ffffff',
                    '--rail-border': '#e8d8ec',
                    '--rail-hover-bg': '#2a1a4a',
                    '--footer-border': '#e8d8ec',
                    '--menu-item-hover': '#f4eef8',
                    '--menu-item-active-bg': 'rgba(122,58,170,0.12)',
                    '--menu-item-count-bg': '#e8d8ec',
                    '--menu-item-count-active': 'rgba(122,58,170,0.2)',
                    '--sidebar-overlay': 'rgba(40,20,70,0.4)',
                    '--music-upload-border': '#e8d8ec',
                    '--music-upload-hover-bg': 'rgba(122,58,170,0.06)',
                    '--mode-btn-bg': '#e8d8ec',
                    '--mode-btn-border': '#e8d8ec',
                    '--data-btn-bg': '#e8d8ec',
                    '--data-btn-border': '#e8d8ec',
                    '--data-btn-hover-border': '#7a3aaa',
                    '--data-btn-hover-color': '#7a3aaa',
                    '--theme-btn-border': '#e8d8ec',
                    '--theme-btn-active-border': '#7a3aaa',
                    '--theme-name-color': '#7a5a9a',
                    '--theme-name-active': '#2a1a4a',
                    '--post-hover-shadow': 'rgba(100,60,140,0.06)',
                    '--modal-shadow': 'rgba(40,20,70,0.2)',
                    '--modal-bg': '#ffffff',
                    '--scrollbar-thumb': '#e8d8ec',
                    '--avatar-bg': 'linear-gradient(145deg, #4a2a6a, #2a1a4a)',
                    '--profile-gradient': 'linear-gradient(160deg, #2a1a4a, #1a0a2a 85%)',
                    '--profile-accent': 'rgba(122,58,170,0.35)',
                    '--greet-color': '#dcc9e8',
                    '--avatar-hint-bg': 'rgba(40,20,70,0.6)',
                    '--avatar-badge-bg': '#7a3aaa',
                    '--avatar-badge-border': '#2a1a4a',
                    '--avatar-default': '#aa8aba',
                    '--pname-focus-shadow': '#7a3aaa',
                    '--pname-placeholder': '#7a5a9a',
                    '--pbio-color': '#7a5a9a',
                    '--pstats-color': '#7a5a9a',
                    '--postmini-border': '#e8d8ec',
                    '--postmini-thumb-bg': 'linear-gradient(150deg, #7a3aaa, #6a2a9a)',
                    '--postmini-thumb-b': 'linear-gradient(150deg, #2a1a4a, #4a2a6a)',
                    '--postmini-text': '#2a1a4a',
                    '--music-status-color': '#aa8aba',
                    '--music-time-color': '#aa8aba',
                    '--music-progress-bg': '#e8d8ec',
                    '--music-progress-fill': '#7a3aaa',
                    '--music-volume-track': '#e8d8ec',
                    '--music-volume-thumb': '#7a3aaa',
                    '--ai-status-color': '#aa8aba',
                    '--ai-chat-bg': '#f0e8f4',
                    '--ai-msg-bot': '#ffffff',
                    '--ai-msg-user': '#7a3aaa',
                    '--ai-msg-system': '#e8863a',
                    '--ai-input-bg': '#ffffff',
                    '--ai-input-border': '#e8d8ec',
                    '--ai-input-focus-border': '#7a3aaa',
                    '--ai-send-btn-bg': '#7a3aaa',
                    '--ai-send-btn-hover': '#6a2a9a',
                    '--theme-current-color': '#7a5a9a',
                    '--theme-current-bg': '#e8d8ec',
                    '--theme-btn-bg': '#e8d8ec',
                    '--theme-btn-hover': '#dcc8e4',
                    '--theme-btn-active-shadow': '0 0 0 2px #7a3aaa',
                    '--theme-btn-text': '#7a5a9a',
                    '--theme-btn-active-text': '#2a1a4a',
                    '--pill-active-text': '#ffffff',
                    '--rail-hover-color': '#ffffff',
                    '--data-btn-export-bg': '#7a3aaa',
                    '--data-btn-export-hover': '#6a2a9a',
                    '--data-btn-import-bg': '#e8863a',
                    '--data-btn-import-hover': '#d4782e',
                    '--mode-btn-active-bg': '#7a3aaa',
                    '--mode-btn-active-color': '#ffffff',
                    '--mode-btn-hover-border': '#7a3aaa',
                    '--delete-hover-bg': '#fee2e2',
                    '--delete-hover-color': '#dc2626',
                    '--fcard-dark1': 'radial-gradient(circle at 80% 0%, #2a1a4a, #1a0a3a 60%)',
                    '--fcard-dark2': 'linear-gradient(155deg, #2a1a4a, #1a0a3a)',
                    '--fcard-tag': 'rgba(255,255,255,0.08)',
                    '--theme-btn-active-bg': 'rgba(122,58,170,0.1)',
                    '--input-border': '#e8d8ec',
                    '--input-focus-border': '#7a3aaa',
                    '--menu-item-active-color': '#7a3aaa',
                    '--avatar-badge-color': '#ffffff',
                    '--scrollbar-track': 'transparent',
                    '--editor-toolbar-bg': '#e8d8ec',
                    '--editor-toolbar-border': '#e8d8ec',
                    '--editor-toolbar-btn-hover': '#dcc8e4',
                    '--editor-content-bg': '#ffffff',
                    '--editor-content-border': '#e8d8ec',
                    '--type-btn-active-bg': '#7a3aaa',
                    '--type-btn-active-color': '#ffffff',
                    '--type-btn-border': '#e8d8ec',
                    '--type-btn-bg': '#f4eef8',
                    '--type-btn-hover-border': '#7a3aaa'
                };
                Object.assign(targetVars, v);
            } else {
                targetVars = themes.light;
            }

            for (const [key, value] of Object.entries(targetVars)) {
                root.style.setProperty(key, value);
            }

            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === themeKey);
            });

            // 仅应用配色；存储与按钮高亮由 setTheme 负责
            document.querySelectorAll('.theme-btn').forEach(btn => {
                const saved = localStorage.getItem('ZIH_theme') || 'light';
                btn.classList.toggle('active', btn.dataset.theme === saved);
            });
        }

        function resolveThemeKey(key) {
            if (key === 'system') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            return key || 'light';
        }

        function setTheme(key) {
            localStorage.setItem('ZIH_theme', key);
            applyTheme(key === 'system' ? resolveThemeKey('system') : key);
            // 重新标记 active 为用户选择的 key（含 system）
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === key);
            });
            const nameMap = {
                light: '☀️ 白天', dark: '🌙 黑夜', warm: '🌅 暖阳', forest: '🌲 森林',
                ocean: '🌊 海洋', sakura: '🌸 樱花', violet: '💜 紫罗兰', system: '💻 系统'
            };
            const el = document.getElementById('themeCurrent');
            if (el) el.innerHTML = `当前主题：<strong>${nameMap[key] || key}</strong>`;
            if (key === 'system') {
                // 监听系统变化
                if (!window._zihThemeMedia) {
                    window._zihThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
                    window._zihThemeMedia.addEventListener('change', () => {
                        if (localStorage.getItem('ZIH_theme') === 'system') {
                            applyTheme(resolveThemeKey('system'));
                            document.querySelectorAll('.theme-btn').forEach(btn => {
                                btn.classList.toggle('active', btn.dataset.theme === 'system');
                            });
                        }
                    });
                }
            }
        }

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.dataset.theme;
                if (theme) setTheme(theme);
            });
        });

        // ============================================================
        // 14. 初始化
        // ============================================================
        const initPosts = getPosts();
        let needSave = false;
        initPosts.forEach(p => {
            if (p.views === undefined) { p.views = 0;
                needSave = true; }
            if (p.type === undefined) { p.type = 'article';
                needSave = true; }
            if (p.content === undefined) { p.content = '';
                needSave = true; }
        });
        if (needSave) savePosts(initPosts);

        const savedTheme = localStorage.getItem('ZIH_theme') || 'light';
        setTheme(savedTheme);

        renderProfile();
        currentCategory = '全部';
        renderAll();
        renderGallery();
        renderComments();
        renderTieba();
        renderGroups();
        renderContacts();
        loadMusic();
        switchMode('ai');
        showTab('blog', false);

        // ============================================================
        // 今日一言
        // ============================================================
        const QUOTES = [
            '不要太劳累了，早睡更健康。',
            '代码写得好，不如注释写得清楚。',
            '今天也要元气满满地调试 bug。',
            '学英语就像跑步，贵在坚持。',
            '少一点完美主义，多一点完成主义。',
            '世界很大，先把眼前这一页写完。',
            '休息是为了走更长的路。',
            '保持好奇，比保持忙碌更重要。',
            '一行代码，一份心意。',
            '慢慢来，比较快。',
            '把简单的事情重复做，就是不简单。',
            '允许自己不完美，然后继续前进。'
        ];

        function pickQuote(forceRandom) {
            if (forceRandom) return QUOTES[Math.floor(Math.random() * QUOTES.length)];
            const day = new Date().toDateString();
            let seed = 0;
            for (let i = 0; i < day.length; i++) seed += day.charCodeAt(i);
            return QUOTES[seed % QUOTES.length];
        }

        function renderQuote(forceRandom) {
            const el = document.getElementById('dailyQuote');
            if (el) el.textContent = pickQuote(!!forceRandom);
        }
        renderQuote(false);
        document.getElementById('quoteRefresh')?.addEventListener('click', () => renderQuote(true));

        // ============================================================
        // 移动端底部导航
        // ============================================================
        document.querySelectorAll('.bottom-nav .bnav-item').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const tab = this.dataset.tab;
                if (!tab) return;
                showTab(tab, false);
                document.querySelectorAll('.bottom-nav .bnav-item').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
            }, { passive: false });
        });
        // 同步底部导航高亮
        const _origShowTab = showTab;
        // 在已有 showTab 调用后同步 — 简单再绑一层监听不够，直接补丁：
        const navSync = new MutationObserver(() => {
            const active = document.querySelector('.toplinks a.active');
            const tab = active?.dataset?.tab || (document.getElementById('blog-content')?.classList.contains('active') ? 'blog' : null);
            if (tab) {
                document.querySelectorAll('.bottom-nav .bnav-item').forEach(b => {
                    b.classList.toggle('active', b.dataset.tab === tab);
                });
            }
        });
        document.querySelectorAll('#blog-content, #gallery, #personal, #about, #links').forEach(el => {
            if (el) navSync.observe(el, { attributes: true, attributeFilter: ['class'] });
        });


        // 预览筛选
        document.querySelectorAll('#galleryFilters .pill').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#galleryFilters .pill').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                galleryMediaFilter = this.dataset.media || 'all';
                renderGallery();
            });
        });

        // 排序 / 草稿箱 / 热门
        document.getElementById('sortSelect')?.addEventListener('change', function() {
            currentSort = this.value || 'newest';
            renderAll();
        });
        document.getElementById('draftBoxBtn')?.addEventListener('click', function() {
            showDraftsOnly = !showDraftsOnly;
            this.classList.toggle('active', showDraftsOnly);
            currentCategory = '全部';
            renderAll();
            if (showDraftsOnly) alert('当前为草稿箱视图，再次点击按钮返回全部文章');
        });
        document.getElementById('hotListBtn')?.addEventListener('click', function() {
            currentSort = 'likes';
            showDraftsOnly = false;
            const sel = document.getElementById('sortSelect');
            if (sel) sel.value = 'likes';
            document.getElementById('draftBoxBtn')?.classList.remove('active');
            renderAll();
            document.getElementById('post-grid')?.scrollIntoView({ behavior: 'smooth' });
        });

        // 留言表情
        document.querySelectorAll('#emojiRow .emoji-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const ta = document.getElementById('commentContent');
                if (!ta) return;
                const start = ta.selectionStart || ta.value.length;
                const end = ta.selectionEnd || ta.value.length;
                const emoji = this.textContent;
                ta.value = ta.value.slice(0, start) + emoji + ta.value.slice(end);
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
        });

        // 公告条
        const ANNOUNCE_KEY = 'ZIH_announce';
        (function initAnnounce() {
            const bar = document.getElementById('announceBar');
            const text = document.getElementById('announceText');
            const editBtn = document.getElementById('announceEditBtn');
            const closeBtn = document.getElementById('announceCloseBtn');
            if (!bar || !text) return;
            try {
                const saved = JSON.parse(localStorage.getItem(ANNOUNCE_KEY) || '{}');
                if (saved.hidden) bar.classList.add('hidden');
                if (saved.text) text.textContent = saved.text;
            } catch (_) {}
            editBtn?.addEventListener('click', function() {
                const editing = text.getAttribute('contenteditable') === 'true';
                if (editing) {
                    text.setAttribute('contenteditable', 'false');
                    localStorage.setItem(ANNOUNCE_KEY, JSON.stringify({
                        text: text.textContent.trim(),
                        hidden: bar.classList.contains('hidden')
                    }));
                    editBtn.textContent = '✏️';
                } else {
                    text.setAttribute('contenteditable', 'true');
                    text.focus();
                    editBtn.textContent = '💾';
                }
            });
            closeBtn?.addEventListener('click', function() {
                bar.classList.add('hidden');
                let saved = {};
                try { saved = JSON.parse(localStorage.getItem(ANNOUNCE_KEY) || '{}'); } catch (_) {}
                saved.hidden = true;
                saved.text = text.textContent.trim();
                localStorage.setItem(ANNOUNCE_KEY, JSON.stringify(saved));
            });
        })();

        // 友链
        const LINKS_KEY = 'ZIH_friend_links';
        const defaultLinks = [
            { id: 1, name: 'GitHub', url: 'https://github.com', desc: '代码托管' }
        ];
        function getFriendLinks() {
            const s = localStorage.getItem(LINKS_KEY);
            if (s) { try { return JSON.parse(s); } catch (_) {} }
            localStorage.setItem(LINKS_KEY, JSON.stringify(defaultLinks));
            return defaultLinks.slice();
        }
        function saveFriendLinks(list) { localStorage.setItem(LINKS_KEY, JSON.stringify(list)); }
        function renderFriendLinks() {
            const box = document.getElementById('links-grid');
            if (!box) return;
            const list = getFriendLinks();
            if (!list.length) {
                box.innerHTML = '<p class="community-empty">暂无友链，点击添加</p>';
                return;
            }
            box.innerHTML = list.map(item => `
                <a class="community-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
                    <span class="c-icon">🔗</span>
                    <span class="c-name">${item.name}</span>
                    <span class="c-type">友链</span>
                    ${item.desc ? `<span class="c-desc">${item.desc}</span>` : ''}
                    <button type="button" class="c-del" title="删除" onclick="event.preventDefault();event.stopPropagation();deleteFriendLink(${item.id})">🗑️</button>
                </a>
            `).join('');
        }
        window.deleteFriendLink = function(id) {
            if (!confirm('删除该友链？')) return;
            saveFriendLinks(getFriendLinks().filter(i => i.id !== id));
            renderFriendLinks();
        };
        document.getElementById('addLinkBtn')?.addEventListener('click', () => {
            document.getElementById('linkModal')?.classList.add('active');
        });
        document.getElementById('closeLinkBtn')?.addEventListener('click', () => {
            document.getElementById('linkModal')?.classList.remove('active');
            document.getElementById('linkForm')?.reset();
        });
        document.getElementById('linkModal')?.addEventListener('click', e => {
            if (e.target.id === 'linkModal') {
                e.target.classList.remove('active');
                document.getElementById('linkForm')?.reset();
            }
        });
        document.getElementById('linkForm')?.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('linkName').value.trim();
            const url = document.getElementById('linkUrl').value.trim();
            const desc = document.getElementById('linkDesc').value.trim();
            if (!name || !url) return;
            const list = getFriendLinks();
            list.push({ id: Date.now(), name, url, desc });
            saveFriendLinks(list);
            renderFriendLinks();
            document.getElementById('linkModal')?.classList.remove('active');
            document.getElementById('linkForm')?.reset();
        });
        renderFriendLinks();


        // ============================================================
        // 体验与个性 + 数据与对外
        // ============================================================

        // 阅读进度条
        (function initReadProgress() {
            const bar = document.getElementById('readProgress');
            if (!bar) return;
            const onScroll = () => {
                const doc = document.documentElement;
                const scrollTop = doc.scrollTop || document.body.scrollTop;
                const height = doc.scrollHeight - doc.clientHeight;
                const pct = height > 0 ? (scrollTop / height) * 100 : 0;
                bar.style.width = pct + '%';
            };
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        })();

        // 回到顶部增强
        document.getElementById('railTopBtn')?.addEventListener('click', function() {
            this.classList.remove('pulse-top');
            void this.offsetWidth;
            this.classList.add('pulse-top');
        });

        // 右下角快捷按钮：可在设置中分别屏蔽/恢复
        (function initRailSettings() {
            const topBtn = document.getElementById('railTopBtn');
            const settingsBtn = document.getElementById('railSettingsBtn');
            const commentBtn = document.getElementById('railCommentBtn');
            const panel = document.getElementById('railSettingsPanel');
            const closeBtn = document.getElementById('closeRailSettings');
            const topToggle = document.getElementById('toggleRailTop');
            const settingsToggle = document.getElementById('toggleRailSettings');
            const commentToggle = document.getElementById('toggleRailComment');
            if (!panel || !settingsBtn) return;

            const KEY = 'ZIH_rail_visibility';
            let state = { top: true, settings: true, comment: true };
            try { state = { ...state, ...(JSON.parse(localStorage.getItem(KEY) || '{}')) }; } catch (_) {}

            function apply() {
                if (topBtn) topBtn.style.display = state.top ? '' : 'none';
                if (commentBtn) commentBtn.style.display = state.comment ? '' : 'none';
                // 设置按钮自身不能被隐藏，否则无法恢复；勾选项仍可用于状态管理。
                if (settingsBtn) settingsBtn.style.display = '';
                if (topToggle) topToggle.checked = !!state.top;
                if (settingsToggle) settingsToggle.checked = !!state.settings;
                if (commentToggle) commentToggle.checked = !!state.comment;
                localStorage.setItem(KEY, JSON.stringify(state));
            }
            function openPanel(e) {
                e?.preventDefault();
                panel.classList.add('open');
                panel.setAttribute('aria-hidden', 'false');
            }
            function closePanel() {
                panel.classList.remove('open');
                panel.setAttribute('aria-hidden', 'true');
            }
            settingsBtn.addEventListener('click', openPanel);
            closeBtn?.addEventListener('click', closePanel);
            document.addEventListener('click', e => {
                if (!panel.contains(e.target) && !settingsBtn.contains(e.target)) closePanel();
            });
            topToggle?.addEventListener('change', () => { state.top = topToggle.checked; apply(); });
            commentToggle?.addEventListener('change', () => { state.comment = commentToggle.checked; apply(); });
            // 设置按钮不能在隐藏后消失，否则用户无法重新打开设置面板。
            settingsToggle?.addEventListener('change', () => {
                state.settings = true;
                settingsToggle.checked = true;
                apply();
            });
            apply();
        })();

        // 可编辑侧边栏问候
        (function initGreet() {
            const el = document.getElementById('sidebarGreet');
            if (!el) return;
            const key = 'ZIH_greet';
            const saved = localStorage.getItem(key);
            if (saved) el.textContent = saved;
            el.addEventListener('blur', () => {
                const t = el.textContent.trim() || '不要太劳累了，早睡更健康';
                el.textContent = t;
                localStorage.setItem(key, t);
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
            });
        })();

        // 节日自动换肤
        function detectHolidayTheme() {
            const now = new Date();
            const m = now.getMonth() + 1;
            const d = now.getDate();
            // 简化：元旦、春节档（约 1-2 月）、中秋档（约 9 月）、国庆
            if ((m === 1 && d <= 3) || (m === 2 && d <= 20)) return 'sakura'; // 新年/春节氛围
            if (m === 9 && d >= 10 && d <= 20) return 'warm'; // 中秋暖色
            if (m === 10 && d <= 7) return 'warm'; // 国庆
            if (m === 12 && d >= 20) return 'violet'; // 年末
            return null;
        }
        (function initHolidayTheme() {
            const toggle = document.getElementById('holidayThemeToggle');
            const enabled = localStorage.getItem('ZIH_holiday_theme') !== '0';
            if (toggle) toggle.checked = enabled;
            toggle?.addEventListener('change', function() {
                localStorage.setItem('ZIH_holiday_theme', this.checked ? '1' : '0');
                if (this.checked) {
                    const h = detectHolidayTheme();
                    if (h) setTheme(h);
                }
            });
            if (enabled) {
                const h = detectHolidayTheme();
                // 仅当用户未手动选过主题偏好时自动切换？若开启节日则优先节日
                if (h && localStorage.getItem('ZIH_holiday_applied') !== h + '-' + new Date().getFullYear()) {
                    setTheme(h);
                    localStorage.setItem('ZIH_holiday_applied', h + '-' + new Date().getFullYear());
                }
            }
        })();

        // 访问统计
        (function initVisitStats() {
            const key = 'ZIH_visit_stats';
            let data = { total: 0, days: {} };
            try { data = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
            if (!data.days) data.days = {};
            if (!data.total) data.total = 0;
            const today = new Date().toISOString().slice(0, 10);
            data.total += 1;
            data.days[today] = (data.days[today] || 0) + 1;
            // 只保留近 60 天
            const keys = Object.keys(data.days).sort();
            while (keys.length > 60) {
                delete data.days[keys.shift()];
            }
            localStorage.setItem(key, JSON.stringify(data));
            const st = document.getElementById('statToday');
            const su = document.getElementById('statTotal');
            const sp = document.getElementById('statPosts');
            if (st) st.textContent = data.days[today] || 0;
            if (su) su.textContent = data.total || 0;
            if (sp) sp.textContent = getPosts().filter(p => p.status !== 'draft').length;
        })();

        // 导出 RSS
        document.getElementById('exportRssBtn')?.addEventListener('click', function() {
            const posts = getPosts().filter(p => p.status !== 'draft').sort((a, b) => b.id - a.id).slice(0, 50);
            const site = location.origin + location.pathname.replace(/index\.html$/, '');
            const items = posts.map(p => {
                const desc = (p.summary || p.content || '').replace(/<[^>]+>/g, ' ').slice(0, 200);
                return `    <item>
      <title><![CDATA[${p.title || ''}]]></title>
      <link>${site}#post-${p.id}</link>
      <guid isPermaLink="false">zih-post-${p.id}</guid>
      <pubDate>${new Date(p.date || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${desc}]]></description>
      <category><![CDATA[${p.category || ''}]]></category>
    </item>`;
            }).join('\n');
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ZIH · 博客小栈</title>
    <link>${site}</link>
    <description>分享技术与生活的点点滴滴</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
            const blob = new Blob([xml], { type: 'application/rss+xml' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'zih-feed.xml';
            a.click();
            URL.revokeObjectURL(a.href);
            alert('已下载 RSS 文件 zih-feed.xml\\n可上传到仓库根目录供订阅使用。');
        });

        // 轻量云同步：从远程 JSON URL 拉取（如 GitHub Gist raw）
        document.getElementById('cloudPullBtn')?.addEventListener('click', async function() {
            const url = document.getElementById('cloudJsonUrl')?.value.trim();
            if (!url) { alert('请填写远程 JSON 地址'); return; }
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const data = await res.json();
                if (!data.posts && !data.version) throw new Error('不是有效的备份 JSON');
                if (!confirm('将用远程数据覆盖本地，是否继续？')) return;
                if (data.posts) savePosts(data.posts);
                if (data.comments) saveComments(data.comments);
                if (data.images) saveImages(data.images);
                if (data.contacts) saveContacts(data.contacts);
                if (data.profile) saveProfile(data.profile);
                if (data.music) saveMusicData(data.music);
                if (data.tieba) saveTieba(data.tieba);
                if (data.groups) saveGroups(data.groups);
                if (data.friendLinks) saveFriendLinks(data.friendLinks);
                renderProfile();
                renderAll();
                renderGallery();
                renderComments();
                renderContacts();
                renderTieba();
                renderGroups();
                renderFriendLinks();
                loadMusic();
                alert('☁️ 远程数据已同步到本地');
            } catch (err) {
                alert('拉取失败：' + err.message + '\\n请确认地址可公开访问且允许跨域（CORS）。');
            }
        });

        // SEO：打开文章时更新标题
        const _openDetailSeo = window.openDetail;
        // openDetail is function declaration - wrap
        const origOpenDetail = openDetail;
        window.openDetail = function(id) {
            origOpenDetail(id);
            const post = getPosts().find(p => p.id === id);
            if (post) {
                document.title = (post.title || '文章') + ' · ZIH 博客小栈';
                const md = document.querySelector('meta[name="description"]');
                if (md && post.summary) md.setAttribute('content', post.summary);
            }
        };
        // restore close title
        const closeDetailRestore = () => {
            document.title = 'ZIH · 博客小栈';
        };
        document.getElementById('closeDetailBtn')?.addEventListener('click', closeDetailRestore);
        document.getElementById('closeDetailBtn2')?.addEventListener('click', closeDetailRestore);

        // PWA Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }

        console.log('🚀 博客小栈已加载！');
        console.log('📝 支持写文章和新闻，富文本编辑器可插入图片、链接、列表等。');
        console.log('📊 点击文章卡片可查看详情并增加阅读量。');
        console.log('💬 支持评论回复 · ❤️ 点赞 · 📌 置顶 · 💻 跟随系统主题 · 📱 底部导航');
    

// ============================================================
// 特色卡片：自定义 + 置顶
// ============================================================
(function initFeaturedCards() {
    const KEY = 'ZIH_featured_cards_v1';
    const defaults = {
        notice: { title: '博客须知', tag: '置顶', meta: '发表于 2025-8-3 · 0 条评论', pinned: true },
        roots: { title: '英语词根词缀系列', tag: '英语体系 · 最新', meta: '第四小节 · 发表于 2 天前', pinned: false }
    };
    const getState = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
            return {
                notice: { ...defaults.notice, ...(saved.notice || {}) },
                roots: { ...defaults.roots, ...(saved.roots || {}) }
            };
        } catch (_) { return JSON.parse(JSON.stringify(defaults)); }
    };
    const saveState = state => localStorage.setItem(KEY, JSON.stringify(state));
    const cards = document.getElementById('featuredCards');
    const modal = document.getElementById('featuredEditModal');
    if (!cards || !modal) return;
    const form = document.getElementById('featuredEditForm');
    const idInput = document.getElementById('featuredEditId');
    const titleInput = document.getElementById('featuredTitleInput');
    const tagInput = document.getElementById('featuredTagInput');
    const metaInput = document.getElementById('featuredMetaInput');
    const pinInput = document.getElementById('featuredPinnedInput');

    function render() {
        const state = getState();
        cards.querySelectorAll('.fcard[data-featured-id]').forEach(card => {
            const id = card.dataset.featuredId, d = state[id];
            card.querySelector('[data-featured-field="title"]').textContent = d.title;
            card.querySelector('[data-featured-field="tag"]').textContent = d.tag || '';
            card.querySelector('[data-featured-field="meta"]').textContent = d.meta || '';
            card.classList.toggle('is-pinned', !!d.pinned);
            const pinBtn = card.querySelector('[data-featured-pin]');
            if (pinBtn) {
                pinBtn.textContent = d.pinned ? '📌' : '📍';
                pinBtn.title = d.pinned ? '取消置顶' : '置顶';
            }
        });
        [...cards.querySelectorAll('.fcard[data-featured-id]')]
            .sort((a,b) => Number(getState()[b.dataset.featuredId].pinned) - Number(getState()[a.dataset.featuredId].pinned))
            .forEach(c => cards.appendChild(c));
    }
    function openEditor(id) {
        const d = getState()[id];
        idInput.value = id; titleInput.value = d.title; tagInput.value = d.tag; metaInput.value = d.meta; pinInput.checked = !!d.pinned;
        modal.classList.add('active');
        setTimeout(() => titleInput.focus(), 30);
    }
    function closeEditor() { modal.classList.remove('active'); }
    cards.addEventListener('click', e => {
        const edit = e.target.closest('[data-featured-edit]');
        const pin = e.target.closest('[data-featured-pin]');
        if (edit) { e.stopPropagation(); openEditor(edit.dataset.featuredEdit); return; }
        if (pin) {
            e.stopPropagation();
            const id = pin.dataset.featuredPin, state = getState();
            state[id].pinned = !state[id].pinned; saveState(state); render();
        }
    });
    form.addEventListener('submit', e => {
        e.preventDefault();
        const id = idInput.value, state = getState();
        state[id] = { title: titleInput.value.trim() || defaults[id].title, tag: tagInput.value.trim(), meta: metaInput.value.trim(), pinned: pinInput.checked };
        saveState(state); render(); closeEditor();
    });
    document.getElementById('closeFeaturedEditBtn')?.addEventListener('click', closeEditor);
    document.getElementById('cancelFeaturedEditBtn')?.addEventListener('click', closeEditor);
    modal.addEventListener('click', e => { if (e.target === modal) closeEditor(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) closeEditor(); });
    render();
})();
