from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),

    path('login/', views.login_user, name='login_user'),

    path('logout/', views.logout_user, name='logout_user'),

    path('me/update/', views.update_member_info, name='update_member_info'),

    path('me/change-password/', views.change_password, name='change_password'),

    path('me/', views.my_info, name='my_info'),

    path('me/borrows/', views.my_borrows, name='my_borrows'),

    path('me/reviews/', views.my_reviews, name='my_reviews'),

    path('me/delete/', views.delete_account, name='delete_account'),

    path('books/', views.search_books, name='search_books'),

    path('borrow/', views.borrow_books, name='borrow_books'),

    path('extend/', views.extend_borrow, name='extend_borrow'),

    path('return/', views.return_book, name='return_book'),

    path('reviews/create/', views.create_review, name='create_review'),

    path('books/<str:isbn>/', views.book_detail, name='book_detail'),

    path('books/<str:isbn>/reviews/', views.read_reviews, name='read_reviews'),

    path('reviews/update/<int:review_id>/', views.update_review, name='update_review'),

    path('reviews/delete/<int:review_id>/', views.delete_review, name='delete_review'),
    #로그인 상태확인
    path('login-check/', views.login_check, name='login_check'),

    # [추가] 중복 체크용 URL
    path('check-id/', views.check_id_duplicate, name='check_id_duplicate'),
    
    path('check-email/', views.check_email_duplicate, name='check_email_duplicate'),

    path('check-email/', views.check_email_duplicate, name='check_email_duplicate'),

    # [추가] 사용자의 특정 도서 대여 상태 확인
    path('books/<str:isbn>/status/', views.check_user_book_status, name='check_user_book_status'),

    #-----------------------관리자 기능-----------------------------------
    #전체 회원 목록 조회 (검색 포함)
    path('admin/members/', views.admin_list_members, name='admin_list_members'),
    
    #특정 회원 상세 정보 조회
    path('admin/members/<int:member_id>/', views.admin_get_member, name='admin_get_member'),

    #관리자가 직접 회원 등록
    path('admin/members/create/', views.admin_create_member, name='admin_create_member'),
    
    #회원 정보 및 상태 수정
    path('admin/members/update/<int:member_id>/', views.admin_update_member, name='admin_update_member'),
    
    #회원 삭제 (탈퇴 처리)
    path('admin/members/delete/<int:member_id>/', views.admin_delete_member, name='admin_delete_member'),

    #특정 회원의 대여/반납 이력 조회
    path('admin/members/<int:member_id>/borrows/', views.admin_member_borrows, name='admin_member_borrows'),

    #관리자의 특정 회원 대여/반납 처리
    path('admin/borrow/', views.admin_borrow_book, name='admin_borrow_book'),
    path('admin/return/', views.admin_return_book, name='admin_return_book'),

    #새 도서 등록
    path('admin/books/create/', views.admin_create_book, name='admin_create_book'),
    
    #도서 정보 수정
    path('admin/books/update/<str:isbn>/', views.admin_update_book, name='admin_update_book'),
    
    #도서 정보 삭제 (BookInfo 삭제 시 실물 Book도 자동 삭제)
    path('admin/books/delete/<str:isbn>/', views.admin_delete_book, name='admin_delete_book'),

    #특정 도서의 실물 책 목록 조회 (***추가***)
    path('admin/books/<str:isbn>/copies/', views.admin_get_book_copies),

    #특정 도서의 실물 책 상세 정보 조회 (***추가***)
    path('admin/books/<str:isbn>/add-copies/', views.admin_add_book_copies, name='admin_add_book_copies'),

    #개별 실물 책 상태 수정 (대여가능, 대여중, 대여 불가)
    path('admin/book-copy/update/<int:book_manage_id>/', views.admin_update_book_copy, name='admin_update_book_copy'),

    #카테고리 관리 (조회, 추가)
    path('admin/categories/', views.admin_categories, name='admin_categories'),
    
    #카테고리 삭제
    path('admin/categories/<int:category_id>/', views.admin_delete_category, name='admin_delete_category'),

    #출판사 목록 조회 (검색 포함)
    path('admin/publishers/', views.admin_list_publishers, name='admin_list_publishers'),
    
    #새 출판사 등록
    path('admin/publishers/create/', views.admin_create_publisher, name='admin_create_publisher'),
    
    #출판사 정보 수정
    path('admin/publishers/update/<int:publisher_id>/', views.admin_update_publisher, name='admin_update_publisher'),
    
    #출판사 삭제
    path('admin/publishers/delete/<int:publisher_id>/', views.admin_delete_publisher, name='admin_delete_publisher'),

    #리뷰 관리 (조회)
    path('admin/reviews/', views.admin_list_reviews, name='admin_list_reviews'),

    #리뷰 삭제
    path('admin/reviews/delete/<int:review_id>/', views.admin_delete_review, name='admin_delete_review'),

    #운영 정책 관리 (조회, 수정)
    path('admin/policy/', views.admin_policy, name='admin_policy'),


]