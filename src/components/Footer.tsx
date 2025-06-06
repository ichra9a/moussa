
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';

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
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook size={20} />;
      case 'instagram':
        return <Instagram size={20} />;
      case 'linkedin':
        return <Linkedin size={20} />;
      case 'youtube':
        return <Youtube size={20} />;
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

  return (
    <footer className="bg-slate-900 text-white py-12 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="col-span-1 md:col-span-2">
            {logo && (
              <div className="mb-4">
                <img src={logo} alt="Logo" className="h-12 object-contain" />
              </div>
            )}
            <p className="text-slate-300 arabic-text text-lg leading-relaxed">
              {aboutText.ar || 'نحن منصة تعليمية متخصصة في التطوير الشخصي والمهني'}
            </p>
            {contactEmail && (
              <div className="flex items-center gap-2 mt-4 text-slate-300">
                <Mail size={16} />
                <span className="arabic-text">{contactEmail}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 arabic-heading">روابط سريعة</h3>
            <ul className="space-y-2">
              {footerLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.url} 
                    className="text-slate-300 hover:text-white transition-colors arabic-text"
                  >
                    {link.title.ar}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-bold text-lg mb-4 arabic-heading">تابعنا على</h3>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className="text-slate-300 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(social.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 mt-8 pt-8 text-center">
          <p className="text-slate-400 arabic-text">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
