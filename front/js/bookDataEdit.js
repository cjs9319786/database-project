let bookArr = [];
let currentPage = 1;
const itemsPerPage = 10;
const pagesPerGroup = 5;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("searchForm");
    const boardPage = document.getElementById("board_page");
    const board = document.getElementById("board");
    const reg_btn = document.getElementById("regist-book");
    const fix_btn = document.getElementById("fix-book");
    const del_btn = document.getElementById("delete-book");

    // 1. 페이지 로드 시 카테고리 목록 불러오기 함수 호출
    fetchCategories();

    // 2. 도서 검색 (GET 요청 사용)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const searchInput = document.getElementById("search_bar").value;

        if (searchInput.trim() === "") {
            alert("검색어를 입력해주세요");
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/books/?q=${encodeURIComponent(searchInput)}`);
            const result = await response.json();

            if (!result.books || result.books.length === 0) {
                alert("검색 결과가 없습니다!");
                booksArr = [];
                display_book_list(1);
                return;
            }

            booksArr = result.books;
            display_book_list(1);

        } catch (error) {
            console.error("Error fetching search results:", error);
            alert("검색 중 오류가 발생했습니다.");
        }
    });

    // 3. 도서 리스트 출력
    window.display_book_list = function(page) {
        const board = document.getElementById("board");
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endItems = booksArr.slice(startIndex, startIndex + itemsPerPage);

        // 리스트 영역 스타일 (스크롤 적용)
        board.style.height = "70%";
        board.style.overflowY = "auto";
        board.style.overflowX = "hidden";
        board.style.borderBottom = "1px solid #ccc";

        // 헤더 (상단 고정)
        board.innerHTML = `
        <div class="top" style="position: sticky; top: 0; z-index: 1; display: flex; align-items: center; text-align: center; font-weight: bold; padding: 10px 0; border-bottom: 2px solid #333; background-color: #f5f5f5;">
            <div class="num" style="width: 15%;">ISBN</div>
            <div class="title" style="width: 35%;">제목</div>
            <div class="writer" style="width: 15%;">저자</div>
            <div class="publish" style="width: 15%;">출판사</div>
            <div class="date" style="width: 10%;">재고</div>
            <div class="count" style="width: 10%;">관리</div>
        </div>
      `;

        if (endItems.length === 0) {
            board.innerHTML += `<div style="text-align:center; padding:20px;">검색 결과가 없습니다.</div>`;
            return;
        }

        endItems.forEach((item) => {
            const divItem = document.createElement("div");
            divItem.classList.add("li-item");
            divItem.style.display = "flex";
            divItem.style.alignItems = "center";
            divItem.style.padding = "8px 0";
            divItem.style.borderBottom = "1px solid #eee";
            divItem.style.textAlign = "center";
            divItem.style.fontSize = "14px";
            divItem.style.backgroundColor = "#fff";

            const textStyle = "overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 5px;";

            divItem.innerHTML = `
          <div class="num" style="width: 15%; ${textStyle}" title="${item.isbn}">${item.isbn}</div>
          <div class="title" style="width: 35%; text-align:left; ${textStyle}" title="${item.title}">${item.title}</div>
          <div class="writer" style="width: 15%; ${textStyle}" title="${item.author}">${item.author}</div>
          <div class="publish" style="width: 15%; ${textStyle}" title="${item.publisher__publisher_name}">${item.publisher__publisher_name}</div>
          <div class="date" style="width: 10%;">${item.stock_count}권</div>
          <div class="count" style="width: 10%;">
              <button onclick="openEditModal('${item.isbn}')" class="del_button" style="background-color:#4CAF50; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; font-size:12px;">
                  수정
              </button>
          </div>
        `;
            board.appendChild(divItem);
        });

        createPaginationButtons();
    };

    // 페이지네이션 버튼 생성
    function createPaginationButtons() {
        const totalPages = Math.ceil(booksArr.length / itemsPerPage);
        boardPage.querySelectorAll(".bt,.num_p").forEach((btn) => btn.remove());

        const createBtn = (cls, text, page) => {
            const btn = document.createElement("a");
            btn.href = "#";
            btn.className = "bt " + cls;
            btn.textContent = text;
            btn.addEventListener("click", () => {
                if (page > 0 && page <= totalPages) display_book_list(page);
            });
            return btn;
        };

        boardPage.prepend(createBtn("first", "<<", 1), createBtn("prev", "<", currentPage - 1));

        const startPage = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
        const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement("a");
            pageBtn.href = "#";
            pageBtn.className = "num_p";
            pageBtn.textContent = i;
            if (i === currentPage) pageBtn.classList.add("on");
            pageBtn.addEventListener("click", (e) => {
                e.preventDefault();
                display_book_list(i);
            });
            boardPage.appendChild(pageBtn);
        }
        boardPage.append(createBtn("next", ">", currentPage + 1), createBtn("last", ">>", totalPages));
    }

    // 도서 등록 버튼 이벤트
    reg_btn.addEventListener("click", async function() {
        const title = document.getElementById("book_title").value;
        const isbn = document.getElementById("book_isbn").value;
        const categoryId = document.getElementById("book_category").value;
        const publisher = document.getElementById("book_publish").value;
        const author = document.getElementById("book_writer").value;
        const count = document.getElementById("book_amount").value;
        const imageUrl = document.getElementById("book_image").value;

        if (!title || !isbn || !categoryId || !publisher) {
            alert("필수 항목(제목, ISBN, 카테고리ID, 출판사)을 모두 입력해주세요!");
            return;
        }

        const book_obj = {
            isbn: isbn,
            title: title,
            category_id: parseInt(categoryId),
            publisher_name: publisher,
            author: author,
            copy_count: count ? parseInt(count) : 1,
            image_url: imageUrl
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/admin/books/create/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(book_obj),
            });

            const result = await response.json();
            if (response.ok) {
                alert("등록 성공: " + result.message);
                location.reload();
            } else {
                alert("등록 실패: " + result.error);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("서버 오류가 발생했습니다.");
        }
    });

    // 도서 수정 버튼 (기존 기능 유지하되, 현재는 개별 관리 기능 위주로 사용됨)
    fix_btn.addEventListener("click", async function() {
        // 1. 입력된 값 가져오기
        const isbn = document.getElementById("book_isbn").value;
        const title = document.getElementById("book_title").value;
        const categoryId = document.getElementById("book_category").value;
        const publisher = document.getElementById("book_publish").value;
        const author = document.getElementById("book_writer").value;
        const imageUrl = document.getElementById("book_image").value;

        // 2. 유효성 검사
        if (!title || !categoryId || !publisher) {
            alert("필수 항목(제목, 카테고리, 출판사)을 모두 입력해주세요.");
            return;
        }

        if (!confirm("도서 정보를 수정하시겠습니까?")) return;

        // 3. 전송할 데이터 객체 생성
        const updateData = {
            title: title,
            author: author,
            category_id: parseInt(categoryId),
            publisher_name: publisher,
            image_url: imageUrl
        };

        try {
            // 4. 수정 API 호출
            // urls.py 경로: path('admin/books/update/<str:isbn>/', ...)
            const response = await fetch(`http://127.0.0.1:8000/api/admin/books/update/${isbn}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 관리자 세션 쿠키 전송
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                location.reload(); // 변경 사항 반영을 위해 새로고침
            } else {
                alert("수정 실패: " + (result.error || "알 수 없는 오류"));
            }

        } catch (error) {
            console.error("수정 오류:", error);
            alert("서버 통신 중 오류가 발생했습니다.");
        }
    });

    // 도서 삭제 버튼 이벤트
    del_btn.addEventListener("click", async function() {
        const isbn = document.getElementById("book_isbn").value;

        if (!isbn) {
            alert("삭제할 도서가 선택되지 않았습니다.");
            return;
        }

        const confirmMsg = "정말로 이 도서 정보를 삭제하시겠습니까?\n\n" +
            "주의: 이 도서에 연결된 '모든 실물 도서(재고)'와\n" +
            "'회원들의 리뷰'가 함께 영구적으로 삭제됩니다.";

        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/admin/books/delete/${isbn}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });

            const result = await response.json();

            if (response.ok) {
                alert("삭제 성공: " + result.message);
                location.reload();
            } else {
                alert("삭제 실패: " + (result.error || "알 수 없는 오류"));
            }
        } catch (error) {
            console.error("삭제 오류:", error);
            alert("서버 통신 중 오류가 발생했습니다.");
        }
    });

}); // [중요] 여기서 DOMContentLoaded가 닫힙니다.


// ==========================================
//  여기서부터는 전역 함수들입니다.
// ==========================================

// 1. 모달 제어 함수
window.ModalVisible = function(state, isInit) {
    const modal = document.getElementById("book-add-modal-wrap");

    if (isInit) {
        // 필드 초기화
        document.getElementById("book_title").value = "";
        document.getElementById("book_isbn").value = "";
        document.getElementById("book_category").value = "";
        document.getElementById("book_writer").value = "";
        document.getElementById("book_publish").value = "";
        document.getElementById("book_amount").value = "";
        document.getElementById("book_image").value = "";

        // 상태 초기화
        document.getElementById("book_isbn").readOnly = false;
        document.getElementById("book_amount").disabled = false;
        document.getElementById("book_amount").readOnly = false;
        document.getElementById("book_num").textContent = "-";

        // 실물 도서 목록 영역 숨기기
        const listArea = document.getElementById("copy_list_area");
        if (listArea) listArea.style.display = "none";

        const tbody = document.getElementById("copy_list_tbody");
        if (tbody) tbody.innerHTML = "";

        // 버튼 상태
        document.getElementById("regist-book").style.display = "block";
        document.getElementById("fix-book").style.display = "none";
        document.getElementById("delete-book").style.display = "none";
    }

    if (modal) {
        modal.style.display = state ? "block" : "none";
    }
};

// 2. 카테고리 목록 가져오기
async function fetchCategories() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/categories/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.ok) {
            const result = await response.json();
            const selectBox = document.getElementById("book_category");
            selectBox.innerHTML = '<option value="" disabled selected hidden>카테고리 선택 (필수)</option>';
            result.categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.category_id;
                option.textContent = category.category_name;
                selectBox.appendChild(option);
            });
        }
    } catch (error) {
        console.error("통신 오류:", error);
    }
}

// 3. 수정 모달 열기 및 데이터 로드
window.openEditModal = async function(isbn) {
    ModalVisible(true, false);

    document.getElementById("regist-book").style.display = "none";
    document.getElementById("fix-book").style.display = "block";
    document.getElementById("delete-book").style.display = "block";

    const listArea = document.getElementById("copy_list_area");
    if (listArea) listArea.style.display = "block";

    try {
        // 책 상세 정보
        const resInfo = await fetch(`http://127.0.0.1:8000/api/books/${isbn}/`);
        if (resInfo.ok) {
            const bookInfo = await resInfo.json();
            document.getElementById("book_title").value = bookInfo.title;
            document.getElementById("book_isbn").value = bookInfo.isbn;
            document.getElementById("book_isbn").readOnly = true;
            document.getElementById("book_writer").value = bookInfo.author;
            document.getElementById("book_publish").value = bookInfo.publisher_name;
            document.getElementById("book_image").value = bookInfo.image_url;
            document.getElementById("book_amount").value = "";
            document.getElementById("book_amount").disabled = true;

            const select = document.getElementById("book_category");
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text === bookInfo.category_name) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }

        // 실물 책 목록
        const resCopies = await fetch(`http://127.0.0.1:8000/api/admin/books/${isbn}/copies/`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const tbody = document.getElementById("copy_list_tbody");
        if (tbody) tbody.innerHTML = "";

        if (resCopies.ok) {
            const data = await resCopies.json();
            if (data.copies.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3'>등록된 실물 도서가 없습니다.</td></tr>";
            } else {
                data.copies.forEach(copy => {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #eee";
                    tr.innerHTML = `
                        <td style="padding: 8px;">${copy.book_manage_id}</td>
                        <td style="padding: 8px;">${copy.status_display}</td>
                        <td style="padding: 8px;">
                            <button style="font-size:12px; cursor:pointer;" 
                                onclick="updateCopyStatus(${copy.book_manage_id})">
                                관리
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (err) {
        console.error("데이터 로딩 실패:", err);
    }
};

// 4. 개별 도서 추가 입고
window.addBookCopies = async function() {
    const isbn = document.getElementById("book_isbn").value;
    const amountInput = document.getElementById("add_copy_amount");
    const amount = amountInput.value;

    if (!amount || amount < 1) {
        alert("1권 이상 입력해주세요.");
        return;
    }
    if (!confirm(`${amount}권을 추가 입고하시겠습니까?`)) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/books/${isbn}/add-copies/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ amount: amount })
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            amountInput.value = 1;
            openEditModal(isbn);
        } else {
            alert("입고 실패: " + result.error);
        }
    } catch (error) {
        alert("통신 오류 발생");
    }
};

// 5. 개별 도서 상태 변경
window.updateCopyStatus = async function(bookManageId) {
    const inputStatus = prompt("변경할 상태 입력 (예: 대여가능, 대여중, 분실, 폐기)", "");
    if (inputStatus === null || inputStatus.trim() === "") return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/book-copy/update/${bookManageId}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: inputStatus })
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            const currentIsbn = document.getElementById("book_isbn").value;
            openEditModal(currentIsbn);
        } else {
            alert("변경 실패: " + result.error);
        }
    } catch (error) {
        alert("통신 오류 발생");
    }
};