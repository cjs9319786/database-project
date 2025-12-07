from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager

class Category(models.Model):
    category_id = models.IntegerField(primary_key=True, help_text="분류번호 (PK, 수동 입력)")
    category_name = models.CharField(
        max_length=50, 
        unique=True, 
        null=False, 
        help_text="분류명 (UNIQUE, NOT NULL)"
    )

    class Meta:
        db_table = 'category'

    def __str__(self):
        return self.category_name

class Publisher(models.Model):
    publisher_id = models.AutoField(primary_key=True, help_text="출판사번호 (PK)")
    publisher_name = models.CharField(
        max_length=255, 
        unique=True, 
        null=False, 
        help_text="출판사명 (UNIQUE, NOT NULL)"
    )
    phone_number = models.CharField(
        max_length=20, 
        null=True, 
        blank=True, 
        help_text="출판사 연락처"
    )

    class Meta:
        db_table = 'publisher'

    def __str__(self):
        return self.publisher_name

class BookInfo(models.Model):
    isbn = models.CharField(
        max_length=50, 
        primary_key=True, 
        help_text="국제 표준 도서 번호 (PK, NOT NULL)"
    )
    title = models.CharField(
        max_length=255, 
        null=False, 
        help_text="도서명 (NOT NULL)"
    )
    author = models.CharField(
        max_length=50, 
        null=True, 
        blank=True, 
        help_text="저자"
    )

    image_url = models.CharField(
        max_length=1000, 
        null=True, 
        blank=True, 
        help_text="도서 표지 이미지 URL"
    )
    
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT, # 카테고리가 삭제되어도 책 정보는 남김
        null=True, 
        blank=True,
        db_column='category_id',
        help_text="도서분류번호 (FK)"
    )

    publisher = models.ForeignKey(
        Publisher, 
        on_delete=models.PROTECT, # 출판사가 삭제되어도 책 정보는 남김
        null=True, 
        blank=True,
        db_column='publisher_id',
        help_text="출판사번호 (FK)"
    )

    class Meta:
        db_table = 'bookinfo'

    def __str__(self):
        return self.title
    
class MemberManager(BaseUserManager):
    def create_user(self, login_id, email, first_name, phone_number, birth_date, password=None, **extra_fields):
        if not login_id:
            raise ValueError('아이디(login_id)는 필수입니다.')
        if not email:
            raise ValueError('이메일은 필수입니다.')

        email = self.normalize_email(email)
        user = self.model(
            login_id=login_id, 
            email=email, 
            first_name=first_name, 
            phone_number=phone_number,
            birth_date=birth_date,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login_id, email, first_name, phone_number, birth_date, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        # 슈퍼유저 생성 시 필요한 필수 필드들을 create_user에 전달
        return self.create_user(
            login_id=login_id, 
            email=email, 
            first_name=first_name, 
            phone_number=phone_number, 
            birth_date=birth_date, 
            password=password, 
            **extra_fields
        )

class Member(AbstractUser):
    username = None
    login_id = models.CharField(
        max_length=50, 
        unique=True, 
        null=False, 
        help_text="로그인 아이디 (UNIQUE, NOT NULL)"
    )
    
    USERNAME_FIELD = 'login_id'

    first_name = models.CharField(max_length=150, null=False, blank=False, help_text="이름 (NOT NULL)")
    
    birth_date = models.DateField(null=False, help_text="생년월일 (NOT NULL)")
    phone_number = models.CharField(
        max_length=20, 
        unique=True, 
        null=False, 
        help_text="휴대폰번호 (UNIQUE, NOT NULL)"
    )
    status = models.CharField(
        max_length=10, 
        null=False, 
        default='정상', 
        help_text="회원상태 (NOT NULL, DEFAULT '정상')"
    )
    overdue_end_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="연체 종료일"
    )
    
    objects = MemberManager()
    REQUIRED_FIELDS = ['first_name', 'email', 'birth_date', 'phone_number']

    class Meta:
        db_table = 'member'
    def __str__(self):
        return f"{self.first_name} ({self.login_id})"

class Book(models.Model):
    class Status(models.IntegerChoices):
        AVAILABLE = 0, '대여가능'
        BORROWED = 1, '대여중'
        UNAVAILABLE = 2, '대여불가' # (분실, 폐기 등)

    book_manage_id = models.AutoField(primary_key=True, help_text="도서관리번호 (PK, NOT NULL)")
        
    isbn = models.ForeignKey(
        BookInfo, 
        on_delete=models.CASCADE, # 도서 정보가 삭제되면 실물 책도 함께 삭제
        null=False,
        db_column='isbn',
        help_text="도서번호 (FK, NOT NULL)"
    )
    status = models.SmallIntegerField(
        choices=Status.choices, # Admin 페이지에서 드롭다운으로 보임
        default=Status.AVAILABLE, # 기본값: 0 (대여가능)
        help_text="도서상태 (0:대여가능, 1:대여중, 2:대여불가)"
    )

    class Meta:
        db_table = 'book'

    def __str__(self):
        return self.book_manage_id

class Borrow(models.Model):
    borrow_id = models.AutoField(primary_key=True, help_text="대여번호 (PK)")
    
    member = models.ForeignKey(
        Member, 
        on_delete=models.PROTECT, # 대여 기록이 있는 회원은 삭제 방지
        null=False,
        db_column='member_id',
        help_text="회원번호 (FK, NOT NULL)"
    )

    book = models.ForeignKey(
        Book, 
        on_delete=models.PROTECT, # 대여 기록이 있는 도서는 삭제 방지
        null=False,
        db_column='book_manage_id',
        help_text="도서관리번호 (FK, NOT NULL)"
    )
    
    borrow_date = models.DateField(null=False, help_text="대여일 (NOT NULL)")
    due_date = models.DateField(null=False, help_text="반납예정일 (NOT NULL)")
    return_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="실제반납일 (NULL이면 대여중)"
    )
    is_extended = models.BooleanField(
        null=False, 
        default=False, 
        help_text="연장 여부 (NOT NULL, DEFAULT false)"
    )

    class Meta:
        db_table = 'borrow'

    def __str__(self):
        return f"대여번호 {self.borrow_id}"

class Review(models.Model):
    review_id = models.AutoField(primary_key=True, help_text="리뷰번호 (PK)")
    
    member = models.ForeignKey(
        Member, 
        on_delete=models.CASCADE, # 회원이 탈퇴하면 리뷰도 함께 삭제
        null=False,
        db_column='member_id',
        help_text="회원번호 (FK, NOT NULL)"
    )

    isbn = models.ForeignKey(
        BookInfo, 
        on_delete=models.CASCADE, # 도서 정보가 삭제되면 리뷰도 함께 삭제
        null=False,
        db_column='isbn',
        help_text="도서번호 (FK, NOT NULL)"
    )
    
    # TINYINT(1~5) -> SmallIntegerField + Validators로 구현
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=False,
        help_text="평점 (1~5, NOT NULL)"
    )

    content = models.TextField(null=True, blank=True, help_text="리뷰 내용")
    
    # DATETIME, DEFAULT CURRENT_TIMESTAMP -> auto_now_add=True로 구현
    created_at = models.DateTimeField(
        auto_now_add=True, # 생성 시 자동으로 현재 시간 저장
        null=False,
        help_text="작성일시 (NOT NULL, DEFAULT CURRENT_TIMESTAMP)"
    )

    class Meta:
        db_table = 'review'

    def __str__(self):
        return f"리뷰 {self.review_id} (평점: {self.rating})"
    
class Policy(models.Model):
    #도서관 운영 정책 관리 (싱글톤 패턴 적용) 이 테이블은 오직 1개의 행만 존재
    max_borrow_count = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        help_text="1인당 최대 대여 권수 (기본: 3권)"
    )
    
    default_due_days = models.IntegerField(
        default=14,
        validators=[MinValueValidator(1)],
        help_text="기본 대여 기간 (기본: 14일)"
    )
    
    max_extend_days = models.IntegerField(
        default=7,
        validators=[MinValueValidator(1)],
        help_text="연장 가능 기간 (기본: 7일)"
    )
    
    overdue_penalty_days = models.IntegerField(
        default=7,
        validators=[MinValueValidator(0)],
        help_text="연체 시 대여 정지 기간 (기본: 7일)"
    )

    class Meta:
        db_table = 'policy'
        verbose_name = "운영 정책"
        verbose_name_plural = "운영 정책"

    def save(self, *args, **kwargs):
        #PK를 무조건 1로 고정하여, 새로운 행이 생기지 않고 1번 행만 계속 수정되게 함
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        #정책은 삭제할 수 없음 (삭제 시도 시 아무것도 안 함)
        pass

    @classmethod
    def load(cls):
        #현재 정책을 불러오는 헬퍼 메서드, 데이터가 없으면 기본값으로 생성해서 반환함.
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "도서관 운영 정책 설정"