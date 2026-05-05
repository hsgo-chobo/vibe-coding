import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';

// =============================================
// Firebase 설정
// Firebase Console(https://console.firebase.google.com) > 프로젝트 설정 > 앱 추가(웹)
// 에서 아래 값을 본인 프로젝트 설정으로 교체하세요.
// Firestore Database > 규칙(Rules) 에서 읽기/쓰기 허용 설정도 필요합니다.
// =============================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const todosRef = collection(db, 'todos');

// 상태
let todos = [];
let currentFilter = 'all';

// DOM 요소
const form = document.getElementById('add-form');
const input = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const emptyState = document.getElementById('empty-state');
const statusBanner = document.getElementById('status-banner');
const filterBtns = document.querySelectorAll('.filter-btn');

// Firestore 실시간 구독
const q = query(todosRef, orderBy('createdAt', 'asc'));
onSnapshot(q, snapshot => {
    todos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTodos();
}, err => {
    console.error(err);
    showBanner('Firebase 연결에 실패했습니다. script.js 의 firebaseConfig 설정을 확인하세요.');
});

// ---- CRUD ----

// 추가
form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    try {
        await addDoc(todosRef, { text, completed: false, createdAt: serverTimestamp() });
        input.value = '';
    } catch (err) {
        console.error('추가 실패:', err);
    }
});

// 완료 토글
async function toggleTodo(id, currentCompleted) {
    await updateDoc(doc(db, 'todos', id), { completed: !currentCompleted });
}

// 삭제
async function deleteTodo(id) {
    await deleteDoc(doc(db, 'todos', id));
}

// 텍스트 수정 저장
async function saveTodo(id, newText) {
    const text = newText.trim();
    if (!text) return;
    await updateDoc(doc(db, 'todos', id), { text });
}

// ---- 렌더링 ----

function renderTodos() {
    const filtered = todos.filter(t => {
        if (currentFilter === 'active') return !t.completed;
        if (currentFilter === 'completed') return t.completed;
        return true;
    });

    todoList.innerHTML = '';

    const activeCount = todos.filter(t => !t.completed).length;
    todoCount.textContent = todos.length
        ? `${activeCount}개 남음 / 전체 ${todos.length}개`
        : '';

    emptyState.hidden = filtered.length > 0;
    filtered.forEach(todo => todoList.appendChild(createItem(todo)));
}

function createItem(todo) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;

    // 체크박스
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id, todo.completed));

    // 텍스트
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = todo.text;

    // 액션 버튼 영역
    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    buildActionButtons(actions, li, textSpan, todo);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actions);
    return li;
}

function buildActionButtons(actions, li, textSpan, todo) {
    actions.innerHTML = '';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost';
    editBtn.textContent = '수정';
    editBtn.type = 'button';
    editBtn.addEventListener('click', () => startEdit(li, textSpan, actions, todo));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '삭제';
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
}

function startEdit(li, textSpan, actions, todo) {
    // 텍스트 → 입력창으로 교체
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = todo.text;
    editInput.maxLength = 200;
    textSpan.replaceWith(editInput);
    editInput.focus();
    editInput.select();

    // 버튼 교체: 저장 / 취소
    actions.innerHTML = '';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = '저장';
    saveBtn.type = 'button';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost';
    cancelBtn.textContent = '취소';
    cancelBtn.type = 'button';

    const save = () => saveTodo(todo.id, editInput.value);
    // onSnapshot이 새 값으로 리렌더링하므로 저장 후 UI는 자동으로 원복됨

    const cancel = () => {
        editInput.replaceWith(textSpan);
        buildActionButtons(actions, li, textSpan, todo);
    };

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cancel);
    editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') cancel();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
}

// ---- 필터 ----

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// ---- 유틸 ----

function showBanner(msg) {
    statusBanner.textContent = msg;
    statusBanner.hidden = false;
}