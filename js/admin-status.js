// admin-status.js (fixed to work with adminStatus.css)
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://1pb257oa3g.execute-api.us-east-1.amazonaws.com/prod";
  const S3_BASE  = "https://tu-emergency-alert-bucket-cp2.s3.amazonaws.com/";
  const statusList  = document.getElementById("statusList");
  const searchInput = document.getElementById("searchInput");

  let allReports = [];
  let filtered   = [];

  // ---------- helper: เวลา ----------
  function formatDateTime(iso) {
    if (!iso) return { date: "-", time: "-" };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };

    const date = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const time = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  }

  function s3Url(key) {
    if (!key) return null;
    if (/^https?:\/\//i.test(key)) return key;
    return S3_BASE + key.replace(/^\/+/, "");
  }

  // ---------- โหลด incident ที่ status = pending_review ----------
  async function fetchPending() {
    statusList.innerHTML = `<p style="padding:16px;text-align:center;">⏳ กำลังโหลด...</p>`;

    try {
      const url = `${API_BASE}/admin/incidents?status=pending_review`;
      const res = await fetch(url);
      const data = await res.json();
      const items = data.items || [];

      allReports = items.map((it) => {
        const images = (it.images || [])
          .map((x) => (typeof x === "string" ? x : x.S))
          .filter(Boolean);

        return {
          id:          it.id || it.incidentId,
          title:       it.title || "ไม่ระบุหัวข้อ",
          location:    it.location || "-",
          description: it.description || it.detail || "-",
          status:      it.status || "pending_review",
          createdAt:   it.createdAt || it.reportedAt || it.lastUpdatedAt || null,
          images,
          reportedBy:  it.reportedBy || "-",
        };
      });

      
      // ใหม่สุดอยู่บน
      allReports.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return a.createdAt < b.createdAt ? 1 : -1;
      });

      filtered = allReports.slice();
      render();
    } catch (err) {
      console.error(err);
      statusList.innerHTML =
        `<p style="padding:16px;text-align:center;color:red;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
    }
  }

  // ---------- วาดการ์ดตาม CSS เดิม ----------
  function render() {
    statusList.innerHTML = "";

    if (!filtered.length) {
      statusList.innerHTML =
        `<p style="padding:16px;text-align:center;">ไม่มีรายงานที่รอการตรวจสอบ</p>`;
      return;
    }

    filtered.forEach((r) => {
      const { date, time } = formatDateTime(r.createdAt);
      const imgUrl = r.images && r.images.length ? s3Url(r.images[0]) : null;

      const card = document.createElement("article");
      card.className = "status-card";
      card.dataset.id = r.id;

      // header + meta + detail โครงตาม adminStatus.css
      card.innerHTML = `
        <div class="report-header">
          <div class="folder-icon">📁</div>
          <div class="report-title">${r.title}</div>
        </div>

        <div class="report-meta">
          <div class="meta-time">${time}</div>
          <div class="meta-date">${date}</div>
          <div class="meta-reporter">ผู้รายงาน: ${r.reportedBy}</div>
        </div>

        <div class="report-detail-content">
          <div class="detail-info-wrapper">
            <div class="detail-image-container">
              ${imgUrl
                ? `<img class="report-detail-image" src="${imgUrl}" alt="report image" />`
                : `<div style="color:#777;">(ไม่มีรูปภาพ)</div>`}
            </div>

            <div class="detail-text-block">
              <div class="detail-meta">
                <div>ตำแหน่ง: ${r.location}</div>
                <div class="status-label">
                  สถานะ :
                  <span class="status-value status-${r.status}">อยู่ระหว่างตรวจสอบ</span>
                </div>
              </div>

              <div class="detail-description-box">
                <strong>รายละเอียด:</strong>
                <div class="desc">${r.description}</div>
              </div>

              <div class="admin-actions">
                <button class="approve-btn">Approve</button>
                <button class="done-btn">Done</button>
                <button class="reject-btn">Reject</button>
              </div>
            </div>
          </div>
        </div>
      `;

      const header = card.querySelector(".report-header");
      const detailContent = card.querySelector(".report-detail-content");
      const approveBtn = card.querySelector(".approve-btn");
      const doneBtn    = card.querySelector(".done-btn");
      const rejectBtn  = card.querySelector(".reject-btn");

      // 👉 ใช้ .expanded ให้ตรงกับ CSS (ไม่ใช้ style.display)
      header.addEventListener("click", () => {
        const isExpanded = card.classList.contains("expanded");
        
        if (!isExpanded) {
          // เปิด: คำนวณความสูงที่แท้จริง
          card.classList.add("expanded");
          // ใช้ setTimeout เพื่อให้ DOM update ก่อน
          setTimeout(() => {
            const scrollHeight = detailContent.scrollHeight;
            detailContent.style.maxHeight = scrollHeight + "px";
          }, 0);
        } else {
          // ปิด: ตั้งกลับเป็น 0
          detailContent.style.maxHeight = "0";
          card.classList.remove("expanded");
        }
      });

      approveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        changeStatus(r.id, "approved", card);
      });
      doneBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        changeStatus(r.id, "done", card);
      });
      rejectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        changeStatus(r.id, "rejected", card);
      });

      // ซ่อนรูปถ้าขึ้น error
      const imgEl = card.querySelector(".report-detail-image");
      if (imgEl) {
        imgEl.onerror = () => {
          imgEl.parentElement.innerHTML = `<div style="color:#777;">(ไม่สามารถแสดงรูปได้)</div>`;
        };
      }

      statusList.appendChild(card);
    });
  }

  // ---------- เรียก Lambda เปลี่ยนสถานะ ----------
  async function changeStatus(id, newStatus, cardEl) {
    try {
      const url = `${API_BASE}/admin/incidents/${encodeURIComponent(id)}/status`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          admin: "admin@dome.tu.ac.th", // ภายหลังจะเปลี่ยนเป็น email จาก Cognito ก็ได้
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "อัปเดตสถานะไม่สำเร็จ");

      // ลบออกจาก list เพราะหน้านี้ใช้สำหรับ pending เท่านั้น
      allReports = allReports.filter((x) => x.id !== id);
      filtered   = filtered.filter((x) => x.id !== id);
      if (cardEl) cardEl.remove();
      if (!filtered.length) render();

      alert(`✅ เปลี่ยนสถานะเป็น ${newStatus} สำเร็จ`);
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  }

  // ---------- search ----------
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    filtered = !q
      ? allReports.slice()
      : allReports.filter((r) =>
          (r.title || "").toLowerCase().includes(q) ||
          (r.location || "").toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
        );
    render();
  });

  // เริ่มโหลด
  fetchPending();
});
