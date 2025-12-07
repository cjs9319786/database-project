let reviewsArr = [];        // 서버에서 받은 전체 데이터를 저장할 곳
let currentBannedList = []; // 현재 적용된 금지어 리스트
let currentPage = 1;
const itemsPerPage = 10;
const pagesPerGroup = 5;

document.addEventListener("DOMContentLoaded", async () => {
    // 저장된 금지어 불러오기 (없으면 빈 상태)
    loadBannedWords();

    // 페이지 로드 시 전체 데이터 가져오기
    await fetchReviews();

    // 검색 폼 이벤트
    document.getElementById("searchForm").addEventListener("submit", (e) => {
        e.preventDefault();
        fetchReviews();
    });

    // 상세 보기용 모달 HTML 생성
    const modalHtml = `
        <div id="review_modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; justify-content:center; align-items:center;">
            <div style="background:white; padding:20px; width:500px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.2);">
                <h3 style="margin-top:0; border-bottom:1px solid #ddd; padding-bottom:10px;">리뷰 상세 내용</h3>
                <div id="modal_content" style="min-height:100px; max-height:400px; overflow-y:auto; white-space:pre-wrap; margin:15px 0; line-height: 1.5;"></div>
                <div style="text-align:right;">
                    <button onclick="document.getElementById('review_modal').style.display='none'" 
                            style="padding:5px 15px; cursor:pointer; background:#ddd; border:none; border-radius:5px;">닫기</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
});

// 금지어 설정 불러오기
function loadBannedWords() {
    const storedData = localStorage.getItem("my_banned_words");

    if (storedData) {
        // 저장된 게 있으면 불러옴
        currentBannedList = JSON.parse(storedData);
    } else {
        // 저장된 게 없으면 빈 배열로 시작
        currentBannedList = [];
    }
    // 설정창이 있다면 값 채우기
    const inputArea = document.getElementById("banned_words_input");
    if (inputArea) inputArea.value = currentBannedList.join(", ");
}

// 금지어 설정 저장
function saveBannedWords() {
    const inputVal = document.getElementById("banned_words_input").value;

    // 콤마로 분리 및 공백 제거
    const newList = inputVal.split(',')
        .map(w => w.trim())
        .filter(w => w !== "");

    // 빈 값이어도 저장 가능하게 함 (금지어 기능을 끄고 싶을 수 있으므로)
    currentBannedList = newList;

    if (newList.length === 0) {
        localStorage.removeItem("my_banned_words"); // 비었으면 삭제
        alert("금지어 목록이 비워졌습니다.");
    } else {
        localStorage.setItem("my_banned_words", JSON.stringify(newList));
        alert("금지어 설정이 저장되었습니다.\n리스트가 자동으로 갱신됩니다.");
    }

    sortAndDisplay();
}
// 금지어 초기화 (로컬 스토리지에서 삭제)
function resetBannedWords() {
    if (!confirm("금지어 목록을 모두 지우시겠습니까?")) return;
    // 빈 배열로 초기화
    currentBannedList = [];
    localStorage.removeItem("my_banned_words");

    document.getElementById("banned_words_input").value = "";
    alert("초기화되었습니다.");
    sortAndDisplay();
}
// 금지어 포함 여부 확인
function hasBannedWord(content) {
    if (!content || currentBannedList.length === 0) return false;
    // 저장된 리스트에 있는 단어 중 하나라도 포함되면 true
    return currentBannedList.some(word => content.includes(word));
}

// 서버에서 데이터 가져오기
async function fetchReviews() {
    const searchValue = document.getElementById("search_Bar").value.trim();
    let url = `http://127.0.0.1:8000/api/admin/reviews/`;
    if (searchValue) {
        url += `?q=${encodeURIComponent(searchValue)}`;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.status === 403) {
            alert("관리자 권한이 필요합니다.");
            window.location.href = "Main.html";
            return;
        }

        const result = await response.json();
        reviewsArr = result.reviews || [];
        sortAndDisplay();

    } catch (error) {
        console.error("리뷰 조회 오류:", error);
    }
}

// 배열 정렬 후 1페이지부터 출력
function sortAndDisplay() {
    const sortValue = document.getElementById("sort_select").value;

    if (sortValue === 'bad_word') {
        // 부적절 단어 우선 정렬
        reviewsArr.sort((a, b) => {
            const aBad = hasBannedWord(a.content);
            const bBad = hasBannedWord(b.content);

            // 둘 다 금지어가 있거나 둘 다 없으면 -> 최신순
            if (aBad === bBad) return new Date(b.created_at) - new Date(a.created_at);

            // a가 금지어 있으면(-1: 앞으로), b가 있으면(1: 뒤로)
            return bBad - aBad;
        });
    } else if (sortValue === 'latest') {
        reviewsArr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortValue === 'oldest') {
        reviewsArr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortValue === 'high_rating') {
        reviewsArr.sort((a, b) => b.rating - a.rating);
    } else if (sortValue === 'low_rating') {
        reviewsArr.sort((a, b) => a.rating - b.rating);
    }

    // 1페이지부터 다시 그리기
    display_Review_list(1);
}

// 리스트 출력
function display_Review_list(page) {
    currentPage = page;
    const listDiv = document.getElementById("review_list_div");

    // 헤더 초기화
    listDiv.innerHTML = `
        <div class="top">
            <div class="col_id">No</div>
            <div class="col_book">책 제목</div>
            <div class="col_user">작성자</div>
            <div class="col_rating">평점</div>
            <div class="col_content">내용</div>
            <div class="col_date">작성일</div>
            <div class="col_manage">관리</div>
        </div>
    `;

    if (reviewsArr.length === 0) {
        listDiv.innerHTML += `<div style="padding:20px; text-align:center;">데이터가 없습니다.</div>`;
        document.getElementById("list_Page").innerHTML = "";
        return;
    }

    // 페이지네이션 로직 (Client-side Pagination)
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = reviewsArr.slice(startIndex, endIndex);

    currentItems.forEach((item, index) => {
        const divItem = document.createElement("div");
        divItem.classList.add("li-item");

        // 금지어 포함 확인
        const isBad = hasBannedWord(item.content);
        if (isBad) {
            divItem.style.backgroundColor = "#fff0f0"; // 연한 빨강 배경
        }

        const dateStr = item.created_at.substring(0, 10);
        const stars = "⭐".repeat(item.rating);
        const listNum = startIndex + index + 1;

        // 내용 하이라이팅 (금지어 있을 때만)
        let contentDisplay = item.content;
        if (isBad) {
            currentBannedList.forEach(word => {
                contentDisplay = contentDisplay.replaceAll(word, `<span style="background:yellow; color:red; font-weight:bold;">${word}</span>`);
            });
            contentDisplay = `<span style="color:red; font-weight:bold; margin-right:5px;">[주의]</span>` + contentDisplay;
        }

        divItem.innerHTML = `
            <div class="col_id">${listNum}</div>
            <div class="col_book" title="${item.isbn__title}">${item.isbn__title}</div>
            <div class="col_user">${item.member__login_id}</div>
            <div class="col_rating" style="color:#f39c12;">${stars} (${item.rating})</div>
            
            <div class="col_content" 
                 title="클릭하여 전체 보기" 
                 onclick="showReviewModal(\`${item.content.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)">
                 ${contentDisplay}
            </div>
            
            <div class="col_date">${dateStr}</div>
            <div class="col_manage">
                <input type="button" class="delete_btn_style" value="삭제" 
                       onclick="deleteReviewAdmin(${item.review_id})">
            </div>
        `;
        listDiv.appendChild(divItem);
    });

    createPaginationButtons();
}

// 리뷰 삭제
async function deleteReviewAdmin(reviewId) {
    if (!confirm("정말로 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/reviews/delete/${reviewId}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.ok) {
            alert("삭제되었습니다.");
            // 삭제 후 데이터 다시 불러오기 (새로고침 없이)
            fetchReviews();
        } else {
            alert("삭제 실패");
        }
    } catch (e) {
        console.error(e);
    }
}

// 페이지네이션 버튼 생성
function createPaginationButtons() {
    const listPage = document.getElementById("list_Page");
    const totalPages = Math.ceil(reviewsArr.length / itemsPerPage);
    listPage.innerHTML = "";

    if (totalPages === 0) return;

    // 버튼 생성 헬퍼 함수
    const createBtn = (text, page) => {
        const btn = document.createElement("a");
        btn.href = "#";
        btn.innerText = text;
        btn.className = (text === currentPage) ? "num_p on" : "num_p"; // 클래스명은 CSS에 맞게 조정
        if (text === '<<' || text === '<' || text === '>' || text === '>>') btn.className = "bt";

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            display_Review_list(page);
        });
        return btn;
    };

    // <<, < 버튼
    listPage.appendChild(createBtn("<<", 1));
    listPage.appendChild(createBtn("<", currentPage > 1 ? currentPage - 1 : 1));

    // 숫자 버튼 그룹
    const startPage = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
        const btn = createBtn(i, i);
        if (i === currentPage) {
            btn.style.fontWeight = "bold";
            btn.style.color = "green"; // 활성 스타일
        }
        listPage.appendChild(btn);
    }

    // >, >> 버튼
    listPage.appendChild(createBtn(">", currentPage < totalPages ? currentPage + 1 : totalPages));
    listPage.appendChild(createBtn(">>", totalPages));
}

// 리뷰 상세 모달 표시
function showReviewModal(content) {
    document.getElementById("modal_content").textContent = content;
    document.getElementById("review_modal").style.display = "flex";
}

// 전역 함수 등록
window.sortAndDisplay = sortAndDisplay;
window.deleteReviewAdmin = deleteReviewAdmin;
window.showReviewModal = showReviewModal;