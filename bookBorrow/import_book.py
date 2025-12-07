import os
import django
from tqdm import tqdm

#Django 환경 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookBorrow.settings')
django.setup()

#모델 임포트
from bookdb.models import BookInfo, Book

def import_books_from_bookinfo():
    
    #임포트할 대상인 BookInfo의 모든 객체를 가져온다
    all_book_infos = BookInfo.objects.all()

    if not all_book_infos.exists():
        print("오류: BookInfo 테이블에 데이터가 없습니다.")
        print("import_bookinfo.py 스크립트를 먼저 실행해주세요.")
        return

    print(f"BookInfo 테이블의 {all_book_infos.count()}개 ISBN에 대해 실물 도서 생성을 시작")

    created_count = 0
    existing_count = 0

    #tqdm으로 진행률 표시
    for book_info_obj in tqdm(all_book_infos, desc="Book 생성 중"):
        
        # BookInfo 객체(book_info_obj)를 'isbn' 필드에 그대로 전달
        # 이 ISBN으로 등록된 Book이 있는지 확인하고 없으면 새로 생성
        book, created = Book.objects.get_or_create(
            isbn=book_info_obj  #ForeignKey 필드에는 ID가 아닌 객체 자체를 전달
            
            #book_manage_id -> AutoField가 자동 처리
            #status -> default="대여가능"이 자동 처리
        )
        
        if created:
            created_count += 1
        else:
            existing_count += 1

    print("실물 도서 임포트 완료.")
    print(f"  - {created_count}건의 실물 도서 생성 완료")
    print(f"  - {existing_count}건은 이미 존재함")

if __name__ == "__main__":
    import_books_from_bookinfo()