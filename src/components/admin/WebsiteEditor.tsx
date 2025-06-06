
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Settings, Type, Image } from 'lucide-react';
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
    { key: 'site_title', value: 'منصة التعلم الإلكتروني', type: 'text', label: 'عنوان الموقع' },
    { key: 'site_description', value: 'منصة تعليمية متقدمة لتطوير المهارات', type: 'textarea', label: 'وصف الموقع' },
    { key: 'hero_title', value: 'ابدأ رحلتك التعليمية معنا', type: 'text', label: 'عنوان القسم الرئيسي' },
    { key: 'hero_subtitle', value: 'اكتشف عالماً من المعرفة والمهارات الجديدة', type: 'text', label: 'العنوان الفرعي الرئيسي' },
    { key: 'about_title', value: 'عن منصتنا التعليمية', type: 'text', label: 'عنوان قسم "حولنا"' },
    { key: 'about_description', value: 'نحن منصة تعليمية متطورة تهدف إلى تقديم أفضل المحتويات التعليمية', type: 'textarea', label: 'وصف قسم "حولنا"' },
    { key: 'contact_email', value: 'info@platform.com', type: 'email', label: 'البريد الإلكتروني للتواصل' },
    { key: 'contact_phone', value: '+966 50 123 4567', type: 'text', label: 'رقم الهاتف' },
    { key: 'footer_text', value: 'جميع الحقوق محفوظة 2024', type: 'text', label: 'نص الفوتر' }
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
        // Initialize with default settings if none exist
        await initializeDefaultSettings();
      } else {
        setSettings(data || []);
        // If no settings exist, initialize defaults
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
        setting_value: { value: setting.value },
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
          ? { ...setting, setting_value: { value: newValue } }
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

  const renderSettingInput = (setting: WebsiteSetting) => {
    const settingType = getSettingType(setting.setting_key);
    const value = setting.setting_value?.value || '';

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
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 arabic-text">جاري تحميل الإعدادات...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Site Basic Info */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg arabic-heading flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  معلومات الموقع الأساسية
                </h3>
                {settings.filter(s => ['site_title', 'site_description'].includes(s.setting_key)).map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="arabic-text font-medium">
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Hero Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg arabic-heading flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  القسم الرئيسي (Hero)
                </h3>
                {settings.filter(s => ['hero_title', 'hero_subtitle'].includes(s.setting_key)).map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="arabic-text font-medium">
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* About Section */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg arabic-heading">قسم "حولنا"</h3>
                {settings.filter(s => ['about_title', 'about_description'].includes(s.setting_key)).map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="arabic-text font-medium">
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg arabic-heading">معلومات التواصل</h3>
                {settings.filter(s => ['contact_email', 'contact_phone', 'footer_text'].includes(s.setting_key)).map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <Label className="arabic-text font-medium">
                      {getSettingLabel(setting.setting_key)}
                    </Label>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

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
