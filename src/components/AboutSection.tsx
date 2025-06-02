
import { Users, Target, Award, Heart } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Users,
      title: 'خبراء في التدريب',
      description: 'فريق من المدربين المعتمدين والخبراء في مختلف المجالات'
    },
    {
      icon: Target,
      title: 'محتوى هادف',
      description: 'دورات تدريبية مصممة خصيصاً لتحقيق أهدافك المهنية والشخصية'
    },
    {
      icon: Award,
      title: 'شهادات معتمدة',
      description: 'احصل على شهادات معتمدة عند إتمام الدورات التدريبية بنجاح'
    },
    {
      icon: Heart,
      title: 'تعلم ممتع',
      description: 'تجربة تعليمية تفاعلية وممتعة تحفزك على الاستمرار والتطور'
    }
  ];

  return (
    <section id="about" className="py-20 bg-slate-50 mobile-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 arabic-heading mb-6">
            من نحن
          </h2>
          <p className="text-xl text-slate-600 arabic-text max-w-3xl mx-auto leading-relaxed">
            منصة تدريبية متقدمة تهدف إلى تقديم أفضل الدورات التدريبية والتعليمية 
            لمساعدتك في تطوير مهاراتك وتحقيق أهدافك المهنية والشخصية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mobile-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 mobile-card border border-slate-100"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 arabic-heading mb-4 text-center">
                {feature.title}
              </h3>
              <p className="text-slate-600 arabic-text text-center leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl p-8 md:p-12 shadow-xl mobile-card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 arabic-heading mb-6">
                رؤيتنا ورسالتنا
              </h3>
              <p className="text-lg text-slate-600 arabic-text mb-6 leading-relaxed">
                نسعى لتكون منصة التدريب الرائدة في المنطقة، حيث نقدم تجربة تعليمية 
                استثنائية تجمع بين أحدث التقنيات والمحتوى عالي الجودة.
              </p>
              <p className="text-lg text-slate-600 arabic-text leading-relaxed">
                رسالتنا هي تمكين الأفراد من تطوير قدراتهم ومهاراتهم من خلال 
                برامج تدريبية متطورة ومتخصصة تواكب احتياجات سوق العمل.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">+500</div>
                  <div className="text-slate-600 arabic-text">متدرب</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">+50</div>
                  <div className="text-slate-600 arabic-text">دورة تدريبية</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">+20</div>
                  <div className="text-slate-600 arabic-text">مدرب خبير</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 arabic-heading">98%</div>
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
