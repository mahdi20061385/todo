// ---------- تنظیمات ----------
const BACKEND_BASE = "https://todo-push-backend.onrender.com"; // آدرس سرور Node
const input = document.getElementById("todo-input");
const timeInput = document.getElementById("todo-time");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");
const testBtn = document.getElementById("test-btn");

// ---------- LocalStorage ----------
function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}
function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// ---------- رندر ----------
function renderTodos() {
  list.innerHTML = "";
  const todos = getTodos();
  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    if (todo.completed) li.classList.add("completed");

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.title + (todo.time ? ` ⏰ ${todo.time}` : "");

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.setAttribute("aria-label", "حذف");

    const icon = document.createElement("span");
    icon.className = "trash";
    icon.setAttribute("aria-hidden", "true");

    del.appendChild(icon);
    li.appendChild(text);
    li.appendChild(del);

    li.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      todos[index].completed = !todos[index].completed;
      saveTodos(todos);
      renderTodos();
    });

    del.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos(todos);
      renderTodos();
    });

    list.appendChild(li);
  });
}

// ---------- افزودن ----------
function addTodo() {
  const title = input.value.trim();
  const time = timeInput.value; // HH:MM
  if (!title) {
    input.focus();
    return;
  }

  const todos = getTodos();
  const todoId = Date.now();
  todos.push({ id: todoId, title, completed: false, time });
  saveTodos(todos);
  input.value = "";
  timeInput.value = "";
  renderTodos();

  // اگر زمان دارد، روی سرور زمان‌بندی کن
  if (time) {
    const atISO = buildTodayISO(time);
    scheduleReminderOnServer(todoId, title, atISO).catch(console.error);
  }
}

// تبدیل "HH:MM" به ISO امروز
function buildTodayISO(hhmm) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const now = new Date();
  const when = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hh,
    mm,
    0,
    0
  );
  return when.toISOString();
}

// ---------- رویدادها ----------
addBtn.addEventListener("click", addTodo);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});
clearBtn.addEventListener("click", () => {
  localStorage.removeItem("todos");
  renderTodos();
});
testBtn.addEventListener("click", testNotification);

// ---------- اعلان ساده برای تست ----------
function testNotification() {
  if (Notification.permission === "granted") {
    new Notification("تست اعلان", { body: "این یک اعلان تستی است" });
  } else {
    Notification.requestPermission().then((p) => {
      if (p === "granted")
        new Notification("تست اعلان", { body: "این یک اعلان تستی است" });
    });
  }
}

// ---------- Service Worker ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("SW registered"));
}

// ---------- Push Subscription ----------
async function ensureNotificationPermission() {
  if (Notification.permission === "granted") return true;
  const p = await Notification.requestPermission();
  return p === "granted";
}

async function getVapidPublicKey() {
  const r = await fetch(`${BACKEND_BASE}/vapidPublicKey`);
  const { key } = await r.json();
  return key;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getPushSubscription() {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const vapidKey = await getVapidPublicKey();
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
}

// ساخت شناسه یکتا برای دستگاه
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = Date.now() + "-" + Math.random().toString(36).substring(2);
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// ثبت Subscription روی سرور همراه با deviceId
async function registerSubscriptionOnServer() {
  const ok = await ensureNotificationPermission();
  if (!ok) {
    alert("اجازه اعلان داده نشد.");
    return;
  }
  const sub = await getPushSubscription();
  const deviceId = getDeviceId();

  await fetch(`${BACKEND_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId, subscription: sub }),
  });
  console.log("Subscription registered on server");
}

// زمان‌بندی یادآوری فقط برای همین دستگاه
async function scheduleReminderOnServer(todoId, title, atISO) {
  const deviceId = getDeviceId();
  await fetch(`${BACKEND_BASE}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todoId, title, atISO, deviceId }),
  });
}

// شروع
renderTodos();
registerSubscriptionOnServer().catch(console.error);
