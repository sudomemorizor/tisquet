const fs = require('fs');
const path = require('path');

const taskFile = path.join(__dirname, 'tasks.json');
const settingsFile = path.join(__dirname, 'settings.json');

// Global settings variable, accessible everywhere
let settings = {};
let hideDone = false;
let deleteIndex = null; // index of task pending deletion

// Load & save settings
function loadSettings() {
  if (fs.existsSync(settingsFile)) {
    try {
      return JSON.parse(fs.readFileSync(settingsFile));
    } catch {
      return {};
    }
  }
  return {};
}

function saveSettings(settings) {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// Load & save tasks
function loadTasks() {
  if (fs.existsSync(taskFile)) {
    const data = fs.readFileSync(taskFile);
    return JSON.parse(data);
  }
  return [];
}

function saveTasks(tasks) {
  fs.writeFileSync(taskFile, JSON.stringify(tasks, null, 2));
}

// Render tasks and attach event handlers
function renderTasks(tasks) {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  tasks.forEach((task, index) => {
    if (hideDone && task.done) return; // skip done tasks if hidden

    const li = document.createElement('li');
    li.className = 'task';

    const span = document.createElement('span');
    span.textContent = task.text;
    if (task.done) {
      span.classList.add('done-text');
      li.classList.add('done-task');
    } else {
      span.classList.remove('done-text');
      li.classList.remove('done-task');
    }

    const controls = document.createElement('div');
    controls.style.display = 'flex';

    // Done button
    const doneBtn = document.createElement('button');
    doneBtn.innerHTML = `<i class="fas fa-check icon-adjust"></i>`;
    doneBtn.classList.add('done');
    doneBtn.title = task.done ? 'Mark as Undone' : 'Mark as Done';
    doneBtn.onclick = () => {
      tasks[index].done = !tasks[index].done;
      saveTasks(tasks);
      renderTasks(tasks);
    };

    // Edit Note button
    const noteBtn = document.createElement('button');
    noteBtn.innerHTML = '<i class="fas fa-pen"></i>';
    noteBtn.classList.add('edit-note');
    noteBtn.title = 'Edit Note';
    noteBtn.onclick = () => {
      showNoteEditor(li, task, index, tasks);
    };

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.classList.add('trash');
    deleteBtn.title = 'Delete Task';
    deleteBtn.onclick = () => {
      if (settings.confirmDelete) {
        deleteIndex = index;
        showDeleteModal();
      } else {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks(tasks);
      }
    };

    controls.appendChild(doneBtn);
    controls.appendChild(noteBtn);
    controls.appendChild(deleteBtn);

    const wrapper = document.createElement('div');
    wrapper.appendChild(span);
    wrapper.appendChild(controls);

    li.appendChild(wrapper);

    if (task.note) {
      const noteEl = document.createElement('div');
      noteEl.classList.add('note');
      noteEl.textContent = `📝 ${task.note}`;
      noteEl.style.fontSize = '0.9em';
      noteEl.style.color = '#999';
      noteEl.style.marginTop = '5px';
      li.appendChild(noteEl);
    }

    list.appendChild(li);
  });
}

function showNoteEditor(container, task, index, tasks) {
  const existingEditor = document.querySelector('.note-editor');
  if (existingEditor) {
    existingEditor.remove();
  }

  const editorWrapper = document.createElement('div');
  editorWrapper.className = 'note-editor';

  const textarea = document.createElement('textarea');
  textarea.value = task.note || '';
  textarea.rows = 4;
  textarea.style.width = '100%';
  textarea.style.marginTop = '10px';

  const buttonRow = document.createElement('div');
  buttonRow.style.marginTop = '5px';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Note';
  saveBtn.onclick = () => {
    tasks[index].note = textarea.value;
    saveTasks(tasks);
    renderTasks(tasks);
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    editorWrapper.remove();
  };

  buttonRow.appendChild(saveBtn);
  buttonRow.appendChild(cancelBtn);

  editorWrapper.appendChild(textarea);
  editorWrapper.appendChild(buttonRow);

  container.appendChild(editorWrapper);
}

function applyDarkMode(enabled) {
  if (enabled) {
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
  }
}


function showDeleteModal() {
  const modal = document.getElementById('delete-confirmation-modal');
  modal.classList.remove('hidden');
}

function hideDeleteModal() {
  const modal = document.getElementById('delete-confirmation-modal');
  modal.classList.add('hidden');
}

// Main initialization
window.addEventListener('DOMContentLoaded', () => {
  // Load settings and tasks
  settings = loadSettings();
  const tasks = loadTasks();

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
    }
    });

    window.addEventListener('mousedown', function() {
    document.body.classList.remove('user-is-tabbing');
    });

  // Elements
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsIcon = document.getElementById('settings-icon');
  const confirmDeleteToggle = document.getElementById('confirm-delete-toggle');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const input = document.getElementById('task-input');
  const button = document.getElementById('add-task');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

  // Initialize UI toggles from settings
  confirmDeleteToggle.checked = settings.confirmDelete ?? true;
  darkModeToggle.checked = settings.darkMode ?? true;
  applyDarkMode(settings.darkMode ?? true);

  // Settings toggle button
  settingsToggle.addEventListener('click', () => {
    const isOpen = settingsPanel.classList.toggle('active');

    if (isOpen) {
      settingsIcon.classList.remove('fa-gear');
      settingsIcon.classList.add('fa-xmark');
    } else {
      settingsIcon.classList.remove('fa-xmark');
      settingsIcon.classList.add('fa-gear');
    }

    settingsIcon.style.transition = 'transform 0.3s ease';
    settingsIcon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  });

  // Settings toggle change handlers
  confirmDeleteToggle.addEventListener('change', () => {
    settings.confirmDelete = confirmDeleteToggle.checked;
    saveSettings(settings);
  });

  darkModeToggle.addEventListener('change', () => {
    settings.darkMode = darkModeToggle.checked;
    saveSettings(settings);
    applyDarkMode(settings.darkMode);
  });

  // Add task button handler
  button.addEventListener('click', () => {
    const text = input.value.trim();
    if (text === '') return;
    tasks.push({ text, done: false, note: '' });
    input.value = '';
    saveTasks(tasks);
    renderTasks(tasks);
  });

  //Hide Done handler
  const toggleHideDoneBtn = document.getElementById('toggle-hide-done');
  function updateHideDoneButton() {
  const icon = toggleHideDoneBtn.querySelector('i');
  if (hideDone) {
    icon.classList.replace('fa-eye', 'fa-eye-slash');
    toggleHideDoneBtn.setAttribute('aria-pressed', 'true');
    toggleHideDoneBtn.title = 'Show done tasks';
  } else {
    icon.classList.replace('fa-eye-slash', 'fa-eye');
    toggleHideDoneBtn.setAttribute('aria-pressed', 'false');
    toggleHideDoneBtn.title = 'Hide done tasks';
  }
}

toggleHideDoneBtn.addEventListener('click', () => {
  hideDone = !hideDone;
  settings.hideDone = hideDone;  // save state
  saveSettings(settings);
  updateHideDoneButton();
  renderTasks(tasks);
});

// Initialize button on load
hideDone = settings.hideDone ?? false;
updateHideDoneButton();

  // Delete modal buttons handlers
  confirmDeleteBtn.addEventListener('click', () => {
    if (deleteIndex !== null) {
      tasks.splice(deleteIndex, 1);
      saveTasks(tasks);
      renderTasks(tasks);
      deleteIndex = null;
    }
    hideDeleteModal();
  });

  cancelDeleteBtn.addEventListener('click', () => {
    deleteIndex = null;
    hideDeleteModal();
  });

  // Initial render
  renderTasks(tasks);
});