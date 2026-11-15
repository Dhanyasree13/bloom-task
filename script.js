"use strict";
const KEY = "bloom-tasks-week3";
function getEl(id) {
    const item = document.getElementById(id);
    if (!item)
        throw new Error(`Missing element: ${id}`);
    return item;
}
function isPriority(value) {
    return value === "Low" || value === "Medium" || value === "High";
}
function isTask(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const t = value;
    return typeof t.id === "string" && typeof t.text === "string" &&
        typeof t.date === "string" && isPriority(t.priority) && typeof t.completed === "boolean";
}
function loadTasks() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(isTask) : [];
    }
    catch (_a) {
        return [];
    }
}
let tasks = loadTasks();
let filter = "all";
let seconds = 25 * 60;
let timer = null;
function save() { try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
}
catch (_a) {
    alert("Could not save tasks in this browser.");
} }
function go(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("shown"));
    getEl(page).classList.add("shown");
    document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.page === page));
    const titles = { home: "Good day, planner! ☀️", tasks: "Your task collection ✨", focus: "Find your flow 🌿", insights: "Your progress story ✨", settings: "A space that feels like yours ⚙" };
    getEl("heading").textContent = titles[page];
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function addTask(e) {
    e.preventDefault();
    const input = getEl("taskInput");
    const text = input.value.trim();
    const p = getEl("priority").value;
    if (!text) {
        alert("Please enter a task.");
        return;
    }
    if (!isPriority(p))
        return;
    tasks.unshift({ id: crypto.randomUUID(), text, date: getEl("dueDate").value, priority: p, completed: false });
    save();
    getEl("taskForm").reset();
    render();
    input.focus();
}
function removeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task && confirm(`Delete "${task.text}"?`)) {
        tasks = tasks.filter(t => t.id !== id);
        save();
        render();
    }
}
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task)
        return;
    const value = prompt("Edit task:", task.text);
    if (value === null)
        return;
    if (!value.trim()) {
        alert("Task cannot be empty.");
        return;
    }
    task.text = value.trim();
    save();
    render();
}
function toggleTask(id) { const t = tasks.find(x => x.id === id); if (t) {
    t.completed = !t.completed;
    save();
    render();
} }
function clearCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (!count) {
        alert("No completed tasks to clear.");
        return;
    }
    if (confirm(`Clear ${count} completed task(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        save();
        render();
    }
}
function button(label, cls, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.className = cls;
    b.addEventListener("click", fn);
    return b;
}
function renderList() {
    const list = getEl("list");
    list.replaceChildren();
    const term = getEl("search").value.toLowerCase();
    const visible = tasks.filter(t => t.text.toLowerCase().includes(term) && (filter === "all" || (filter === "active" && !t.completed) || (filter === "completed" && t.completed)));
    visible.forEach(t => {
        const li = document.createElement("li");
        li.className = t.completed ? "task done" : "task";
        const info = document.createElement("div");
        const name = document.createElement("b");
        name.textContent = t.text;
        const meta = document.createElement("small");
        meta.textContent = `${t.date || "No due date"} · ${t.priority} priority`;
        info.append(name, meta);
        const actions = document.createElement("div");
        actions.className = "actions";
        actions.append(button(t.completed ? "Undo" : "Done", "done", () => toggleTask(t.id)), button("Edit", "edit", () => editTask(t.id)), button("Delete", "delete", () => removeTask(t.id)));
        li.append(info, actions);
        list.append(li);
    });
    getEl("empty").style.display = visible.length ? "none" : "block";
    document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
}
function updateStats() {
    const total = tasks.length, done = tasks.filter(t => t.completed).length, pending = total - done, rate = total ? Math.round(done / total * 100) : 0;
    getEl("total").textContent = String(total);
    getEl("done").textContent = String(done);
    getEl("pending").textContent = String(pending);
    getEl("percent").textContent = `${rate}%`;
    getEl("bar").style.width = `${rate}%`;
    getEl("progressText").textContent = rate === 100 && total ? "Amazing! You completed everything 🎉" : "Every completed task is a little victory.";
    getEl("navCount").textContent = String(pending);
    getEl("iDone").textContent = String(done);
    getEl("iRate").textContent = `${rate}%`;
    getEl("iHigh").textContent = String(tasks.filter(t => !t.completed && t.priority === "High").length);
    const upcoming = getEl("upcoming");
    upcoming.replaceChildren();
    tasks.filter(t => !t.completed).slice(0, 3).forEach(t => { const li = document.createElement("li"); li.textContent = `${t.text} — ${t.date || t.priority}`; upcoming.append(li); });
    getEl("upcomingEmpty").style.display = upcoming.children.length ? "none" : "block";
}
function render() { renderList(); updateStats(); }
function showClock() { getEl("clock").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function stopClock() { if (timer !== null)
    clearInterval(timer); timer = null; getEl("start").textContent = "Start focus"; }
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => { const p = b.dataset.page; go(p); }));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
getEl("newTask").addEventListener("click", () => { go("tasks"); getEl("taskInput").focus(); });
getEl("taskForm").addEventListener("submit", addTask);
getEl("search").addEventListener("input", renderList);
document.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter; renderList(); }));
getEl("clear").addEventListener("click", clearCompleted);
getEl("clearSettings").addEventListener("click", clearCompleted);
getEl("start").addEventListener("click", () => {
    if (timer !== null) {
        stopClock();
        getEl("timerStatus").textContent = "Paused. Take a breath.";
        return;
    }
    getEl("start").textContent = "Pause";
    getEl("timerStatus").textContent = "You're in your focus zone 🌿";
    timer = window.setInterval(() => { seconds--; showClock(); if (seconds <= 0) {
        stopClock();
        getEl("timerStatus").textContent = "Beautiful work! Time for a break 🎉";
    } }, 1000);
});
function resetClock(min = 25) { stopClock(); seconds = min * 60; showClock(); getEl("timerStatus").textContent = "Ready when you are. You can do this."; }
getEl("reset").addEventListener("click", () => resetClock());
document.querySelectorAll("[data-min]").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll("[data-min]").forEach(x => x.classList.remove("chosen"));
    b.classList.add("chosen");
    resetClock(Number(b.dataset.min));
}));
getEl("today").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
render();
showClock();


// Colour theme selection (saved in this browser)
const THEME_KEY = "bloom-tasks-theme";
const availableThemes = ["sage", "sunshine", "lavender", "rose", "ocean", "dark"];
function applyTheme(theme) {
    const chosen = availableThemes.includes(theme) ? theme : "sage";
    document.body.dataset.theme = chosen;
    try { localStorage.setItem(THEME_KEY, chosen); } catch (_a) {}
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
        const active = button.dataset.themeChoice === chosen;
        button.classList.toggle("selected", active);
        button.setAttribute("aria-pressed", String(active));
    });
    const status = document.getElementById("themeStatus");
    if (status) status.textContent = `${chosen.charAt(0).toUpperCase() + chosen.slice(1)} theme selected`;
}
document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeChoice || "sage"));
});
let savedTheme = "sage";
try { savedTheme = localStorage.getItem(THEME_KEY) || "sage"; } catch (_a) {}
applyTheme(savedTheme);
