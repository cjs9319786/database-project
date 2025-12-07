let join_members = [];
let currentData = {};
let currentPage = 1;
const itemsPerPage = 15;
const pagesPerGroup = 5;

document.addEventListener("DOMContentLoaded", async () => {
  const join_btn = document.getElementById("join_member_btn"); //전체회원조회버튼
  const join_member_list = document.getElementById("join_member_List"); //회원 목록 추가할 리스트
  const searchForm = document.getElementById("searchForm");
  const admin_btn = document.getElementById("modify_admin_btn");
  const signUpForm = document.getElementById('memberSignUpForm');

  const list_Page = document.getElementById("list_Page");
  const delete_btn = document.getElementById("delete_btn");
  //전체회원정보 불러오기
  join_btn.addEventListener("click", async function () {
    try {
      const endUrl = "http://127.0.0.1:8000/api/admin/members/";
      const response = await fetch(endUrl, {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();
      const member_data = result.members || [];
      join_members = member_data.map((row) => ({
        member_id: row.id,
        login_id: row.login_id,
        first_name: row.first_name,
        email: row.email,
        phone_number: row.phone_number,
        birth_date: row.birth_date,
        status: row.status,
        date_joined: row.date_joined,
        is_active: row.is_active,
    }));
      console.log(join_members);
      display_Member_list(1);
    } catch (error) {
      console.error("서버통신오류", error);
    }
  });
  //회원검색
  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (document.querySelector("#search_Bar").value == "") {
      alert("검색어를 입력해주세요");
      return;
    }

    const searchInput = document.getElementById("search_Bar").value;
    try {
      const endUrl = `http://127.0.0.1:8000/api/admin/members/?q=${encodeURIComponent(searchInput)}`;
      const response = await fetch(endUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
            const result = await response.json();
      const member_data = result.members || [];
      join_members = member_data.map((row) => ({
        member_id: row.id,
        login_id: row.login_id,
        first_name: row.first_name,
        email: row.email,
        phone_number: row.phone_number,
        birth_date: row.birth_date,
        status: row.status,
        date_joined: row.date_joined,
        is_active: row.is_active,
      }));
      display_Member_list(1);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  });
  //회원 추가
  signUpForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    console.log("폼데이터:", formData);
    const data = {
      login_id: formData.get("modal_login_id"),
      password: formData.get("modal_password"),
      first_name: formData.get("modal_first_name"),
      email: formData.get("modal_email"),
      phone_number: formData.get("modal_phone_number").replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"),
      birth_date: formData.get("modal_birth_date"),
      status: formData.get("modal_status"),
    };
    try {
      const endUrl = `http://127.0.0.1:8000/api/admin/members/create/`;
      const response = await fetch(endUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok) {
            alert(result.message || "회원 등록이 성공적으로 완료되었습니다.");
            closeModal();
            location.reload(); 
        } else {
            alert(`등록 실패: ${result.error || response.statusText}`);
            console.error("등록 실패 상세:", result.error);
        }
    } catch (error) {
      console.error("Error adding member:", error);
    }
  });

  //회원 리스트 생성
  function display_Member_list(page) {
    currentPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = join_members.slice(startIndex, endIndex);
    join_member_list.innerHTML = `<div class="top">
                <div class="top-item" id="top-id">회원 ID</div>
                <div class="top-item" id="top-name">이름</div>
                <div class="top-item" id="top-email">이메일 주소</div>
                <div class="top-item" id="top-hp">회원 전화번호</div>
                <div class="top-item" id="top-birthdate">생년월일</div>
                <div class="top-item" id="top-status">회원상태</div>
                <div class="top-item" id="top-is_active">is_active</div>
                <div class="top-item" id="top-detail">상세</div>
                </div>`;

    currentItems.forEach((item) => {
      const divItem = document.createElement("div");
      divItem.classList.add("li-item");
      divItem.innerHTML = '';
      divItem.innerHTML = `
          <div class="id">${item.login_id}</div>
          <div class="name">${item.first_name}</div>
          <div class="email">${item.email}</div>
          <div class="hp">${item.phone_number}</div>
          <div class="birthdate">${item.birth_date}</div>
          <div class="status">${item.status}</div>
          <div class="is_active">${item.is_active ? '활성' : '비활성'}</div>
          <div class="detail">
          <input type="button" class="btn" id="detail_btn_${item.member_id}" value="상세" onclick="change_Detail(${item.member_id})">
          <input type="button" class="btn" id="detail_btn_${item.member_id}" value="대여" onclick="openRentModal(${item.member_id}, '${item.first_name}')"></div>
          `;
      join_member_list.appendChild(divItem);
    });
    createPaginationButtons();
  }

 //페이지네이션 생성
  function createPaginationButtons() {
    const totalPages = Math.ceil(join_members.length / itemsPerPage);

    list_Page.querySelectorAll(".bt,.num_p").forEach((btn) => btn.remove());

    const firstPageBtn = document.createElement("a");
    firstPageBtn.href = "#";
    firstPageBtn.className = "bt first";
    firstPageBtn.textContent = "<<";
    firstPageBtn.addEventListener("click", () => display_Member_list(1));

    const prevPageBtn = document.createElement("a");
    prevPageBtn.href = "#";
    prevPageBtn.className = "bt prev";
    prevPageBtn.textContent = "<";
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) display_Member_list(currentPage - 1);
    });

    const nextPageBtn = document.createElement("a");
    nextPageBtn.href = "#";
    nextPageBtn.className = "bt next";
    nextPageBtn.textContent = ">";
    nextPageBtn.addEventListener("click", () => {
      if (currentPage < totalPages) display_Member_list(currentPage + 1);
    });

    const lastPageBtn = document.createElement("a");
    lastPageBtn.href = "#";
    lastPageBtn.className = "bt last";
    lastPageBtn.textContent = ">>";
    lastPageBtn.addEventListener("click", () => display_Member_list(totalPages));

    const startPage = Math.floor((currentPage - 1) / pagesPerGroup) * pagesPerGroup + 1;
    const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

    // 페이지 버튼 생성
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("a");
      pageBtn.href = "#";
      pageBtn.className = "num_p";
      pageBtn.textContent = i;
      pageBtn.dataset.page = i;
      pageBtn.addEventListener("click", (e) => {
        e.preventDefault();
        display_Member_list(i);
      });
      if (i === currentPage) {
        pageBtn.classList.add("on");
      }
      list_Page.appendChild(pageBtn);
    }
    // 이전 페이지, 다음 페이지, 첫 페이지, 마지막 페이지 버튼을 추가합니다.
    list_Page.prepend(firstPageBtn, prevPageBtn);
    list_Page.append(nextPageBtn, lastPageBtn);
  }
});
  //회원 삭제 
async function del_member(id,is_staff) {

  if (is_staff) {
    alert("관리자는 삭제할 수 없습니다.");
    return;
  }
  if (!confirm("정말로 해당 회원을 탈퇴(비활성화) 처리하시겠습니까?")) {
        return;
    }
    try {
      const endUrl = `http://127.0.0.1:8000/api/admin/members/delete/${id}/`;
      await fetch(endUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ member_id: id }),
      });
      alert("삭제성공");
      location.reload();
    } catch (error) {
      console.error("서버통신오류", error);
    }
}
function showModal(param) {

  if (param === 'signUp'){
    document.getElementById('memberSignUpForm').reset();
    document.getElementById('sign_up_btn').style.display = 'block';
    document.getElementById('modify_btn').style.display = 'none';
  }
  else if (param === 'modify'){
    document.getElementById('sign_up_btn').style.display = 'none';
    document.getElementById('modify_btn').style.display = 'block';
    document.getElementById('modal_password').parentElement.style.display = 'none';
    document.getElementById('modal_login_id').disabled = true;
      if(document.getElementById("modal_status").value === "탈퇴"){
        document.getElementById("modify_btn").style.backgroundColor = "gray";
        document.getElementById("modify_btn").disabled = true;
      }
      else{
        document.getElementById("modify_btn").style.backgroundColor = "green";
        document.getElementById("modify_btn").disabled = false;
  }
  }
  else{
    document.getElementById('sign_up_btn').style.display = 'none';
    document.getElementById('modify_btn').style.display = 'none';
  }
  document.getElementById('signUpModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('signUpModal').style.display = 'none';
    document.getElementById('borrowModal').style.display = 'none';
    document.getElementById('rent_modal').style.display = 'none';
    
}

async function change_Detail(id) {

  const info_div = document.getElementById("info_wrap")
  const btn_wrap = document.getElementById("btn_wrap")
  const login_id = document.getElementById("modal_login_id");
  const name = document.getElementById("modal_first_name");
  const email = document.getElementById("modal_email");
  const phone = document.getElementById("modal_phone_number");
  const birth = document.getElementById("modal_birth_date");
  const status = document.getElementById("modal_status");
  
  info_div.innerHTML = ``;

  try {
    // URL에 id를 포함시킵니다. (예: .../members/5/)
    const endUrl = `http://127.0.0.1:8000/api/admin/members/${id}/`;
    const response = await fetch(endUrl, {
      method: "GET",
      credentials: "include", // 쿠키/세션 인증 포함
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 데이터 파싱
    const data = await response.json();

    // 3. 데이터 가공 (null 처리 등)
    const isActiveText = data.is_active ? '활성' : '비활성';
    const overdueDate = data.overdue_end_date ? data.overdue_end_date : '-';
    const statusText = data.status ? data.status : '일반';
    const joinDate = data.date_joined ? data.date_joined.substring(0, 10) : '-';
  

  info_div.innerHTML = `
            <h3 style="margin-bottom: 20px; text-align: center;">회원 상세 정보</h3>
            <table style="width: 100%; border-top: 2px solid green; border-collapse: collapse;">
                <colgroup>
                    <col style="width: 30%; background: #f9f9f9;">
                    <col style="width: 70%;">
                </colgroup>
                <tbody>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">회원 ID</th>
                        <td style="padding-left: 15px;">${data.login_id}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">이름</th>
                        <td style="padding-left: 15px;">${data.first_name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">이메일</th>
                        <td style="padding-left: 15px;">${data.email}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">전화번호</th>
                        <td style="padding-left: 15px;">${data.phone_number}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">생년월일</th>
                        <td style="padding-left: 15px;">${data.birth_date}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">회원 상태</th>
                        <td style="padding-left: 15px;">${statusText}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">활동 여부</th>
                        <td style="padding-left: 15px;">${isActiveText}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">연체 종료일</th>
                        <td style="padding-left: 15px;">${overdueDate}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">가입일</th>
                        <td style="padding-left: 15px;">${joinDate}</td> 
                    </tr>
                    <tr style="border-bottom: 1px solid #ddd; height: 40px;">
                        <th style="padding-left: 15px; text-align: left;">관리자 여부</th>
                        <td style="padding-left: 15px;">${data.is_staff ? '예' : '아니오'}</td> 
                    </tr>
                </tbody>
            </table>
        `;
      btn_wrap.innerHTML = 
              `<input type="button" value="회원의 대여/반납 기록" onclick="openBorrowModal(${data.member_id})" class="div_change_btn" id="modify_admin_btn" />
              <input type="button" value="회원 정보 수정" onclick="showModal('modify')" class="div_change_btn" id="modify_member_btn" />
              <input type="button" value="회원 삭제" onclick="del_member(${data.member_id},${data.is_staff})" class="div_change_btn" id="delete_btn" />
              <input type="button" value="돌아가기" onclick="change_join()" class="div_change_btn" id="return_btn" />`;

      // 모달창에도 미리 넣어놓기
      if(login_id || name || email || phone || birth || status){
            currentData = {
              id: data.member_id,
            login_id: data.login_id,
            first_name: data.first_name,
            email: data.email,
            phone_number: data.phone_number,
            birth_date: data.birth_date,
            status: data.status
          }
          login_id.value = data.login_id;
          name.value = data.first_name;
          email.value = data.email;
          phone.value = data.phone_number;
          birth.value = data.birth_date;
          status.value = data.status;
        } 
        if(data.status === "탈퇴"){document.getElementById("delete_btn").style.display = "none";}
        else{document.getElementById("delete_btn").style.display = "block";}

      }catch (error) {
      console.error("서버통신오류", error);
      alert("회원 상세 정보를 불러오는 데 실패했습니다.");
  }

  document.getElementById("check_member_wrap").style.display = "none";
  document.getElementById("member_Manage_wrap").style.display = "block";
/*
  if (a == 1) {
    document.getElementById("info_Penalty").style.display = "none";
    document.getElementById("p_admin").textContent = "관리자입니다.";
    document.getElementById("modify_admin_btn").style.display = "none";
    document.getElementById("delete_btn").style.display = "none";
  }
    */
}
function change_join() {
  document.getElementById("join_member_check_wrap").style.display = "block";
  document.getElementById("check_member_wrap").style.display = "block";
  document.getElementById("member_Manage_wrap").style.display = "none";
  document.getElementById("list_Page").style.display = "block";
}
  
async function modify_info(){
  /*admin/members/update/<int:member_id/></int:member_id>*/
  console.log("수정데이터:", currentData.status);
  const updateData = {};
  if(currentData.first_name !== document.getElementById("modal_first_name").value)
    updateData.first_name = document.getElementById("modal_first_name").value;
  if(currentData.email !== document.getElementById("modal_email").value)
    updateData.email = document.getElementById("modal_email").value;
  if(currentData.phone_number !== document.getElementById("modal_phone_number").value)
    updateData.phone_number = document.getElementById("modal_phone_number").value;
  if(currentData.birth_date !== document.getElementById("modal_birth_date").value)
    updateData.birth_date = document.getElementById("modal_birth_date").value;
  if(currentData.status !== document.getElementById("modal_status").value)
    updateData.status = document.getElementById("modal_status").value;

  if (Object.keys(updateData).length === 0) {
    alert("수정된 정보가 없습니다.");
    return;
  }

  try{
    const endUrl = `http://127.0.0.1:8000/api/admin/members/update/${currentData.id}/`;
    const response = await fetch(endUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updateData),
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || "회원 정보가 성공적으로 수정되었습니다.");
      closeModal();
      location.reload(); 
    } else {
      alert(`수정 실패: ${result.error || response.statusText}`);
      console.error("수정 실패 상세:", result.error);
    }
  } catch (error) {
    console.error("Error modifying member info:", error);
  alert("회원 정보 수정에 실패했습니다.");
  }

}