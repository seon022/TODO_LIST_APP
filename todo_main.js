let todos = [];
const todoText = document.querySelector("#todoText");
const todoMemo = document.querySelector("#todoMemo");
const todoCategory = document.querySelector("#newTodoCategory");
const addBtn = document.getElementById("addItem");
const list = document.getElementById("todoList");

// 검색 및 필터링 요소
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const filterCategory = document.querySelector("#filterCategory");

// 수정 모달
const editModal = document.getElementById("editModal");
const editText = document.getElementById("editText");
const editMemo = document.getElementById("editMemo");
const editCategory = document.getElementById("editCategory");
const saveEdit = document.getElementById("saveEdit");
const closeModal = document.getElementById("closeModal");

// 조회 모달 요소
const viewModal = document.getElementById("viewModal");
const viewText = document.getElementById("viewText");
const viewMemo = document.getElementById("viewMemo");
const viewCategory = document.getElementById("viewCategory");
const viewCompleted = document.getElementById("viewCompleted");
const closeViewModal = document.getElementById("closeViewModal");

let currentEditingId;
let draggedItem = null;
let draggedItemIndex = null;
let lastY;

// local storage에서 todos 로드하기
function loadTodos() {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
        todos = JSON.parse(storedTodos);
        todos.sort((a, b) => a.orderNum - b.orderNum); // 순서대로 정렬
    }

    renderTodos(); // 로드한 todos로 렌더링
}

// todos 배열을 local storage에 저장
function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

// 새로운 todo 추가 시 전체 todos 렌더링
addBtn.onclick = () => {
    const newTodo = {
        id: Date.now(),
        text: todoText.value,
        memo: todoMemo.value,
        category: todoCategory.value,
        completed: false,
        orderNum: todos.length,
    };

    // todos 배열에 새로운 todo 추가
    todos.push(newTodo);

    // localStorage에 저장
    saveTodos();

    // 업데이트된 todos 배열로 전체 DOM 다시 렌더링
    renderTodos();

    // 입력 필드 초기화
    clearInputs();
};

// 전체 todos 배열을 기반으로 리스트 렌더링
function renderTodos() {
    // 기존 리스트 초기화
    list.innerHTML = "";
    // todos 배열 순회하며 각 항목을 DOM에 추가
    const filteredTodos = filterTodos();

    // 없으면 empty 표시
    if (filteredTodos.length === 0) {
        list.classList.add("empty");
    } else {
        list.classList.remove("empty");
    }
}

function addTodoItem(todo) {
    const newLi = document.createElement("li");
    newLi.classList.add("todo-item");
    newLi.dataset.id = todo.id;

    // 드래그 핸들 아이콘
    const dragHandle = document.createElement("div");
    dragHandle.classList.add("drag-handle");
    dragHandle.innerHTML = "handle";

    // 체크박스 컨테이너
    const checkboxContainer = document.createElement("div");
    checkboxContainer.classList.add("checkbox-container");

    // 체크박스
    const newCheckbox = document.createElement("input");
    newCheckbox.type = "checkbox";
    newCheckbox.classList.add("todo-checkbox");
    newCheckbox.id = `todo-${todo.id}`;
    newCheckbox.checked = todo.completed;

    // 체크박스 라벨
    const checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = newCheckbox.id;
    checkboxLabel.classList.add("checkbox-label");

    checkboxContainer.appendChild(newCheckbox);
    checkboxContainer.appendChild(checkboxLabel);

    // 할 일 텍스트
    const todoContent = document.createElement("div");
    todoContent.classList.add("todo-content");
    const newSpan = document.createElement("span");
    newSpan.textContent = todo.text;

    todoContent.appendChild(newSpan);

    // 버튼 컨테이너
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    // 편집 버튼
    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.innerHTML = "edit";

    // 삭제 버튼
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "del";

    // 요소들을 li에 추가
    newLi.appendChild(dragHandle);
    newLi.appendChild(checkboxContainer);
    newLi.appendChild(todoContent);
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    newLi.appendChild(buttonContainer);

    list.appendChild(newLi);

    // 체크박스 변경 시
    newCheckbox.addEventListener("change", () => {
        todo.completed = newCheckbox.checked;
        if (newCheckbox.checked) {
            newSpan.style.textDecoration = "line-through";
            newSpan.style.color = "#999";
        } else {
            newSpan.style.textDecoration = "none";
            newSpan.style.color = "#222";
        }
        saveTodos();
    });

    // todo text 클릭 시
    newSpan.addEventListener("click", () => {
        openViewModal(todo);
    });
    // 편집 버튼 클릭 시
    editBtn.addEventListener("click", () => {
        openEditModal(todo);
    });

    // 삭제 버튼 클릭 시
    deleteBtn.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        saveTodos();
        renderTodos(); // 삭제 후 전체 리스트 다시 렌더링
    });

    // Set initial style based on completed status
    if (todo.completed) {
        newSpan.style.textDecoration = "line-through";
    }

    // Drag and drop event listeners
    newLi.setAttribute("draggable", true);
    newLi.addEventListener("dragstart", dragStart);
    newLi.addEventListener("dragend", dragEnd);
    newLi.addEventListener("dragover", dragOver);
    newLi.addEventListener("dragenter", dragEnter);
    newLi.addEventListener("dragleave", dragLeave);
    newLi.addEventListener("drop", drop);
}

function clearInputs() {
    todoText.value = "";
    todoMemo.value = "";
    todoCategory.value = "";
}

// 검색 기능
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const todoItems = list.querySelectorAll("li");
    todoItems.forEach((item) => {
        const text = item.querySelector("span").textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

// 카테고리별 필터링 기능
function filterTodos() {
    const selectedCategory = filterCategory.value;

    // 필터링된 todos 배열
    const filteredTodos =
        selectedCategory === ""
            ? todos
            : todos.filter((todo) => todo.category === selectedCategory);

    // 기존 리스트 초기화
    list.innerHTML = "";

    // 필터링된 할 일 목록을 다시 DOM에 추가
    filteredTodos.forEach((todo) => addTodoItem(todo));

    // 없으면 empty 표시
    if (filteredTodos.length === 0) {
        list.classList.add("empty");
    } else {
        list.classList.remove("empty");
    }
    return filteredTodos;
}

// 모달 open 함수
function openEditModal(todo) {
    currentEditingId = todo.id;
    editText.value = todo.text;
    editMemo.value = todo.memo;
    editCategory.value = todo.category;
    editModal.style.display = "block";
}
// 뷰 모달 open 함수
function openViewModal(todo) {
    viewText.textContent = todo.text;
    viewMemo.textContent = todo.memo || "(No memo)";
    viewCategory.textContent = todo.category;
    viewModal.style.display = "block";
}

// 수정 모달 open 함수
function openEditModal(todo) {
    currentEditingId = todo.id;
    editText.value = todo.text;
    editMemo.value = todo.memo;
    editCategory.value = todo.category;
    editModal.style.display = "block";
}

saveEdit.onclick = function () {
    const todoIndex = todos.findIndex((todo) => todo.id === currentEditingId);
    if (todoIndex !== -1) {
        // todos 배열 업데이트
        todos[todoIndex] = {
            ...todos[todoIndex],
            text: editText.value,
            memo: editMemo.value,
            category: editCategory.value,
        };

        // localStorage에 저장
        saveTodos();

        // 업데이트된 todos 배열로 전체 DOM 다시 렌더링
        renderTodos();

        // 모달 닫기
        editModal.style.display = "none";
    }
};

closeModal.onclick = function () {
    editModal.style.display = "none";
};

closeViewModal.onclick = function () {
    viewModal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
    if (event.target == viewModal) {
        viewModal.style.display = "none";
    }
};

// Drag and drop functions
function dragStart(e) {
    draggedItem = e.target.closest("li");
    draggedItemIndex = Array.from(list.children).indexOf(draggedItem);
    setTimeout(() => {
        draggedItem.classList.add("dragging");
    }, 0);
}

function dragEnd(e) {
    draggedItem.classList.remove("dragging");
    updateOrder(); // 드래그 종료 시 순서 업데이트
    draggedItem = null;
    draggedItemIndex = null;
}

function dragOver(e) {
    e.preventDefault();
    const currentY = e.clientY;

    // Y 좌표가 변경되었을 때만 재정렬 로직을 실행
    if (currentY !== lastY) {
        const afterElement = getDragAfterElement(list, currentY);
        const currentElement = document.querySelector(".dragging");
        if (afterElement == null) {
            list.appendChild(currentElement);
        } else {
            list.insertBefore(currentElement, afterElement);
        }
        lastY = currentY;
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [
        ...container.querySelectorAll("li:not(.dragging)"),
    ];

    return draggableElements.reduce(
        (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        { offset: Number.NEGATIVE_INFINITY }
    ).element;
}

function dragEnter(e) {
    e.preventDefault();
    e.target.closest("li").classList.add("drag-over");
}

function dragLeave(e) {
    e.target.closest("li").classList.remove("drag-over");
}

function drop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest("li");
    dropTarget.classList.remove("drag-over");
}

function updateOrder() {
    const todoItems = list.querySelectorAll("li");
    todos = Array.from(todoItems)
        .map((item, index) => {
            const todoId = parseInt(item.dataset.id);
            const todo = todos.find((t) => t.id === todoId);
            if (todo) {
                return { ...todo, orderNum: index };
            }
            return null;
        })
        .filter((todo) => todo !== null);
    console.log(todos);
    saveTodos();
}

// 초기 로드
loadTodos();

// 이벤트 리스너
searchButton.addEventListener("click", performSearch);
filterCategory.addEventListener("change", filterTodos);
