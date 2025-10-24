document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("statusList");
    const reports = JSON.parse(localStorage.getItem("userReports")) || [];

    if (reports.length === 0) {
        list.innerHTML = "<p>No reports yet.</p>";
        return;
    }

    reports.forEach(r => {
        const div = document.createElement("div");
        div.className = "report-card";
        div.innerHTML = `
            <h3>${r.title}</h3>
            <p><strong>Location:</strong> ${r.position}</p>
            <p><strong>Description:</strong> ${r.desc}</p>
            ${r.image ? `<img src="${r.image}" style="max-width:200px;border-radius:8px;">` : ""}
            <p><strong>Status:</strong> <span class="status ${r.status.toLowerCase()}">${r.status}</span></p>
            <p><small>${r.date}</small></p>
          `;
        list.appendChild(div);
    });
});