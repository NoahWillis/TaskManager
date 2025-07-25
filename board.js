document.addEventListener("DOMContentLoaded", () => {
  let projects = JSON.parse(localStorage.getItem("projects")) || [];
  let currentProjectId = localStorage.getItem("currentProjectId");
  const savedScrollSetting = localStorage.getItem("scrollEnabled");

  const backBtn = document.getElementById("backToDashboardBtn");
  const workForm = document.getElementById("workForm");
  const workTitle = document.getElementById("workTitle");
  const workContent = document.getElementById("workContent");
  const workStatus = document.getElementById("workStatus");
  const workDueDate = document.getElementById("workDueDate");

  const notStartedContainer = document.getElementById("notStartedContainer");
  const inProgressContainer = document.getElementById("inProgressContainer");
  const completedContainer = document.getElementById("completedContainer");
  const emptyState = document.getElementById("emptyState");
  const boardTitle = document.getElementById("boardTitle");

  const addWorkBtn = document.getElementById("addWorkBtn");
  const deleteProjectBtn = document.getElementById("deleteProjectBtn");
  const taskModal = document.getElementById("addWorkModel");
  const closeModelBtn = document.getElementById("closeModelBtn");
  const confirmModal = document.getElementById("confirmModel");
  const confirmText = confirmModal.querySelector(".confirmation-text");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const scrollToggle = document.getElementById("scrollToggleCheckbox");

  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");

  const colorPicker = document.getElementById("colorPicker");
  const colorButton = document.getElementById('colorPickerBtn');

  let deleteTarget = null;
  let editingTaskIndex = null;

  const proj = projects.find(p => p.id === currentProjectId);
  if (!proj) return window.location.href = "dashboard.html";

  boardTitle.textContent = proj.name;

  let history = [];
  let future = [];

  function saveHistory() {
    history.push(JSON.stringify(proj.tasks));
    if (history.length > 50) history.shift(); // limit history size
    future = []; // clear redo stack on new action
  }

  function undo() {
    if (history.length === 0) return;
    future.push(JSON.stringify(proj.tasks));
    proj.tasks = JSON.parse(history.pop());
    saveAndRender();
  }

  function redo() {
    if (future.length === 0) return;
    history.push(JSON.stringify(proj.tasks));
    proj.tasks = JSON.parse(future.pop());
    saveAndRender();
  }

  undoBtn?.addEventListener("click", undo);
  redoBtn?.addEventListener("click", redo);

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    }
    if (e.ctrlKey && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  });

  document.getElementById("bulletBtn").addEventListener("click", () => {
    document.execCommand("insertUnorderedList");
  });

  openSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("active");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("active");
  });

  if (savedScrollSetting === "true") {
    enablePageScroll();
    scrollToggle.checked = true;
  } else {
    disablePageScroll();
    scrollToggle.checked = false;
  }

  scrollToggle.addEventListener("change", (e) => {
    const isEnabled = e.target.checked;
    localStorage.setItem("scrollEnabled", isEnabled);

    if (isEnabled) {
      enablePageScroll();
    } else {
      disablePageScroll();
    }
  });

  function enablePageScroll() {
    document.body.style.height = "auto";
    document.body.style.overflowY = "auto";
    document.querySelectorAll(".works-list").forEach(el => {
      el.style.overflowY = "visible";
    });
  }

  function disablePageScroll() {
    document.body.style.height = "100vh";
    document.body.style.overflowY = "hidden";
    document.querySelectorAll(".works-list").forEach(el => {
      el.style.overflowY = "auto";
    });
  }

  colorPicker.addEventListener("input", () => {
    const selectedColor = colorPicker.value;
    document.execCommand("foreColor", false, selectedColor);
  });

  addWorkBtn.onclick = () => openTaskModal();
  closeModelBtn.onclick = () => {
    taskModal.classList.remove("active");
    document.body.style.overflow = "";
  };
  backBtn.onclick = () => window.location.href = "dashboard.html";

  deleteProjectBtn.onclick = () => {
    deleteTarget = "project";
    confirmText.textContent = `Are you sure you want to delete the project "${proj.name}"?`;
    openConfirmModal();
  };
  cancelDeleteBtn.onclick = () => closeConfirmModal();

  confirmDeleteBtn.onclick = () => {
    if (deleteTarget === "project") {
      projects = projects.filter(p => p.id !== currentProjectId);
      localStorage.setItem("projects", JSON.stringify(projects));
      localStorage.removeItem("currentProjectId");
      window.location.href = "dashboard.html";
    }
    else if (deleteTarget && typeof deleteTarget.taskIndex === "number") {
      saveHistory(); // Save before deleting
      proj.tasks.splice(deleteTarget.taskIndex, 1);
      saveAndRender();
      closeConfirmModal();
    }
  };

  workForm.onsubmit = e => {
    e.preventDefault();
    const task = {
      title: workTitle.value.trim(),
      content: workContent.innerHTML,
      status: workStatus.value,
      dueDate: workDueDate.value,
      date: new Date().toISOString()
    };
    saveHistory(); // Save before adding or editing
    if (editingTaskIndex == null) proj.tasks.unshift(task);
    else proj.tasks[editingTaskIndex] = task;

    saveAndRender();
    taskModal.classList.remove("active");
    document.body.style.overflow = "";
  };

  function openTaskModal(idx = null) {
    editingTaskIndex = idx;
    document.querySelector(".model-title").textContent = idx !== null ? "Edit Task" : "New Task";
    if (idx !== null) {
      const t = proj.tasks[idx];
      workTitle.value = t.title;
      workContent.innerHTML = t.content;
      workStatus.value = t.status;
      workDueDate.value = t.dueDate;
      document.querySelector(".model-title").textContent = "Edit Task";

      document.querySelector(".submit-btn").textContent = "Save Task";

    } else {
      workForm.reset();
      workContent.innerHTML = "";
      document.querySelector(".model-title").textContent = "New Task";

      document.querySelector(".submit-btn").textContent = "Create Task";
    }
    taskModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function saveAndRender() {
    localStorage.setItem("projects", JSON.stringify(projects));
    renderTasks();
  }

  function renderTasks() {
    [notStartedContainer, inProgressContainer, completedContainer].forEach(c => c.innerHTML = "");
    proj.tasks.forEach((work, index) => {
      const card = document.createElement("div");
      card.className = "work-card";
      card.setAttribute("data-task-id", work.date);
      card.innerHTML = `
        <div class="work-content">
          <div class="work-header">
            <h3 class="work-title">${work.title}</h3>
            <div class="work-actions">
              <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
              <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div class="status-and-due">
            <span class="status-badge status-${work.status}">${work.status.replace("-", " ")}</span>
            ${work.dueDate ? `<span class="due-date-badge">Due: ${formatDate(work.dueDate)}</span>` : ""}
          </div>
          <p class="work-text">${work.content}</p>
          <div class="work-footer">
            <small class="created-date">Created: ${formatDate(work.date)}</small>
          </div>
        </div>
      `;

      card.querySelector(".edit-btn").onclick = () => openTaskModal(index);
      card.querySelector(".delete-btn").onclick = () => {
        deleteTarget = { taskIndex: index };
        confirmText.textContent = `Are you sure you want to delete the task "${work.title}"?`;
        openConfirmModal();
      };

      appendToColumn(card, work.status);
    });

    emptyState.style.display = proj.tasks.length ? "none" : "block";
  }

  function appendToColumn(card, status) {
    if (status === "in-progress") inProgressContainer.appendChild(card);
    else if (status === "completed") completedContainer.appendChild(card);
    else notStartedContainer.appendChild(card);
  }

  function openConfirmModal() {
    confirmModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeConfirmModal() {
    confirmModal.classList.remove("active");
    document.body.style.overflow = "";
    deleteTarget = null;
  }

  function formatDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-US", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  const dragConfig = {
    group: "tasks",
    animation: 150,
    onEnd: e => {
      const statusMap = {
        [notStartedContainer.id]: "not-started",
        [inProgressContainer.id]: "in-progress",
        [completedContainer.id]: "completed"
      };

      const newStatus = statusMap[e.to.id];
      const draggedEl = e.item;
      const taskId = draggedEl.getAttribute("data-task-id");

      const taskIndex = proj.tasks.findIndex(t => t.date === taskId);
      if (taskIndex === -1) return;

      saveHistory(); // Save before rearranging tasks

      const task = proj.tasks[taskIndex];
      task.status = newStatus;

      proj.tasks.splice(taskIndex, 1);
      const newIndex = Array.from(e.to.children).indexOf(draggedEl);
      proj.tasks.splice(newIndex, 0, task);

      const badge = draggedEl.querySelector(".status-badge");
      if (badge) {
        badge.textContent = newStatus.replace("-", " ");
        badge.className = `status-badge status-${newStatus}`;
      }

      localStorage.setItem("projects", JSON.stringify(projects));

      saveAndRender();
    }
  };

  new Sortable(notStartedContainer, dragConfig);
  new Sortable(inProgressContainer, dragConfig);
  new Sortable(completedContainer, dragConfig);

  renderTasks();
});
