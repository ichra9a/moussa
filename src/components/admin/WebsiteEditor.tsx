
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Settings, Type, Image, Video, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebsiteSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
}

const WebsiteEditor = () => {
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const defaultSettings = [
    // Hero Section
    { key: 'hero_title', value: 'طوّر من إمكاناتك', type: 'text', label: 'العنوان الرئيسي', category: 'hero' },
    { key: 'hero_subtitle', value: 'محتوى تدريبي احترافي مصمم لمساعدتك على تجاوز التحديات', type: 'textarea', label: 'النص الفرعي', category: 'hero' },
    { key: 'hero_video_title', value: 'مرحباً بكم في رحلة التطوير الشخصي', type: 'text', label: 'عنوان الفيديو المميز', category: 'hero' },
    { key: 'hero_video_description', value: 'اكتشف كيفية إطلاق إمكاناتك وتحقيق أهدافك من خلال استراتيجيات التدريب المؤكدة.', type: 'textarea', label: 'وصف الفيديو المميز', category: 'hero' },
    { key: 'hero_video_thumbnail', value: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&h=450&fit=crop', type: 'text', label: 'صورة الفيديو المصغرة', category: 'hero' },
    { key: 'hero_primary_button', value: 'شاهد المقدمة', type: 'text', label: 'نص الزر الرئيسي', category: 'hero' },
    { key: 'hero_secondary_button', value: 'استكشف الفئات', type: 'text', label: 'نص الزر الثانوي', category: 'hero' },
    
    // Statistics
    { key: 'stats_videos', value: '50+', type: 'text', label: 'عدد الدروس', category: 'hero' },
    { key: 'stats_videos_label', value: 'درس فيديو', type: 'text', label: 'تسمية الدروس', category: 'hero' },
    { key: 'stats_categories', value: '10+', type: 'text', label: 'عدد الفئات', category: 'hero' },
    { key: 'stats_categories_label', value: 'فئة', type: 'text', label: 'تسمية الفئات', category: 'hero' },
    { key: 'stats_students', value: '1000+', type: 'text', label: 'عدد الطلاب', category: 'hero' },
    { key: 'stats_students_label', value: 'طالب', type: 'text', label: 'تسمية الطلاب', category: 'hero' },

    // About Section
    { key: 'about_title', value: 'من نحن', type: 'text', label: 'عنوان قسم "حولنا"', category: 'about' },
    { key: 'about_description', value: 'نحن منصة تعليمية متطورة تهدف إلى تقديم أفضل المحتويات التعليمية', type: 'textarea', label: 'وصف قسم "حولنا"', category: 'about' },

    // Contact Section
    { key: 'contact_title', value: 'تواصل معنا', type: 'text', label: 'عنوان قسم التواصل', category: 'contact' },
    { key: 'contact_description', value: 'نحن هنا لمساعدتك في رحلتك التعليمية', type: 'textarea', label: 'وصف قسم التواصل', category: 'contact' },
    { key: 'contact_email', value: 'info@platform.com', type: 'email', label: 'البريد الإلكتروني للتواصل', category: 'contact' },
    { key: 'contact_phone', value: '+966 50 123 4567', type: 'text', label: 'رقم الهاتف', category: 'contact' },

    // Footer
    { key: 'footer_about', value: '{"ar": "نحن منصة تعليمية متخصصة في التطوير الشخصي والمهني"}', type: 'json', label: 'نص "حولنا" في الفوتر', category: 'footer' },
    { key: 'footer_contact_email', value: 'info@platform.com', type: 'email', label: 'بريد التواصل في الفوتر', category: 'footer' },
    { key: 'footer_links', value: '[]', type: 'json', label: 'الروابط السريعة', category: 'footer' },
    { key: 'footer_social_links', value: '[]', type: 'json', label: 'روابط التواصل الاجتماعي', category: 'footer' },
    { key: 'site_logo', value: '', type: 'text', label: 'شعار الموقع', category: 'footer' },

    // Search Section
    { key: 'search_title', value: 'ابحث عن الدروس', type: 'text', label: 'عنوان قسم البحث', category: 'search' },
    { key: 'search_placeholder', value: 'ابحث عن الموضوع الذي تريد تعلمه...', type: 'text', label: 'نص البحث', category: 'search' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*');

      if (error) {
        console.error('Error fetching settings:', error);
        await initializeDefaultSettings();
      } else {
        setSettings(data || []);
        if (!data || data.length === 0) {
          await initializeDefaultSettings();
        }
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الإعدادات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSettings = async () => {
    try {
      const settingsToInsert = defaultSettings.map(setting => ({
        setting_key: setting.key,
        setting_value: setting.type === 'json' ? JSON.parse(setting.value) : { value: setting.value },
        setting_type: setting.type
      }));

      const { data, error } = await supabase
        .from('website_settings')
        .insert(settingsToInsert)
        .select();

      if (error) {
        console.error('Error initializing settings:', error);
      } else {
        setSettings(data || []);
      }
    } catch (error) {
      console.error('Error in initializeDefaultSettings:', error);
    }
  };

  const updateSetting = (settingKey: string, newValue: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.setting_key === settingKey 
          ? { 
              ...setting, 
              setting_value: setting.setting_type === 'json' 
                ? JSON.parse(newValue || '{}')
                : { value: newValue }
            }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = settings.map(setting => ({
        id: setting.id,
        setting_key: setting.setting_key,
        setting_value: setting.setting_value,
        setting_type: setting.setting_type
      }));

      const { error } = await supabase
        .from('website_settings')
        .upsert(updates, { onConflict: 'setting_key' });

      if (error) {
        throw error;
      }

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الموقع بنجاح"
      });

      // Refresh the page to show changes
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key: string) => {
    const defaultSetting = defaultSettings.find(s => s.key === key);
    return defaultSetting?.label || key;
  };

  const getSettingType = (key: string) => {
    const defaultSetting = defaultSettings.find(s => s.key === key);
    return defaultSetting?.type || 'text';
  };

  const getSettingCategory = (key: string) => {
    const defaultSetting = defaultSettings.find(s => s.key === key);
    return defaultSetting?.category || 'general';
  };

  const renderSettingInput = (setting: WebsiteSetting) => {
    const settingType = getSettingType(setting.setting_key);
    const value = settingType === 'json' 
      ? JSON.stringify(setting.setting_value || {}, null, 2)
      : setting.setting_value?.value || '';

    switch (settingType) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
            className="arabic-text"
            rows={3}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
            className="arabic-text"
          />
        );
      case 'json':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
            className="arabic-text font-mono"
            rows={4}
            placeholder='{"ar": "النص باللغة العربية"}'
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateSetting(setting.setting_key, e.target.value)}
            className="arabic-text"
          />
        );
    }
  };

  const groupedSettings = settings.reduce((groups, setting) => {
    const category = getSettingCategory(setting.setting_key);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(setting);
    return groups;
  }, {} as Record<string, WebsiteSetting[]>);

  const categoryIcons = {
    hero: Video,
    about: MessageSquare,
    contact: MessageSquare,
    footer: Settings,
    search: Type,
    general: Settings
  };

  const categoryTitles = {
    hero: 'القسم الرئيسي والإحصائيات',
    about: 'قسم "حولنا"',
    contact: 'قسم التواصل',
    footer: 'الفوتر',
    search: 'قسم البحث',
    general: 'إعدادات عامة'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">تحرير محتوى الموقع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <Settings className="h-5 w-5" />
            تحرير محتوى الموقع
          </CardTitle>
          <p className="text-slate-600 arabic-text">
            قم بتخصيص جميع النصوص والمحتوى الظاهر في الواجهة الأمامية للموقع
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(groupedSettings).length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 arabic-text">جاري تحميل الإعدادات...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSettings).map(([category, categorySettings]) => {
                const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                const categoryTitle = categoryTitles[category as keyof typeof categoryTitles] || category;

                return (
                  <div key={category} className="border rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-lg arabic-heading flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {categoryTitle}
                    </h3>
                    <div className="grid gap-4">
                      {categorySettings.map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <Label className="arabic-text font-medium">
                            {getSettingLabel(setting.setting_key)}
                          </Label>
                          {renderSettingInput(setting)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full arabic-text"
                size="lg"
              >
                <Save className="ml-2 h-4 w-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteEditor;
