
import { useState, useEffect } from 'react';
import { Users, Target, Award, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

const AboutSection = () => {
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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return Users;
      case 'Target':
        return Target;
      case 'Award':
        return Award;
      case 'Heart':
        return Heart;
      default:
        return Users;
    }
  };

  return (
    <section id="about" className="py-20 bg-slate-50 mobile-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 arabic-heading mb-6">
            {aboutContent.title}
          </h2>
          <p className="text-xl text-slate-600 arabic-text max-w-3xl mx-auto leading-relaxed">
            {aboutContent.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mobile-grid">
          {aboutContent.features.map((feature, index) => {
            const IconComponent = getIcon(feature.icon);
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 mobile-card border border-slate-100"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 arabic-heading mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-slate-600 arabic-text text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-xl mobile-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 arabic-heading mb-6">
                {aboutContent.vision_title}
              </h3>
              <p className="text-lg text-slate-600 arabic-text mb-6 leading-relaxed">
                {aboutContent.vision_description}
              </p>
              <p className="text-lg text-slate-600 arabic-text leading-relaxed">
                {aboutContent.mission_description}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">{aboutContent.stats.students}</div>
                  <div className="text-slate-600 arabic-text">متدرب</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">{aboutContent.stats.courses}</div>
                  <div className="text-slate-600 arabic-text">دورة تدريبية</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">{aboutContent.stats.trainers}</div>
                  <div className="text-slate-600 arabic-text">مدرب خبير</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">{aboutContent.stats.satisfaction}</div>
                  <div className="text-slate-600 arabic-text">نسبة الرضا</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
