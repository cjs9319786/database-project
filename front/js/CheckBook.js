let currentPage = 1; // 현재 페이지 번호
const itemsPerPage = 8; // 한 페이지에 표시할 아이템 수
const pagesPerGroup = 5; // 한 그룹에 표시할 페이지 수
let books = []; // 검색 결과를 저장할 배열 (전역 변수)
let returns = []; // 반납 검색 결과를 저장할 배열

document.addEventListener("DOMContentLoaded", () => {
    const boardPage = document.getElementById("board_page");
    const board = document.getElementById("result_book_div");
    const book_search_btn = document.getElementById("book_search_btn");
    const return_search_btn = document.getElementById("return_search_btn");
    const result_return_div = document.getElementById("result_return_div");

    // 관리자 메뉴 표시 여부 결정
    checkAdminAuthority();

    /*도서 검색 기능 Main.js와 동일*/
    book_search_btn.addEventListener("click", async function () {
        console.log("검색 시작..");
        const searchInput = document.getElementById("book_search_input").value;
        const searchParams = searchInput.toString().trim();

        if (searchParams === "") {
            alert("검색어를 입력해주세요");
            return;
        }

        try {
            const endUrl = `http://127.0.0.1:8000/api/books/?q=${encodeURIComponent(searchParams)}`;

            const response = await fetch(endUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (!result.books || result.books.length === 0) {
                alert("검색 결과가 없습니다!");
                books = [];
                display_book_list(1);
                return;
            }

            books = result.books.map((row) => ({
                isbn: row.isbn,
                title: row.title,
                author: row.author,
                publisher: row.publisher__publisher_name,
                stock_count: row.stock_count, // views.py에서 온 stock_count 사용 -재고
                image_url: row.image_url
            }));
            display_book_list(1);

        } catch (error) {
            console.error("Error fetching search results:", error);
            alert("서버 통신 중 오류가 발생했습니다.");
        }
    });

    /**
      도서 목록 출력 함수
    * @param {number} page - 표시할 페이지 번호
    */
    function display_book_list(page) {
        console.log("도서 목록 출력..., 페이지:", page);
        currentPage = page;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = books.slice(startIndex, endIndex);

        // 헤더 설정
        board.innerHTML = `
            <div class="top">
                <div class="b_isbn" style="width: 15%;">ISBN</div>
                <div class="b_title" style="width: 40%;">책 제목</div>
                <div class="b_author" style="width: 20%;">저자</div>
                <div class="b_stock" style="width: 10%;">재고</div>
                <div class="b_action" style="width: 15%;">기능</div>
            </div>`;

        if (currentItems.length === 0) {
            board.innerHTML += `<div style="padding:20px; text-align:center;">검색 결과가 없습니다.</div>`;
            boardPage.innerHTML = "";
            return;
        }

        currentItems.forEach((item) => {
            const divItem = document.createElement("div");
            divItem.classList.add("li-item");

            // 재고 확인 로직 (item.stock_count 사용)
            let actionBtn = '';
            if (item.stock_count > 0) {
                // 문자열 ISBN 전달을 위해 따옴표('') 처리 주의
                actionBtn = `<input type="button" class="loan_button" value="대여하기" 
                             onclick="requestBorrow('${item.isbn}')" 
                             style="cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 4px;">`;
            } else {
                actionBtn = `<span style="color: red; font-size: 14px;">대여불가</span>`;
            }

            divItem.innerHTML = `
                <div class="b_isbn" style="width: 15%; overflow:hidden; text-overflow:ellipsis;">${item.isbn}</div>
                <div class="b_title" style="width: 40%; text-align: left; padding-left: 10px;">${item.title}</div>
                <div class="b_author" style="width: 20%;">${item.author}</div>
                <div class="b_stock" style="width: 10%;">${item.stock_count}권</div>
                <div class="b_action" style="width: 15%; display: flex; justify-content: center; align-items: center;">
                    ${actionBtn}
                </div>
            `;
            board.appendChild(divItem);
        });
        createPaginationButtons();
    }
    /* 페이지 네이션 버튼 생성 */
    function createPaginationButtons() {
        const totalPages = Math.ceil(books.length / itemsPerPage);
        boardPage.innerHTML = ""; // 초기화

        if (totalPages === 0) return;

        const createBtn = (text, onClick) => {
            const btn = document.createElement("a");
            btn.href = "#";
            btn.className = "bt";
            btn.textContent = text;
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                onClick();
            });
            return btn;
        };

        boardPage.appendChild(createBtn("<<", () => display_book_list(1)));
        boardPage.appendChild(createBtn("<", () => {
            if (currentPage > 1) display_book_list(currentPage - 1);
        }));

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

        boardPage.appendChild(createBtn(">", () => {
            if (currentPage < totalPages) display_book_list(currentPage + 1);
        }));
        boardPage.appendChild(createBtn(">>", () => display_book_list(totalPages)));
    }
    /* 도서 반납 내역 조회 기능 */
    return_search_btn.addEventListener("click", async function () {
        console.log("반납 내역 조회 시작...");
        result_return_div.innerHTML = ""; // 초기화
        // views.py의 my_borrows 함수 호출
        try {
            const response = await fetch("http://127.0.0.1:8000/api/me/borrows/", {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json", 
                    
                },
                credentials: "include"
            });

            const result = await response.json();

            // 로그인 안 된 경우
            if (response.status === 401) {
                alert("로그인이 필요합니다.");
                window.location.href = "Main.html";
                return;
            }

            if (!response.ok) {
                alert("목록을 불러오는데 실패했습니다.");
                return;
            }

            // 결과 매핑 (views.py > my_borrows의 리턴값 구조 확인)
            // 아직 반납하지 않은 책(return_date가 null인 것)만 필터링
            const myBorrows = result.borrows.filter(item => item.return_date === null);

            if (myBorrows.length === 0) {
                alert("현재 대여 중인 도서가 없습니다.");
                result_return_div.innerHTML = "";
                return;
            }

            // 테이블 헤더 그리기
            result_return_div.innerHTML = `
                <div class="top">
                    <div class="b_num" style="width:15%">책 번호</div>
                    <div class="b_title" style="width:40%">책 제목</div>
                    <div class="s_date" style="width:20%">대여일</div>
                    <div class="e_date" style="width:15%">반납예정일</div>
                    <div class="del_btn" style="width:10%">관리</div>
                </div>`;

            // 목록 그리기
            myBorrows.forEach((item) => {
                const divItem = document.createElement("div");
                divItem.classList.add("li-item");

                // 연체 여부 시각적 표시 (오늘 날짜와 비교)
                const today = new Date().toISOString().split('T')[0];
                const isOverdue = item.due_date < today ? "color:red; font-weight:bold;" : "";

                divItem.innerHTML = `
                    <div class="b_num" style="width:15%">${item.book__book_manage_id}</div>
                    <div class="b_title" style="width:40%">${item.book__isbn__title}</div>
                    <div class="s_date" style="width:20%">${item.borrow_date}</div>
                    <div class="e_date" style="width:15%; ${isOverdue}">${item.due_date}</div>
                    <div class="del_btn" style="width:10%">
                        <input type="button" class="del_button" 
                               onclick="processReturn(${item.borrow_id})" 
                               value="반납하기"
                               style="cursor: pointer; background-color: #ff9800; color: white; border: none; padding: 5px 10px; border-radius: 4px;">
                    </div>
                `;
                result_return_div.appendChild(divItem);
            });

        } catch (error) {
            console.error("서버오류:", error);
            alert("통신 중 오류가 발생했습니다.");
        }
    });
});

// 대여 요청 함수 (views.py: borrow_books 대응)
async function requestBorrow(isbn) {
    if (!confirm("이 책을 대여하시겠습니까?")) {
        return;
    }

    // 백엔드는 'isbns' 라는 키를 기다리고 있음
    const data = {
        isbns: [isbn]
    };

    // 쿠키에서 CSRF 토큰 가져오기
    //const csrftoken = getCookie('csrftoken');

    try {
        const response = await fetch("http://127.0.0.1:8000/api/borrow/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // "X-CSRFToken": csrftoken,  CSRF 토큰 전달(POST 요청에 필요) 일단 주석처리 보안부분
            },
            credentials: "include",
            // 로그인 쿠키(sessionid)를 백엔드로 같이 보내주는 옵션
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            alert("대여 성공!\n" + result.message);
            // 목록 갱신
            document.getElementById("book_search_btn").click();
        } else {
            console.error("서버 에러 응답:", result);

            if (response.status === 401) {
                alert("로그인이 필요한 서비스입니다.");
                window.location.href = "Main.html"; // 로그인 창으로 튕겨내기
            } else {
                alert("대여 실패: " + (result.error || "알 수 없는 오류"));
            }
        }

    } catch (error) {
        console.error("통신 오류:", error);
        alert("서버와 통신 중 문제가 발생했습니다.");
    }
}

// 반납 처리 함수
async function processReturn(borrowId) {
    if (!confirm("이 도서를 반납하시겠습니까?")) {
        return;
    }

    //const csrftoken = getCookie('csrftoken');

    try {
        // views.py의 return_book 호출
        const response = await fetch("http://127.0.0.1:8000/api/return/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                //"X-CSRFToken": csrftoken, CSRF 토큰 전달(POST 요청에 필요) 일단 주석처리 보안부분
            },
            credentials: "include",
            body: JSON.stringify({ borrow_id: borrowId }) // borrow_id 전송
        });

        const result = await response.json();

        if (response.ok) {
            let msg = result.message;
            if (result.is_overdue) {
                msg += "\n(주의: 연체되어 대여 정지 패널티가 부과되었습니다.)";
            }
            alert(msg);

            // 목록 갱신을 위해 검색 버튼 트리거
            document.getElementById("return_search_btn").click();
        } else {
            alert("반납 실패: " + (result.error || "알 수 없는 오류"));
        }
    } catch (error) {
        console.error("반납 오류:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}

function navigateToPage() {
    window.location.href = "Main.html";
}

// 관리자 권한 확인 함수
async function checkAdminAuthority() {
    try {
        // 내 정보 조회 API 호출 (로그인 쿠키 포함)
        const response = await fetch("http://127.0.0.1:8000/api/me/", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",              
            }, 
            credentials: "include",            
        });

        if (response.ok) {
            const data = await response.json();

            const managerMenu = document.getElementById("Menu-bar_Manager");
            const memberMenu = document.getElementById("Menu-bar_Member");

            // views.py에서 보낸 is_staff가 True인지 확인
            if (data.is_staff === true) {
                // [관리자일 때]
                if (managerMenu) managerMenu.style.display = "block"; // 관리자 메뉴 보이기
                if (memberMenu) memberMenu.style.display = "none";    // 회원 메뉴 숨기기
            } else {
                // [일반 회원일 때]
                if (managerMenu) managerMenu.style.display = "none";  // 관리자 메뉴 숨기기
                if (memberMenu) memberMenu.style.display = "block";   // 회원 메뉴 보이기
            }
        } else {
            // 로그인 상태가 아닐 경우 (API 호출 실패 등)
            // 필요하다면 로그인 페이지로 보내거나 메뉴를 다 숨길 수 있습니다.
            console.log("로그인 정보 확인 실패");
        }
    } catch (error) {
        console.error("사용자 권한 확인 중 오류 발생:", error);
    }
}
/*
async function logout() {
    // 1. 서버에 로그아웃 요청 보내기 
    try {
        //const csrftoken = getCookie('csrftoken'); // 상단에 정의된 getCookie 함수 사용

        const response = await fetch("/api/logout/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
               // "X-CSRFToken": csrftoken,  CSRF 토큰 전달(POST 요청에 필요) 일단 주석처리 보안부분
               credentials: "include"
            },
            
        });

        // 2. 서버 응답 처리
        if (response.ok) {
            alert("로그아웃 되었습니다.");
        } else {
            console.error("로그아웃 실패");
        }

    } catch (error) {
        console.error("통신 오류:", error);
    } finally {
        // 3. 성공 여부와 관계없이 화면 이동 및 로컬 정보 삭제
        localStorage.removeItem("authToken"); // 토큰을 썼다면 삭제
        window.location.href = "Main.html";   // 메인 화면으로 이동
    }
}*/
// 전역 스코프 할당 (HTML onclick에서 접근 가능하도록)
window.requestBorrow = requestBorrow;
window.processReturn = processReturn;
//window.logout = logout;

/*
// Django CSRF 토큰 가져오기 함수 - POST 요청에 필요
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // 쿠키 이름으로 시작하는 문자열 찾기
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
*/