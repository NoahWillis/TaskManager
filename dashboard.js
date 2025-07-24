document.addEventListener("DOMContentLoaded", () => {
  const projectsContainer = document.getElementById("projectsList");
  const confirmModal = document.getElementById("confirmModal");
  const confirmText = document.querySelector(".confirmation-text");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

  const projectModal = document.getElementById("projectModal");
  const closeProjectModal = document.getElementById("closeProjectModal");
  const projectForm = document.getElementById("projectForm");
  const projectNameInput = document.getElementById("projectName");
  const createProjectBtn = document.getElementById("createProjectBtn");
  const modalTitle = document.getElementById("projectModalTitle");
  const submitProjectBtn = document.getElementById("submitProjectBtn");

  let projects = JSON.parse(localStorage.getItem("projects")) || [];
  let deleteTargetId = null;
  let isEditing = false;
  let editingProjectId = null;

  function renderProjects() {
    projectsContainer.innerHTML = "";

    projects.forEach(project => {
      const card = document.createElement("div");
      card.className = "project-card";

      const projectBtn = document.createElement("button");
      projectBtn.className = "project-button";
      projectBtn.textContent = project.name;
      projectBtn.onclick = () => {
        localStorage.setItem("currentProjectId", project.id);
        window.location.href = "index.html";
      };

      const actions = document.createElement("div");
      actions.className = "project-actions";

      const editBtn = document.createElement("button");
      editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
      editBtn.style.color = "#888"; 
      editBtn.onclick = (e) => {
        e.stopPropagation();
        isEditing = true;
        editingProjectId = project.id;
        modalTitle.textContent = "Edit Project";
        submitProjectBtn.textContent = "Save Changes";
        projectNameInput.value = project.name;
        projectModal.classList.add("active");
        document.body.style.overflow = "hidden";
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
      deleteBtn.classList.add("delete-btn");
      deleteBtn.style.color = "#888"; 
      deleteBtn.onmouseenter = () => deleteBtn.style.color = "#e53935";
      deleteBtn.onmouseleave = () => deleteBtn.style.color = "#888";

      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteTargetId = project.id;
        confirmText.textContent = `Are you sure you want to delete "${project.name}"?`;
        openConfirmModal();
      };

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(projectBtn);
      card.appendChild(actions);
      projectsContainer.appendChild(card);
    });

    // Show/hide empty state if needed
    document.getElementById("emptyState").style.display = projects.length === 0 ? "block" : "none";
  }

  // Show modal for new project
  createProjectBtn.onclick = () => {
    isEditing = false;
    editingProjectId = null;
    modalTitle.textContent = "New Project";
    submitProjectBtn.textContent = "Create Project";
    projectNameInput.value = "";
    projectModal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  // Handle modal form submit (create/edit)
  projectForm.onsubmit = (e) => {
    e.preventDefault();
    const name = projectNameInput.value.trim();
    if (!name) return;

    if (isEditing && editingProjectId) {
      const project = projects.find(p => p.id === editingProjectId);
      if (project) project.name = name;
    } else {
      const newProject = {
        id: crypto.randomUUID(),
        name,
        tasks: []
      };
      projects.push(newProject);
      localStorage.setItem("projects", JSON.stringify(projects));
      localStorage.setItem("currentProjectId", newProject.id);
      window.location.href = "index.html";
      return;
    }

    localStorage.setItem("projects", JSON.stringify(projects));
    closeProjectModalFn();
    renderProjects();
  };

  closeProjectModal.onclick = () => closeProjectModalFn();

  function closeProjectModalFn() {
    projectModal.classList.remove("active");
    document.body.style.overflow = "";
    isEditing = false;
    editingProjectId = null;
  }

  confirmDeleteBtn.onclick = () => {
    if (!deleteTargetId) return;
    projects = projects.filter(p => p.id !== deleteTargetId);
    localStorage.setItem("projects", JSON.stringify(projects));
    deleteTargetId = null;
    closeConfirmModal();
    renderProjects();
  };

  cancelDeleteBtn.onclick = () => {
    deleteTargetId = null;
    closeConfirmModal();
  };

  function openConfirmModal() {
    confirmModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeConfirmModal() {
    confirmModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  renderProjects();
});
