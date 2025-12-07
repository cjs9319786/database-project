// 전역 변수: 데이터를 저장하고 페이지를 관리
let allPublishers = [];
let currentPubPage = 1;
const pubsPerPage = 10;
const pubPageGroupSize = 5;

// 모달 열기
window.openPublisherModal = function() {
    const modal = document.getElementById("publisher-modal-wrap");
    modal.style.display = "flex";
    
    // 검색창 초기화
    if(document.getElementById("pub_search_input")) {
        document.getElementById("pub_search_input").value = ""; 
    }

    resetPubForm();
    fetchPublishers(); // 전체 목록 로드 (검색어 없이)
};

// 검색 버튼 기능
window.searchPublishers = function() {
    const query = document.getElementById("pub_search_input").value;
    fetchPublishers(query); // 검색어를 인자로 전달
};

// 모달 닫기
window.closePublisherModal = function () {
    document.getElementById("publisher-modal-wrap").style.display = "none";
};

// 폼 초기화
window.resetPubForm = function () {
    document.getElementById("pub_id_hidden").value = "";
    document.getElementById("input_pub_name").value = "";
    document.getElementById("input_pub_phone").value = "";

    const saveBtn = document.getElementById("btn_save_pub");
    saveBtn.innerText = "등록";
    saveBtn.style.backgroundColor = "#4CAF50";
};

// 출판사 목록 API 호출 (query: 검색어)
async function fetchPublishers(query = "") {
    try {
        // 검색어가 있으면 URL 뒤에 ?q=검색어 붙임
        const url = `http://127.0.0.1:8000/api/admin/publishers/?q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        if (response.ok) {
            const result = await response.json();
            allPublishers = result.publishers; 
            // 검색 결과로 1페이지 다시 그리기
            renderPublisherPage(1);
        } else {
            if(response.status === 403){
                alert("관리자 권한이 필요합니다.");
                closePublisherModal();
                return;
            }else{
                alert(`"목록을 불러오지 못했습니다."`);
                closePublisherModal();
                    return;
        }
    }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
}

// 페이지 렌더링 함수 (10개씩만 그리기)
function renderPublisherPage(page) {
    currentPubPage = page;
    const tbody = document.getElementById("publisher_list_tbody");
    tbody.innerHTML = "";

    if (allPublishers.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3'>등록된 출판사가 없습니다.</td></tr>";
        document.getElementById("pub_pagination").innerHTML = "";
        return;
    }

    // 현재 페이지에 해당하는 데이터 슬라이싱
    const start = (page - 1) * pubsPerPage;
    const end = start + pubsPerPage;
    const itemsToShow = allPublishers.slice(start, end);

    itemsToShow.forEach(pub => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding: 8px;">${pub.publisher_name}</td>
            <td style="padding: 8px;">${pub.phone_number || "-"}</td>
            <td style="padding: 8px;">
                <button onclick="prepareEdit('${pub.publisher_id}', '${pub.publisher_name}', '${pub.phone_number}')" 
                        style="cursor:pointer; padding:4px 8px; background:#2196F3; color:white; border:none; border-radius:3px; margin-right:5px;">
                    수정
                </button>
                <button onclick="deletePublisher('${pub.publisher_id}')" 
                        style="cursor:pointer; padding:4px 8px; background:#f44336; color:white; border:none; border-radius:3px;">
                    삭제
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 페이지네이션 버튼 생성
    createPubPagination();
}
// 페이지네이션 버튼 생성 함수
function createPubPagination() {
    const paginationDiv = document.getElementById("pub_pagination");
    paginationDiv.innerHTML = "";

    const totalPages = Math.ceil(allPublishers.length / pubsPerPage);
    if (totalPages === 0) return;

    // 현재 페이지 그룹 계산
    const startPage = Math.floor((currentPubPage - 1) / pubPageGroupSize) * pubPageGroupSize + 1;
    const endPage = Math.min(startPage + pubPageGroupSize - 1, totalPages);

    // 버튼 생성 도우미
    const createBtn = (text, targetPage, isDisabled = false, isActive = false) => {
        const a = document.createElement("a");
        a.href = "#";
        a.innerText = text;
        a.className = isActive ? "num_p on" : "num_p"; // 기존 CSS 클래스 재사용
        if (!isActive) a.style.margin = "0 3px";

        if (isDisabled) {
            a.style.pointerEvents = "none";
            a.style.color = "#ccc";
            a.style.borderColor = "#ccc";
        } else {
            a.onclick = (e) => {
                e.preventDefault();
                renderPublisherPage(targetPage);
            };
        }
        return a;
    };

    // [<<] [ < ]
    paginationDiv.appendChild(createBtn("<<", 1, currentPubPage === 1));
    paginationDiv.appendChild(createBtn("<", currentPubPage - 1, currentPubPage === 1));

    // [1] [2] [3] ...
    for (let i = startPage; i <= endPage; i++) {
        paginationDiv.appendChild(createBtn(i, i, false, i === currentPubPage));
    }

    // [ > ] [>>]
    paginationDiv.appendChild(createBtn(">", currentPubPage + 1, currentPubPage === totalPages));
    paginationDiv.appendChild(createBtn(">>", totalPages, currentPubPage === totalPages));
}

// 등록 및 수정 처리
window.savePublisher = async function () {
    const id = document.getElementById("pub_id_hidden").value;
    const name = document.getElementById("input_pub_name").value;
    const phone = document.getElementById("input_pub_phone").value;

    if (!name.trim()) {
        alert("출판사 이름을 입력해주세요.");
        return;
    }

    let url = "";
    let method = "POST";
    let alertMsg = "";

    if (id) {
        url = `http://127.0.0.1:8000/api/admin/publishers/update/${id}/`;
        alertMsg = "수정되었습니다.";
    } else {
        url = "http://127.0.0.1:8000/api/admin/publishers/create/";
        alertMsg = "등록되었습니다.";
    }

    const data = {
        publisher_name: name,
        phone_number: phone
    };

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(alertMsg);
            resetPubForm();
            fetchPublishers(); // 데이터 다시 로드 및 리스트 갱신
        } else {
            alert("작업 실패: " + (result.error || "알 수 없는 오류"));
        }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
};

// 수정 준비
window.prepareEdit = function (id, name, phone) {
    document.getElementById("pub_id_hidden").value = id;
    document.getElementById("input_pub_name").value = name;
    document.getElementById("input_pub_phone").value = (phone === "null" || phone === "undefined") ? "" : phone;

    const saveBtn = document.getElementById("btn_save_pub");
    saveBtn.innerText = "수정 저장";
    saveBtn.style.backgroundColor = "#2196F3";
};

// 삭제 처리
window.deletePublisher = async function (id) {
    if (!confirm("정말로 삭제하시겠습니까?\n(도서가 연결된 출판사는 삭제할 수 없습니다.)")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/publishers/delete/${id}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });

        const result = await response.json();

        if (response.ok) {
            alert("삭제되었습니다.");
            fetchPublishers();
        } else {
            alert("삭제 실패: " + (result.error || "오류 발생"));
        }
    } catch (error) {
        console.error(error);
        alert("서버 통신 오류");
    }
};