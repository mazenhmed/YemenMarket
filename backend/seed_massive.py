import os
import django
import random
import requests
from django.core.files.base import ContentFile
import concurrent.futures
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from vendors.models import Vendor
from products.models import Category, Product

print("🚀 بدء التعبئة الضخمة بالذكاء الاصطناعي...")

# 1. إنشاء الأقسام
cats_data = [
    {'name': 'Fashion', 'name_ar': 'أزياء وملابس', 'icon': '👗', 'order': 1},
    {'name': 'Vegetables', 'name_ar': 'خضروات', 'icon': '🥦', 'order': 2},
    {'name': 'Fruits', 'name_ar': 'فواكه', 'icon': '🍎', 'order': 3},
    {'name': 'Sweets', 'name_ar': 'حلويات', 'icon': '🍰', 'order': 4},
    {'name': 'Stationery', 'name_ar': 'قرطاسية', 'icon': '✏️', 'order': 5},
]
categories = {}
for cd in cats_data:
    c, _ = Category.objects.get_or_create(name=cd['name'], defaults=cd)
    categories[cd['name']] = c

# 2. إنشاء المستخدمين والمتاجر
def create_vendor(username, store_name, desc):
    u, c = User.objects.get_or_create(username=username, defaults={'email': f'{username}@yemenmarket.com', 'role': 'vendor'})
    if c:
        u.set_password('vendor123')
        u.is_active_account = True
        u.save()
    v, _ = Vendor.objects.get_or_create(user=u, defaults={'store_name': store_name, 'description': desc, 'status': 'approved'})
    return v

vendor_gulf = create_vendor('gulf_center', 'مركز الخليج التجاري', 'أفضل تشكيلات الملابس الرجالية، النسائية، والأطفال.')
vendor_library = create_vendor('maktaba', 'المكتبة المتكاملة', 'أدوات مدرسية وقرطاسية، أدوات هندسية وطباعة.')
vendor_sweets = create_vendor('fakhamah_sweets', 'حلويات الفخامة', 'أفخم أنواع الكعك والحلويات وتورتات المناسبات.')
vendor_fruits = create_vendor('king_fruits', 'ملك الفواكة', 'فواكه وخضروات طازجة يومياً بأفضل الأسعار.')

# 3. مولدات المنتجات
def generate_clothes():
    types = ["تيشيرت", "بنطلون", "قميص", "فستان", "شورت", "حذاء", "جاكيت", "بدلة", "ملابس داخلية", "طقم"]
    targets = ["رجالي", "نسائي", "أطفال", "ولادي", "بناتي", "شبابي"]
    colors = ["أسود", "أبيض", "أحمر", "أزرق", "رمادي", "كحلي", "بني", "وردي", "أصفر"]
    adjectives = ["قطن 100%", "مريح", "شتوي دافئ", "ماركة عالمية", "جودة عالية", "كلاسيكي", "رياضي", "أنيق"]
    english_keywords = ["tshirt", "jeans pants", "casual shirt", "elegant dress", "shorts", "sneakers", "winter jacket", "elegant suit", "underwear", "clothing set"]
    
    products = []
    for i in range(100):
        t_idx = random.randint(0, len(types)-1)
        name = f"{types[t_idx]} {random.choice(targets)} {random.choice(colors)} - {i+1}"
        desc = f"{name} - {random.choice(adjectives)}. مقاسات مختلفة متاحة، مناسب للاستخدام اليومي."
        price = Decimal(random.randint(5, 50) * 1000)
        keyword = f"{english_keywords[t_idx]} isolated white background"
        products.append({"name": name, "desc": desc, "price": price, "vendor": vendor_gulf, "category": categories['Fashion'], "image_prompt": keyword})
    return products

def generate_stationery():
    items = [
        ("قلم حبر", "ink pen"), ("دفتر سلك", "spiral notebook"), ("حقيبة مدرسية", "school backpack"), 
        ("أقلام رصاص", "pencils"), ("علبة هندسة", "geometry set"), ("ألوان خشبية", "colored pencils"), 
        ("ورق طباعة A4", "A4 printer paper"), ("ممحاة", "eraser"), ("براية", "sharpener"), 
        ("آلة حاسبة", "calculator"), ("طابعة صغيرة", "compact printer"), ("حبر طابعة", "printer ink")
    ]
    adjectives = ["جودة عالية", "مستورد", "ممتاز للطلاب", "ألوان زاهية", "احترافي", "أصلي"]
    products = []
    for i in range(100):
        item = random.choice(items)
        name = f"{item[0]} {random.choice(['كبير', 'صغير', 'طقم', 'مفرد'])} - {i+1}"
        desc = f"{item[0]} {random.choice(adjectives)}. مثالي للمدارس والجامعات والمكاتب."
        price = Decimal(random.randint(1, 20) * 500)
        products.append({"name": name, "desc": desc, "price": price, "vendor": vendor_library, "category": categories['Stationery'], "image_prompt": f"{item[1]} isolated white background"})
    return products

def generate_sweets():
    items = [
        ("كعكة شوكولاتة", "chocolate cake"), ("تارت فواكه", "fruit tart"), ("بقلاوة", "baklava"), 
        ("كنافة", "kunafa dessert"), ("معمول تمر", "maamoul dessert"), ("تورتة مناسبات", "fancy party cake"),
        ("تشيز كيك", "cheesecake"), ("كليجا", "kleicha cookies"), ("بسبوسة", "basbousa dessert"),
        ("ماكرون فرنسي", "french macarons"), ("كوكيز", "chocolate chip cookies")
    ]
    products = []
    for i in range(50):
        item = random.choice(items)
        name = f"{item[0]} {random.choice(['فاخر', 'طازج', 'مكسرات', 'حجم كبير', 'مخصوص'])} - {i+1}"
        desc = f"{name}. محضر طازجاً بأفضل المكونات يومياً."
        price = Decimal(random.randint(5, 40) * 1000)
        products.append({"name": name, "desc": desc, "price": price, "vendor": vendor_sweets, "category": categories['Sweets'], "image_prompt": f"{item[1]} dessert delicious high quality food photography"})
    return products

def generate_fruits_veggies():
    fruits = [("تفاح", "red apple"), ("موز", "banana bunch"), ("برتقال", "orange fruit"), 
              ("عنب", "grapes"), ("مانجو", "mango fruit"), ("فراولة", "strawberry"), ("كيوي", "kiwi fruit"), ("بطيخ", "watermelon")]
    veggies = [("طماطم", "tomato"), ("خيار", "cucumber"), ("بصل", "onion"), ("بطاطس", "potato"), 
               ("خس", "lettuce"), ("جزر", "carrot"), ("بصل أخضر", "spring onion"), ("ثوم", "garlic")]
    products = []
    for i in range(50):
        fruit = random.choice(fruits)
        name = f"{fruit[0]} {random.choice(['يمني', 'مستورد', 'سكري', 'طازج'])} - سلة {i+1}"
        price = Decimal(random.randint(1, 8) * 1000)
        products.append({"name": name, "desc": "فواكه قطفة اليوم طازجة 100%", "price": price, "vendor": vendor_fruits, "category": categories['Fruits'], "image_prompt": f"{fruit[1]} fresh fruit isolated background"})
    
    for i in range(50):
        veg = random.choice(veggies)
        name = f"{veg[0]} {random.choice(['يمني', 'عضوي', 'طازج'])} - كرتون {i+1}"
        price = Decimal(random.randint(1, 5) * 500)
        products.append({"name": name, "desc": "خضروات مزارع عضوية خالية من الكيماويات", "price": price, "vendor": vendor_fruits, "category": categories['Vegetables'], "image_prompt": f"{veg[1]} fresh vegetable isolated background"})
    return products

all_products = generate_clothes() + generate_stationery() + generate_sweets() + generate_fruits_veggies()

# دالة لتحميل الصورة وحفظ المنتج
def create_product(data):
    if Product.objects.filter(name=data['name'], vendor=data['vendor']).exists():
        return
    
    p = Product(name=data['name'], description=data['desc'], price=data['price'], 
                vendor=data['vendor'], category=data['category'], status='active', stock_quantity=random.randint(10, 100))
    
    try:
        # استخدام Pollinations AI لجلب صور حقيقية عالية الجودة 
        random_seed = random.randint(1, 1000000)
        url = f"https://image.pollinations.ai/prompt/{data['image_prompt'].replace(' ', '%20')}?width=400&height=400&seed={random_seed}&nologo=true"
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            file_name = f"img_{random_seed}.jpg"
            p.image.save(file_name, ContentFile(response.content), save=False)
    except Exception as e:
        print(f"Error fetching image for {data['name']}: {e}")
        pass
        
    p.save()
    print(f"✅ تم إضافة: {data['name']}")

print(f"⏳ جاري إنشاء {len(all_products)} منتج بقوة الذكاء الاصطناعي...")

# استخدام خيوط المعالجة السريعة 
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    executor.map(create_product, all_products)

print("🎉 اكتملت التعبئة الضخمة بنجاح! تم تجهيز جميع المتاجر.")
