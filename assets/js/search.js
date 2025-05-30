document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  if (!searchForm || !searchInput || !searchResults) return;
  
  let searchIndex = [];
  
  // 加载搜索索引
  fetch('/search.json')
    .then(response => response.json())
    .then(data => {
      searchIndex = data;
    })
    .catch(error => console.error('搜索索引加载失败:', error));
  
  // 处理搜索输入
  searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    
    if (query.length < 2) {
      searchResults.classList.remove('active');
      return;
    }
    
    performSearch(query);
  });
  
  // 阻止表单默认提交行为
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    if (query.length > 0) {
      performSearch(query);
    }
  });
  
  // 点击页面其他地方关闭搜索结果
  document.addEventListener('click', function(e) {
    if (!searchForm.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });
  
  // 执行搜索
  function performSearch(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    searchIndex.forEach(post => {
      const inTitle = post.title.toLowerCase().includes(queryLower);
      const inContent = post.content.toLowerCase().includes(queryLower);
      const inTags = post.tags.some(tag => tag.toLowerCase().includes(queryLower));
      
      if (inTitle || inContent || inTags) {
        results.push({
          ...post,
          score: (inTitle ? 3 : 0) + (inTags ? 2 : 0) + (inContent ? 1 : 0)
        });
      }
    });
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    displayResults(results, query);
  }
  
  // 显示结果
  function displayResults(results, query) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <p>没有找到包含 "<strong>${query}</strong>" 的文章</p>
          <p>尝试使用不同的关键词</p>
        </div>
      `;
      searchResults.classList.add('active');
      return;
    }
    
    results.slice(0, 8).forEach(result => {
      const excerpt = createExcerpt(result.content, query);
      const date = new Date(result.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const item = document.createElement('a');
      item.href = result.url;
      item.className = 'search-result-item';
      item.innerHTML = `
        <h4>${highlightQuery(result.title, query)}</h4>
        <div class="search-result-meta">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z"/>
            </svg>
            ${date}
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
            </svg>
            ${result.categories.join(', ')}
          </span>
        </div>
        <div class="search-excerpt">${excerpt}</div>
      `;
      searchResults.appendChild(item);
    });
    
    searchResults.classList.add('active');
  }
  
  // 创建内容摘要
  function createExcerpt(content, query) {
    const contentLower = content.toLowerCase();
    const queryIndex = contentLower.indexOf(query);
    
    if (queryIndex === -1) {
      return content.substring(0, 120) + '...';
    }
    
    const start = Math.max(0, queryIndex - 30);
    const end = Math.min(content.length, queryIndex + query.length + 90);
    let excerpt = content.substring(start, end);
    
    if (start > 0) {
      excerpt = '...' + excerpt;
    }
    if (end < content.length) {
      excerpt += '...';
    }
    
    return highlightQuery(excerpt, query);
  }
  
  // 高亮搜索关键词
  function highlightQuery(text, query) {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  // 转义正则特殊字符
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
});