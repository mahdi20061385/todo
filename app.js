const input = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const list = document.getElementById("todo-list");

// گرفتن لیست از localStorage
function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

// ذخیره لیست در localStorage
function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// رندر کردن لیست روی صفحه
function renderTodos() {
  list.innerHTML = "";
  const todos = getTodos();
  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    if (todo.completed) li.classList.add("completed");

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.title;

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
      if (e.target.closest(".delete-btn")) return; // اگر روی دکمه حذف بود، کاری نکن
      todos[index].completed = !todos[index].completed;
      saveTodos(todos);
      renderTodos();
    });

    // کلیک روی دکمه حذف
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
  if (!title) {
    input.focus();
    return;
  }
  const todos = getTodos();
  todos.push({ title, completed: false });
  saveTodos(todos);
  input.value = "";
  renderTodos();
}

// رویداد دکمه Add
addBtn.addEventListener("click", addTodo);

// افزودن با Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// بارگذاری اولیه
renderTodos();
