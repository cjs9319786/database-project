// 전역변수 설정
let allCategories = [];
let currentCatPage = 1;
const catsPerPage = 10;
const catPageGroupSize = 5;

// 모달 열기
window.openCategoryModal = function() {
    const modal = document.getElementById("category-modal-wrap");
    modal.style.display = "flex";
    
    resetCatForm();
    fetchCategoriesList(); 
};

// 모달 닫기
window.closeCategoryModal = function () {
    document.getElementById("category-modal-wrap").style.display = "none";
};

// 폼 초기화
window.resetCatForm = function () {
    document.getElementById("input_cat_id").value = "";
    document.getElementById("input_cat_name").value = "";
};

// 목록 조회 API 호출 (검색 없이 전체 조회)
async function fetchCategoriesList() {
    try {
        // views.py의 admin_categories (GET) 호출
        const response = await fetch("http://127.0.0.1:8000/api/admin/categories/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.ok) {
            const result = await response.json();
            allCategories = result.categories;
            allCategories.sort((a, b) => a.category_id - b.category_id); // 받아온 데이터를 ID 기준 오름차순 정렬
            renderCategoryPage(1);
        } else {
            if(response.status === 403){
                alert("관리자 권한이 필요합니다.");
                closeCategoryModal();
                return;
            }else{
                alert(`"목록을 불러오지 못했습니다."`);
                closeCategoryModal();
                    return;
            }    
        }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
}

// 렌더링 (삭제 버튼만 있음)
function renderCategoryPage(page) {
    currentCatPage = page;
    const tbody = document.getElementById("category_list_tbody");
    tbody.innerHTML = "";

    if (allCategories.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>등록된 카테고리가 없습니다.</td></tr>";
        document.getElementById("cat_pagination").innerHTML = "";
        return;
    }

    const start = (page - 1) * catsPerPage;
    const end = start + catsPerPage;
    const itemsToShow = allCategories.slice(start, end);

    itemsToShow.forEach(cat => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 8px;">${cat.category_id}</td>
            <td style="padding: 8px;">${cat.category_name}</td>
            <td style="padding: 8px;">
                <button onclick="deleteCategory('${cat.category_id}')" 
                        style="cursor:pointer; padding:4px 8px; background:#f44336; color:white; border:none; border-radius:3px;">
                    삭제
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    createCatPagination();
}

// 페이지네이션 (출판사와 동일 로직)
function createCatPagination() {
    const paginationDiv = document.getElementById("cat_pagination");
    paginationDiv.innerHTML = "";

    const totalPages = Math.ceil(allCategories.length / catsPerPage);
    if (totalPages === 0) return;

    const startPage = Math.floor((currentCatPage - 1) / catPageGroupSize) * catPageGroupSize + 1;
    const endPage = Math.min(startPage + catPageGroupSize - 1, totalPages);

    const createBtn = (text, targetPage, isDisabled = false, isActive = false) => {
        const a = document.createElement("a");
        a.href = "#";
        a.innerText = text;
        a.className = isActive ? "num_p on" : "num_p";
        if (!isActive) a.style.margin = "0 3px";

        if (isDisabled) {
            a.style.pointerEvents = "none";
            a.style.color = "#ccc";
            a.style.borderColor = "#ccc";
        } else {
            a.onclick = (e) => {
                e.preventDefault();
                renderCategoryPage(targetPage);
            };
        }
        return a;
    };

    paginationDiv.appendChild(createBtn("<<", 1, currentCatPage === 1));
    paginationDiv.appendChild(createBtn("<", currentCatPage - 1, currentCatPage === 1));

    for (let i = startPage; i <= endPage; i++) {
        paginationDiv.appendChild(createBtn(i, i, false, i === currentCatPage));
    }

    paginationDiv.appendChild(createBtn(">", currentCatPage + 1, currentCatPage === totalPages));
    paginationDiv.appendChild(createBtn(">>", totalPages, currentCatPage === totalPages));
}

// 카테고리 등록 (POST)
window.saveCategory = async function () {
    const id = document.getElementById("input_cat_id").value;
    const name = document.getElementById("input_cat_name").value;

    if (!id || !name.trim()) {
        alert("ID와 이름을 모두 입력해주세요.");
        return;
    }

    // 등록 API 호출
    try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/categories/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
                category_id: id, 
                category_name: name 
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("등록되었습니다.");
            resetCatForm();
            fetchCategoriesList();
        } else {
            alert("등록 실패: " + (result.error || "알 수 없는 오류"));
        }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
};

// 카테고리 삭제 (DELETE)
window.deleteCategory = async function (id) {
    if (!confirm("정말로 삭제하시겠습니까?\n(도서가 연결된 카테고리는 삭제할 수 없습니다.)")) return;

    try {
        // views.py의 admin_delete_category는 POST로 처리
        const response = await fetch(`http://127.0.0.1:8000/api/admin/categories/${id}/`, {
            method: "POST", 
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const result = await response.json();

        if (response.ok) {
            alert("삭제되었습니다.");
            fetchCategoriesList();
        } else {
            alert("삭제 실패: " + (result.error || "오류 발생"));
        }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
};