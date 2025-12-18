const input = document.getElementById("todo-input");
const timeInput = document.getElementById("todo-time");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");
const clearBtn = document.getElementById("clear-btn");

// گرفتن لیست از localStorage
function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

// ذخیره لیست در localStorage
function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// رندر کردن لیست
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

    // کلیک روی آیتم برای کامل/ناقص کردن
    li.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      todos[index].completed = !todos[index].completed;
      saveTodos(todos);
      renderTodos();
    });

    // حذف آیتم
    del.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos(todos);
      renderTodos();
    });

    list.appendChild(li);
  });
}

// افزودن آیتم جدید
function addTodo() {
  const title = input.value.trim();
  const time = timeInput.value;
  if (!title) {
    input.focus();
    return;
  }
  const todos = getTodos();
  todos.push({ title, completed: false, time });
  saveTodos(todos);
  input.value = "";
  timeInput.value = "";
  renderTodos();
}

// پاکسازی کل لیست
clearBtn.addEventListener("click", () => {
  localStorage.removeItem("todos");
  renderTodos();
});

// رویداد دکمه Add
addBtn.addEventListener("click", addTodo);

// افزودن با Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// بارگذاری اولیه
renderTodos();

// اعلان در زمان مشخص
function checkReminders() {
  const todos = getTodos();
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  todos.forEach((todo) => {
    if (todo.time === currentTime && !todo.notified) {
      // درخواست اجازه اعلان
      if (Notification.permission === "granted") {
        new Notification("یادآوری", { body: todo.title });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("یادآوری", { body: todo.title });
          }
        });
      }
      todo.notified = true; // جلوگیری از تکرار
      saveTodos(todos);
    }
  });
}

// چک کردن هر دقیقه
setInterval(checkReminders, 60000);
