
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, TrendingUp } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  course_id: string;
  order_index: number;
  is_active: boolean;
  courses: {
    title: string;
    thumbnail: string;
  } | null;
}

interface FeaturedModulesProps {
  modules: Module[];
  onEnroll: (moduleId: string, type: 'module') => void;
}

const FeaturedModules = ({ modules, onEnroll }: FeaturedModulesProps) => {
  if (modules.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-semibold text-slate-900 arabic-heading flex items-center gap-2">
          <Play className="h-6 w-6 text-green-600" />
          المودولات المتخصصة
        </h3>
        <Badge variant="secondary" className="arabic-text">
          تعلم سريع
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {modules.map((module) => (
          <Card key={module.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="relative">
                <img 
                  src={module.courses?.thumbnail || '/placeholder.svg'} 
                  alt={module.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <Badge className="absolute top-2 right-2 bg-green-600">
                  مودول مفرد
                </Badge>
              </div>
              <CardTitle className="arabic-heading text-xl text-slate-900">
                {module.title}
              </CardTitle>
              <p className="text-sm text-slate-500 arabic-text">
                من دورة: {module.courses?.title || 'دورة غير متاحة'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 arabic-text line-clamp-3">
                {module.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  <span className="arabic-text">تعلم مركز</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} />
                  <span className="arabic-text">نتائج سريعة</span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 arabic-text shadow-lg"
                onClick={() => onEnroll(module.id, 'module')}
              >
                اشترك في المودول
                <BookOpen size={18} className="mr-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FeaturedModules;
