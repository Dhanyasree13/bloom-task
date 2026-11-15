// Week 3: Type-safe Bloom Tasks
type Priority = "Low" | "Medium" | "High";
type Filter = "all" | "active" | "completed";
type Page = "home" | "tasks" | "focus" | "insights" | "settings";
interface Task { id: string; text: string; date: string; priority: Priority; completed: boolean; }

const KEY = "bloom-tasks-week3";
function getEl<T extends HTMLElement>(id: string): T {
  const item = document.getElementById(id);
  if (!item) throw new Error(`Missing element: ${id}`);
  return item as T;
}
function isPriority(value: unknown): value is Priority {
  return value === "Low" || value === "Medium" || value === "High";
}
function isTask(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === "string" && typeof t.text === "string" &&
    typeof t.date === "string" && isPriority(t.priority) && typeof t.completed === "boolean";
}
function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTask) : [];
  } catch { return []; }
}
let tasks: Task[] = loadTasks();
let filter: Filter = "all";
let seconds = 25 * 60;
let timer: number | null = null;
function save(): void { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { alert("Could not save tasks in this browser."); } }
function go(page: Page): void {
  document.querySelectorAll<HTMLElement>(".page").forEach(p => p.classList.remove("shown"));
  getEl<HTMLElement>(page).classList.add("shown");
  document.querySelectorAll<HTMLButtonElement>(".nav").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  const titles: Record<Page, string> = { home: "Good day, planner! ☀️", tasks: "Your task collection ✨", focus: "Find your flow 🌿", insights: "Your progress story ✨", settings: "A space that feels like yours ⚙" };
  getEl<HTMLElement>("heading").textContent = titles[page];
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function addTask(e: SubmitEvent): void {
  e.preventDefault();
  const input = getEl<HTMLInputElement>("taskInput");
  const text = input.value.trim();
  const p = getEl<HTMLSelectElement>("priority").value;
  if (!text) { alert("Please enter a task."); return; }
  if (!isPriority(p)) return;
  tasks.unshift({ id: crypto.randomUUID(), text, date: getEl<HTMLInputElement>("dueDate").value, priority: p, completed: false });
  save(); getEl<HTMLFormElement>("taskForm").reset(); render(); input.focus();
}
function removeTask(id: string): void {
  const task = tasks.find(t => t.id === id);
  if (task && confirm(`Delete "${task.text}"?`)) { tasks = tasks.filter(t => t.id !== id); save(); render(); }
}
function editTask(id: string): void {
  const task = tasks.find(t => t.id === id); if (!task) return;
  const value = prompt("Edit task:", task.text);
  if (value === null) return;
  if (!value.trim()) { alert("Task cannot be empty."); return; }
  task.text = value.trim(); save(); render();
}
function toggleTask(id: string): void { const t = tasks.find(x => x.id === id); if (t) { t.completed = !t.completed; save(); render(); } }
function clearCompleted(): void {
  const count = tasks.filter(t => t.completed).length;
  if (!count) { alert("No completed tasks to clear."); return; }
  if (confirm(`Clear ${count} completed task(s)?`)) { tasks = tasks.filter(t => !t.completed); save(); render(); }
}
function button(label: string, cls: string, fn: () => void): HTMLButtonElement {
  const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.className = cls; b.addEventListener("click", fn); return b;
}
function renderList(): void {
  const list = getEl<HTMLUListElement>("list"); list.replaceChildren();
  const term = getEl<HTMLInputElement>("search").value.toLowerCase();
  const visible = tasks.filter(t => t.text.toLowerCase().includes(term) && (filter === "all" || (filter === "active" && !t.completed) || (filter === "completed" && t.completed)));
  visible.forEach(t => {
    const li = document.createElement("li"); li.className = t.completed ? "task done" : "task";
    const info = document.createElement("div"); const name = document.createElement("b"); name.textContent = t.text;
    const meta = document.createElement("small"); meta.textContent = `${t.date || "No due date"} · ${t.priority} priority`;
    info.append(name, meta);
    const actions = document.createElement("div"); actions.className = "actions";
    actions.append(button(t.completed ? "Undo" : "Done", "done", () => toggleTask(t.id)), button("Edit", "edit", () => editTask(t.id)), button("Delete", "delete", () => removeTask(t.id)));
    li.append(info, actions); list.append(li);
  });
  getEl<HTMLElement>("empty").style.display = visible.length ? "none" : "block";
  document.querySelectorAll<HTMLButtonElement>(".filter").forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
}
function updateStats(): void {
  const total = tasks.length, done = tasks.filter(t => t.completed).length, pending = total - done, rate = total ? Math.round(done / total * 100) : 0;
  getEl<HTMLElement>("total").textContent = String(total); getEl<HTMLElement>("done").textContent = String(done); getEl<HTMLElement>("pending").textContent = String(pending);
  getEl<HTMLElement>("percent").textContent = `${rate}%`; getEl<HTMLElement>("bar").style.width = `${rate}%`;
  getEl<HTMLElement>("progressText").textContent = rate === 100 && total ? "Amazing! You completed everything 🎉" : "Every completed task is a little victory.";
  getEl<HTMLElement>("navCount").textContent = String(pending);
  getEl<HTMLElement>("iDone").textContent = String(done); getEl<HTMLElement>("iRate").textContent = `${rate}%`;
  getEl<HTMLElement>("iHigh").textContent = String(tasks.filter(t => !t.completed && t.priority === "High").length);
  const upcoming = getEl<HTMLUListElement>("upcoming"); upcoming.replaceChildren();
  tasks.filter(t => !t.completed).slice(0, 3).forEach(t => { const li = document.createElement("li"); li.textContent = `${t.text} — ${t.date || t.priority}`; upcoming.append(li); });
  getEl<HTMLElement>("upcomingEmpty").style.display = upcoming.children.length ? "none" : "block";
}
function render(): void { renderList(); updateStats(); }
function showClock(): void { getEl<HTMLElement>("clock").textContent = `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`; }
function stopClock(): void { if (timer !== null) clearInterval(timer); timer = null; getEl<HTMLButtonElement>("start").textContent = "Start focus"; }
document.querySelectorAll<HTMLButtonElement>("[data-page]").forEach(b => b.addEventListener("click", () => { const p = b.dataset.page as Page; go(p); }));
document.querySelectorAll<HTMLButtonElement>("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go as Page)));
getEl<HTMLButtonElement>("newTask").addEventListener("click", () => { go("tasks"); getEl<HTMLInputElement>("taskInput").focus(); });
getEl<HTMLFormElement>("taskForm").addEventListener("submit", addTask);
getEl<HTMLInputElement>("search").addEventListener("input", renderList);
document.querySelectorAll<HTMLButtonElement>(".filter").forEach(b => b.addEventListener("click", () => { filter = b.dataset.filter as Filter; renderList(); }));
getEl<HTMLButtonElement>("clear").addEventListener("click", clearCompleted);
getEl<HTMLButtonElement>("clearSettings").addEventListener("click", clearCompleted);
getEl<HTMLButtonElement>("start").addEventListener("click", () => {
  if (timer !== null) { stopClock(); getEl<HTMLElement>("timerStatus").textContent = "Paused. Take a breath."; return; }
  getEl<HTMLButtonElement>("start").textContent = "Pause"; getEl<HTMLElement>("timerStatus").textContent = "You're in your focus zone 🌿";
  timer = window.setInterval(() => { seconds--; showClock(); if (seconds <= 0) { stopClock(); getEl<HTMLElement>("timerStatus").textContent = "Beautiful work! Time for a break 🎉"; } }, 1000);
});
function resetClock(min = 25): void { stopClock(); seconds = min * 60; showClock(); getEl<HTMLElement>("timerStatus").textContent = "Ready when you are. You can do this."; }
getEl<HTMLButtonElement>("reset").addEventListener("click", () => resetClock());
document.querySelectorAll<HTMLButtonElement>("[data-min]").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll("[data-min]").forEach(x => x.classList.remove("chosen")); b.classList.add("chosen"); resetClock(Number(b.dataset.min));
}));
getEl<HTMLElement>("today").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
render(); showClock();


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
