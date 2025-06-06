
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, Settings, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebsiteSetting {
  setting_key: string;
  setting_value: any;
  setting_type: string;
}

const WebsiteEditor = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('*');

      if (data) {
        const settingsObj: Record<string, any> = {};
        data.forEach((setting: WebsiteSetting) => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any, type: string = 'text') => {
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          setting_type: type,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      let success = true;
      
      // Save hero content
      if (settings.hero_title) {
        success = success && await updateSetting('hero_title', settings.hero_title);
      }
      if (settings.hero_subtitle) {
        success = success && await updateSetting('hero_subtitle', settings.hero_subtitle);
      }
      if (settings.hero_video_id) {
        success = success && await updateSetting('hero_video_id', settings.hero_video_id);
      }

      // Save footer content
      if (settings.footer_about) {
        success = success && await updateSetting('footer_about', settings.footer_about);
      }
      if (settings.footer_contact_email) {
        success = success && await updateSetting('footer_contact_email', settings.footer_contact_email);
      }
      if (settings.footer_links) {
        success = success && await updateSetting('footer_links', settings.footer_links, 'json');
      }
      if (settings.footer_social_links) {
        success = success && await updateSetting('footer_social_links', settings.footer_social_links, 'json');
      }

      if (success) {
        toast({
          title: "تم بنجاح",
          description: "تم حفظ إعدادات الموقع بنجاح"
        });
      } else {
        throw new Error('Some settings failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`logos/${fileName}`, logoFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(`logos/${fileName}`);

      await updateSetting('site_logo', data.publicUrl, 'image');

      toast({
        title: "تم بنجاح",
        description: "تم رفع الشعار بنجاح"
      });

      setLogoFile(null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الشعار",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 arabic-heading">
            <Globe className="h-5 w-5" />
            محرر محتوى الموقع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero" className="arabic-text">الصفحة الرئيسية</TabsTrigger>
              <TabsTrigger value="logo" className="arabic-text">الشعار</TabsTrigger>
              <TabsTrigger value="footer" className="arabic-text">الفوتر</TabsTrigger>
              <TabsTrigger value="links" className="arabic-text">الروابط</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-4">
              <div>
                <Label className="arabic-text">عنوان القسم الرئيسي (عربي)</Label>
                <Input
                  value={settings.hero_title?.ar || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    hero_title: { ...prev.hero_title, ar: e.target.value }
                  }))}
                  className="arabic-text"
                />
              </div>
              <div>
                <Label className="arabic-text">عنوان القسم الرئيسي (إنجليزي)</Label>
                <Input
                  value={settings.hero_title?.en || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    hero_title: { ...prev.hero_title, en: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label className="arabic-text">النص الفرعي (عربي)</Label>
                <Textarea
                  value={settings.hero_subtitle?.ar || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    hero_subtitle: { ...prev.hero_subtitle, ar: e.target.value }
                  }))}
                  className="arabic-text"
                  rows={3}
                />
              </div>
              <div>
                <Label className="arabic-text">النص الفرعي (إنجليزي)</Label>
                <Textarea
                  value={settings.hero_subtitle?.en || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    hero_subtitle: { ...prev.hero_subtitle, en: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
              <div>
                <Label className="arabic-text">معرف فيديو اليوتيوب</Label>
                <Input
                  value={settings.hero_video_id || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    hero_video_id: e.target.value
                  }))}
                  placeholder="dQw4w9WgXcQ"
                />
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4">
              <div>
                <Label className="arabic-text">الشعار الحالي</Label>
                {settings.site_logo && (
                  <div className="mt-2">
                    <img 
                      src={settings.site_logo} 
                      alt="Site Logo" 
                      className="max-h-20 object-contain"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label className="arabic-text">رفع شعار جديد</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="arabic-text"
                />
              </div>
              {logoFile && (
                <Button onClick={handleLogoUpload} className="arabic-text">
                  <Upload className="ml-2 h-4 w-4" />
                  رفع الشعار
                </Button>
              )}
            </TabsContent>

            <TabsContent value="footer" className="space-y-4">
              <div>
                <Label className="arabic-text">نبذة عن المنصة (عربي)</Label>
                <Textarea
                  value={settings.footer_about?.ar || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    footer_about: { ...prev.footer_about, ar: e.target.value }
                  }))}
                  className="arabic-text"
                  rows={3}
                />
              </div>
              <div>
                <Label className="arabic-text">نبذة عن المنصة (إنجليزي)</Label>
                <Textarea
                  value={settings.footer_about?.en || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    footer_about: { ...prev.footer_about, en: e.target.value }
                  }))}
                  rows={3}
                />
              </div>
              <div>
                <Label className="arabic-text">البريد الإلكتروني</Label>
                <Input
                  value={settings.footer_contact_email || ''}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    footer_contact_email: e.target.value
                  }))}
                  type="email"
                />
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div>
                <Label className="arabic-text">روابط التواصل الاجتماعي (JSON)</Label>
                <Textarea
                  value={JSON.stringify(settings.footer_social_links || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setSettings(prev => ({
                        ...prev,
                        footer_social_links: parsed
                      }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono"
                  rows={6}
                />
              </div>
              <div>
                <Label className="arabic-text">روابط الصفحات (JSON)</Label>
                <Textarea
                  value={JSON.stringify(settings.footer_links || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setSettings(prev => ({
                        ...prev,
                        footer_links: parsed
                      }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="font-mono"
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveContent} disabled={saving} className="arabic-text">
              <Save className="ml-2 h-4 w-4" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteEditor;
