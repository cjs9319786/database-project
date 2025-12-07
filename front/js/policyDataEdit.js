window.openPolicyModal = async function() {
    const modal = document.getElementById("policy-modal-wrap");
    modal.style.display = "block";

    try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/policy/", {
            method: "GET",
            credentials: "include"
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById("policy_max_borrow").value = data.max_borrow_count;
            document.getElementById("policy_due_days").value = data.default_due_days;
            document.getElementById("policy_extend_days").value = data.max_extend_days;
            document.getElementById("policy_penalty_days").value = data.overdue_penalty_days;
        } else {
            alert("정책 정보를 불러오는데 실패했습니다.");
        }
    } catch (e) {
        console.error(e);
        alert("서버 통신 오류");
    }
};

window.closePolicyModal = function() {
    document.getElementById("policy-modal-wrap").style.display = "none";
};

window.savePolicy = async function() {
    const data = {
        max_borrow_count: document.getElementById("policy_max_borrow").value,
        default_due_days: document.getElementById("policy_due_days").value,
        max_extend_days: document.getElementById("policy_extend_days").value,
        overdue_penalty_days: document.getElementById("policy_penalty_days").value
    };

    try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/policy/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert("운영 정책이 수정되었습니다.");
            closePolicyModal();
        } else {
            alert("수정 실패: " + (result.error || "알 수 없는 오류"));
        }
    } catch (e) {
        console.error(e);
        alert("서버 통신 오류");
    }
};