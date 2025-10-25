document.addEventListener("DOMContentLoaded", () => {
  const adminReportList = document.getElementById("adminReportList");

  // Load approved posts (or show placeholder)
  const approvedPosts = JSON.parse(localStorage.getItem("approvedPosts")) || [];

  if (approvedPosts.length === 0) {
    adminReportList.innerHTML = '<p style="text-align: center; color: #666; margin-top: 50px;">ยังไม่มีโพสต์ที่อนุมัติ</p>';
  } else {
    renderPosts(approvedPosts);
  }

  // Render posts into the list
  function renderPosts(posts) {
    adminReportList.innerHTML = '';
    posts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'report-card';

      // Build inner HTML structure (image left, content right)
      card.innerHTML = `
        <div class="report-header">
          <div class="report-preview">
            ${post.image ? `
              <div class="preview-image-container">
                <img src="${post.image}" class="preview-image" alt="report image" />
              </div>
            ` : `
              <div class="preview-image-container" style="background:#e6e6e6;display:flex;align-items:center;justify-content:center;color:#999;">
                ไม่มีรูป
              </div>
            `}

            <div class="preview-content">
              <div>
                <h3 class="report-title">${escapeHtml(post.title || 'ไม่มีหัวข้อ')}</h3>
                <div class="preview-description">
                  <div class="desc" data-fulltext>${escapeHtml(post.desc || '')}</div>
                  <button class="see-more-btn" aria-expanded="false">ดูเพิ่มเติม</button>
                </div>
              </div>

              <div class="report-info">
                <div class="report-meta">
                  <div class="meta-position">ตำแหน่ง: ${escapeHtml(post.position || '-')}</div>
                  <div class="meta-time">เวลา: ${escapeHtml(post.date || '-')}</div>
                </div>
                <div class="report-status">
                  <span class="status status-tag ${statusClass(post.status)}">${statusLabel(post.status)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Attach truncation behavior
      const descEl = card.querySelector('[data-fulltext]');
      const btn = card.querySelector('.see-more-btn');
      applyTruncation(descEl, btn);

      adminReportList.appendChild(card);
    });
  }

  // --- Helpers ---
  function statusClass(raw) {
    if (!raw) return 'pending';
    const s = String(raw).toLowerCase();
    if (s.includes('pending') || s.includes('อยู่') || s.includes('ตรวจ')) return 'pending';
    if (s.includes('approved') || s.includes('approve') || s.includes('อนุมัติ')) return 'approved';
    if (s.includes('done') || s.includes('complete') || s.includes('เสร็จ')) return 'done';
    if (s.includes('reject') || s.includes('ไม่อนุมัติ') || s.includes('ปฏิเสธ')) return 'rejected';
    return s; // fallback
  }

  function statusLabel(raw) {
    if (!raw) return 'อยู่ระหว่างดำเนินการ';
    const s = String(raw).toLowerCase();
    if (s.includes('pending') || s.includes('อยู่') || s.includes('ตรวจ')) return 'อยู่ระหว่างดำเนินการ';
    if (s.includes('approved') || s.includes('approve') || s.includes('อนุมัติ')) return 'อนุมัติ';
    if (s.includes('done') || s.includes('complete') || s.includes('เสร็จ')) return 'ดำเนินการเสร็จสิ้น';
    if (s.includes('reject') || s.includes('ไม่อนุมัติ') || s.includes('ปฏิเสธ')) return 'ปฏิเสธ';
    // If already Thai or unknown, return original (trimmed)
    return String(raw).length > 20 ? String(raw).slice(0,20) + '...' : String(raw);
  }

  // Toggle truncation: if text is long, show truncated + button
  function applyTruncation(descEl, btn) {
    if (!descEl) return;
    const full = descEl.textContent || '';
    const threshold = 220; // characters to trigger truncation (shorter for tighter layout)

    // Use plain text and preserve newlines via CSS (pre-line)
    if (full.length <= threshold) {
      btn.style.display = 'none';
      return;
    }

    // initialize truncated state
    descEl.classList.add('truncated');
    btn.textContent = 'ดูเพิ่มเติม';
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.add('see-more-btn');

    btn.addEventListener('click', (e) => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        descEl.classList.add('truncated');
        btn.textContent = 'ดูเพิ่มเติม';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        descEl.classList.remove('truncated');
        btn.textContent = 'ดูน้อยลง';
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // basic HTML escape to avoid injecting markup
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

});
