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
const FeaturedModules = ({
  modules,
  onEnroll
}: FeaturedModulesProps) => {
  if (modules.length === 0) return null;
  return;
};
export default FeaturedModules;