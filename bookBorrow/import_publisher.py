import os
import django
import pandas as pd

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookBorrow.settings')
django.setup()

from bookdb.models import Publisher

def import_publisher_from_csv(filepath):
    df = pd.read_csv(filepath)

    df = df.fillna('')

    created_count = 0
    existing_count = 0
    
    print("출판사 임포트 시작")
    
    for index, row in df.iterrows():
        publisher_id_from_csv = row['publisher_id']
        publisher_name_from_csv = row['publisher_name']
        publisher_phone_number_from_csv = row['phone_number']
        
        
        publisher, created = Publisher.objects.get_or_create(
            publisher_id=publisher_id_from_csv, 
            defaults={
                'publisher_name': publisher_name_from_csv,
                'phone_number': publisher_phone_number_from_csv
            }
        )
        

        '''
        publisher, created = Publisher.objects.get_or_create(
                publisher_name=publisher_name_from_csv,
                
                defaults={
                    'publisher_id': publisher_id_from_csv,
                    'phone_number': publisher_phone_number_from_csv
                }
            )
        '''

        if created:
            created_count += 1
        else:
            existing_count += 1
            
    print("출판사 임포트 완료.")
    print(f"  - 총 {len(df)}건 중, {created_count}건 생성 완료")
    print(f"  - {existing_count}건은 이미 존재함")

if __name__ == "__main__":
    csv_file_path = 'publisher.csv'
    import_publisher_from_csv(csv_file_path)