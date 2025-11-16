// ===============================
// admin-home.js (fixed)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://1pb257oa3g.execute-api.us-east-1.amazonaws.com/prod";

  const ENDPOINTS = {
    feed: () => `${API_BASE}/reports`,
    update: (id) => `${API_BASE}/admin/incidents/${encodeURIComponent(id)}`,
    delete: (id) => `${API_BASE}/admin/incidents/${encodeURIComponent(id)}`,
  };

  const S3_PUBLIC_BASE = "https://tu-emergency-alert-bucket-cp2.s3.amazonaws.com/";

  const rawToken = localStorage.getItem("id_token") || "";
  const userRole = localStorage.getItem("user_role") || "USER";
  const userEmail = localStorage.getItem("user_email") || "";

  if (userRole !== "ADMIN") {
    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    window.location.href = "./index.html";
    return;
  }

  const authHeader = rawToken
    ? { Authorization: rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}` }
    : {};

  const listEl =
    document.getElementById("adminFeedList") ||
    document.getElementById("feedList") ||
    document.getElementById("incidentList");

  const searchInput = document.getElementById("searchInput");

  let incidents = [];
  let filtered = [];

  function statusLabelThai(status) {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "กำลังดำเนินการแก้ไข";
    if (s === "finish") return "ดำเนินการเเก้ไขเสร็จสิ้น";
    return status || "-";
  }

  // (ยังมีอยู่ แต่ไม่ได้ใช้ก็ไม่เป็นไร)
  function fmtDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  // ✅ แก้ formatTime ให้แสดง เวลา + วันที่ + พ.ศ.
  function formatTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const pad = (n) => String(n).padStart(2, "0");
    const hours = pad(d.getHours());
    const mins  = pad(d.getMinutes());
    const day   = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const yearBE = d.getFullYear() + 543;
    return `${hours}:${mins} ${day}/${month}/${yearBE}`;
  }

  function s3UrlFromKey(key) {
    if (!key) return null;
    if (/^https?:\/\//i.test(key)) return key;
    return S3_PUBLIC_BASE + key.replace(/^\/+/, "");
  }

  async function loadAdminFeed() {
    try {
      const url = ENDPOINTS.feed();
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "โหลดรายงานไม่สำเร็จ");
      }
      const data = await res.json();
      const items = data.items || [];

      incidents = items.map((it) => {
        const rawImgs = it.images || [];
        const images = (Array.isArray(rawImgs) ? rawImgs : [])
          .map((v) => (typeof v === "string" ? v : v && v.S ? v.S : null))
          .filter(Boolean);

        return {
          id: it.id || it.incidentId || it.reportId,
          title: it.title || "ไม่ระบุหัวข้อ",
          location: it.location || "-",
          description: it.description || it.detail || it.details || "-",
          status: it.status,
          reportedAt: it.reportedAt || it.createdAt || null,
          images,
          reportedBy: it.reportedBy || "-",
          category: it.category || "-",
        };
      });

      incidents.sort((a, b) => {
        const ta = a.reportedAt || "";
        const tb = b.reportedAt || "";
        if (!ta && !tb) return 0;
        if (!ta) return 1;
        if (!tb) return -1;
        return ta < tb ? 1 : -1;
      });

      filtered = incidents.slice();
      renderList();
    } catch (err) {
      console.error(err);
      if (listEl) {
        listEl.innerHTML = `<p style="padding: 12px; color:#b00;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</p>`;
      }
    }
  }

  function renderList() {
  	if (!listEl) return;
  	listEl.innerHTML = "";

  	if (!filtered.length) {
  		listEl.innerHTML =
  		`<p style="text-align:center; margin-top:24px; color:#666;">ยังไม่มีเหตุที่อนุมัติแล้ว/เสร็จสิ้น</p>`;
  		return;
  	}

  	filtered.forEach((inc) => {
  		const card = document.createElement("article");
  		card.className = "feed-card"; 

  		const imgUrl =
  		inc.images && inc.images.length ? s3UrlFromKey(inc.images[0]) : null;
  		
  		const timeText = formatTime(inc.reportedAt || inc.createdAt); 
  		
  		const title = escapeHtml(inc.title);
  		const location = escapeHtml(inc.location);
  		const desc = escapeHtml(inc.description);
  		const descShort =
  		desc.length > 70 ? desc.substring(0, 70).trim() + "…" : desc;
  		
  		const statusLower = (inc.status || "").toLowerCase();
  		const statusClass = (statusLower === 'finish' || statusLower === 'done') ? 'status-finished' : '';
  		const statusText = statusLabelThai(inc.status);

  		card.innerHTML = `
  		<div class="feed-body">
  			${
  			imgUrl 
  			? `
  			<div class="feed-image-wrap">
  			<img src="${imgUrl}" class="feed-image"
  					alt="incident image"
  					onerror="this.parentElement.style.display='none';" />
  			</div>
  			`
  			: ""
  			}

  			<div class="feed-text-wrap">
  			<div class="feed-header">
  				<h3 class="feed-title">${title}</h3>
  				<button class="feed-toggle-btn" aria-label="ดูรายละเอียด">▾</button>
  			</div>

  			<div class="feed-meta">
  				<span>📍 ${location}</span>
  				<span>🕒 ${timeText}</span>
  			</div>

  			<span class="feed-status-chip ${statusClass}">${statusText}</span>

  			<div class="feed-extra" style="display:none;">
  				<p><strong>รายละเอียดเต็ม:</strong> ${desc}</p>
  				<p><strong>สถานะ:</strong> ${statusText} (${inc.status})</p>
  				<p><strong>ผู้รายงาน:</strong> ${escapeHtml(inc.reportedBy)}</p>

  				<div class="feed-actions">
  				<button class="feed-edit-btn">แก้ไข</button>
  				<button class="feed-delete-btn">ลบ</button>
  				</div>
  			</div>
  			</div>
  		</div>
  		`;

  		const extra = card.querySelector(".feed-extra");
  		const toggleBtn = card.querySelector(".feed-toggle-btn");
  		const statusChip = card.querySelector(".feed-status-chip");
  		const descShortEl = card.querySelector(".feed-desc-short"); 

  		toggleBtn.addEventListener("click", () => {
  		const showing = extra.style.display === "block";

  		if (showing) {
  			extra.style.display = "none";
  			toggleBtn.textContent = "▾";
  			if (statusChip) statusChip.style.display = "inline-block";
  			if (descShortEl) descShortEl.style.display = "block"; 
  		} else {
  			extra.style.display = "block";
  			toggleBtn.textContent = "▴";
  			if (statusChip) statusChip.style.display = "none";
  			if (descShortEl) descShortEl.style.display = "none"; 
  		}
  		});
  		
  		const editBtn = card.querySelector(".feed-edit-btn");
  		editBtn.addEventListener("click", async () => {
  		await handleEditIncident(inc);
  		});

  		const deleteBtn = card.querySelector(".feed-delete-btn");
  		deleteBtn.addEventListener("click", async () => {
  		await handleDeleteIncident(inc);
  		});

  		listEl.appendChild(card);
  	});
  }

  async function handleEditIncident(inc) {
    try {
      const newTitle = window.prompt("แก้ไขหัวข้อ", inc.title);
      if (newTitle === null) return;

      const newLocation = window.prompt("แก้ไขสถานที่", inc.location);
      if (newLocation === null) return;

      const newDesc = window.prompt("แก้ไขรายละเอียด", inc.description);
      if (newDesc === null) return;

      const baseStatus = (inc.status || "approved").toLowerCase();
      const defaultStatus = baseStatus === "approved" ? "finish" : baseStatus;

      const newStatus = window.prompt(
        "สถานะ (approved = กำลังดำเนินการแก้ไข, finish = ดำเนินการเเก้ไขเสร็จสิ้น)",
        defaultStatus
      );
      if (newStatus === null) return;

      const s = newStatus.trim().toLowerCase();
      if (s !== "approved" && s !== "finish") {
        alert("สถานะต้องเป็น approved หรือ finish เท่านั้น");
        return;
      }

      await updateIncident(inc.id, {
        title: newTitle.trim() || inc.title,
        location: newLocation.trim() || inc.location,
        description: newDesc.trim() || inc.description,
        status: s,
      });

      inc.title = newTitle.trim() || inc.title;
      inc.location = newLocation.trim() || inc.location;
      inc.description = newDesc.trim() || inc.description;
      inc.status = s;

      renderList();
      alert("✅ แก้ไขรายงานสำเร็จ");
    } catch (err) {
      console.error(err);
      alert("❌ แก้ไขไม่สำเร็จ: " + err.message);
    }
  }

  async function updateIncident(id, changes) {
    console.log("PUT", ENDPOINTS.update(id), changes);
    const res = await fetch(ENDPOINTS.update(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({
        ...changes,
        admin: userEmail || "admin",
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "อัปเดต incident ไม่สำเร็จ");
    }
  }

  async function handleDeleteIncident(inc) {
    const sure = window.confirm(
      `ต้องการลบเหตุ "${inc.title}" จริงหรือไม่?\n\nข้อมูลจะถูกลบออกจากระบบทั้งหมด (รวมรูปใน S3)`
    );
    if (!sure) return;

    try {
      console.log("DELETE", ENDPOINTS.delete(inc.id));
      const res = await fetch(ENDPOINTS.delete(inc.id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({ admin: userEmail || "admin" }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "ลบ incident ไม่สำเร็จ");
      }

      incidents = incidents.filter((x) => x.id !== inc.id);
      filtered = filtered.filter((x) => x.id !== inc.id);
      renderList();
      alert("✅ ลบเหตุเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      alert("❌ ลบไม่สำเร็จ: " + err.message);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      filtered = !q
        ? incidents.slice()
        : incidents.filter((r) =>
            (r.title || "").toLowerCase().includes(q) ||
            (r.location || "").toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q) ||
            (r.status || "").toLowerCase().includes(q) ||
            (r.reportedBy || "").toLowerCase().includes(q)
          );
      renderList();
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  loadAdminFeed();
});
