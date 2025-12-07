//대여/반납 모달
async function openBorrowModal(memberId) {
    const modal = document.getElementById('borrowModal');
    const listWrap = document.getElementById('borrow_history_list_wrap');

    modal.style.display = 'block';


    try {
    const endUrl = `http://127.0.0.1:8000/api/admin/members/${memberId}/borrows/`;
    const response = await fetch(endUrl, {
      method: "GET",
      credentials: "include", // 쿠키/세션 인증 포함
    });
        
        if (!response.ok) {
            throw new Error("데이터 조회 실패");
        }

        const data = await response.json();
        const borrows = data.borrows; 

        // 데이터 없을 때,
        if (borrows.length === 0) {
            listWrap.innerHTML = '<p style="text-align:center; padding: 20px;">대여 기록이 없습니다.</p>';
            return;
        }

        // 테이블
        let tableHtml = `
            <table style="width: 100%; border-collapse: collapse; text-align: center;">
                <thead style="background-color: #f2f2f2;">
                    <tr>
                        <th style="padding: 10px; border: 1px solid #ddd;">도서명</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">대여일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">반납예정일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">반납일</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">상태</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // 리스트 반복문으로 행(tr) 추가
        borrows.forEach(item => {
            const borrowDate = item.borrow_date.substring(0, 10);
            const dueDate = item.due_date.substring(0, 10);
            // 반납일 체크
            const returnDate = item.return_date ? item.return_date.substring(0, 10) : '-';
            
            
            // 상태 표시 (반납일이 있으면 '반납완료', 없으면 '대여중')
            let status = '';
            let statusColor = '';
            let actionBtn = "";

            if (item.return_date) {
                status = '반납완료';
                statusColor = 'gray';
            } else {
                // 연체 여부 확인 (오늘 날짜와 비교)
                const today = new Date().toISOString().split('T')[0];
                if (today > dueDate) {
                    status = '연체중';
                    statusColor = 'red';
                    actionBtn = `<button onclick="processReturn(${item.borrow_id})" 
                             style="background:#f44336; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">
                             반납처리</button>`;
                } else {
                    status = '대여중';
                    statusColor = 'green';

                    actionBtn = `<button onclick="processReturn(${item.borrow_id})" 
                             style="background:#f44336; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">
                             반납처리</button>`;
                }
            }

            tableHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.book__isbn__title}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${borrowDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${dueDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${returnDate}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">
                        <div style="margin-bottom: 5px;">${status}</div>
                        ${actionBtn}
                    </td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;

        listWrap.innerHTML = tableHtml;
          
        document.querySelector('#borrowModal h2').innerText = `${data.member_name}님의 대여/반납 내역`;
    } catch (error) {
        console.error(error);
        listWrap.innerHTML = '<p style="color:red; text-align:center;">오류가 발생했습니다.</p>';
    }
}
function openRentModal(memberId, memberName) {
    document.getElementById('rent_target_member_id').value = memberId;
    document.getElementById('rent_target_name').innerText = memberName;
    document.getElementById('rent_isbn_input').value = ''; 
    document.getElementById('rent_modal').style.display = 'block';
}
// 반납 요청
async function processReturn(borrowIdParam) {
     if(!confirm("해당 도서를 반납 처리하시겠습니까?")) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/admin/return/', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            credentials: "include",
            body: JSON.stringify({borrow_id : borrowIdParam})
        });

        const result = await response.json();

        if (response.ok) {
            let msg = result.message + `\n반납 회원: ${result.returned_member}`;
            if (result.is_overdue) {
                msg += "\n[주의] 연체된 도서입니다. 회원이 대여 정지 처리되었습니다.";
            }
            alert(msg);
            closeModal();
            
        } else {
            alert("오류: " + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}
//대여요청
async function processRent() {
    const memberId = document.getElementById('rent_target_member_id').value;
    const isbn = document.getElementById('rent_isbn_input').value.trim();

    if(!isbn) { alert("ISBN을 입력하세요."); return; }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/admin/borrow/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                member_id: memberId,
                isbns: [isbn]
            })
        });
        const result = await response.json();

        if(response.ok) {
            let msg = result.message;
            if(result.failed_isbns && result.failed_isbns.length > 0) {
                msg += `\n(실패한 ISBN: ${result.failed_isbns.join(', ')})`;
            }
            alert(msg);
            closeModal('rent_modal');
        } else {
            alert("대여 실패: " + result.error);
        }
    } catch (error) {
        alert("대여 통신 중 오류가 발생했습니다.");
    }
}