import os
import django
import pandas as pd

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookBorrow.settings')
django.setup()

from bookdb.models import Category

def import_categories_from_csv(filepath):
    df = pd.read_csv(filepath)
    
    print("카테고리 임포트 시작")
    
    for index, row in df.iterrows():
        category_id_from_csv = row['category_id']
        category_name_from_csv = row['category_name']
        
        category, created = Category.objects.get_or_create(
            category_id=category_id_from_csv,
            defaults={'category_name': category_name_from_csv}
        )
        
        if created:
            print(f"  [생성] ID: {category_id_from_csv}, 이름: {category_name_from_csv}")
        else:
            print(f"  [존재] ID: {category_id_from_csv}, 이름: {category_name_from_csv}")
            
    print("카테고리 임포트 완료.")

if __name__ == "__main__":
    csv_file_path = 'category.csv'
    import_categories_from_csv(csv_file_path)