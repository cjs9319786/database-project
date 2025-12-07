let booksArr = []; // 검색 결과를 저장할 배열
let currentPage = 1;
const itemsPerPage = 10;
const pagesPerGroup = 5;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchForm");
  const boardPage = document.getElementById("board_page");
  const board = document.getElementById("Result_list");

  // 1. 책 검색 함수
  async function search(search_value) {
    try {
      const searchParams = search_value.toString();
      // 엔드포인트: views.py의 search_books와 연결됨
      const endUrl = `http://127.0.0.1:8000/api/books/?q=${searchParams}`;

      const response = await fetch(endUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      // 결과가 없거나 비어있는 경우 처리
      if (!result.books || result.books.length === 0) {
        alert("검색 결과가 없습니다!");
        // 검색 결과가 없으면 리스트를 비웁니다
        booksArr = [];
        display_book_list(1);
        return;
      }

      booksArr = result.books.map((row) => ({
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        publisher: row.publisher__publisher_name,
        category: row.category__category_name,
        amount: row.stock_count !== undefined ? row.stock_count : 0,
        rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : "0.0",
        info: "상세 설명이 없습니다.",
        image_url: row.image_url
      }));

      display_book_list(1);
      openList(); // 결과창 열기

    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  }

  // 검색 폼 제출 이벤트
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const searchInput = document.getElementById("booksearch_input");
    if (searchInput.value.trim() == "") {
      alert("검색어를 입력해주세요");
      return;
    }
    search(searchInput.value);
  });

  // 책 목록 표시 함수
  function display_book_list(page) {
    currentPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = booksArr.slice(startIndex, endIndex);

    // 헤더 다시 그리기
    board.innerHTML = `<div class="top">
      <div class="b_title">책 제목</div>
      <div class="b_writer">저자</div>
      <div class="b_publish">출판사</div>
      <div class="b_amount">수량</div>
    </div>`;

    if (currentItems.length === 0) {
      board.innerHTML += `<div class="li-item" style="justify-content:center; padding:20px;">검색 결과가 없습니다.</div>`;
      return;
    }

    currentItems.forEach((item) => {
      const divItem = document.createElement("div");
      divItem.classList.add("li-item");

      // 제목 클릭 시 display_Detail 함수에 ISBN(문자열)을 전달
      divItem.innerHTML = `
        <div class="b_num" id="b_num_${item.isbn}" style="display:none">${item.isbn}</div>
        <div class="b_title">
            <a onclick="display_Detail('${item.isbn}')" style="cursor: pointer; font-weight: bold; color: #333;">
                ${item.title}
            </a>
        </div>
        <div class="b_writer">${item.author}</div>
        <div class="b_publish">${item.publisher}</div>
        <div class="b_amount">${item.amount}</div>
        `;
      board.appendChild(divItem);
    });

    createPaginationButtons();
  }

  // 페이지네이션 함수
  function createPaginationButtons() {
    const totalPages = Math.ceil(booksArr.length / itemsPerPage);
    boardPage.querySelectorAll(".bt,.num_p").forEach((btn) => btn.remove());

    if (totalPages === 0) return;

    const createBtn = (cls, text, onClick) => {
      const btn = document.createElement("a");
      btn.href = "#";
      btn.className = cls;
      btn.textContent = text;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        onClick();
      });
      return btn;
    };

    boardPage.prepend(createBtn("bt prev", "<", () => { if (currentPage > 1) display_book_list(currentPage - 1); }));
    boardPage.prepend(createBtn("bt first", "<<", () => display_book_list(1)));

    boardPage.append(createBtn("bt next", ">", () => { if (currentPage < totalPages) display_book_list(currentPage + 1); }));
    boardPage.append(createBtn("bt last", ">>", () => display_book_list(totalPages)));

    const startPage = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = createBtn("num_p", i, () => display_book_list(i));
      pageBtn.dataset.page = i;
      if (i === currentPage) pageBtn.classList.add("on");
      boardPage.insertBefore(pageBtn, boardPage.querySelector(".bt.next"));
    }
  }
});

// 페이지 이동 함수
function navigateToPage() {
  window.location.href = "Main.html";
}

// 상세 정보 보여주기 (서버 데이터 기반)
// [전역 변수 추가] 현재 보고 있는 책의 ISBN과 내 리뷰 ID 저장용
let currentIsbn = null;
let myReviewId = null;
let myReviewData = null;

// 상세 정보 보여주기 (수정됨)
async function display_Detail(isbn) {
  currentIsbn = isbn; // 현재 ISBN 전역 변수에 저장
  myReviewId = null;  // 리뷰 ID 초기화
  myReviewData = null; // 내 리뷰 데이터 초기화

  // 모달창 띄우기 (데이터 로딩 전 미리 띄움)
  const modal = document.getElementById("modal_overlay");
  modal.style.display = "flex";
  document.getElementById("p_title").textContent = "로딩 중...";

  try {
    // 서버에 상세 정보 요청 (views.py의 book_detail 호출)
    const response = await fetch(`http://127.0.0.1:8000/api/books/${isbn}/`);

    if (!response.ok) {
      throw new Error("상세 정보를 불러오는데 실패했습니다.");
    }
    // 서버에서 받은 최신 데이터 (평점 포함)
    const bookData = await response.json();

    // 받아온 데이터로 모달 내용 채우기
    document.getElementById("p_title").textContent = bookData.title;
    document.getElementById("p_writer").textContent = bookData.author;
    document.getElementById("p_publish").textContent = bookData.publisher_name;
    document.getElementById("p_num").textContent = bookData.isbn;
    const listData = booksArr.find(b => String(b.isbn) === String(isbn));
    document.getElementById("p_amount").textContent = listData ? listData.amount : "-";

    // 평점(별) 그리기 로직 (서버에서 받은 rating 사용)
    const ratingVal = parseFloat(bookData.rating); // 서버가 준 최신 평점
    const fullStars = Math.floor(ratingVal);
    const emptyStars = 5 - fullStars;
    const starStr = "⭐".repeat(fullStars) + "☆".repeat(emptyStars);

    document.getElementById("p_stars").textContent = starStr;
    document.getElementById("p_rating_value").textContent = `(${ratingVal.toFixed(1)})`;

    // 이미지 처리
    const imageElement = document.getElementById("Detail_image");
    if (imageElement) {
      if (bookData.image_url && bookData.image_url.trim() !== "") {
        imageElement.innerHTML = `
                <img src="${bookData.image_url}"
                     alt="${bookData.title}" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;">
              `;
      } else {
        imageElement.innerHTML = `
                <div style="width:100%; height:100%; background:#eee; display:flex; align-items:center; justify-content:center; color:#888;">
                    이미지 없음
                </div>`;
      }
    }

    // 리뷰 목록 및 내 리뷰 상태 로드
    closeReviewForm();
    document.getElementById("my_review_actions").innerHTML = "";
    await loadMyReviewStatus(isbn);
    await loadAllReviews(isbn);

  } catch (error) {
    console.error("상세 정보 로드 오류:", error);
    alert("도서 정보를 불러올 수 없습니다: " + error.message);
    closeDetail(); // 오류 시 모달 닫기
  }
}

// 리뷰 폼 열기/닫기/제출
function openReviewForm(mode) {
  const form = document.getElementById("review_form_container");
  form.style.display = "block";
  form.dataset.mode = mode; // 'create' or 'update'

  if (mode === 'update' && myReviewData) {
    // 수정 모드일 때: 전역 변수(myReviewData)에서 값을 가져와 세팅
    document.getElementById("review_rating").value = myReviewData.rating;
    document.getElementById("review_content").value = myReviewData.content;
  } else {
    // 작성 모드일 때: 초기화
    document.getElementById("review_rating").value = "5";
    document.getElementById("review_content").value = "";
  }
}

function closeReviewForm() {
  document.getElementById("review_form_container").style.display = "none";
}

// 리뷰 등록/수정 제출 함수
async function submitReview() {
  const form = document.getElementById("review_form_container");
  const mode = form.dataset.mode;

  const rating = document.getElementById("review_rating").value;
  const content = document.getElementById("review_content").value;

  if (!content.trim()) {
    alert("내용을 입력해주세요.");
    return;
  }

  let url = "";
  let bodyData = {};

  if (mode === 'create') {
    url = "http://127.0.0.1:8000/api/reviews/create/";
    bodyData = { isbn: currentIsbn, rating: rating, content: content };
  } else {
    // 수정 시 myReviewId 사용
    url = `http://127.0.0.1:8000/api/reviews/update/${myReviewId}/`;
    bodyData = { rating: rating, content: content };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // 세션 인증 필수
      body: JSON.stringify(bodyData)
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      // 성공 후 상세화면 새로고침 (변경된 내용 반영)
      display_Detail(currentIsbn);
    } else {
      alert("실패: " + (result.error || "알 수 없는 오류"));
    }
  } catch (error) {
    console.error("리뷰 저장 오류:", error);
    alert("서버 통신 중 오류가 발생했습니다.");
  }
}

// 전체 리뷰 목록 가져오기
async function loadAllReviews(isbn) {
  const listDiv = document.getElementById("reviews_list");
  listDiv.innerHTML = "로딩 중...";

  try {
    // views.py의 read_reviews 엔드포인트 호출
    const response = await fetch(`http://127.0.0.1:8000/api/books/${isbn}/reviews/`);
    const data = await response.json();

    if (!data.reviews || data.reviews.length === 0) {
      listDiv.innerHTML = "<p>등록된 리뷰가 없습니다.</p>";
      return;
    }

    let html = "";
    data.reviews.forEach(review => {
      const stars = "⭐".repeat(review.rating);
      html += `
                <div style="border-bottom:1px solid #eee; padding: 10px 0;">
                    <div style="font-size:12px; color:gray;">
                        <span>${review.member__login_id}</span> | <span>${review.created_at.substring(0, 10)}</span>
                    </div>
                    <div style="color:#f39c12;">${stars}</div>
                    <div>${review.content}</div>
                </div>
            `;
    });
    listDiv.innerHTML = html;

  } catch (error) {
    listDiv.innerHTML = "리뷰를 불러올 수 없습니다.";
    console.error(error);
  }
}

async function loadMyReviewStatus(isbn) {
  const actionDiv = document.getElementById("my_review_actions");
  actionDiv.innerHTML = "<span>권한 확인 중...</span>";

  try {
    const encodedIsbn = encodeURIComponent(isbn);
    const response = await fetch(`http://127.0.0.1:8000/api/books/${encodedIsbn}/status/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    if (!response.ok) throw new Error("상태 확인 실패");

    const data = await response.json();

    // 로그인하지 않은 경우
    if (!data.is_authenticated) {
      actionDiv.innerHTML = "<p style='color:gray; font-size:14px;'>로그인 후 리뷰를 작성할 수 있습니다.</p>";
      return;
    }

    // 이미 작성한 리뷰가 있는 경우 (수정 기능만 제공)
    if (data.my_review) {
      myReviewId = data.my_review.review_id;
      myReviewData = data.my_review; // ★ 데이터를 전역 변수에 저장 (수정 시 사용)

      const stars = "⭐".repeat(data.my_review.rating);

      actionDiv.innerHTML = `
                <div style="padding: 10px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 5px; margin-bottom: 10px;">
                    <div style="font-weight:bold; color:green; margin-bottom:5px;">내가 쓴 리뷰</div>
                    <div style="color:#f39c12;">${stars}</div>
                    <div style="color:#555; margin: 5px 0; white-space: pre-wrap;">${data.my_review.content}</div>
                    <div style="text-align:right;">
                        <button onclick="openReviewForm('update')" 
                                style="cursor:pointer; background:white; border:1px solid #ccc; padding:3px 8px; border-radius:3px;">수정</button>
                    </div>
                </div>
            `;
      return;
    }

    // 대여한 적이 없는 경우
    if (!data.has_borrowed) {
      actionDiv.innerHTML = "<p style='color:gray; font-size:14px;'>이 책을 대여한 이력이 있어야 리뷰를 작성할 수 있습니다.</p>";
      return;
    }

    // 리뷰 작성 가능 (로그인O, 대여O, 리뷰X)
    actionDiv.innerHTML = `
            <button onclick="openReviewForm('create')" 
                    style="width:100%; padding:10px; background-color:green; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">
                리뷰 작성하기
            </button>
        `;

  } catch (error) {
    console.error(error);
    actionDiv.innerHTML = "";
  }
}

// 모달 닫기 기능
function closeDetail() {
  const modal = document.getElementById("modal_overlay");
  if (modal) {
    modal.style.display = "none";
  }
}


// 리스트 열고 닫기 UI 함수
function openList() {
  document.getElementById("search_Result").style.display = "block";
}

function closeList() {
  document.getElementById("search_Result").style.display = "none";
  // 리스트 닫을 때 상세창도 같이 닫으려면 아래 주석 해제
  // document.getElementById("Result_Detail").style.display = "none";
}