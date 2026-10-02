let site = null;

const $ = (id) => document.getElementById(id);

async function loadSite() {
  const res = await fetch("/api/site");
  site = await res.json();

  $("name").value = site.profile.name || "";
  $("tagline").value = site.profile.tagline || "";
  $("banner").value = site.profile.banner || "";
  $("bio").value = site.profile.bio || "";
  $("about_me").value = site.profile.about_me || "";
  $("tags").value = (site.profile.tags || []).join(", ");
  $("profile-preview").src = site.profile.photo || "";

  renderProjects();
  renderTimeline();
  renderLinks();
}

function renderProjects() {
  $("projects-editor").innerHTML = site.projects.map((p, i) => `
    <div class="editor-row project-editor">
      <div>
        <input value="${esc(p.title)}" placeholder="Project name"
          oninput="site.projects[${i}].title=this.value">
        <textarea placeholder="Description"
          oninput="site.projects[${i}].description=this.value">${esc(p.description)}</textarea>
      </div>

      <div>
        <label>Status</label>
        <select onchange="site.projects[${i}].status=this.value">
          ${["Planning","In Development","Completed","Paused"].map(s => `<option ${s===p.status?"selected":""}>${s}</option>`).join("")}
        </select>

        <label>Progress: <span id="progress-label-${i}">${p.progress}</span>%</label>
        <input type="range" min="0" max="100" value="${p.progress}"
          oninput="site.projects[${i}].progress=Number(this.value);$('progress-label-${i}').textContent=this.value">
      </div>

      <div class="project-banner-editor">
        <div class="mini-banner" style="${p.banner ? `background-image:url('${p.banner}')` : ""}">
          ${p.banner ? "" : "NO BANNER"}
        </div>
        <input type="file" accept="image/*" onchange="uploadProjectBanner(${i}, this)">
        <small>Choose a banner image</small>
      </div>

      <button class="danger" onclick="site.projects.splice(${i},1);renderProjects()">Delete</button>
    </div>`).join("");
}

function renderTimeline() {
  $("timeline-editor").innerHTML = site.timeline.map((x, i) => `
    <div class="editor-row two">
      <input value="${esc(x.year)}" oninput="site.timeline[${i}].year=this.value">
      <input value="${esc(x.text)}" oninput="site.timeline[${i}].text=this.value">
      <button class="danger" onclick="site.timeline.splice(${i},1);renderTimeline()">Delete</button>
    </div>`).join("");
}

function renderLinks() {
  $("links-editor").innerHTML = site.links.map((x, i) => `
    <div class="editor-row two">
      <input value="${esc(x.name)}" oninput="site.links[${i}].name=this.value">
      <input value="${esc(x.url)}" oninput="site.links[${i}].url=this.value">
      <button class="danger" onclick="site.links.splice(${i},1);renderLinks()">Delete</button>
    </div>`).join("");
}

function addProject() {
  site.projects.push({
    title:"New Project",
    description:"Describe the project.",
    status:"Planning",
    progress:0,
    banner:""
  });
  renderProjects();
}

function addTimeline() {
  site.timeline.push({year:"NOW",text:"New milestone."});
  renderTimeline();
}

function addLink() {
  site.links.push({name:"New Link",url:"https://"});
  renderLinks();
}

async function uploadProfilePhoto() {
  const file = $("profile-photo-file").files[0];
  if (!file) return alert("Choose a photo first.");

  const form = new FormData();
  form.append("file", file);
  form.append("kind", "profile");

  const res = await fetch("/api/upload", {method:"POST", body:form});
  const data = await res.json();

  if (!data.ok) return alert(data.error || "Upload failed.");
  site.profile.photo = data.url;
  $("profile-preview").src = data.url;
  showMessage("Profile photo uploaded. Click SAVE EVERYTHING.");
}

async function uploadProjectBanner(index, input) {
  const file = input.files[0];
  if (!file) return;

  const form = new FormData();
  form.append("file", file);
  form.append("kind", `project_${index}`);

  const res = await fetch("/api/upload", {method:"POST", body:form});
  const data = await res.json();

  if (!data.ok) return alert(data.error || "Upload failed.");
  site.projects[index].banner = data.url;
  renderProjects();
  showMessage("Project banner uploaded. Click SAVE EVERYTHING.");
}

async function saveAll() {
  // Explicit getElementById calls fix the old "name" field problem.
  site.profile.name = $("name").value;
  site.profile.tagline = $("tagline").value;
  site.profile.banner = $("banner").value;
  site.profile.bio = $("bio").value;
  site.profile.about_me = $("about_me").value;
  site.profile.tags = $("tags").value.split(",").map(x => x.trim()).filter(Boolean);

  const res = await fetch("/api/site", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(site)
  });

  const data = await res.json();
  showMessage(data.ok ? "✓ Saved! Open/refresh the public site to see the changes." : "Save failed.");
}

function showMessage(text) {
  $("message").textContent = text;
  setTimeout(() => $("message").textContent="", 3500);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

document.querySelectorAll(".sidebar button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".sidebar button").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(x => x.classList.add("hidden"));
    btn.classList.add("active");
    $("tab-"+btn.dataset.tab).classList.remove("hidden");
  };
});

loadSite();
