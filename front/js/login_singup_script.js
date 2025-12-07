document.addEventListener("DOMContentLoaded", function () {
 const signupForm = document.getElementById("signupForm");
 const loginForm = document.getElementById("loginForm");
  //로그인폼 id/pw값 서버로 보냄
  
 signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = {
      login_id: formData.get("member_id"),
      password: formData.get("password"),
      first_name: formData.get("name"),
      email: formData.get("email"),
      birth_date: formData.get("birthdate"),
      phone_number: formData.get("hp").replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3"),
    };
    try {
      const endUrl = `http://127.0.0.1:8000/api/signup/`;
      const response = await fetch(endUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      console.log("Success:", result);
      if(response.status !== 400){
      alert(`${data.login_id}의 회원가입이 완료되었습니다. 로그인 페이지로 이동합니다. "`);
            window.location.href = "Login.html";   
      }else{
        if(result.errorcode === 1){
          alert("이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.");
          return;
        }else if(result.errorcode === 2){
          alert("이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.");
          return;
        }else if(result.errorcode === 3){
          alert("이미 가입된 전화번호입니다. 다른 전화번호를 사용해주세요.");
          return;
        }
      }
        
    } catch (error) {
      console.error("Error:", error);
      alert("서버 오류가 발생했습니다.");
    }
      
  });
  /*정상 확인성공*/
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    const data = {
      login_id: formData.get("member_id"),
      password: formData.get("password"),
    };

    try {
      const endUrl = `http://127.0.0.1:8000/api/login/`;
      const response = await fetch(endUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      console.log("Success:", result);
      /* todo 이제 받은 데이터를 사용*/
      if (response.ok) {
        alert(`${data.login_id}님 환영합니다!`);
        window.location.href = "Main.html";
      }
      } catch (error) {
      console.error("Error:", error);
      alert("서버 오류가 발생했습니다.");
    }
    });
});