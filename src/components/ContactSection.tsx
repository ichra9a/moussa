
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormData({
      name: '',
      email: '',
      message: ''
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'البريد الإلكتروني',
      info: 'info@trainingplatform.com',
      link: 'mailto:info@trainingplatform.com'
    },
    {
      icon: Phone,
      title: 'رقم الهاتف',
      info: '+966 12 345 6789',
      link: 'tel:+966123456789'
    },
    {
      icon: MapPin,
      title: 'العنوان',
      info: 'الرياض، المملكة العربية السعودية',
      link: '#'
    }
  ];

  return (
    <section id="contact" className="py-20 bg-white mobile-app">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 arabic-heading mb-6">
            معلومات التواصل
          </h2>
          <p className="text-xl text-slate-600 arabic-text max-w-3xl mx-auto leading-relaxed">
            نحن هنا لمساعدتك والإجابة على جميع استفساراتك. 
            لا تتردد في التواصل معنا في أي وقت
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((item, index) => (
            <div key={index} className="bg-slate-50 rounded-2xl p-8 text-center hover:bg-slate-100 transition-all duration-200 mobile-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <item.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 arabic-heading mb-3">
                {item.title}
              </h3>
              <p className="text-slate-600 arabic-text text-lg">
                {item.info}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Working Hours */}
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mobile-card">
              <h4 className="text-xl font-bold text-slate-900 arabic-heading mb-6">
                ساعات العمل
              </h4>
              <div className="space-y-4 arabic-text text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الأحد - الخميس</span>
                  <span>9:00 ص - 6:00 م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">الجمعة</span>
                  <span>9:00 ص - 12:00 م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">السبت</span>
                  <span>مغلق</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mobile-card">
            <h3 className="text-2xl font-bold text-slate-900 arabic-heading mb-6">
              أرسل لنا رسالة
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-slate-700 arabic-text font-medium mb-2">
                  الاسم الكامل
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    name: e.target.value
                  })}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-200 arabic-text mobile-touch"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-700 arabic-text font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    email: e.target.value
                  })}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                  dir="ltr"
                  required
                />
              </div>
              
              <div>
                <label className="block text-slate-700 arabic-text font-medium mb-2">
                  الرسالة
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({
                    ...formData,
                    message: e.target.value
                  })}
                  placeholder="اكتب رسالتك هنا..."
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-blue-200 p-4 arabic-text resize-none"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white arabic-text font-semibold rounded-xl mobile-button flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                إرسال الرسالة
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
