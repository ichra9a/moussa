
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

interface FooterLink {
  title: { ar: string; en: string };
  url: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('*')
        .in('setting_key', ['footer_about', 'footer_links', 'footer_contact_email', 'footer_social_links', 'site_logo']);

      if (data) {
        const settingsObj: Record<string, any> = {};
        data.forEach((setting: any) => {
          settingsObj[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    const iconProps = { size: 20, className: "transition-colors" };
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook {...iconProps} />;
      case 'instagram':
        return <Instagram {...iconProps} />;
      case 'linkedin':
        return <Linkedin {...iconProps} />;
      case 'youtube':
        return <Youtube {...iconProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return null;
  }

  const footerLinks: FooterLink[] = settings.footer_links || [];
  const socialLinks: SocialLink[] = settings.footer_social_links || [];
  const aboutText = settings.footer_about || {};
  const contactEmail = settings.footer_contact_email || '';
  const logo = settings.site_logo || '';

  const quickLinks = [
    { title: { ar: 'الصفحة الرئيسية', en: 'Home' }, url: '#home' },
    { title: { ar: 'الدورات', en: 'Courses' }, url: '#courses' },
    { title: { ar: 'حولنا', en: 'About' }, url: '#about' },
    { title: { ar: 'تواصل معنا', en: 'Contact' }, url: '#contact' },
    ...footerLinks
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-cairo" dir="rtl">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {logo && (
              <div className="mb-6">
                <img src={logo} alt="Logo" className="h-12 object-contain" />
              </div>
            )}
            <div className="space-y-4">
              <h3 className="text-xl font-bold arabic-heading text-white">منصة التعلم الإلكتروني</h3>
              <p className="text-slate-300 arabic-text text-lg leading-relaxed max-w-md">
                {aboutText.ar || 'نحن منصة تعليمية متخصصة في التطوير الشخصي والمهني، نقدم محتوى تدريبي احترافي لمساعدتك على تحقيق أهدافك.'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactEmail && (
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <Mail size={18} className="text-blue-400" />
                  <span className="arabic-text">{contactEmail}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-300">
                <Phone size={18} className="text-blue-400" />
                <span className="arabic-text">+966 50 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <MapPin size={18} className="text-blue-400" />
                <span className="arabic-text">المملكة العربية السعودية</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold arabic-heading text-white border-b border-slate-700 pb-3">
              روابط سريعة
            </h3>
            <ul className="space-y-3">
              {quickLinks.slice(0, 6).map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.url} 
                    className="text-slate-300 hover:text-blue-400 transition-colors arabic-text flex items-center group"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded-full ml-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.title.ar}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media & Newsletter */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold arabic-heading text-white border-b border-slate-700 pb-3">
              تابعنا
            </h3>
            
            {/* Social Links */}
            <div className="flex gap-4 flex-wrap">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="w-10 h-10 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all duration-200 rounded-lg flex items-center justify-center group"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
              
              {/* Default social links if none configured */}
              {socialLinks.length === 0 && (
                <>
                  <div className="w-10 h-10 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Facebook size={20} />
                  </div>
                  <div className="w-10 h-10 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Instagram size={20} />
                  </div>
                  <div className="w-10 h-10 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Youtube size={20} />
                  </div>
                </>
              )}
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-slate-300 arabic-text text-sm">
                اشترك في نشرتنا الإخبارية للحصول على آخر التحديثات
              </p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 arabic-text text-sm"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm arabic-text">
                  اشتراك
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 arabic-text text-sm">
              © {new Date().getFullYear()} منصة التعلم الإلكتروني. جميع الحقوق محفوظة
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#privacy" className="text-slate-400 hover:text-white transition-colors arabic-text">
                سياسة الخصوصية
              </a>
              <a href="#terms" className="text-slate-400 hover:text-white transition-colors arabic-text">
                شروط الاستخدام
              </a>
              <a href="#cookies" className="text-slate-400 hover:text-white transition-colors arabic-text">
                سياسة ملفات تعريف الارتباط
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
