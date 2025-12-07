document.addEventListener("DOMContentLoaded", () => {
  loadMemberInfo();
  loadMyBorrows();
  loadMyReviews();
});

// 1. 내 정보 불러오기
async function loadMemberInfo() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/me/", {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
        const data = await response.json();
        setText("p_id", data.login_id);
        setText("p_name", data.first_name);
        setText("p_email", data.email);
        setText("p_hp", data.phone_number);
        setText("p_birth_date", data.birth_date);
        setText("p_panalty_count", data.status); // 회원상태 표시
        
        // 모달 입력창에도 미리 값 채워두기
        const editName = document.getElementById("edit_name");
        const editEmail = document.getElementById("edit_email");
        const editHp = document.getElementById("edit_hp");
        const editBirthDate = document.getElementById("edit_birth_date");

        if(editName) editName.value = data.first_name;
        if(editEmail) editEmail.value = data.email;
        if(editHp) editHp.value = data.phone_number;
        if(editBirthDate) editBirthDate.value = data.birth_date;
    }
  } catch (e) { console.error(e); }
}

// 2. 내 대여 목록 불러오기
async function loadMyBorrows() {
    const div = document.getElementById("loan_info");
    div.innerHTML = "";
    try {
        const response = await fetch("http://127.0.0.1:8000/api/me/borrows/", { credentials: "include" });
        const data = await response.json();
        
        if(!data.borrows || data.borrows.length === 0) {
            document.getElementById("strong_none").style.display = "block";
            return;
        }
        document.getElementById("strong_none").style.display = "none";

        data.borrows.forEach(item => {
            // 날짜 비교 (연체 확인)
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = !item.return_date && item.due_date < today;
            const statusText = item.return_date ? "반납완료" : (isOverdue ? "<span style='color:red'>연체중</span>" : "대여중");
            
            // 연장 버튼 (반납 안했고, 연장 안했고, 연체 안했으면 표시)
            let btnHtml = "";
            if (!item.return_date && !item.is_extended && !isOverdue) {
                btnHtml = `<button onclick="extendBook(${item.borrow_id})" style="font-size:12px; width:50px; height:25px; background-color:#4CAF50; color:white; border:none; border-radius:4px;">연장</button>`;
            }

            const row = document.createElement("div");
            row.style.cssText = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ddd;";
            row.innerHTML = `
                <div style="flex:2">${item.book__isbn__title}</div>
                <div style="flex:1">${item.borrow_date}</div>
                <div style="flex:1">~ ${item.due_date}</div>
                <div style="flex:1; text-align:right;">${statusText} ${btnHtml}</div>
            `;
            div.appendChild(row);
        });
    } catch (e) { console.error(e); }
}

// 3. 내 리뷰 목록
async function loadMyReviews() {
    const div = document.getElementById("my_reviews_list"); // HTML에 추가한 ID
    if(!div) return;
    div.innerHTML = "";
    
    try {
        const response = await fetch("http://127.0.0.1:8000/api/me/reviews/", { credentials: "include" });
        const data = await response.json();
        
        if(!data.reviews || data.reviews.length === 0) {
            div.innerHTML = "<p>작성한 리뷰가 없습니다.</p>";
            return;
        }
        
        data.reviews.forEach(r => {
            const row = document.createElement("div");
            row.innerHTML = `<p>[${r.isbn__title}] ⭐${r.rating} - ${r.content}</p>`;
            div.appendChild(row);
        });
    } catch(e) { console.error(e); }
}

// 4. 대여 연장 기능
window.extendBook = async function(borrowId) {
    if(!confirm("대여 기간을 7일 연장하시겠습니까?")) return;
    try {
        const response = await fetch("http://127.0.0.1:8000/api/extend/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ borrow_id: borrowId })
        });
        const result = await response.json();
        alert(result.message || result.error);
        if(response.ok) location.reload();
    } catch(e) { alert("오류 발생"); }
};

// 5. 모달 제어
window.openModal = (id) => document.getElementById(`modal_${id}`).style.display = "block";
window.closeModal = (id) => document.getElementById(`modal_${id}`).style.display = "none";

// 6. 정보 수정 제출
window.submitEditInfo = async function() {
    const name = document.getElementById("edit_name").value;
    const email = document.getElementById("edit_email").value;
    const hp = document.getElementById("edit_hp").value;
    const birthDate = document.getElementById("edit_birth_date").value;
    
    try {
        const response = await fetch("http://127.0.0.1:8000/api/me/update/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
                first_name: name, 
                email: email,
                phone_number: hp,
                birth_date: birthDate
            })
        });
        if(response.ok) {
            alert("수정되었습니다.");
            location.reload();
        } else {
            const res = await response.json();
            alert(res.error);
        }
    } catch(e) { alert("오류 발생"); }
};

// 7. 비밀번호 변경 제출
window.submitChangePw = async function() {
    const curPw = document.getElementById("current_pw").value;
    const newPw = document.getElementById("new_pw").value;
    
    try {
        const response = await fetch("http://127.0.0.1:8000/api/me/change-password/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ current_password: curPw, new_password: newPw })
        });
        const res = await response.json();
        if(response.ok) {
            alert("변경되었습니다.");
            closeModal('changePw');
        } else {
            alert(res.error);
        }
    } catch(e) { alert("오류 발생"); }
};

// 8. 회원 탈퇴
window.deleteAccount = async function() {
    const pw = prompt("탈퇴하시려면 비밀번호를 입력해주세요.");
    if(!pw) return;
    
    try {
        const response = await fetch("http://127.0.0.1:8000/api/me/delete/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ password: pw })
        });
        const res = await response.json();
        if(response.ok) {
            alert("탈퇴 처리되었습니다.");
            window.location.href = "Main.html";
        } else {
            alert(res.error);
        }
    } catch(e) { alert("오류 발생"); }
};

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val || "-";
}

