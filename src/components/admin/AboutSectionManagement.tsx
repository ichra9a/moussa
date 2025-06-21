
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AboutContent {
  title: string;
  description: string;
  vision_title: string;
  vision_description: string;
  mission_description: string;
  stats: {
    students: string;
    courses: string;
    trainers: string;
    satisfaction: string;
  };
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

const AboutSectionManagement = () => {
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    title: 'من نحن',
    description: 'منصة تدريبية متقدمة تهدف إلى تقديم أفضل الدورات التدريبية والتعليمية لمساعدتك في تطوير مهاراتك وتحقيق أهدافك المهنية والشخصية',
    vision_title: 'رؤيتنا ورسالتنا',
    vision_description: 'نسعى لتكون منصة التدريب الرائدة في المنطقة، حيث نقدم تجربة تعليمية استثنائية تجمع بين أحدث التقنيات والمحتوى عالي الجودة.',
    mission_description: 'رسالتنا هي تمكين الأفراد من تطوير قدراتهم ومهاراتهم من خلال برامج تدريبية متطورة ومتخصصة تواكب احتياجات سوق العمل.',
    stats: {
      students: '+500',
      courses: '+50',
      trainers: '+20',
      satisfaction: '98%'
    },
    features: [
      {
        title: 'خبراء في التدريب',
        description: 'فريق من المدربين المعتمدين والخبراء في مختلف المجالات',
        icon: 'Users'
      },
      {
        title: 'محتوى هادف',
        description: 'دورات تدريبية مصممة خصيصاً لتحقيق أهدافك المهنية والشخصية',
        icon: 'Target'
      },
      {
        title: 'شهادات معتمدة',
        description: 'احصل على شهادات معتمدة عند إتمام الدورات التدريبية بنجاح',
        icon: 'Award'
      },
      {
        title: 'تعلم ممتع',
        description: 'تجربة تعليمية تفاعلية وممتعة تحفزك على الاستمرار والتطور',
        icon: 'Heart'
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [editingFeature, setEditingFeature] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('setting_key', 'about_section_content')
        .single();

      if (data && data.setting_value && typeof data.setting_value === 'object') {
        const settingValue = data.setting_value as Record<string, any>;
        setAboutContent(prev => ({
          ...prev,
          ...settingValue
        }));
      }
    } catch (error) {
      console.error('Error fetching about content:', error);
    }
  };

  const saveAboutContent = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({
          setting_key: 'about_section_content',
          setting_value: aboutContent as any,
          setting_type: 'json'
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ محتوى قسم من نحن بنجاح",
      });
    } catch (error) {
      console.error('Error saving about content:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ المحتوى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updatedFeatures = [...aboutContent.features];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    setAboutContent({
      ...aboutContent,
      features: updatedFeatures
    });
  };

  const addFeature = () => {
    setAboutContent({
      ...aboutContent,
      features: [
        ...aboutContent.features,
        {
          title: 'ميزة جديدة',
          description: 'وصف الميزة الجديدة',
          icon: 'Star'
        }
      ]
    });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = aboutContent.features.filter((_, i) => i !== index);
    setAboutContent({
      ...aboutContent,
      features: updatedFeatures
    });
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 arabic-heading">إدارة قسم من نحن</h2>
        <Button
          onClick={saveAboutContent}
          disabled={loading}
          className="arabic-text flex items-center gap-2"
        >
          <Save size={16} />
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">المحتوى الرئيسي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">العنوان الرئيسي</label>
            <Input
              value={aboutContent.title}
              onChange={(e) => setAboutContent({
                ...aboutContent,
                title: e.target.value
              })}
              className="arabic-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">الوصف</label>
            <Textarea
              value={aboutContent.description}
              onChange={(e) => setAboutContent({
                ...aboutContent,
                description: e.target.value
              })}
              rows={3}
              className="arabic-text"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vision and Mission */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الرؤية والرسالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">عنوان الرؤية والرسالة</label>
            <Input
              value={aboutContent.vision_title}
              onChange={(e) => setAboutContent({
                ...aboutContent,
                vision_title: e.target.value
              })}
              className="arabic-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">نص الرؤية</label>
            <Textarea
              value={aboutContent.vision_description}
              onChange={(e) => setAboutContent({
                ...aboutContent,
                vision_description: e.target.value
              })}
              rows={3}
              className="arabic-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 arabic-text">نص الرسالة</label>
            <Textarea
              value={aboutContent.mission_description}
              onChange={(e) => setAboutContent({
                ...aboutContent,
                mission_description: e.target.value
              })}
              rows={3}
              className="arabic-text"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading">الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">عدد المتدربين</label>
              <Input
                value={aboutContent.stats.students}
                onChange={(e) => setAboutContent({
                  ...aboutContent,
                  stats: { ...aboutContent.stats, students: e.target.value }
                })}
                className="arabic-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">عدد الدورات</label>
              <Input
                value={aboutContent.stats.courses}
                onChange={(e) => setAboutContent({
                  ...aboutContent,
                  stats: { ...aboutContent.stats, courses: e.target.value }
                })}
                className="arabic-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">عدد المدربين</label>
              <Input
                value={aboutContent.stats.trainers}
                onChange={(e) => setAboutContent({
                  ...aboutContent,
                  stats: { ...aboutContent.stats, trainers: e.target.value }
                })}
                className="arabic-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 arabic-text">نسبة الرضا</label>
              <Input
                value={aboutContent.stats.satisfaction}
                onChange={(e) => setAboutContent({
                  ...aboutContent,
                  stats: { ...aboutContent.stats, satisfaction: e.target.value }
                })}
                className="arabic-text"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-heading flex items-center justify-between">
            الميزات
            <Button
              onClick={addFeature}
              variant="outline"
              size="sm"
              className="arabic-text flex items-center gap-2"
            >
              <Plus size={16} />
              إضافة ميزة
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aboutContent.features.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium arabic-text">الميزة {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setEditingFeature(editingFeature === index ? null : index)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      onClick={() => removeFeature(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                
                {editingFeature === index && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 arabic-text">العنوان</label>
                      <Input
                        value={feature.title}
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                        className="arabic-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 arabic-text">الوصف</label>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, 'description', e.target.value)}
                        rows={2}
                        className="arabic-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 arabic-text">الأيقونة</label>
                      <Input
                        value={feature.icon}
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        placeholder="Users, Target, Award, Heart, etc."
                      />
                    </div>
                  </div>
                )}
                
                {editingFeature !== index && (
                  <div className="text-sm text-gray-600 arabic-text">
                    <p><strong>العنوان:</strong> {feature.title}</p>
                    <p><strong>الوصف:</strong> {feature.description}</p>
                    <p><strong>الأيقونة:</strong> {feature.icon}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutSectionManagement;
