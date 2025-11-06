# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Business, Category, Product, WiFiInfo, Comment, WaiterCall
import json

class RegisterSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError("Şifreler uyuşmuyor.")
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password1']
        )
        return user

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ['id', 'name', 'slug', 'logo', 'menu_type', 'created_at', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    business_slugs = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    businesses = BusinessSerializer(many=True, read_only=True)
    business_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'banner_image', 'business_slugs',
            'businesses', 'business_names', 'created_at'
        ]
        extra_kwargs = {'banner_image': {'required': False}}

    def get_business_names(self, obj):
        return [b.name for b in obj.businesses.all()]

    def validate(self, data):
        request = self.context.get('request')
        slugs = data.get('business_slugs', [])
        
        print(f"DEBUG VALIDATE: business_slugs = {slugs}")
        print(f"DEBUG VALIDATE: type = {type(slugs)}")
        
        if request and request.method in ['POST', 'PUT', 'PATCH']:
            # Eğer slugs string olarak gelmişse parse et
            processed_slugs = []
            
            if isinstance(slugs, list):
                for item in slugs:
                    if isinstance(item, str):
                        # Eğer item JSON array gibi görünüyorsa parse et
                        if item.strip().startswith('[') and item.strip().endswith(']'):
                            try:
                                parsed = json.loads(item)
                                if isinstance(parsed, list):
                                    processed_slugs.extend(parsed)
                                else:
                                    processed_slugs.append(item)
                            except json.JSONDecodeError:
                                processed_slugs.append(item)
                        else:
                            processed_slugs.append(item)
                    else:
                        processed_slugs.append(item)
            elif isinstance(slugs, str):
                # Eğer string olarak gelmişse
                if slugs.strip().startswith('[') and slugs.strip().endswith(']'):
                    try:
                        processed_slugs = json.loads(slugs)
                    except json.JSONDecodeError:
                        processed_slugs = [slugs]
                else:
                    processed_slugs = [slugs]
            else:
                processed_slugs = slugs or []
            
            # Slug'ları temizle (boşlukları kaldır)
            processed_slugs = [str(slug).strip() for slug in processed_slugs if str(slug).strip()]
            
            print(f"DEBUG VALIDATE: Processed slugs = {processed_slugs}")
            
            # Kullanıcının işletmelerine erişim kontrolü
            if request.user.is_authenticated and processed_slugs:
                user_businesses = Business.objects.filter(
                    slug__in=processed_slugs, 
                    user=request.user
                )
                user_slugs = list(user_businesses.values_list('slug', flat=True))
                
                print(f"DEBUG: User businesses = {user_slugs}")
                
                # Eğer gönderilen slug'lardan bazıları kullanıcıya ait değilse
                invalid_slugs = set(processed_slugs) - set(user_slugs)
                if invalid_slugs:
                    print(f"DEBUG: Invalid slugs = {invalid_slugs}")
                    raise serializers.ValidationError({
                        'business_slugs': f"Bu işletmelere erişiminiz yok: {', '.join(invalid_slugs)}"
                    })
            
            data['business_slugs'] = processed_slugs
        
        return data

    def create(self, validated_data):
        print(f"DEBUG: create method - validated_data: {validated_data}")
        slugs = validated_data.pop('business_slugs', [])
        banner_image = validated_data.pop('banner_image', None)
        
        print(f"DEBUG: Creating category with name: {validated_data.get('name')}")
        print(f"DEBUG: business_slugs: {slugs}")
        
        category = Category.objects.create(
            name=validated_data.get('name'),
            banner_image=banner_image if banner_image else None
        )
        
        if slugs:
            businesses = Business.objects.filter(slug__in=slugs)
            print(f"DEBUG: Found businesses: {[b.slug for b in businesses]}")
            category.businesses.set(businesses)
        
        return category

class ProductSerializer(serializers.ModelSerializer):
    # category -> id
    class Meta:
        model = Product
        fields = [
            'id','category','name','description','price',
            'image','image_url','is_active','is_popular','preparation_time',
            'ingredients','allergens','created_at'
        ]
        read_only_fields = ['created_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # kolay frontend gösterimi
        rep['image'] = instance.image.url if instance.image else (instance.image_url or None)
        rep['category_name'] = instance.category.name
        return rep

    def create(self, validated_data):
        # ingredients/allergens POSTMultipart ile gelirse string olabilir; JSON parse et
        for key in ('ingredients', 'allergens'):
            val = validated_data.get(key)
            if isinstance(val, str):
                try:
                    validated_data[key] = json.loads(val)
                except:
                    validated_data[key] = []
        return super().create(validated_data)

    def update(self, instance, validated_data):
        for key in ('ingredients', 'allergens'):
            val = validated_data.get(key)
            if isinstance(val, str):
                try:
                    validated_data[key] = json.loads(val)
                except:
                    validated_data[key] = instance.__dict__.get(key, [])
        return super().update(instance, validated_data)
    
class WiFiInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WiFiInfo
        fields = '__all__'
        fields = ['ssid', 'password', 'is_enabled']

# serializers.py - Sadece işletme yorumu için
class CommentSerializer(serializers.ModelSerializer):
    business_slug = serializers.CharField(write_only=True)
    
    class Meta:
        model = Comment
        fields = [
            "id", "business", "business_slug",
            "user_name", "user_email", "comment", "rating",
            "status", "created_at", "approved_at", "approved_by"
        ]
        read_only_fields = ["id", "business", "status", "created_at", "approved_at", "approved_by"]

    def validate(self, data):
        # İşletme slug kontrolü
        business_slug = data.get('business_slug')
        if not business_slug:
            raise serializers.ValidationError({"business_slug": "Business slug gereklidir."})
        
        try:
            business = Business.objects.get(slug=business_slug)
        except Business.DoesNotExist:
            raise serializers.ValidationError({"business_slug": "Geçersiz işletme slug'ı."})
        
        data['business'] = business
        
        # Kullanıcı adı ve email için varsayılan değerler
        if not data.get('user_name'):
            data['user_name'] = "Anonim"
        if not data.get('user_email'):
            data['user_email'] = "guest@example.com"
            
        return data

    def create(self, validated_data):
        # Doğrulama sırasında eklenen business alanını kullan
        validated_data.pop('business_slug', None)
        
        return super().create(validated_data)
    

# serializers.py - WaiterCallSerializer ekleyin
class WaiterCallSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_slug = serializers.CharField(source='business.slug', read_only=True)
    
    class Meta:
        model = WaiterCall
        fields = [
            'id', 'business', 'business_name', 'business_slug',
            'table_number', 'location', 'status', 'called_at',
            'completed_at', 'notes'
        ]
        read_only_fields = ['id', 'called_at', 'completed_at']

# serializers.py - WaiterCallCreateSerializer düzeltmesi
class WaiterCallCreateSerializer(serializers.ModelSerializer):
    business_slug = serializers.CharField(write_only=True)
    
    class Meta:
        model = WaiterCall
        fields = ['business_slug', 'table_number', 'location', 'notes']
    
    def validate(self, data):
        business_slug = data.get('business_slug')
        try:
            business = Business.objects.get(slug=business_slug)
            data['business'] = business
        except Business.DoesNotExist:
            raise serializers.ValidationError({"business_slug": "Geçersiz işletme slug'ı."})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('business_slug', None)
        return super().create(validated_data)