document.addEventListener("DOMContentLoaded", function () {
  logincheck("main");
});

async function logincheck(event) {
  const menuManager = document.getElementById("Menu-bar_Manager");
  const menuMember = document.getElementById("Menu-bar_Member");
  const loginBefore = document.getElementById("login_before"); // 로그인 전 (버튼 보임)
  const loginAfter = document.getElementById("login_after");   // 로그인 후 (Logout 버튼)
  
  // [수정 1] 백엔드의 '내 정보 조회' API 주소로 변경
  const loginCheckUrl = 'http://127.0.0.1:8000/api/me/';

  try {
    const response = await fetch(loginCheckUrl, {
      method: 'GET',
      credentials: 'include', // [중요] 세션 쿠키를 서버로 보냄
      headers: {
        "Content-Type": "application/json",
      },
    });

    // [수정 2] response.ok (상태코드 200~299)로 로그인 여부 판단
    if (response.ok) {
      // 🟢 로그인 성공 상태
      const data = await response.json();
      console.log("로그인 확인됨:", data.login_id);

      // 1. 로그인/로그아웃 버튼 전환
      if(loginBefore) loginBefore.style.display = "none";
      if(loginAfter) loginAfter.style.display = "block";

      // 2. 메뉴 전환 (관리자 vs 일반회원)
      // data.is_staff 같은 필드가 백엔드 my_info에 없다면 일단 일반회원 메뉴를 보여줍니다.
      // 만약 관리자 구분을 하려면 views.py의 my_info에 is_staff를 추가해야 합니다.
      
      // 임시 로직: 일단 회원 메뉴 표시
      if(menuMember) menuMember.style.display = "flex"; 
      if(menuManager) menuManager.style.display = "none"; 

      // (관리자 구분 로직이 필요하다면 아래 주석 해제 및 백엔드 수정 필요)
      /*
      if (data.is_staff) {
          if(menuManager) menuManager.style.display = "flex";
          if(menuMember) menuMember.style.display = "none";
      } else {
          if(menuMember) menuMember.style.display = "flex";
          if(menuManager) menuManager.style.display = "none";
      }
      */

    } else {
      // 🔴 로그인 안 된 상태 (401 Unauthorized 등)
      console.log("비로그인 상태");
      
      // 메뉴 숨김
      if(menuManager) menuManager.style.display = "none";
      if(menuMember) menuMember.style.display = "none";
      
      // 로그인 버튼 보이기
      if(loginBefore) loginBefore.style.display = "block";
      if(loginAfter) loginAfter.style.display = "none";
    } 

  } catch(error) {
    console.error('로그인 체크 통신 오류:', error);
  }  
}

// 로그아웃 함수
async function logout() {
  try { 
    // [수정] 로그아웃 API 주소 확인
    const logoutUrl = 'http://127.0.0.1:8000/api/logout/';
    const response = await fetch(logoutUrl, {
      method: 'POST',
      credentials: 'include', // 세션 쿠키 포함 필수
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      alert("로그아웃 되었습니다.");
      window.location.href = "Main.html"; // 메인으로 새로고침
    } else {
      alert("로그아웃 실패");
    }
  } catch (error) {
    console.error(error);
  }
}