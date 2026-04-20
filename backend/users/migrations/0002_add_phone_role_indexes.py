# Migration: إضافة indexes لحقول phone و role لتسريع الاستعلامات

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # إضافة db_index لحقل phone لتسريع البحث بالهاتف
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(blank=True, db_index=True, max_length=20),
        ),
        # إضافة db_index لحقل role لتسريع الفلترة بالدور
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('customer', 'Customer'), ('vendor', 'Vendor'), ('admin', 'Admin')],
                db_index=True,
                default='customer',
                max_length=15,
            ),
        ),
        # إضافة composite indexes للاستعلامات الشائعة
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['phone'], name='user_phone_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='user_role_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role', '-date_joined'], name='user_role_joined_idx'),
        ),
    ]
