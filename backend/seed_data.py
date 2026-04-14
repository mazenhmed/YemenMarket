"""
Seed database with real data for YemenMarket platform.
Run: python manage.py shell < seed_data.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from vendors.models import Vendor
from products.models import Category, Product, ProductReview
from orders.models import Order, OrderItem, Transaction
from decimal import Decimal

print("🌱 بدء تعبئة قاعدة البيانات...")

# ============ USERS ============
print("👤 إنشاء المستخدمين...")

# ── Admin: ALWAYS force role='admin' even if account already exists ──
admin_user, created = User.objects.get_or_create(username='admin', defaults={
    'email': 'admin@yemenmarket.com', 'role': 'admin', 'phone': '770000001',
    'city': 'صنعاء', 'is_staff': True, 'is_superuser': True
})
# Force-update role & permissions in case the account existed before
admin_user.role = 'admin'
admin_user.is_staff = True
admin_user.is_superuser = True
if created:
    admin_user.set_password('admin123')
admin_user.save()

vendor_users = []
vendor_data = [
    {'username': 'ali_tech', 'email': 'ali@tech-store.com', 'phone': '770123456', 'city': 'صنعاء'},
    {'username': 'sara_fashion', 'email': 'sara@fashion.com', 'phone': '771234567', 'city': 'صنعاء'},
    {'username': 'fahd_honey', 'email': 'fahd@honey.com', 'phone': '772345678', 'city': 'تعز'},
    {'username': 'majed_pc', 'email': 'majed@pc-world.com', 'phone': '773456789', 'city': 'عدن'},
    {'username': 'noura_beauty', 'email': 'noura@beauty.com', 'phone': '774567890', 'city': 'صنعاء'},
    {'username': 'ahmed_sport', 'email': 'ahmed@sport.com', 'phone': '775678901', 'city': 'إب'},
]
for vd in vendor_data:
    u, created = User.objects.get_or_create(username=vd['username'], defaults={
        **vd, 'role': 'vendor'
    })
    u.role = 'vendor'  # Force-update role
    if created:
        u.set_password('vendor123')
    u.save()
    vendor_users.append(u)

customer_users = []
customer_data = [
    {'username': 'customer', 'email': 'customer@email.com', 'phone': '776000001', 'city': 'صنعاء'},
    {'username': 'khaled_ahmed', 'email': 'khaled@email.com', 'phone': '776000002', 'city': 'عدن'},
    {'username': 'fatima_ali', 'email': 'fatima@email.com', 'phone': '776000003', 'city': 'تعز'},
    {'username': 'omar_hassan', 'email': 'omar@email.com', 'phone': '776000004', 'city': 'حضرموت'},
    {'username': 'reem_saeed', 'email': 'reem@email.com', 'phone': '776000005', 'city': 'إب'},
]
for cd in customer_data:
    u, created = User.objects.get_or_create(username=cd['username'], defaults={
        **cd, 'role': 'customer'
    })
    u.role = 'customer'  # Force-update role
    if created:
        u.set_password('customer123')
    u.save()
    customer_users.append(u)

# Also add a "vendor" shortcut account for demo
vendor_user, created = User.objects.get_or_create(username='vendor', defaults={
    'email': 'vendor@store.com', 'role': 'vendor', 'phone': '770999999', 'city': 'صنعاء'
})
vendor_user.role = 'vendor'  # Force-update role
if created:
    vendor_user.set_password('vendor123')
vendor_user.save()

print(f"  ✅ {User.objects.count()} مستخدم")

# ============ VENDORS (STORES) ============
print("🏪 إنشاء المتاجر...")

stores_data = [
    {'user': vendor_users[0], 'store_name': 'متجر التقنية الحديثة', 'description': 'أحدث الأجهزة الإلكترونية والإكسسوارات التقنية بأسعار منافسة وضمان حقيقي. خبرة أكثر من 5 سنوات في السوق اليمني.', 'phone': '770123456', 'email': 'ali@tech-store.com', 'city': 'صنعاء', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.8'), 'total_sales': Decimal('18500000'), 'commission_rate': Decimal('5.00')},
    {'user': vendor_users[1], 'store_name': 'أزياء صنعاء', 'description': 'أحدث صيحات الموضة والأزياء اليمنية والعالمية بجودة عالية وأسعار منافسة. ملابس رجالية ونسائية وأطفال.', 'phone': '771234567', 'email': 'sara@fashion.com', 'city': 'صنعاء', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.7'), 'total_sales': Decimal('12300000'), 'commission_rate': Decimal('5.00')},
    {'user': vendor_users[2], 'store_name': 'بيت العسل اليمني', 'description': 'عسل سدر طبيعي وأعشاب يمنية أصيلة من المناحل مباشرة. منتجات عضوية 100% من جبال اليمن.', 'phone': '772345678', 'email': 'fahd@honey.com', 'city': 'تعز', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.9'), 'total_sales': Decimal('8900000'), 'commission_rate': Decimal('5.00')},
    {'user': vendor_users[3], 'store_name': 'عالم الحاسوب', 'description': 'لابتوبات، طابعات، وملحقات الكمبيوتر. وكلاء معتمدون لأشهر الماركات العالمية.', 'phone': '773456789', 'email': 'majed@pc-world.com', 'city': 'عدن', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.8'), 'total_sales': Decimal('22100000'), 'commission_rate': Decimal('5.00')},
    {'user': vendor_users[4], 'store_name': 'جمال اليمن', 'description': 'منتجات عناية بالبشرة والشعر طبيعية 100%. مستحضرات تجميل ماركات عالمية أصلية.', 'phone': '774567890', 'email': 'noura@beauty.com', 'city': 'صنعاء', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.7'), 'total_sales': Decimal('6500000'), 'commission_rate': Decimal('5.00')},
    {'user': vendor_users[5], 'store_name': 'رياضة اليمن', 'description': 'ملابس ومعدات رياضية لجميع الأنشطة. أحذية رياضية أصلية وأجهزة لياقة بدنية.', 'phone': '775678901', 'email': 'ahmed@sport.com', 'city': 'إب', 'status': 'approved', 'is_verified': False, 'rating': Decimal('4.4'), 'total_sales': Decimal('3200000'), 'commission_rate': Decimal('5.00')},
]

# Also create a store for the "vendor" demo account
demo_vendor_store = {'user': vendor_user, 'store_name': 'متجر البائع التجريبي', 'description': 'متجر تجريبي لاختبار المنصة', 'phone': '770999999', 'email': 'vendor@store.com', 'city': 'صنعاء', 'status': 'approved', 'is_verified': True, 'rating': Decimal('4.5'), 'total_sales': Decimal('1000000'), 'commission_rate': Decimal('5.00')}

vendors = []
for sd in stores_data + [demo_vendor_store]:
    v, _ = Vendor.objects.get_or_create(user=sd['user'], defaults=sd)
    vendors.append(v)

print(f"  ✅ {Vendor.objects.count()} متجر")

# ============ CATEGORIES ============
print("📂 إنشاء الأقسام...")

categories_data = [
    {'name': 'Electronics', 'name_ar': 'إلكترونيات', 'icon': '📱', 'order': 1},
    {'name': 'Fashion', 'name_ar': 'أزياء وملابس', 'icon': '👗', 'order': 2},
    {'name': 'Home', 'name_ar': 'أثاث ومنزل', 'icon': '🏠', 'order': 3},
    {'name': 'Food', 'name_ar': 'أغذية طبيعية', 'icon': '🥗', 'order': 4},
    {'name': 'Beauty', 'name_ar': 'عناية وجمال', 'icon': '💄', 'order': 5},
    {'name': 'Sports', 'name_ar': 'رياضة', 'icon': '⚽', 'order': 6},
]

cats = []
for cd in categories_data:
    c, _ = Category.objects.get_or_create(name=cd['name'], defaults=cd)
    cats.append(c)

print(f"  ✅ {Category.objects.count()} قسم")

# ============ PRODUCTS ============
print("📦 إنشاء المنتجات...")

products_data = [
    # Electronics - متجر التقنية
    {'name': 'سماعات بلوتوث لاسلكية برو', 'description': 'سماعات لاسلكية عالية الجودة بتقنية البلوتوث 5.3، عمر بطارية يصل إلى 40 ساعة، عزل ضوضاء فعال، صوت ستيريو نقي. مناسبة للاستخدام اليومي والرياضة. تأتي مع علبة شحن مغناطيسية.', 'price': Decimal('45000'), 'compare_price': Decimal('55000'), 'stock_quantity': 25, 'category': cats[0], 'vendor': vendors[0], 'status': 'active', 'is_featured': True, 'sold_count': 134, 'rating': Decimal('4.8'), 'rating_count': 89},
    {'name': 'ساعة ذكية رياضية مقاومة للماء', 'description': 'ساعة ذكية متعددة الاستخدامات مع متتبع اللياقة البدنية، مقاومة للماء IP68، شاشة AMOLED 1.4 بوصة، مزامنة مع الهاتف، قياس معدل نبضات القلب والأكسجين.', 'price': Decimal('25000'), 'compare_price': Decimal('32000'), 'stock_quantity': 40, 'category': cats[0], 'vendor': vendors[0], 'status': 'active', 'is_featured': True, 'sold_count': 89, 'rating': Decimal('4.7'), 'rating_count': 56},
    {'name': 'سماعات رأس احترافية للألعاب', 'description': 'سماعات ألعاب احترافية بصوت محيطي 7.1، ميكروفون قابل للفصل مع خاصية إلغاء الضوضاء، إضاءة RGB قابلة للتخصيص، متوافقة مع PC, PS5, Xbox.', 'price': Decimal('38000'), 'stock_quantity': 18, 'category': cats[0], 'vendor': vendors[0], 'status': 'active', 'sold_count': 67, 'rating': Decimal('4.5'), 'rating_count': 34},
    {'name': 'شاحن لاسلكي سريع 15 واط', 'description': 'شاحن لاسلكي بقوة 15 واط مع تقنية الشحن السريع Qi، متوافق مع جميع أجهزة آيفون وسامسونج، تصميم أنيق مع إضاءة LED.', 'price': Decimal('12000'), 'stock_quantity': 50, 'category': cats[0], 'vendor': vendors[0], 'status': 'active', 'sold_count': 45, 'rating': Decimal('4.6'), 'rating_count': 28},
    
    # Electronics - عالم الحاسوب
    {'name': 'لابتوب ألترا بوك - معالج حديث', 'description': 'لابتوب خفيف الوزن بمعالج الجيل الأخير Intel Core i7، شاشة Full HD مقاس 14 بوصة IPS، ذاكرة عشوائية 16 جيجا DDR5، وتخزين SSD NVMe بسعة 512 جيجا. مثالي للعمل والدراسة.', 'price': Decimal('350000'), 'compare_price': Decimal('420000'), 'stock_quantity': 8, 'category': cats[0], 'vendor': vendors[3], 'status': 'active', 'is_featured': True, 'sold_count': 48, 'rating': Decimal('4.9'), 'rating_count': 35},
    {'name': 'كاميرا احترافية 4K للتصوير', 'description': 'كاميرا احترافية بدقة 4K مع عدسة مزدوجة 18-55mm، مثبت صورة متقدم OIS، شاشة لمس قابلة للدوران، وإمكانية تصوير فيديو بجودة سينمائية.', 'price': Decimal('420000'), 'stock_quantity': 5, 'category': cats[0], 'vendor': vendors[3], 'status': 'active', 'sold_count': 22, 'rating': Decimal('4.6'), 'rating_count': 15},
    {'name': 'كيبورد ميكانيكي RGB', 'description': 'لوحة مفاتيح ميكانيكية بإضاءة RGB قابلة للتخصيص، مفاتيح Cherry MX Blue، مسند معصم مريح، اتصال USB-C سلكي ولاسلكي.', 'price': Decimal('35000'), 'stock_quantity': 30, 'category': cats[0], 'vendor': vendors[3], 'status': 'active', 'sold_count': 38, 'rating': Decimal('4.7'), 'rating_count': 22},
    {'name': 'ماوس ألعاب احترافي', 'description': 'ماوس ألعاب بدقة 16000 DPI قابلة للتعديل، 8 أزرار قابلة للبرمجة، إضاءة RGB، وزن قابل للتعديل، سنسور بصري متقدم.', 'price': Decimal('18000'), 'stock_quantity': 35, 'category': cats[0], 'vendor': vendors[3], 'status': 'active', 'sold_count': 52, 'rating': Decimal('4.6'), 'rating_count': 30},

    # Fashion - أزياء صنعاء
    {'name': 'فستان سهرة أنيق', 'description': 'فستان سهرة أنيق بتصميم عصري، قماش ساتان فاخر مع تطريز يدوي، متوفر بعدة ألوان وأحجام. مناسب للمناسبات والحفلات.', 'price': Decimal('55000'), 'compare_price': Decimal('70000'), 'stock_quantity': 15, 'category': cats[1], 'vendor': vendors[1], 'status': 'active', 'is_featured': True, 'sold_count': 67, 'rating': Decimal('4.6'), 'rating_count': 41},
    {'name': 'حقيبة ظهر ذكية مضادة للسرقة', 'description': 'حقيبة ظهر بتصميم مضاد للسرقة مع جيب مخفي، منفذ USB للشحن، قماش مقاوم للماء، مبطنة لحماية اللابتوب حتى 15.6 بوصة.', 'price': Decimal('18000'), 'stock_quantity': 28, 'category': cats[1], 'vendor': vendors[1], 'status': 'active', 'sold_count': 93, 'rating': Decimal('4.4'), 'rating_count': 55},
    {'name': 'طقم رسمي رجالي كلاسيكي', 'description': 'طقم رسمي رجالي من قماش صوف فاخر، بدلة مع بنطلون وقميص وربطة عنق. خياطة احترافية بأحدث القصات العالمية.', 'price': Decimal('85000'), 'stock_quantity': 10, 'category': cats[1], 'vendor': vendors[1], 'status': 'active', 'sold_count': 28, 'rating': Decimal('4.8'), 'rating_count': 18},
    {'name': 'حذاء جلد طبيعي كلاسيكي', 'description': 'حذاء رجالي من الجلد الطبيعي الإيطالي الفاخر، نعل مريح مع تقنية Memory Foam، تصميم كلاسيكي يناسب العمل والمناسبات.', 'price': Decimal('42000'), 'stock_quantity': 20, 'category': cats[1], 'vendor': vendors[1], 'status': 'active', 'sold_count': 44, 'rating': Decimal('4.5'), 'rating_count': 25},

    # Food - بيت العسل
    {'name': 'عسل سدر يمني طبيعي 1 كيلو', 'description': 'عسل سدر يمني أصيل من مناحل حضرموت، طبيعي 100% بدون أي إضافات. معبأ بعناية في عبوات زجاجية محكمة الإغلاق. شهادة جودة معتمدة.', 'price': Decimal('35000'), 'compare_price': Decimal('42000'), 'stock_quantity': 60, 'category': cats[3], 'vendor': vendors[2], 'status': 'active', 'is_featured': True, 'sold_count': 210, 'rating': Decimal('4.9'), 'rating_count': 156},
    {'name': 'بن يمني فاخر محمص 500 جرام', 'description': 'بن يمني محمص من أجود أنواع البن المزروع في جبال اليمن. تحميص متوسط ​​مثالي، رائحة عطرية فاخرة ونكهة غنية. من مزارع بني مطر.', 'price': Decimal('12000'), 'stock_quantity': 80, 'category': cats[3], 'vendor': vendors[2], 'status': 'active', 'is_featured': True, 'sold_count': 185, 'rating': Decimal('4.8'), 'rating_count': 120},
    {'name': 'تمر عجوة ممتاز 1 كيلو', 'description': 'تمر عجوة يمني ممتاز، محصول الموسم الحالي، طري ولذيذ. معبأ في علبة هدايا أنيقة. مناسب للأكل المباشر والطبخ.', 'price': Decimal('15000'), 'stock_quantity': 45, 'category': cats[3], 'vendor': vendors[2], 'status': 'active', 'sold_count': 98, 'rating': Decimal('4.7'), 'rating_count': 62},
    {'name': 'زيت سمسم يمني بلدي 1 لتر', 'description': 'زيت سمسم يمني بلدي مضغوط على البارد، طبيعي 100%، غني بالفيتامينات والمعادن. مثالي للطبخ والسلطات والعناية بالشعر.', 'price': Decimal('8000'), 'stock_quantity': 70, 'category': cats[3], 'vendor': vendors[2], 'status': 'active', 'sold_count': 142, 'rating': Decimal('4.6'), 'rating_count': 78},

    # Beauty - جمال اليمن
    {'name': 'طقم عناية بالبشرة كامل', 'description': 'طقم عناية متكامل يشمل: غسول الوجه، تونر، سيروم فيتامين C، مرطب يومي، وكريم واقي شمس SPF50. مناسب لجميع أنواع البشرة.', 'price': Decimal('28000'), 'compare_price': Decimal('38000'), 'stock_quantity': 30, 'category': cats[4], 'vendor': vendors[4], 'status': 'active', 'is_featured': True, 'sold_count': 76, 'rating': Decimal('4.7'), 'rating_count': 48},
    {'name': 'زيت أرجان أصلي للشعر 100مل', 'description': 'زيت أرجان مغربي أصلي 100%، مضغوط على البارد، يغذي ويرطب الشعر الجاف والتالف. يعطي لمعاناً طبيعياً ويقلل التقصف.', 'price': Decimal('15000'), 'stock_quantity': 40, 'category': cats[4], 'vendor': vendors[4], 'status': 'active', 'sold_count': 112, 'rating': Decimal('4.8'), 'rating_count': 72},
    {'name': 'عطر عود فاخر 50مل', 'description': 'عطر عود يمني فاخر بتركيز EDP، رائحة خشبية مميزة تدوم طويلاً. مزيج من العود الطبيعي والمسك والعنبر.', 'price': Decimal('65000'), 'stock_quantity': 15, 'category': cats[4], 'vendor': vendors[4], 'status': 'active', 'sold_count': 34, 'rating': Decimal('4.9'), 'rating_count': 22},

    # Sports - رياضة اليمن
    {'name': 'طقم رياضي كامل', 'description': 'طقم رياضي كامل يشمل تيشيرت وشورت، قماش Dry-Fit سريع الجفاف، خفيف الوزن ومريح للتمارين. متوفر بعدة ألوان وأحجام.', 'price': Decimal('22000'), 'compare_price': Decimal('28000'), 'stock_quantity': 35, 'category': cats[5], 'vendor': vendors[5], 'status': 'active', 'sold_count': 58, 'rating': Decimal('4.3'), 'rating_count': 32},
    {'name': 'حذاء رياضي للجري', 'description': 'حذاء رياضي خفيف الوزن مع نعل مطاطي مرن، تقنية امتصاص الصدمات، شبكة تهوية للقدم. مناسب للجري والمشي اليومي.', 'price': Decimal('32000'), 'stock_quantity': 25, 'category': cats[5], 'vendor': vendors[5], 'status': 'active', 'sold_count': 41, 'rating': Decimal('4.5'), 'rating_count': 25},
    {'name': 'دمبل قابل للتعديل 20 كجم', 'description': 'دمبل قابل للتعديل من 2 إلى 20 كجم، طلاء مطاطي مقاوم للانزلاق، مقبض مريح. مثالي للتمارين المنزلية وبناء العضلات.', 'price': Decimal('45000'), 'stock_quantity': 12, 'category': cats[5], 'vendor': vendors[5], 'status': 'active', 'sold_count': 23, 'rating': Decimal('4.6'), 'rating_count': 14},

    # Home/Furniture
    {'name': 'كرسي مكتب مريح', 'description': 'كرسي مكتب إرجونومي بمسند رأس قابل للتعديل، دعم أسفل الظهر، مقعد مبطن بإسفنج عالي الكثافة، عجلات ناعمة لا تخدش الأرضيات.', 'price': Decimal('85000'), 'stock_quantity': 10, 'category': cats[2], 'vendor': vendors[3], 'status': 'active', 'sold_count': 19, 'rating': Decimal('4.5'), 'rating_count': 12},
    {'name': 'مكتب خشبي عصري', 'description': 'مكتب خشبي بتصميم عصري مع أدراج تخزين، سطح واسع 120x60 سم، مناسب للعمل والدراسة. خشب MDF عالي الجودة مع طبقة حماية.', 'price': Decimal('65000'), 'stock_quantity': 8, 'category': cats[2], 'vendor': vendors[3], 'status': 'active', 'sold_count': 15, 'rating': Decimal('4.4'), 'rating_count': 9},

    # Pending products (for admin approval demo)
    {'name': 'طقم عناية بالبشرة جديد', 'description': 'منتج جديد بانتظار الموافقة', 'price': Decimal('28000'), 'stock_quantity': 50, 'category': cats[4], 'vendor': vendors[4], 'status': 'pending', 'sold_count': 0, 'rating': Decimal('0'), 'rating_count': 0},
    {'name': 'كاميرا تصوير 4K جديدة', 'description': 'منتج جديد بانتظار الموافقة', 'price': Decimal('420000'), 'stock_quantity': 8, 'category': cats[0], 'vendor': vendors[3], 'status': 'pending', 'sold_count': 0, 'rating': Decimal('0'), 'rating_count': 0},
]

products = []
for pd in products_data:
    p, _ = Product.objects.get_or_create(
        name=pd['name'], vendor=pd['vendor'],
        defaults=pd
    )
    products.append(p)

print(f"  ✅ {Product.objects.count()} منتج")

# ============ REVIEWS ============
print("⭐ إنشاء التقييمات...")

reviews_data = [
    {'product': products[0], 'user': customer_users[0], 'rating': 5, 'comment': 'سماعات ممتازة، جودة صوت رائعة وعزل ضوضاء فعال. أنصح بها بشدة!'},
    {'product': products[0], 'user': customer_users[1], 'rating': 4, 'comment': 'جودة جيدة جداً لكن البطارية أقل من المتوقع قليلاً'},
    {'product': products[4], 'user': customer_users[2], 'rating': 5, 'comment': 'أفضل لابتوب اشتريته، سريع جداً وخفيف الوزن'},
    {'product': products[4], 'user': customer_users[3], 'rating': 5, 'comment': 'ممتاز للبرمجة والتصميم، الشاشة واضحة جداً'},
    {'product': products[12], 'user': customer_users[0], 'rating': 5, 'comment': 'عسل طبيعي 100%، طعمه خيالي! شكراً بيت العسل'},
    {'product': products[12], 'user': customer_users[4], 'rating': 5, 'comment': 'أفضل عسل سدر جربته، سأطلب مرة أخرى بالتأكيد'},
    {'product': products[8], 'user': customer_users[1], 'rating': 5, 'comment': 'فستان راقي جداً، القماش ممتاز والتطريز رائع'},
    {'product': products[13], 'user': customer_users[3], 'rating': 5, 'comment': 'بن يمني أصيل، رائحة ونكهة لا مثيل لهما'},
]

for rd in reviews_data:
    ProductReview.objects.get_or_create(
        product=rd['product'], user=rd['user'],
        defaults=rd
    )

print(f"  ✅ {ProductReview.objects.count()} تقييم")

# ============ ORDERS ============
print("🛒 إنشاء الطلبات...")

orders_data = [
    {'user': customer_users[0], 'full_name': 'خالد أحمد محمد', 'phone': '776000002', 'city': 'عدن', 'address': 'شارع الرئيسي، بالقرب من مسجد النور', 'subtotal': Decimal('90000'), 'status': 'delivered', 'payment_method': 'cash', 'is_paid': True},
    {'user': customer_users[1], 'full_name': 'فاطمة علي سعيد', 'phone': '776000003', 'city': 'تعز', 'address': 'حي الحصب، شارع 26 سبتمبر', 'subtotal': Decimal('55000'), 'status': 'shipped', 'payment_method': 'transfer', 'is_paid': True},
    {'user': customer_users[2], 'full_name': 'عمر حسن العمري', 'phone': '776000004', 'city': 'حضرموت', 'address': 'المكلا، شارع خالد بن الوليد', 'subtotal': Decimal('105000'), 'status': 'delivered', 'payment_method': 'cash', 'is_paid': True},
    {'user': customer_users[3], 'full_name': 'ريم سعيد الأحمدي', 'phone': '776000005', 'city': 'إب', 'address': 'مدينة إب، حي السلام', 'subtotal': Decimal('350000'), 'status': 'delivered', 'payment_method': 'transfer', 'is_paid': True},
    {'user': customer_users[0], 'full_name': 'خالد أحمد محمد', 'phone': '776000002', 'city': 'عدن', 'address': 'شارع الرئيسي', 'subtotal': Decimal('25000'), 'status': 'cancelled', 'payment_method': 'cash', 'is_paid': False},
    {'user': customer_users[4], 'full_name': 'ماجد الشرعبي', 'phone': '776000006', 'city': 'تعز', 'address': 'شارع جمال', 'subtotal': Decimal('47000'), 'status': 'pending', 'payment_method': 'cash', 'is_paid': False},
]

orders = []
for od in orders_data:
    o = Order(**od)
    o.save()
    orders.append(o)

# Create order items
order_items_data = [
    {'order': orders[0], 'product': products[0], 'vendor': vendors[0], 'product_name': products[0].name, 'product_price': products[0].price, 'quantity': 2},
    {'order': orders[1], 'product': products[8], 'vendor': vendors[1], 'product_name': products[8].name, 'product_price': products[8].price, 'quantity': 1},
    {'order': orders[2], 'product': products[12], 'vendor': vendors[2], 'product_name': products[12].name, 'product_price': products[12].price, 'quantity': 3},
    {'order': orders[3], 'product': products[4], 'vendor': vendors[3], 'product_name': products[4].name, 'product_price': products[4].price, 'quantity': 1},
    {'order': orders[4], 'product': products[1], 'vendor': vendors[0], 'product_name': products[1].name, 'product_price': products[1].price, 'quantity': 1},
    {'order': orders[5], 'product': products[13], 'vendor': vendors[2], 'product_name': products[13].name, 'product_price': products[13].price, 'quantity': 2},
    {'order': orders[5], 'product': products[15], 'vendor': vendors[2], 'product_name': products[15].name, 'product_price': products[15].price, 'quantity': 1},
]

for oid in order_items_data:
    OrderItem.objects.create(**oid)

print(f"  ✅ {Order.objects.count()} طلب مع {OrderItem.objects.count()} عنصر")

# ============ TRANSACTIONS ============
print("💳 إنشاء العمليات المالية...")

for order in [orders[0], orders[2], orders[3]]:  # delivered orders
    for item in order.items.all():
        if item.vendor:
            Transaction.objects.get_or_create(
                order=order, vendor=item.vendor,
                defaults={
                    'transaction_type': 'sale',
                    'amount': item.total,
                    'commission': item.total * 5 / 100,
                    'vendor_amount': item.total * 95 / 100,
                }
            )

print(f"  ✅ {Transaction.objects.count()} عملية مالية")

# ============ SHIPPING ZONES ============
print("🚚 إنشاء مناطق الشحن...")

from shipping.models import ShippingZone, DEFAULT_SHIPPING_ZONES
for sz in DEFAULT_SHIPPING_ZONES:
    ShippingZone.objects.get_or_create(city=sz['city'], defaults=sz)

print(f"  ✅ {ShippingZone.objects.count()} منطقة شحن")

# ============ PAYMENT ACCOUNTS ============
print("💳 إنشاء حسابات الدفع...")

from orders.payment_config import PaymentAccount, DEFAULT_PAYMENT_ACCOUNTS
for pa in DEFAULT_PAYMENT_ACCOUNTS:
    PaymentAccount.objects.get_or_create(provider=pa['provider'], defaults=pa)

print(f"  ✅ {PaymentAccount.objects.count()} حساب دفع")

print("\n" + "="*50)
print("🎉 تم تعبئة قاعدة البيانات بنجاح!")
print(f"   👤 مستخدمين: {User.objects.count()}")
print(f"   🏪 متاجر: {Vendor.objects.count()}")
print(f"   📂 أقسام: {Category.objects.count()}")
print(f"   📦 منتجات: {Product.objects.count()}")
print(f"   ⭐ تقييمات: {ProductReview.objects.count()}")
print(f"   🛒 طلبات: {Order.objects.count()}")
print(f"   💳 عمليات: {Transaction.objects.count()}")
print("="*50)
print("\n🔑 حسابات الدخول:")
print("   مدير: admin / admin123")
print("   بائع: vendor / vendor123")
print("   عميل: customer / customer123")
