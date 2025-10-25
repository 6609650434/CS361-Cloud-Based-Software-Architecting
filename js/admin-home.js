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
// คอมเมนต์: เพิ่ม logic สำหรับปุ่มชี้ลง -> แสดงปุ่ม edit -> แสดง action panel
document.addEventListener("DOMContentLoaded", () => {
  const statusList = document.getElementById("statusList");
  const searchInput = document.getElementById("searchInput");
  const reportTpl = document.getElementById("report-template");
  const placeholderTpl = document.getElementById("placeholder-template");

  // โหลด pending จาก localStorage
  function loadPendingReports() {
    try { return JSON.parse(localStorage.getItem("pendingReports")) || []; }
    catch (e) { return []; }
  }

  function savePendingReports(list) {
    localStorage.setItem("pendingReports", JSON.stringify(list));
  }

  // คืนข้อความสถานะ (ไทย)
  function getStatusText(report) {
    return report.statusText || "อยู่ระหว่างตรวจสอบ";
  }

  // แสดงรายการโดย clone template (ไม่แสดง description)
  function displayPendingReports(filter = "") {
    const pending = loadPendingReports();
    const q = (filter || "").toLowerCase();
    const filtered = pending.filter(r => {
      if (!q) return true;
      return (r.title||"").toLowerCase().includes(q) ||
             (r.position||"").toLowerCase().includes(q);
    });

    statusList.innerHTML = "";

    if (filtered.length === 0) {
      const ph = placeholderTpl.content.cloneNode(true);
      statusList.appendChild(ph);
      return;
    }

    filtered.forEach((report, idx) => {
      const node = reportTpl.content.cloneNode(true);
      const article = node.querySelector("article.status-card");

      // เติมฟิลด์
      const setText = (sel, value) => {
        const el = node.querySelector(sel);
        if (el) el.textContent = value ?? "";
      };
      setText("[data-field='title']", report.title || "ไม่มีหัวข้อ");
      setText("[data-field='position']", report.position || "-");
      setText("[data-field='time']", (report.time || "") + (report.date ? " " + report.date : "") );

      // attributes
      if (article) {
        article.dataset.id = report.id;
        article.dataset.index = idx;
        article.setAttribute("aria-expanded", "false");
      }

      // controls
      const toggleBtn = node.querySelector(".toggle-actions");
      const editBtn = node.querySelector(".edit-btn");
      const actionPanel = node.querySelector(".action-panel");

      // toggle ปุ่ม edit (show/hide) เมื่อกดปุ่มชี้ลง
      if (toggleBtn) {
        toggleBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (editBtn) {
            const isHidden = editBtn.hasAttribute("hidden");
            if (isHidden) editBtn.removeAttribute("hidden");
            else editBtn.setAttribute("hidden", "");
          }
          // ซ่อน/แสดง panel ถ้ามันเปิดอยู่
          if (actionPanel) {
            if (!actionPanel.hasAttribute("hidden")) actionPanel.setAttribute("hidden", "");
          }
        });
      }

      // กด edit -> โชว์ action panel
      if (editBtn) {
        editBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (actionPanel) {
            const isHidden = actionPanel.hasAttribute("hidden");
            if (isHidden) actionPanel.removeAttribute("hidden");
            else actionPanel.setAttribute("hidden", "");
          }
        });
      }

      // ตัวเลือก action ใน panel: inprogress / done
      const optionButtons = node.querySelectorAll(".action-option");
      optionButtons.forEach(btn => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const action = btn.getAttribute("data-action");
          if (!action) return;
          // เรียกอัพเดทสถานะ
          updateReportStatus(report.id, action);
        });
      });

      // คลิกที่ article: ขยาย/ยุบ (ไม่กระทบ controls)
      if (article) {
        article.addEventListener("click", () => {
          const expanded = article.classList.toggle("expanded");
          article.setAttribute("aria-expanded", expanded ? "true" : "false");
        });
      }

      statusList.appendChild(node);
    });
  }

  // อัพเดทสถานะ: 'inprogress' จะอัพเดทสถานะใน pending (ไม่ย้าย),
  // 'done' จะย้ายไป approvedPosts, 'approve' (ถ้ามี) จะย้ายเช่นกัน
  function updateReportStatus(reportId, action) {
    const pending = loadPendingReports();
    const idx = pending.findIndex(r => String(r.id) === String(reportId));
    if (idx === -1) return;

    const report = pending[idx];
    let newStatus = "";
    let newStatusText = "";

    if (action === "inprogress")       { newStatus = "InProgress"; newStatusText = "กำลังดำเนินการ"; }
    else if (action === "done")        { newStatus = "Done";       newStatusText = "ดำเนินการแก้ไขเหตุแล้ว"; }
    else if (action === "approve")     { newStatus = "Approved";   newStatusText = "อนุมัติ"; }
    else if (action === "reject")      { newStatus = "Rejected";   newStatusText = "ไม่อนุมัติ"; }
    else return;

    // ถ้าเป็น inprogress: อัพเดทใน pending แล้วบันทึก (ยังคงอยู่ใน pending)
    if (action === "inprogress") {
      pending[idx] = { ...report, status: newStatus, statusText: newStatusText };
      savePendingReports(pending);
      displayPendingReports(searchInput ? searchInput.value.trim() : "");
      return;
    }

    // ถ้าเป็น done/approve: อัพเดท userReports, ย้ายไป approvedPosts แล้วลบจาก pending
    const userReports = JSON.parse(localStorage.getItem("userReports")) || [];
    const updatedUserReports = userReports.map(r => r.id === report.id ? { ...r, status: newStatus, statusText: newStatusText } : r);
    localStorage.setItem("userReports", JSON.stringify(updatedUserReports));

    if (newStatus === "Approved" || newStatus === "Done") {
      const approved = JSON.parse(localStorage.getItem("approvedPosts")) || [];
      approved.push({ ...report, status: newStatus, statusText: newStatusText });
      localStorage.setItem("approvedPosts", JSON.stringify(approved));
    }

    // ลบจาก pending และบันทึก
    pending.splice(idx, 1);
    savePendingReports(pending);

    displayPendingReports(searchInput ? searchInput.value.trim() : "");
  }

  // search realtime
  if (searchInput) {
    searchInput.addEventListener("input", () => displayPendingReports(searchInput.value.trim()));
  }

  // เรียกแสดงครั้งแรก
  displayPendingReports();
});